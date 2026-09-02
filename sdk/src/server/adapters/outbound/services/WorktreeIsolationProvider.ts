import * as fs from 'fs'
import * as path from 'path'
import { CycleId } from '../../../domain/value-objects/CycleId'

export interface IWorktreeProvider {
  createWorktree(cycleId: CycleId): Promise<string>
  removeWorktree(cycleId: CycleId): Promise<void>
  getWorktreePath(cycleId: CycleId): string | undefined
  hasWorktree(cycleId: CycleId): boolean
  listActiveWorktrees(): string[]
  cleanupAll(): Promise<void>
}

export class WorktreeIsolationProvider implements IWorktreeProvider {
  private activeWorktrees = new Map<string, string>()

  constructor(readonly baseRepoPath: string = process.cwd()) {}

  async createWorktree(cycleId: CycleId): Promise<string> {
    const worktreeDir = path.join(this.baseRepoPath, '.worktrees', cycleId.value)

    if (!fs.existsSync(worktreeDir)) {
      fs.mkdirSync(worktreeDir, { recursive: true })
    }

    this.activeWorktrees.set(cycleId.value, worktreeDir)
    return worktreeDir
  }

  async removeWorktree(cycleId: CycleId): Promise<void> {
    const worktreeDir = this.activeWorktrees.get(cycleId.value)
    if (worktreeDir && fs.existsSync(worktreeDir)) {
      try {
        fs.rmSync(worktreeDir, { recursive: true, force: true })
      } catch {
        // Fallback retry
        await new Promise((r) => setTimeout(r, 100))
        if (fs.existsSync(worktreeDir)) {
          fs.rmSync(worktreeDir, { recursive: true, force: true })
        }
      }
    }
    this.activeWorktrees.delete(cycleId.value)
  }

  getWorktreePath(cycleId: CycleId): string | undefined {
    return this.activeWorktrees.get(cycleId.value)
  }

  hasWorktree(cycleId: CycleId): boolean {
    return this.activeWorktrees.has(cycleId.value)
  }

  listActiveWorktrees(): string[] {
    return Array.from(this.activeWorktrees.values())
  }

  async cleanupAll(): Promise<void> {
    for (const cycleIdStr of Array.from(this.activeWorktrees.keys())) {
      await this.removeWorktree(new CycleId(cycleIdStr))
    }
  }
}
