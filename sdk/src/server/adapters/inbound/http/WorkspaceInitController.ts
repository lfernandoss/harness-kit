import { HttpServerError } from '../../../domain/types'
import {
  GetWorkspaceInitStatusUseCase,
  InitializeWorkspaceUseCase,
} from '../../../application/use-cases'
import {
  VALID_PHASE_STEERING_KEYS,
  type InitializeWorkspaceDTO,
  type WorkspaceInitResultDTO,
  type WorkspaceInitStatusDTO,
} from './dto/WorkspaceInitDto'

export class WorkspaceInitController {
  constructor(
    private readonly initUseCase: InitializeWorkspaceUseCase,
    private readonly statusUseCase: GetWorkspaceInitStatusUseCase
  ) {}

  async handleGetStatus(path?: string): Promise<WorkspaceInitStatusDTO> {
    return this.statusUseCase.execute(path)
  }

  async handleInitialize(rawBody?: string): Promise<WorkspaceInitResultDTO> {
    if (!rawBody || rawBody.trim().length === 0) {
      return this.initUseCase.execute({})
    }

    let parsed: any
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      throw new HttpServerError(400, 'INVALID_JSON', 'Invalid JSON body in initialization request')
    }

    if (parsed && typeof parsed === 'object' && parsed.customSteeringRules) {
      if (typeof parsed.customSteeringRules !== 'object' || Array.isArray(parsed.customSteeringRules)) {
        throw new HttpServerError(400, 'INVALID_STEERING_RULES', 'customSteeringRules must be an object')
      }
      for (const key of Object.keys(parsed.customSteeringRules)) {
        if (!VALID_PHASE_STEERING_KEYS.includes(key as any)) {
          throw new HttpServerError(
            400,
            'INVALID_PHASE_KEY',
            `Unsupported phase steering key: "${key}". Valid keys are: ${VALID_PHASE_STEERING_KEYS.join(', ')}`
          )
        }
      }
    }

    const dto: InitializeWorkspaceDTO = {
      workspacePath: typeof parsed.workspacePath === 'string' ? parsed.workspacePath : undefined,
      forceOverwrite: Boolean(parsed.forceOverwrite),
      customSteeringRules: parsed.customSteeringRules,
      createSettings: Boolean(parsed.createSettings),
    }

    return this.initUseCase.execute(dto)
  }
}
