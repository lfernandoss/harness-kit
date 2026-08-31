import type {
  IOrchestrationApiClient,
  RunConfigDTO,
  SteeringRequestDTO,
} from '../types/index.js'

export interface OrchestrationApiClientOptions {
  baseUrl?: string
  fetchFn?: typeof fetch
}

export class OrchestrationApiClient implements IOrchestrationApiClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options?: OrchestrationApiClientOptions) {

    this.baseUrl = (options?.baseUrl || '').replace(/\/+$/, '')
    this.fetchFn =
      options?.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any))
  }

  async startJob(config: RunConfigDTO): Promise<{ jobId: string; status: string }> {
    const url = `${this.baseUrl}/orchestrator/run`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!res.ok) {
      let errorMessage = `Failed to start orchestration job (HTTP ${res.status})`
      let errorData: any
      try {
        errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      const err: any = new Error(errorMessage)
      err.status = res.status
      err.code = errorData?.code
      throw err
    }

    return res.json()
  }

  async resumeJob(jobId: string, overrides?: Partial<RunConfigDTO>): Promise<{ jobId: string; status: string }> {
    const url = `${this.baseUrl}/orchestrator/jobs/${encodeURIComponent(jobId)}/resume`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(overrides || {}),
    })

    if (!res.ok) {
      let errorMessage = `Failed to resume orchestration job (HTTP ${res.status})`
      let errorData: any
      try {
        errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      const err: any = new Error(errorMessage)
      err.status = res.status
      err.code = errorData?.code
      throw err
    }

    return res.json()
  }

  async abortJob(jobId: string, reason?: string): Promise<void> {
    const url = `${this.baseUrl}/orchestrator/jobs/${encodeURIComponent(jobId)}/abort`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    if (!res.ok) {
      let errorMessage = `Failed to abort job (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }
  }

  async steerJob(jobId: string, action: SteeringRequestDTO): Promise<void> {
    const url = `${this.baseUrl}/orchestrator/jobs/${encodeURIComponent(jobId)}/steering`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(action),
    })

    if (!res.ok) {
      let errorMessage = `Failed to apply steering action (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }
  }

  async getStatus(jobId: string): Promise<{ status: string }> {
    const url = `${this.baseUrl}/orchestrator/status/${encodeURIComponent(jobId)}`
    const res = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      let errorMessage = `Failed to get job status (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }
}
