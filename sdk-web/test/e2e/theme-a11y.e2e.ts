import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserAutomationDriver } from './fixtures/browser-driver.js'
import { A11yThemeAuditor, auditA11yAndTokens } from './verifiers/a11y-auditor.js'
import { renderRouteView } from '../../src/routes/AppRoutes.js'

describe('E2E Itaú Theme Switching & A11y Auditing Suite', () => {
  let driver: BrowserAutomationDriver

  beforeEach(async () => {
    driver = new BrowserAutomationDriver()
    await driver.launch({ headless: true })
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
  })

  it('Should toggle Itaú theme between light and dark without contrast violations when user clicks Theme Toggle', async () => {
    const page = await driver.newPage('http://127.0.0.1:3000/run')
    const auditor = new A11yThemeAuditor(page)

    // Initial Light mode
    const lightResult = await auditor.auditThemeContrast('light')
    expect(lightResult.mode).toBe('light')
    expect(lightResult.passesAA).toBe(true)
    expect(lightResult.violations).toBe(0)
    expect(lightResult.contrastRatio).toBeGreaterThanOrEqual(4.5)

    // Click Theme Toggle button
    await page.click('button[aria-label="Toggle theme"]')

    // Dark mode audit
    const darkResult = await auditor.auditThemeContrast('dark')
    expect(darkResult.mode).toBe('dark')
    expect(darkResult.passesAA).toBe(true)
    expect(darkResult.violations).toBe(0)
    expect(darkResult.contrastRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('Should verify standalone helper auditA11yAndTokens passes AA with zero violations', async () => {
    const page = await driver.newPage('http://127.0.0.1:3000/settings')
    const result = await auditA11yAndTokens(page, 'dark')

    expect(result.violations).toBe(0)
    expect(result.passesAA).toBe(true)
    expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5)
  })
})
