import { join, resolve } from 'node:path'
import { existsSync, statSync, rmSync, writeFileSync } from 'node:fs'
import { FileStateManager } from '../../../file-state/FileStateManager'
import { createDefaultSteeringRules } from '../../../file-state/types'
import { HarnessSettings } from '../../../settings/HarnessSettings'
import { HttpServerError, type HttpServerConfig } from '../../domain/types'
import type { WorkspaceLockManager } from '../../adapters/outbound/mutex/WorkspaceLockManager'
import {
  compileSteeringRules,
  type InitializeWorkspaceDTO,
  type WorkspaceInitResultDTO,
  type SteeringRulesPayload,
} from '../../adapters/inbound/http/dto/WorkspaceInitDto'

export interface InitializeWorkspaceUseCaseDependencies {
  lockManager?: WorkspaceLockManager
  config?: HttpServerConfig
}

export class InitializeWorkspaceUseCase {
  private lockManager?: WorkspaceLockManager
  private config?: HttpServerConfig

  constructor(deps?: InitializeWorkspaceUseCaseDependencies) {
    this.lockManager = deps?.lockManager
    this.config = deps?.config
  }

  async execute(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO> {
    const rawPath = dto.workspacePath || process.cwd()
    const workspacePath = resolve(rawPath)

    // 1. Validate workspace path
    if (!existsSync(workspacePath)) {
      throw new HttpServerError(
        400,
        'INVALID_WORKSPACE_PATH',
        `Workspace directory does not exist: ${workspacePath}`
      )
    }

    try {
      const stats = statSync(workspacePath)
      if (!stats.isDirectory()) {
        throw new HttpServerError(
          400,
          'INVALID_WORKSPACE_PATH',
          `Workspace path is not a directory: ${workspacePath}`
        )
      }
    } catch (err: any) {
      if (err instanceof HttpServerError) throw err
      throw new HttpServerError(
        400,
        'INVALID_WORKSPACE_PATH',
        `Cannot access workspace path: ${err.message || err}`
      )
    }

    // 1.1 Check allowed workspaces if configured
    if (this.config?.allowedWorkspaces && this.config.allowedWorkspaces.length > 0) {
      const isAllowed = this.config.allowedWorkspaces.some((allowed) => {
        const resolvedAllowed = resolve(allowed)
        return (
          workspacePath === resolvedAllowed ||
          workspacePath.startsWith(resolvedAllowed + '/') ||
          workspacePath.startsWith(resolvedAllowed + '\\')
        )
      })
      if (!isAllowed) {
        throw new HttpServerError(
          403,
          'FORBIDDEN_WORKSPACE',
          `Workspace ${workspacePath} is outside allowed directories`
        )
      }
    }

    // 2. Concurrency Lock check
    if (this.lockManager) {
      const isLocked = await this.lockManager.isLocked(workspacePath)
      if (isLocked) {
        throw new HttpServerError(
          423,
          'LOCKED',
          `Workspace ${workspacePath} is currently locked by an active orchestrator job`
        )
      }
    }

    const productDir = join(workspacePath, 'docs', 'product')
    const hasExistingProduct = existsSync(productDir)

    // 3. Overwrite policy check
    if (hasExistingProduct) {
      if (!dto.forceOverwrite) {
        throw new HttpServerError(
          409,
          'CONFLICT',
          'Existing docs/product directory found. Set forceOverwrite to true to overwrite.'
        )
      }
      rmSync(productDir, { recursive: true, force: true })
    }

    // 4. Provision tracking files
    const fsm = new FileStateManager({ productDir, workingDir: workspacePath })
    fsm.ensureProductFiles()

    const additionalFiles = [
      { name: 'ROADMAP.md', content: '# Product Roadmap\n\n## Milestones\n' },
      { name: 'REQUIREMENTS.md', content: '# Product Requirements\n\n## Core Requirements\n' },
    ]
    for (const file of additionalFiles) {
      const target = join(productDir, file.name)
      if (!existsSync(target)) {
        writeFileSync(target, file.content, 'utf-8')
      }
    }

    // 5. Compile and save steering rules
    const rawDefaults = createDefaultSteeringRules()
    const defaultRules: SteeringRulesPayload = {
      user: rawDefaults.user || [],
      bootstrap: rawDefaults.bootstrap || [],
      planning: rawDefaults.planning || [],
      implementation: rawDefaults.implementation || [],
      review: rawDefaults.review || [],
      memory: rawDefaults.memory || [],
    }

    const compiledRules = compileSteeringRules(defaultRules, dto.customSteeringRules)
    const bootstrapConfig = fsm.loadBootstrapConfig()
    bootstrapConfig.steeringRules = compiledRules
    fsm.saveBootstrapConfig(bootstrapConfig)

    // 6. Local settings setup if requested
    let settingsPath: string | undefined
    if (dto.createSettings) {
      settingsPath = HarnessSettings.createLocalSettings(workspacePath)
    }

    const createdFiles = [
      'DEVELOPMENT-STATE.md',
      'ROADMAP.md',
      'REQUIREMENTS.md',
      'BACKLOG.md',
      'BOOTSTRAP-CONFIG.json',
    ]

    return {
      success: true,
      workspacePath,
      createdFiles,
      settingsPath,
    }
  }
}
