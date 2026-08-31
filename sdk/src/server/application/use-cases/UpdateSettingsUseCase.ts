import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { HttpServerError, type HttpServerConfig } from '../../domain/types'
import { DtoMappers } from '../../adapters/inbound/http/mappers/DtoMappers'
import type { HarnessSettingsMap, PhaseSettings } from '../../../settings/SettingsSchema'
import { DEFAULT_SETTINGS, DEFAULT_PHASE_TIMEOUT_MS } from '../../../settings/DefaultSettings'
import { AtomicSettingsWriter } from '../../../settings/AtomicSettingsWriter'
import { PathResolver, type SettingsScope } from '../../../settings/PathResolver'
import { validateSettingsMap } from '../../../settings/SettingsValidator'
import type { IUpdateSettingsUseCase } from '../ports/inbound/IUpdateSettingsUseCase'
import { Runner } from '../../../agent-runner/types'

const SHORT_AGENT_NAMES = ['antigravity', 'claude', 'copilot', 'cursor', 'codex', 'kiro']
const VALID_RUNNERS = Object.values(Runner) as string[]
const ALL_VALID_AGENTS = Array.from(new Set([...SHORT_AGENT_NAMES, ...VALID_RUNNERS]))
const VALID_PHASE_KEYS = ['bootstrap', 'planning', 'implementation', 'review_tl', 'review_adv', 'memory']

function normalizeAgentKey(agent: string): string {
  const clean = agent.trim().toLowerCase()
  const family = clean.replace(/-cli$|-sdk$/, '')
  return SHORT_AGENT_NAMES.includes(family) ? family : clean
}

function isValidAgent(agent?: string): boolean {
  if (!agent || agent.trim() === '') return false
  const clean = agent.trim().toLowerCase()
  return ALL_VALID_AGENTS.includes(clean) || SHORT_AGENT_NAMES.includes(clean.replace(/-cli$|-sdk$/, ''))
}

export class UpdateSettingsUseCase implements IUpdateSettingsUseCase {
  constructor(private config?: HttpServerConfig) {}

  async execute(
    settingsPayload: HarnessSettingsMap | Record<string, any>,
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
  }> {
    const rawProject = projectIdentifier ?? (settingsPayload as any)?.project
    const rawAgent = agentIdentifier ?? (settingsPayload as any)?.agent
    const explicitScope: SettingsScope | undefined =
      scopeParam === 'global' || (settingsPayload as any)?.scope === 'global'
        ? 'global'
        : scopeParam === 'local' || (settingsPayload as any)?.scope === 'local'
        ? 'local'
        : undefined

    const scope: SettingsScope = explicitScope ?? (rawProject ? 'local' : 'local')

    // If whole map save is requested (e.g. SaveSettings in web UI)
    const hasExplicitSettings = (settingsPayload as any)?.settings !== undefined
    const isFullMapPayload =
      hasExplicitSettings ||
      (explicitScope === 'global' && typeof settingsPayload === 'object' && settingsPayload !== null && !('agent' in settingsPayload))

    if (isFullMapPayload && !rawAgent) {
      const fullMap: HarnessSettingsMap = hasExplicitSettings ? (settingsPayload as any).settings : settingsPayload
      const diag = validateSettingsMap(fullMap)
      if (!diag.valid) {
        throw new HttpServerError(
          400,
          'INVALID_SETTINGS_SCHEMA',
          `Settings validation failed: ${diag.errors.map((e) => e.message).join('; ')}`
        )
      }

      const { targetPath } = PathResolver.resolve(scope, rawProject, this.config?.allowedWorkspaces)
      AtomicSettingsWriter.write(targetPath, fullMap)

      return {
        project: rawProject,
        scope,
        targetPath,
        exists: true,
        settings: fullMap,
      }
    }

    if (!rawProject || typeof rawProject !== 'string' || rawProject.trim() === '') {
      throw new HttpServerError(
        400,
        'MISSING_PROJECT_IDENTIFIER',
        `Project identifier parameter 'project' is required in request.`
      )
    }

    if (!rawAgent || typeof rawAgent !== 'string' || rawAgent.trim() === '') {
      throw new HttpServerError(
        400,
        'MISSING_AGENT_PARAMETER',
        `Parameter 'agent' is required in settings request.`
      )
    }

    if (!isValidAgent(rawAgent)) {
      throw new HttpServerError(
        400,
        'INVALID_AGENT',
        `Agent '${rawAgent}' is invalid. Valid agents: ${ALL_VALID_AGENTS.join(', ')}`
      )
    }

    const name = rawProject.trim()
    const fromEnv = DtoMappers.resolveProjectFromEnv(name, this.config?.allowedWorkspaces)
    if (!fromEnv?.path) {
      throw new HttpServerError(
        400,
        'PROJECT_NOT_FOUND',
        `Project identifier '${name}' is not registered in server environment (PROJECT_MAPPINGS, PROJECT_${name.toUpperCase()}_PATH, or ALLOWED_WORKSPACES).`
      )
    }

    const targetPath = resolve(fromEnv.path)

    if (this.config?.allowedWorkspaces && this.config.allowedWorkspaces.length > 0) {
      const allowed = this.config.allowedWorkspaces.some((ws) => targetPath.startsWith(ws))
      if (!allowed) {
        throw new HttpServerError(
          400,
          'PATH_TRAVERSAL_DETECTED',
          `Target path '${targetPath}' is outside allowed workspaces`
        )
      }
    }

    const settingsFilePath = join(targetPath, '.harness-kit', 'settings.json')

    let existingSettings: HarnessSettingsMap = {}
    if (existsSync(settingsFilePath)) {
      try {
        existingSettings = JSON.parse(readFileSync(settingsFilePath, 'utf-8'))
      } catch {}
    }

    const effectiveAgent = rawAgent.trim()
    const agentKey = normalizeAgentKey(effectiveAgent)

    const rawPhases = (settingsPayload as any).phases
    let targetPhases: string[] = []

    if (Array.isArray(rawPhases)) {
      for (const item of rawPhases) {
        const parts = String(item).split('|')
        for (const p of parts) {
          const clean = p.trim().toLowerCase()
          if (VALID_PHASE_KEYS.includes(clean)) {
            targetPhases.push(clean)
          }
        }
      }
    } else if (typeof rawPhases === 'string') {
      const parts = rawPhases.split('|')
      for (const p of parts) {
        const clean = p.trim().toLowerCase()
        if (VALID_PHASE_KEYS.includes(clean)) {
          targetPhases.push(clean)
        }
      }
    }

    if (targetPhases.length === 0) {
      targetPhases = [...VALID_PHASE_KEYS]
    }

    const defaultAgentSettings = DEFAULT_SETTINGS[agentKey] ?? { timeoutMs: DEFAULT_PHASE_TIMEOUT_MS, phases: {} }
    const defaultPhases = defaultAgentSettings.phases ?? {}
    const existingAgentSettings = existingSettings[agentKey] ?? {}
    const existingPhases = existingAgentSettings.phases ?? {}

    const updatedPhases: Record<string, PhaseSettings> = {}

    const newModel =
      typeof (settingsPayload as any).model === 'string' && (settingsPayload as any).model.trim() !== ''
        ? (settingsPayload as any).model.trim()
        : undefined
    const newEffort =
      typeof (settingsPayload as any).effort === 'string' && (settingsPayload as any).effort.trim() !== ''
        ? (settingsPayload as any).effort.trim()
        : undefined

    for (const phase of VALID_PHASE_KEYS) {
      const existingPhase = existingPhases[phase] ?? {}
      const defaultPhase = defaultPhases[phase] ?? {}

      if (targetPhases.includes(phase)) {
        updatedPhases[phase] = {
          model: newModel ?? existingPhase.model ?? defaultPhase.model ?? '',
          effort: newEffort !== undefined ? newEffort : (existingPhase.effort ?? defaultPhase.effort ?? ''),
        }
      } else {
        updatedPhases[phase] = {
          model: existingPhase.model ?? defaultPhase.model ?? '',
          effort: existingPhase.effort ?? defaultPhase.effort ?? '',
        }
      }
    }

    const rawTimeoutMs = (settingsPayload as any).timeoutMs
    let timeoutMs: number

    if (rawTimeoutMs !== undefined) {
      if (typeof rawTimeoutMs !== 'number' || rawTimeoutMs <= 0 || !Number.isFinite(rawTimeoutMs)) {
        throw new HttpServerError(
          400,
          'INVALID_TIMEOUT_MS',
          `Parameter 'timeoutMs' must be a positive number greater than 0.`
        )
      }
      timeoutMs = rawTimeoutMs
    } else {
      timeoutMs = defaultAgentSettings.timeoutMs ?? DEFAULT_PHASE_TIMEOUT_MS
    }

    const mergedSettings: HarnessSettingsMap = {
      ...existingSettings,
      [agentKey]: {
        timeoutMs,
        phases: updatedPhases,
      },
    }

    AtomicSettingsWriter.write(settingsFilePath, mergedSettings)
    return {
      project: name,
      agent: effectiveAgent.toLowerCase(),
      settings: mergedSettings,
      scope: 'local',
      targetPath: settingsFilePath,
      exists: true,
    }
  }
}
