import { PathResolver, type SettingsScope } from '../../../settings/PathResolver'
import { AtomicSettingsWriter } from '../../../settings/AtomicSettingsWriter'
import { DEFAULT_SETTINGS } from '../../../settings/DefaultSettings'
import type { HarnessSettingsMap } from '../../../settings/SettingsSchema'
import type { HttpServerConfig } from '../../domain/types'

export interface SettingsApiPayload {
  readonly scope: SettingsScope
  readonly targetPath: string
  readonly exists: boolean
  readonly settings: HarnessSettingsMap
  readonly project?: string
  readonly agent?: string
}

export class RenewSettingsUseCase {
  constructor(private config?: HttpServerConfig) {}

  async execute(scope: SettingsScope = 'global', projectIdentifier?: string): Promise<SettingsApiPayload> {
    const { targetPath } = PathResolver.resolve(scope, projectIdentifier, this.config?.allowedWorkspaces)
    AtomicSettingsWriter.write(targetPath, DEFAULT_SETTINGS)

    return {
      scope,
      targetPath,
      exists: true,
      settings: DEFAULT_SETTINGS,
      project: projectIdentifier,
    }
  }
}
