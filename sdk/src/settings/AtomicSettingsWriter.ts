import { writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { HarnessSettingsMap } from './SettingsSchema'

export class AtomicSettingsWriter {
  static write(filePath: string, data: HarnessSettingsMap): void {
    const parentDir = dirname(filePath)
    mkdirSync(parentDir, { recursive: true })

    const tmpPath = `${filePath}.tmp`
    const serialized = JSON.stringify(data, null, 2)
    writeFileSync(tmpPath, serialized, 'utf-8')
    renameSync(tmpPath, filePath)
  }
}
