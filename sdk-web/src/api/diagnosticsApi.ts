import type {
  IDiagnosticsApiClient,
  DiagnoseSessionDTO,
  DiagnoseBatchRunOptions,
  DiagnoseReportDTO,
  CandidateSummaryDTO,
  CandidateDetailDTO,
  PromotionResultDTO,
} from '../types/diagnostics.js'

export interface DiagnosticsApiClientOptions {
  baseUrl?: string
  fetchFn?: typeof fetch
}

export class DiagnosticsApiClient implements IDiagnosticsApiClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options?: DiagnosticsApiClientOptions) {
    this.baseUrl = (options?.baseUrl || '').replace(/\/+$/, '')
    this.fetchFn =
      options?.fetchFn ||
      (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any))
  }

  async getSessions(): Promise<DiagnoseSessionDTO[]> {
    const url = `${this.baseUrl}/api/diagnose/sessions`
    const res = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      let errorMessage = `Failed to fetch diagnose sessions (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async runBatch(opts?: DiagnoseBatchRunOptions): Promise<DiagnoseReportDTO> {
    const url = `${this.baseUrl}/api/diagnose/run`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(opts ?? {}),
    })

    if (!res.ok) {
      let errorMessage = `Failed to run diagnose batch (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async getCandidates(): Promise<CandidateSummaryDTO[]> {
    const url = `${this.baseUrl}/api/diagnose/candidates`
    const res = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      let errorMessage = `Failed to fetch candidates (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async getCandidate(id: string): Promise<CandidateDetailDTO> {
    const url = `${this.baseUrl}/api/diagnose/candidates/${encodeURIComponent(id)}`
    const res = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      let errorMessage = `Failed to fetch candidate ${id} (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async promoteCandidate(
    id: string,
    opts?: { runner?: string }
  ): Promise<PromotionResultDTO> {
    const url = `${this.baseUrl}/api/diagnose/candidates/${encodeURIComponent(id)}/promote`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(opts ?? {}),
    })

    if (!res.ok) {
      let errorMessage = `Failed to promote candidate ${id} (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }
}
