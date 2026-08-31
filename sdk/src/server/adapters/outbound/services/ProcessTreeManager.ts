import { spawn, ChildProcess, exec } from 'child_process'
import { promisify } from 'util'
import { CycleId } from '../../../domain/value-objects/CycleId'

const execAsync = promisify(exec)

export interface ProcessHandle {
  pid: number
  process: ChildProcess
  cycleId: CycleId
}

export class ProcessTreeManager {
  private activeHandles: Map<string, ProcessHandle> = new Map()

  filterSensitiveEnv(env: Record<string, string | undefined>): Record<string, string> {
    const sensitivePatterns = [
      /key/i,
      /secret/i,
      /token/i,
      /password/i,
      /passwd/i,
      /auth/i,
      /credential/i,
      /private/i,
    ]

    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(env)) {
      if (v !== undefined) {
        const isSensitive = sensitivePatterns.some((p) => p.test(k))
        if (!isSensitive) {
          clean[k] = v
        }
      }
    }
    return clean
  }

  async spawnSupervisedProcess(
    cycleId: CycleId,
    command: string,
    args: string[],
    env: Record<string, string | undefined> = process.env,
    cwd: string = process.cwd()
  ): Promise<ProcessHandle> {
    const cleanEnv = this.filterSensitiveEnv(env)
    const child = spawn(command, args, {
      cwd,
      env: cleanEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    })

    if (!child.pid) {
      throw new Error(`Failed to spawn process for cycle ${cycleId.value}`)
    }

    const handle: ProcessHandle = {
      pid: child.pid,
      process: child,
      cycleId,
    }

    this.activeHandles.set(cycleId.value, handle)

    child.on('exit', () => {
      this.activeHandles.delete(cycleId.value)
    })

    return handle
  }

  hasActiveProcess(cycleId: CycleId): boolean {
    return this.activeHandles.has(cycleId.value)
  }

  async killProcessTree(cycleId: CycleId): Promise<void> {
    const handle = this.activeHandles.get(cycleId.value)
    if (!handle) {
      return
    }

    const pid = handle.pid
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /pid ${pid} /t /f`)
      } else {
        try {
          process.kill(-pid, 'SIGKILL')
        } catch {
          process.kill(pid, 'SIGKILL')
        }
      }
    } catch {
      // Process may have already exited
    } finally {
      this.activeHandles.delete(cycleId.value)
    }
  }
}
