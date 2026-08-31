import type {
  LiveSessionState,
  RunConfigDTO,
  JobEventDTO,
  IOrchestrationApiClient,
  IEventStreamClient,
} from '../types/index.js'
import { OrchestrationApiClient } from '../services/OrchestrationApiClient.js'
import { EventStreamClient } from '../services/EventStreamClient.js'

export class OrchestrationExecutionManager {
  private _session: LiveSessionState | null = null
  private _error: string | null = null
  private _conflictError: { message: string; activeJobId?: string } | null = null
  private unsubscribeStream?: () => void
  private listeners = new Set<() => void>()

  constructor(
    private readonly apiClient: IOrchestrationApiClient = new OrchestrationApiClient(),
    private readonly streamClient: IEventStreamClient = new EventStreamClient()
  ) {}

  get session(): LiveSessionState | null {
    return this._session
  }

  get isRunning(): boolean {
    return (
      this._session !== null &&
      (this._session.status === 'queued' || this._session.status === 'running')
    )
  }

  get error(): string | null {
    return this._error
  }

  get conflictError(): { message: string; activeJobId?: string } | null {
    return this._conflictError
  }

  async startJob(config: RunConfigDTO): Promise<{ jobId: string; status: string }> {
    this._error = null
    this._conflictError = null
    this.notify()

    try {
      const response = await this.apiClient.startJob(config)
      this.initSession(response.jobId, response.status as any)
      return response
    } catch (err: any) {
      if (err.status === 409 || err.code === 'LOCK_CONFLICT' || err.code === 'WORKSPACE_LOCKED') {
        this._conflictError = {
          message: err.message || 'Workspace is currently locked by another active job',
        }
      } else {
        this._error = err.message || 'Failed to start orchestration run'
      }
      this.notify()
      throw err
    }
  }

  async resumeJob(
    jobId: string,
    overrides?: Partial<RunConfigDTO>
  ): Promise<{ jobId: string; status: string }> {
    this._error = null
    this._conflictError = null
    this.notify()

    try {
      const response = this.apiClient.resumeJob
        ? await this.apiClient.resumeJob(jobId, overrides)
        : { jobId, status: 'running' }

      this.initSession(response.jobId, response.status as any)
      return response
    } catch (err: any) {
      this._error = err.message || 'Failed to resume orchestration run'
      this.notify()
      throw err
    }
  }

  async abortJob(reason?: string): Promise<void> {
    if (!this._session?.jobId) return

    try {
      await this.apiClient.abortJob(this._session.jobId, reason)
      if (this._session) {
        this._session = {
          ...this._session,
          status: 'aborted',
        }
      }
      this.notify()
    } catch (err: any) {
      this._error = err.message || 'Failed to abort job'
      this.notify()
      throw err
    }
  }

  initSession(jobId: string, initialStatus: LiveSessionState['status'] = 'queued'): void {
    this._session = {
      jobId,
      status: initialStatus,
      currentPhase: 'BOOTSTRAP',
      logs: [],
      isConnected: true,
      telemetry: { tokensUsed: 0, costEstimate: 0 },
    }

    this.streamClient.connect(jobId)

    if (this.unsubscribeStream) {
      this.unsubscribeStream()
    }

    this.unsubscribeStream = this.streamClient.onEvent((event: JobEventDTO) => {
      this.handleStreamEvent(event)
    })

    this.notify()
  }

  handleStreamEvent(event: JobEventDTO): void {
    if (!this._session) return

    switch (event.type) {
      case 'phase_change':
        this._session = {
          ...this._session,
          currentPhase: event.phase,
          status: event.phase === 'DEPLOY' || event.phase === 'HALTED' ? 'completed' : 'running',
        }
        break

      case 'log_chunk':
        this._session = {
          ...this._session,
          logs: [
            ...this._session.logs,
            {
              stream: event.stream,
              text: event.text,
              timestamp: event.timestamp ?? Date.now(),
            },
          ],
        }
        break

      case 'telemetry':
        this._session = {
          ...this._session,
          telemetry: {
            tokensUsed: event.tokensUsed,
            costEstimate: event.costEstimate,
          },
        }
        break

      case 'steering_applied':
        this._session = {
          ...this._session,
          logs: [
            ...this._session.logs,
            {
              stream: 'stdout',
              text: `[STEERING] Action applied: ${JSON.stringify(event.action)}`,
              timestamp: event.timestamp ?? Date.now(),
            },
          ],
        }
        break
    }

    this.notify()
  }

  handleStreamDisconnect(): void {
    if (this._session) {
      this._session = {
        ...this._session,
        isConnected: false,
      }
      this.notify()
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

let activeExecutionManager: OrchestrationExecutionManager | null = null

export function useOrchestrationExecution(
  apiClient?: IOrchestrationApiClient,
  streamClient?: IEventStreamClient
): {
  readonly session: LiveSessionState | null
  readonly isRunning: boolean
  readonly error: string | null
  readonly conflictError: { message: string; activeJobId?: string } | null
  startJob(config: RunConfigDTO): Promise<{ jobId: string; status: string }>
  resumeJob(jobId: string, overrides?: Partial<RunConfigDTO>): Promise<{ jobId: string; status: string }>
  abortJob(reason?: string): Promise<void>
  manager: OrchestrationExecutionManager
} {
  if (!activeExecutionManager || apiClient || streamClient) {
    activeExecutionManager = new OrchestrationExecutionManager(apiClient, streamClient)
  }

  return {
    get session() {
      return activeExecutionManager!.session
    },
    get isRunning() {
      return activeExecutionManager!.isRunning
    },
    get error() {
      return activeExecutionManager!.error
    },
    get conflictError() {
      return activeExecutionManager!.conflictError
    },
    startJob: (cfg: RunConfigDTO) => activeExecutionManager!.startJob(cfg),
    resumeJob: (jobId: string, overrides?: Partial<RunConfigDTO>) =>
      activeExecutionManager!.resumeJob(jobId, overrides),
    abortJob: (reason?: string) => activeExecutionManager!.abortJob(reason),
    manager: activeExecutionManager,
  }
}
