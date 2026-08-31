import { describe, it, expect } from 'vitest'
import { ProcessTreeManager } from '../ProcessTreeManager'
import { CycleId } from '../../../../domain/value-objects/CycleId'

describe('ProcessTreeManager', () => {
  it('should spawn supervised process with sanitized environment and record child PID', async () => {
    const manager = new ProcessTreeManager()
    const cycleId = new CycleId('cycle-test-spawn')

    // Run simple node echo process
    const handle = await manager.spawnSupervisedProcess(cycleId, process.execPath, ['-e', 'console.log("hello"); setTimeout(()=>{}, 5000)'], {
      SECRET_API_KEY: 'sensitive-token-12345',
      SAFE_VAR: 'visible-value'
    })

    expect(handle.pid).toBeGreaterThan(0)
    expect(manager.hasActiveProcess(cycleId)).toBe(true)

    // Terminate process tree
    await manager.killProcessTree(cycleId)
    expect(manager.hasActiveProcess(cycleId)).toBe(false)
  })

  it('should sanitize environment variables removing sensitive tokens', () => {
    const manager = new ProcessTreeManager()
    const dirtyEnv = {
      API_KEY: 'key-123',
      SECRET_TOKEN: 'secret-xyz',
      AUTH_PASSWORD: 'password-abc',
      PATH: 'C:\\Windows',
      NODE_ENV: 'test',
    }

    const cleanEnv = manager.filterSensitiveEnv(dirtyEnv)
    expect(cleanEnv.PATH).toBe('C:\\Windows')
    expect(cleanEnv.NODE_ENV).toBe('test')
    expect(cleanEnv.API_KEY).toBeUndefined()
    expect(cleanEnv.SECRET_TOKEN).toBeUndefined()
    expect(cleanEnv.AUTH_PASSWORD).toBeUndefined()
  })

  it('should handle killing non-existent cycle gracefully without error', async () => {
    const manager = new ProcessTreeManager()
    const cycleId = new CycleId('cycle-non-existent')
    await expect(manager.killProcessTree(cycleId)).resolves.not.toThrow()
  })
})
