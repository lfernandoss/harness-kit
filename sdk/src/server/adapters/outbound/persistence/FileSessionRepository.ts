import * as fs from 'fs'
import * as path from 'path'
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository'
import { Session, SessionManifestData } from '../../../domain/aggregates/Session'
import { AutonomousCycle, CycleManifestData } from '../../../domain/aggregates/AutonomousCycle'
import { SessionId } from '../../../domain/value-objects/SessionId'
import { CycleId } from '../../../domain/value-objects/CycleId'

export class FileSessionRepository implements ISessionRepository {
  private readonly rootDir: string

  constructor(workspacePath: string = process.cwd()) {
    this.rootDir = path.resolve(workspacePath, '.harness', 'sessions')
  }

  private getSessionDir(sessionId: string): string {
    return path.join(this.rootDir, sessionId)
  }

  private getCyclesDir(sessionId: string): string {
    return path.join(this.getSessionDir(sessionId), 'cycles')
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  private writeAtomic(filePath: string, content: string): void {
    const dir = path.dirname(filePath)
    this.ensureDir(dir)
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`
    fs.writeFileSync(tmpPath, content, 'utf-8')
    fs.renameSync(tmpPath, filePath)
  }

  async saveSession(session: Session): Promise<void> {
    const sessionDir = this.getSessionDir(session.id.value)
    this.ensureDir(sessionDir)

    const sessionFilePath = path.join(sessionDir, 'session.json')
    const manifest = session.toManifest()
    this.writeAtomic(sessionFilePath, JSON.stringify(manifest, null, 2))

    for (const cycle of session.getCycles()) {
      await this.saveCycle(cycle)
    }
  }

  async findSessionById(id: SessionId): Promise<Session | null> {
    const sessionFilePath = path.join(this.getSessionDir(id.value), 'session.json')
    if (!fs.existsSync(sessionFilePath)) {
      return null
    }

    try {
      const raw = fs.readFileSync(sessionFilePath, 'utf-8')
      const data: SessionManifestData = JSON.parse(raw)
      
      const cyclesDir = this.getCyclesDir(id.value)
      if (fs.existsSync(cyclesDir)) {
        const cycleFiles = fs.readdirSync(cyclesDir).filter((f) => f.endsWith('.json'))
        const cycles: CycleManifestData[] = []
        for (const file of cycleFiles) {
          try {
            const rawCycle = fs.readFileSync(path.join(cyclesDir, file), 'utf-8')
            cycles.push(JSON.parse(rawCycle))
          } catch {
            // Ignore single corrupt cycle file
          }
        }
        data.cycles = cycles
      }

      return Session.fromManifest(data)
    } catch {
      return null
    }
  }

  async listSessions(): Promise<Session[]> {
    if (!fs.existsSync(this.rootDir)) {
      return []
    }

    const entries = fs.readdirSync(this.rootDir)
    const sessions: Session[] = []

    for (const entry of entries) {
      if (entry.startsWith('sess-')) {
        const session = await this.findSessionById(new SessionId(entry))
        if (session) {
          sessions.push(session)
        }
      }
    }

    return sessions
  }

  async saveCycle(cycle: AutonomousCycle): Promise<void> {
    const cyclesDir = this.getCyclesDir(cycle.sessionId.value)
    this.ensureDir(cyclesDir)

    const cycleFilePath = path.join(cyclesDir, `${cycle.id.value}.json`)
    const manifest = cycle.toManifest()
    this.writeAtomic(cycleFilePath, JSON.stringify(manifest, null, 2))
  }

  async findCycleById(cycleId: CycleId, sessionId?: SessionId): Promise<AutonomousCycle | null> {
    if (sessionId) {
      const cycleFilePath = path.join(this.getCyclesDir(sessionId.value), `${cycleId.value}.json`)
      if (fs.existsSync(cycleFilePath)) {
        try {
          const raw = fs.readFileSync(cycleFilePath, 'utf-8')
          return AutonomousCycle.fromManifest(JSON.parse(raw))
        } catch {
          return null
        }
      }
    }

    // Search across all sessions if sessionId not specified
    if (!fs.existsSync(this.rootDir)) {
      return null
    }

    const sessionDirs = fs.readdirSync(this.rootDir).filter((d) => d.startsWith('sess-'))
    for (const sDir of sessionDirs) {
      const cycleFilePath = path.join(this.getCyclesDir(sDir), `${cycleId.value}.json`)
      if (fs.existsSync(cycleFilePath)) {
        try {
          const raw = fs.readFileSync(cycleFilePath, 'utf-8')
          return AutonomousCycle.fromManifest(JSON.parse(raw))
        } catch {
          return null
        }
      }
    }

    return null
  }
}
