import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProcessTreeManager } from '../../server/adapters/outbound/services/ProcessTreeManager'
import { CycleId } from '../../server/domain/value-objects/CycleId'

describe('Process Tree Termination & Leak Audit E2E', () => {
  let manager: ProcessTreeManager

  beforeEach(() => {
    manager = new ProcessTreeManager()
  })

  it('should filter sensitive environment variables from subprocess execution', () => {
    const rawEnv = {
      PATH: '/usr/bin;C:\\windows\\system32',
      NODE_ENV: 'production',
      AWS_SECRET_ACCESS_KEY: 'secret123',
      GITHUB_TOKEN: 'ghp_xxxx',
      DATABASE_PASSWORD: 'supersecretpass',
      AUTH_TOKEN: 'bearer 123',
      USER_PUBLIC_CONFIG: 'allowed_value',
    }

    const sanitized = manager.filterSensitiveEnv(rawEnv)

    expect(sanitized.PATH).toBeDefined()
    expect(sanitized.NODE_ENV).toBe('production')
    expect(sanitized.USER_PUBLIC_CONFIG).toBe('allowed_value')

    expect(sanitized.AWS_SECRET_ACCESS_KEY).toBeUndefined()
    expect(sanitized.GITHUB_TOKEN).toBeUndefined()
    expect(sanitized.DATABASE_PASSWORD).toBeUndefined()
    expect(sanitized.AUTH_TOKEN).toBeUndefined()
  })

  it('should spawn supervised process, register active handle, and clean up on exit', async () => {
    const cycleId = CycleId.generate()
    const isWin = process.platform === 'win32'
    const cmd = isWin ? 'cmd.exe' : 'sleep'
    const args = isWin ? ['/c', 'timeout', '/t', '1'] : ['1']

    const handle = await manager.spawnSupervisedProcess(cycleId, cmd, args)

    expect(handle.pid).toBeGreaterThan(0)
    expect(manager.hasActiveProcess(cycleId)).toBe(true)

    await manager.killProcessTree(cycleId)
    expect(manager.hasActiveProcess(cycleId)).toBe(false)
  })
})
