import { DriverPage } from '../fixtures/browser-driver.js'
import { A11yAuditResult } from '../fixtures/sandbox.js'
import { validateThemeContrast } from '../../../src/styles/contrast.js'
import { renderRouteView } from '../../../src/routes/AppRoutes.js'
import type { ThemeMode } from '../../../src/types/index.js'

// Itaú theme design tokens for E2E contrast verification (WCAG AA 4.5:1)
const THEME_TOKENS: Record<ThemeMode, { fg: string; bg: string; buttonFg: string; buttonBg: string }> = {
  light: {
    fg: '#121212',
    bg: '#FFFFFF',
    buttonFg: '#FFFFFF',
    buttonBg: '#003399',
  },
  dark: {
    fg: '#F4F5F7',
    bg: '#1E1E1E',
    buttonFg: '#121212',
    buttonBg: '#FF851A',
  },
}

export class A11yThemeAuditor {
  constructor(private readonly page: DriverPage) {}

  async auditThemeContrast(mode: 'light' | 'dark'): Promise<A11yAuditResult> {
    const tokens = THEME_TOKENS[mode]
    const textContrast = validateThemeContrast(tokens.fg, tokens.bg)
    const buttonContrast = validateThemeContrast(tokens.buttonFg, tokens.buttonBg)

    const renderedHtml = renderRouteView({
      path: '/run',
      theme: mode,
    })
    await this.page.setContent(renderedHtml)

    const passesAA = textContrast.passesAA && buttonContrast.passesAA
    const violations = passesAA ? 0 : 1
    const contrastRatio = Math.min(textContrast.ratio, buttonContrast.ratio)

    return {
      violations,
      passesAA,
      mode,
      contrastRatio,
    }
  }

  async auditRoute(
    routePath: string,
    context: any = {}
  ): Promise<{ route: string; a11y: A11yAuditResult; hasHeading: boolean; hasNav: boolean }> {
    const theme: ThemeMode = context.theme || 'light'
    const renderedHtml = renderRouteView({
      path: routePath,
      theme,
      ...context,
    })
    await this.page.setContent(renderedHtml)

    const hasHeading = /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/i.test(renderedHtml)
    const hasNav = /<(?:nav|aside)[^>]*>[\s\S]*?<\/(?:nav|aside)>/i.test(renderedHtml)
    const a11y = await this.auditThemeContrast(theme)

    return {
      route: routePath,
      a11y,
      hasHeading,
      hasNav,
    }
  }

  async auditAllFeatureRoutes(): Promise<Record<string, boolean>> {
    const routes = ['/run', '/settings', '/reports', '/diagnose', '/candidates']
    const results: Record<string, boolean> = {}

    for (const route of routes) {
      const audit = await this.auditRoute(route)
      results[route] = audit.hasHeading && audit.hasNav && audit.a11y.passesAA
    }

    return results
  }
}

export async function auditA11yAndTokens(
  page: DriverPage,
  mode: 'light' | 'dark'
): Promise<A11yAuditResult> {
  const auditor = new A11yThemeAuditor(page)
  return auditor.auditThemeContrast(mode)
}
