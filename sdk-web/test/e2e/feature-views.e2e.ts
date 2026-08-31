import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserAutomationDriver } from './fixtures/browser-driver.js'
import { A11yThemeAuditor } from './verifiers/a11y-auditor.js'

describe('E2E Feature Views & Navigation Suite', () => {
  let driver: BrowserAutomationDriver

  beforeEach(async () => {
    driver = new BrowserAutomationDriver()
    await driver.launch({ headless: true })
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
  })

  it('Should navigate between settings, reports, diagnostics, and candidates routes and render data from SDK use cases', async () => {
    const page = await driver.newPage('http://127.0.0.1:3000')
    const auditor = new A11yThemeAuditor(page)

    // 1. Settings view audit
    const settingsAudit = await auditor.auditRoute('/settings')
    expect(settingsAudit.hasHeading).toBe(true)
    expect(settingsAudit.hasNav).toBe(true)
    expect(settingsAudit.a11y.passesAA).toBe(true)

    // 2. Reports view audit
    const reportsAudit = await auditor.auditRoute('/reports')
    expect(reportsAudit.hasHeading).toBe(true)
    expect(reportsAudit.hasNav).toBe(true)
    expect(reportsAudit.a11y.passesAA).toBe(true)

    // 3. Diagnostics view audit
    const diagAudit = await auditor.auditRoute('/diagnose')
    expect(diagAudit.hasHeading).toBe(true)
    expect(diagAudit.hasNav).toBe(true)
    expect(diagAudit.a11y.passesAA).toBe(true)

    // 4. Candidates view audit
    const candAudit = await auditor.auditRoute('/candidates')
    expect(candAudit.hasHeading).toBe(true)
    expect(candAudit.hasNav).toBe(true)
    expect(candAudit.a11y.passesAA).toBe(true)
  })

  it('Should audit all feature routes and verify all are healthy and compliant', async () => {
    const page = await driver.newPage('http://127.0.0.1:3000')
    const auditor = new A11yThemeAuditor(page)

    const routeResults = await auditor.auditAllFeatureRoutes()
    expect(routeResults['/run']).toBe(true)
    expect(routeResults['/settings']).toBe(true)
    expect(routeResults['/reports']).toBe(true)
    expect(routeResults['/diagnose']).toBe(true)
    expect(routeResults['/candidates']).toBe(true)
  })
})
