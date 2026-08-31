import { join, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { HarnessSettings } from './HarnessSettings'
import { HttpServerError } from '../server/domain/types'
import { DtoMappers } from '../server/adapters/inbound/http/mappers/DtoMappers'

export type SettingsScope = 'global' | 'local'

export const isSettingsScope = (v: unknown): v is SettingsScope => v === 'global' || v === 'local'

export class PathResolver {
  static resolve(
    scope: SettingsScope = 'global',
    projectIdentifier?: string,
    allowedWorkspaces?: string[]
  ): { targetPath: string; exists: boolean } {
    if (scope === 'global') {
      const globalPath = HarnessSettings.getGlobalSettingsPath()
      return {
        targetPath: globalPath,
        exists: existsSync(globalPath),
      }
    }

    if (!projectIdentifier || projectIdentifier.trim() === '') {
      throw new HttpServerError(
        400,
        'MISSING_PROJECT_IDENTIFIER',
        `Project identifier query parameter 'project' is required when scope is 'local'.`
      )
    }

    const name = projectIdentifier.trim()
    const fromEnv = DtoMappers.resolveProjectFromEnv(name, allowedWorkspaces)
    if (!fromEnv?.path) {
      throw new HttpServerError(
        400,
        'PROJECT_NOT_FOUND',
        `Project identifier '${name}' is not registered in server environment.`
      )
    }

    const targetBasePath = resolve(fromEnv.path)

    if (allowedWorkspaces && allowedWorkspaces.length > 0) {
      const allowed = allowedWorkspaces.some((ws) => targetBasePath.startsWith(ws))
      if (!allowed) {
        throw new HttpServerError(
          400,
          'PATH_TRAVERSAL_DETECTED',
          `Target path '${targetBasePath}' is outside allowed workspaces`
        )
      }
    }

    const targetPath = join(targetBasePath, '.harness-kit', 'settings.json')
    return {
      targetPath,
      exists: existsSync(targetPath),
    }
  }
}
