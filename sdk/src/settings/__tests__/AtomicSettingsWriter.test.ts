import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AtomicSettingsWriter } from '../AtomicSettingsWriter'
import { DEFAULT_SETTINGS } from '../DefaultSettings'

describe('AtomicSettingsWriter', () => {
  const testDir = join(process.cwd(), 'tests', '.temp', 'atomic-settings-test')
  const targetFile = join(testDir, 'nested', 'settings.json')

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('writes settings content to temporary file and atomically renames to target path', () => {
    AtomicSettingsWriter.write(targetFile, DEFAULT_SETTINGS)
    expect(existsSync(targetFile)).toBe(true)
    const content = JSON.parse(readFileSync(targetFile, 'utf-8'))
    expect(content.antigravity).toBeDefined()
    expect(existsSync(`${targetFile}.tmp`)).toBe(false)
  })

  it('creates parent directories recursively if target directory does not exist', () => {
    const deepFile = join(testDir, 'a', 'b', 'c', 'settings.json')
    AtomicSettingsWriter.write(deepFile, DEFAULT_SETTINGS)
    expect(existsSync(deepFile)).toBe(true)
  })

  it('preserves existing target file if write data serialization fails', () => {
    const validFile = join(testDir, 'existing.json')
    AtomicSettingsWriter.write(validFile, DEFAULT_SETTINGS)

    const circular: any = {}
    circular.self = circular

    expect(() => {
      AtomicSettingsWriter.write(validFile, circular)
    }).toThrow()

    const content = JSON.parse(readFileSync(validFile, 'utf-8'))
    expect(content.antigravity).toBeDefined()
  })
})
