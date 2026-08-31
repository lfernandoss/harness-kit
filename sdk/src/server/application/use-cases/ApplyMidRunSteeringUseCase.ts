import { HttpServerError } from '../../domain/types'
import type { SteeringRequestDTO } from '../../domain/types'
import type { JobStoreRepository } from '../../adapters/outbound/repository/JobStoreRepository'
import { JobExecutionRegistry } from '../../adapters/outbound/services/JobExecutionRegistry'
import { EventStreamBroadcaster } from '../../adapters/inbound/http/routes/EventStreamHandler'
import { Phase } from '../../../orchestrator/types'


const VALID_PHASES = new Set(Object.values(Phase))

export class ApplyMidRunSteeringUseCase {
  constructor(
    private jobStore: JobStoreRepository,
    private executionRegistry: JobExecutionRegistry = JobExecutionRegistry.getInstance(),
    private broadcaster: EventStreamBroadcaster = EventStreamBroadcaster.getInstance()
  ) {}

  async execute(
    jobId: string,
    action: SteeringRequestDTO
  ): Promise<{ applied: boolean }> {
    this.validateAction(action)

    const job = await this.jobStore.findById(jobId)
    if (!job || job.status !== 'running') {
      throw new HttpServerError(
        404,
        'JOB_NOT_RUNNING',
        `Job '${jobId}' is not actively running.`
      )
    }

    const orchestrator = this.executionRegistry.getRunningOrchestrator(jobId)

    if (orchestrator) {
      if (typeof (orchestrator as any).applySteering === 'function') {
        ;(orchestrator as any).applySteering(action)
      } else if (typeof (orchestrator as any).applySteeringActions === 'function') {
        ;(orchestrator as any).applySteeringActions([action])
      }
    }

    this.broadcaster.broadcast(jobId, {
      type: 'steering_applied',
      action,
      timestamp: Date.now(),
      jobId,
    })

    return { applied: true }
  }

  private validateAction(action: SteeringRequestDTO): void {
    if (!action || typeof action !== 'object') {
      throw new HttpServerError(400, 'INVALID_STEERING_PAYLOAD', 'Steering payload must be an object')
    }

    switch (action.type) {
      case 'add_rule': {
        if (typeof action.rule !== 'string' || !action.rule.trim()) {
          throw new HttpServerError(400, 'INVALID_STEERING_PAYLOAD', 'Rule must be a non-empty string')
        }
        if (action.rule.length > 5000) {
          throw new HttpServerError(400, 'INVALID_STEERING_PAYLOAD', 'Rule text exceeds maximum 5000 characters')
        }
        break
      }

      case 'rollback': {
        if (!action.targetPhase || !VALID_PHASES.has(action.targetPhase as Phase)) {
          throw new HttpServerError(
            400,
            'INVALID_STEERING_PAYLOAD',
            `Invalid targetPhase '${action.targetPhase}' for rollback`
          )
        }
        break
      }

      case 'override_score': {
        if (action.tl !== undefined) {
          if (typeof action.tl !== 'number' || isNaN(action.tl)) {
            throw new HttpServerError(400, 'INVALID_STEERING_PAYLOAD', 'tl score must be a valid number')
          }
          ;(action as any).tl = Math.max(0, Math.min(10, action.tl))
        }
        if (action.adv !== undefined) {
          if (typeof action.adv !== 'number' || isNaN(action.adv)) {
            throw new HttpServerError(400, 'INVALID_STEERING_PAYLOAD', 'adv score must be a valid number')
          }
          ;(action as any).adv = Math.max(0, Math.min(10, action.adv))
        }
        break
      }

      default:
        throw new HttpServerError(400, 'INVALID_STEERING_ACTION', `Unknown steering action type: ${(action as any).type}`)
    }
  }
}
