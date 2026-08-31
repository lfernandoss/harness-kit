import type { HarnessSettingsMap } from '../../../../settings/SettingsSchema'
import type { SettingsScope } from '../../../../settings/PathResolver'

export interface IGetSettingsUseCase {
  execute(
    projectIdentifier?: string,
    agentIdentifier?: string,
    scopeParam?: SettingsScope | string
  ): Promise<{
    project?: string
    agent?: string
    settings: HarnessSettingsMap
    scope?: SettingsScope
    targetPath?: string
    exists?: boolean
  }>
}
