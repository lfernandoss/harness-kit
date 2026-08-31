import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as http from 'http'
import { FileSessionRepository } from '../server/adapters/outbound/persistence/FileSessionRepository'
import { ProcessTreeManager } from '../server/adapters/outbound/services/ProcessTreeManager'
import { CreateCycleSessionUseCase } from '../server/application/use-cases/CreateCycleSessionUseCase'
import { ResumeCycleUseCase } from '../server/application/use-cases/ResumeCycleUseCase'
import { AbortCycleUseCase } from '../server/application/use-cases/AbortCycleUseCase'
import { SessionCycleRoutes } from '../server/adapters/inbound/http/routes/SessionCycleRoutes'
import { Session } from '../server/domain/aggregates/Session'
import { SessionId } from '../server/domain/value-objects/SessionId'
import { AutonomousCycle } from '../server/domain/aggregates/AutonomousCycle'
import { CycleId } from '../server/domain/value-objects/CycleId'

export class MultiCycleTestHarness {
  tempDir: string = ''
  server?: http.Server
  serverPort: number = 0
  sessionRepo!: FileSessionRepository
  processTreeManager!: ProcessTreeManager
  createUseCase!: CreateCycleSessionUseCase
  resumeUseCase!: ResumeCycleUseCase
  abortUseCase!: AbortCycleUseCase
  routes!: SessionCycleRoutes

  async init(startHttpServer: boolean = false): Promise<void> {
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-cycle-harness-'))
    this.sessionRepo = new FileSessionRepository(this.tempDir)
    this.processTreeManager = new ProcessTreeManager()
    this.createUseCase = new CreateCycleSessionUseCase(this.sessionRepo)
    this.resumeUseCase = new ResumeCycleUseCase(this.sessionRepo)
    this.abortUseCase = new AbortCycleUseCase(this.sessionRepo, this.processTreeManager)
    this.routes = new SessionCycleRoutes(
      this.sessionRepo,
      this.createUseCase,
      this.resumeUseCase,
      this.abortUseCase
    )

    if (startHttpServer) {
      this.server = http.createServer((req, res) => {
        const handled = this.routes.handle(req, res)
        if (!handled) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not Found' }))
        }
      })

      await new Promise<void>((resolve) => {
        this.server!.listen(0, '127.0.0.1', () => {
          const addr = this.server!.address() as { port: number }
          this.serverPort = addr.port
          resolve()
        })
      })
    }
  }

  async createSession(sessionIdStr?: string): Promise<Session> {
    const sessionId = sessionIdStr ? new SessionId(sessionIdStr) : SessionId.generate()
    let session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) {
      session = new Session(sessionId, this.tempDir)
      await this.sessionRepo.saveSession(session)
    }
    return session
  }

  async attachCycle(sessionId: SessionId): Promise<AutonomousCycle> {
    let session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) {
      session = new Session(sessionId, this.tempDir)
    }
    const cycle = new AutonomousCycle(CycleId.generate(), sessionId)
    session.attachCycle(cycle)
    await this.sessionRepo.saveSession(session)
    return cycle
  }

  async cleanup(): Promise<void> {
    if (this.server) {
      if (this.server.closeAllConnections) {
        this.server.closeAllConnections()
      }
      await new Promise<void>((resolve) => this.server!.close(() => resolve()))
    }
    if (this.tempDir && fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true })
    }
  }
}
