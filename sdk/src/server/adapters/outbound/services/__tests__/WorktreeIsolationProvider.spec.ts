import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WorktreeIsolationProvider } from '../WorktreeIsolationProvider'
import { CycleId } from '../../../../domain/value-objects/CycleId'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

describe('WorktreeIsolationProvider', () => {
  let tempRepo: string
  let provider: WorktreeIsolationProvider

  beforeEach(() => {
    tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wt-test-'))
    provider = new WorktreeIsolationProvider(tempRepo)
  })

  afterEach(async () => {
    if (fs.existsSync(tempRepo)) {
      fs.rmSync(tempRepo, { recursive: true, force: true })
    }
  })

  it('provisions an isolated worktree directory for a cycle and cleans it up on demand', async () => {
    const cycleId = CycleId.generate()
    const wtPath = await provider.createWorktree(cycleId)

    expect(fs.existsSync(wtPath)).toBe(true)
    expect(wtPath).toContain(cycleId.value)
    expect(provider.hasWorktree(cycleId)).toBe(true)
    expect(provider.getWorktreePath(cycleId)).toBe(wtPath)

    await provider.removeWorktree(cycleId)
    expect(fs.existsSync(wtPath)).toBe(false)
    expect(provider.hasWorktree(cycleId)).toBe(false)
  })

  it('cleans up all allocated worktrees on dispose', async () => {
    const cycleId1 = CycleId.generate()
    const cycleId2 = CycleId.generate()

    const wt1 = await provider.createWorktree(cycleId1)
    const wt2 = await provider.createWorktree(cycleId2)

    expect(fs.existsSync(wt1)).toBe(true)
    expect(fs.existsSync(wt2)).toBe(true)

    await provider.cleanupAll()
    expect(fs.existsSync(wt1)).toBe(false)
    expect(fs.existsSync(wt2)).toBe(false)
    expect(provider.listActiveWorktrees()).toHaveLength(0)
  })
})
