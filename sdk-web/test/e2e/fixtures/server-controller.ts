import * as http from 'http'
import { HttpServer } from '../../../../sdk/src/server/HttpServer.js'
import { DynamicPortAllocator } from './port-allocator.js'
import {
  TestServerInstance,
  createTestServerInstance,
} from './sandbox.js'
import { createReportRouter } from '../../../src/server/routes/report.routes.js'
import { createDiagnosticsRouter } from '../../../src/server/routes/diagnosticsRoutes.js'
import { renderRouteView } from '../../../src/routes/AppRoutes.js'

export interface TestServerOptions {
  host?: string
  port?: number
  allowedWorkspaces?: string[]
  auth?: any
}

export interface ITestServerProcess {
  spawnServer(workspacePath: string, port: number): Promise<TestServerInstance>
  killProcessTree(): Promise<void>
}

export class TestServerController implements ITestServerProcess {
  private server: HttpServer | null = null
  private rawServer: http.Server | null = null
  private instance: TestServerInstance | null = null
  private readonly portAllocator: DynamicPortAllocator
  private readonly options: TestServerOptions

  constructor(portAllocator?: DynamicPortAllocator, options: TestServerOptions = {}) {
    this.portAllocator = portAllocator || new DynamicPortAllocator()
    this.options = options
  }

  getInstance(): TestServerInstance | null {
    return this.instance
  }

  isRunning(): boolean {
    return this.server !== null || this.rawServer !== null
  }

  async start(workspacePath: string, forcedPort?: number): Promise<TestServerInstance> {
    const host = this.options.host ?? '127.0.0.1'
    if (host !== '127.0.0.1') {
      throw new Error(`Security invariant violation: host must strictly be 127.0.0.1 (got: ${host})`)
    }

    const port = forcedPort ?? this.options.port ?? (await this.portAllocator.allocate())

    const reportRouter = createReportRouter()
    const diagnosticsRouter = createDiagnosticsRouter()

    this.server = new HttpServer({
      port,
      host: '127.0.0.1',
      allowedWorkspaces: [workspacePath],
      auth: this.options.auth ?? { mode: 'none' },
    })

    // Start SDK API server
    await this.server.start()

    // Wrap with web-specific fallback and SPA page rendering
    const actualPort = this.server.getPort()
    const baseUrl = `http://127.0.0.1:${actualPort}`

    this.instance = createTestServerInstance({
      host: '127.0.0.1',
      port: actualPort,
      baseUrl,
      workspacePath,
    })

    // Verify health check
    await this.verifyHealthReadiness(baseUrl)

    return this.instance
  }

  async spawnServer(workspacePath: string, port: number): Promise<TestServerInstance> {
    return this.start(workspacePath, port)
  }

  async killProcessTree(): Promise<void> {
    await this.stop()
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop().catch(() => {})
      this.server = null
    }

    if (this.rawServer) {
      await new Promise<void>((resolve) => {
        this.rawServer!.close(() => resolve())
      }).catch(() => {})
      this.rawServer = null
    }

    if (this.instance) {
      this.portAllocator.release(this.instance.port)
      this.instance = null
    }
  }

  private async verifyHealthReadiness(baseUrl: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${baseUrl}/health`)
        if (res.ok) {
          return
        }
      } catch {
        // wait before retry
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    throw new Error(`Test server at ${baseUrl} failed health check readiness`)
  }
}
