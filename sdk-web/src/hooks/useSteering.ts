import type { IOrchestrationApiClient, SteeringRequestDTO } from '../types/index.js'
import { OrchestrationApiClient } from '../services/OrchestrationApiClient.js'

export class SteeringManager {
  private _isSubmitting = false
  private _error: string | null = null
  private listeners = new Set<() => void>()

  constructor(
    readonly jobId: string,
    private readonly apiClient: IOrchestrationApiClient = new OrchestrationApiClient()
  ) {}

  get isSubmitting(): boolean {
    return this._isSubmitting
  }

  get error(): string | null {
    return this._error
  }

  async submitSteering(action: SteeringRequestDTO): Promise<void> {
    this._isSubmitting = true
    this._error = null
    this.notify()

    try {
      await this.apiClient.steerJob(this.jobId, action)
      this._isSubmitting = false
      this.notify()
    } catch (err: any) {
      this._error = err.message || 'Failed to submit steering action'
      this._isSubmitting = false
      this.notify()
      throw err
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export function useSteering(
  jobId: string,
  apiClient?: IOrchestrationApiClient
): {
  readonly isSubmitting: boolean
  readonly error: string | null
  submitSteering(action: SteeringRequestDTO): Promise<void>
  manager: SteeringManager
} {
  const manager = new SteeringManager(jobId, apiClient)

  return {
    get isSubmitting() {
      return manager.isSubmitting
    },
    get error() {
      return manager.error
    },
    submitSteering: (action: SteeringRequestDTO) => manager.submitSteering(action),
    manager,
  }
}
