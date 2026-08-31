import { existsSync, unlinkSync } from 'node:fs'
import { PathResolver, type SettingsScope } from '../../../settings/PathResolver'
import type { HttpServerConfig } from '../../domain/types'

export class DeleteSettingsUseCase {
  constructor(private config?: HttpServerConfig) {}

  async execute(
    scope: SettingsScope = 'global',
    projectIdentifier?: string
  ): Promise<{ success: boolean; targetPath: string; scope: SettingsScope }> {
    const { targetPath } = PathResolver.resolve(scope, projectIdentifier, this.config?.allowedWorkspaces)
    if (existsSync(targetPath)) {
      try {
        unlinkSync(targetPath)
      } catch (err: any) {
        // if already deleted or race condition, ignore
      }
    }

    return {
      success: true,
      targetPath,
      scope,
    }
  }
}
