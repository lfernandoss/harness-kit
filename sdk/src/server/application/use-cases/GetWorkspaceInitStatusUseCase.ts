import { join, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { createDefaultSteeringRules } from '../../../file-state/types'
import type {
  WorkspaceInitStatusDTO,
  SteeringRulesPayload,
} from '../../adapters/inbound/http/dto/WorkspaceInitDto'

export class GetWorkspaceInitStatusUseCase {
  async execute(targetWorkspacePath?: string): Promise<WorkspaceInitStatusDTO> {
    const workspacePath = resolve(targetWorkspacePath || process.cwd())

    const productDir = join(workspacePath, 'docs', 'product')
    const settingsPath = join(workspacePath, '.harness-kit', 'settings.json')

    const hasExistingProduct = existsSync(productDir)
    const hasExistingSettings = existsSync(settingsPath)

    const rawDefaults = createDefaultSteeringRules()
    const defaultRules: SteeringRulesPayload = {
      user: rawDefaults.user || [],
      bootstrap: rawDefaults.bootstrap || [],
      planning: rawDefaults.planning || [],
      implementation: rawDefaults.implementation || [],
      review: rawDefaults.review || [],
      memory: rawDefaults.memory || [],
    }

    return {
      workspacePath,
      hasExistingProduct,
      hasExistingSettings,
      defaultRules,
    }
  }
}
