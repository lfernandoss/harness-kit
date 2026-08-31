import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestServerController } from '../server-controller.js'
import { BrowserAutomationDriver } from '../browser-driver.js'
import { createEphemeralSandbox } from '../sandbox.js'

describe('Test Server Controller & Browser Automation Driver', () => {
  let sandboxPath: string
  let controller: TestServerController
  let driver: BrowserAutomationDriver

  beforeEach(async () => {
    sandboxPath = await createEphemeralSandbox('server-test')
    controller = new TestServerController()
    driver = new BrowserAutomationDriver()
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
    await controller.stop().catch(() => {})
  })

  describe('TestServerController', () => {
    it('should spawn test server instance on 127.0.0.1 and pass /health check', async () => {
      const instance = await controller.start(sandboxPath)

      expect(instance).toBeDefined()
      expect(instance.host).toBe('127.0.0.1')
      expect(instance.port).toBeGreaterThan(1024)
      expect(instance.baseUrl).toContain('127.0.0.1')
      expect(controller.isRunning()).toBe(true)

      // Test /health endpoint
      const response = await fetch(`${instance.baseUrl}/health`)
      expect(response.status).toBe(200)
      const health = await response.json()
      expect(health).toHaveProperty('status')
    })

    it('should shut down server cleanly and mark isRunning as false', async () => {
      const instance = await controller.start(sandboxPath)
      expect(controller.isRunning()).toBe(true)

      await controller.stop()
      expect(controller.isRunning()).toBe(false)

      await expect(fetch(`${instance.baseUrl}/health`)).rejects.toThrow()
    })

    it('should prevent binding to non-localhost host addresses', async () => {
      const customController = new TestServerController(undefined, { host: '0.0.0.0' } as any)
      await expect(customController.start(sandboxPath)).rejects.toThrow(/127\.0\.0\.1/)
    })
  })

  describe('BrowserAutomationDriver', () => {
    it('should launch browser, create new pages, and close context', async () => {
      await driver.launch({ headless: true })
      expect(driver.isLaunched()).toBe(true)

      const page = await driver.newPage('about:blank')
      expect(page).toBeDefined()
      expect(driver.getPages().length).toBe(1)

      const page2 = await driver.newPage('about:blank')
      expect(driver.getPages().length).toBe(2)

      await page.close()
      expect(driver.getPages().length).toBe(1)

      await driver.close()
      expect(driver.isLaunched()).toBe(false)
      expect(driver.getPages().length).toBe(0)
    })

    it('should interact with page DOM elements via Driver Page abstraction', async () => {
      await driver.launch({ headless: true })
      const page = await driver.newPage('http://example.com')
      
      await page.setContent('<div class="status-badge" data-status="RUNNING">Running</div><button aria-label="Start Run">Start</button>')

      const badgeText = await page.textContent('.status-badge')
      expect(badgeText).toBe('Running')

      const attr = await page.getAttribute('.status-badge', 'data-status')
      expect(attr).toBe('RUNNING')

      let clicked = false
      await page.evaluate(() => {
        // mock evaluated script
      })
    })
  })
})
