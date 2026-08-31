import type {
  IDiagnosticsApiClient,
  CandidateSummaryDTO,
  CandidateDetailDTO,
  PromotionResultDTO,
} from '../types/diagnostics.js'
import { DiagnosticsApiClient } from '../api/diagnosticsApi.js'

export interface CandidateFilter {
  status?: 'ALL' | 'PROPOSED' | 'APPLIED' | 'PROMOTED'
  targetSkill?: string
}

export class CandidatesStateManager {
  private _candidates: CandidateSummaryDTO[] = []
  private _isLoading = false
  private _error: string | null = null
  private _filter: CandidateFilter = { status: 'ALL' }
  private listeners = new Set<() => void>()

  constructor(private readonly apiClient: IDiagnosticsApiClient = new DiagnosticsApiClient()) {}

  get candidates(): CandidateSummaryDTO[] {
    return this._candidates
  }

  get filteredCandidates(): CandidateSummaryDTO[] {
    return this._candidates.filter((c) => {
      if (this._filter.status && this._filter.status !== 'ALL' && c.status !== this._filter.status) {
        return false
      }
      if (this._filter.targetSkill && c.targetSkill !== this._filter.targetSkill) {
        return false
      }
      return true
    })
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get error(): string | null {
    return this._error
  }

  get filter(): CandidateFilter {
    return this._filter
  }

  setFilter(filter: CandidateFilter): void {
    this._filter = { status: 'ALL', ...filter }
    this.notify()
  }

  async loadCandidates(): Promise<void> {
    this._isLoading = true
    this._error = null
    this.notify()

    try {
      this._candidates = await this.apiClient.getCandidates()
      this._isLoading = false
      this.notify()
    } catch (err: any) {
      this._error = err.message || 'Failed to load candidates'
      this._isLoading = false
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

export class CandidateDetailStateManager {
  private _candidate: CandidateDetailDTO | null = null
  private _isLoading = false
  private _isPromoting = false
  private _error: string | null = null
  private _promotionResult: PromotionResultDTO | null = null
  private listeners = new Set<() => void>()

  constructor(
    private readonly candidateId: string,
    private readonly apiClient: IDiagnosticsApiClient = new DiagnosticsApiClient()
  ) {}

  get candidate(): CandidateDetailDTO | null {
    return this._candidate
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get isPromoting(): boolean {
    return this._isPromoting
  }

  get error(): string | null {
    return this._error
  }

  get promotionResult(): PromotionResultDTO | null {
    return this._promotionResult
  }

  async loadCandidate(): Promise<void> {
    this._isLoading = true
    this._error = null
    this.notify()

    try {
      this._candidate = await this.apiClient.getCandidate(this.candidateId)
      this._isLoading = false
      this.notify()
    } catch (err: any) {
      this._error = err.message || `Failed to load candidate ${this.candidateId}`
      this._isLoading = false
      this.notify()
    }
  }

  async promoteAutonomous(runner = 'claude-cli'): Promise<PromotionResultDTO> {
    this._isPromoting = true
    this._error = null
    this.notify()

    try {
      const result = await this.apiClient.promoteCandidate(this.candidateId, { runner })
      this._promotionResult = result
      this._isPromoting = false
      if (result.success && this._candidate) {
        this._candidate = {
          ...this._candidate,
          status: 'PROMOTED',
        }
      }
      this.notify()
      return result
    } catch (err: any) {
      const failedResult: PromotionResultDTO = {
        success: false,
        candidateId: this.candidateId,
        targetSkill: this._candidate?.targetSkill ?? 'unknown',
        runnerType: runner,
        error: err.message || 'Promotion failed',
      }
      this._error = err.message || 'Promotion failed'
      this._promotionResult = failedResult
      this._isPromoting = false
      this.notify()
      return failedResult
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

let activeCandidatesManager: CandidatesStateManager | null = null

export function useCandidates(apiClient?: IDiagnosticsApiClient): {
  readonly candidates: CandidateSummaryDTO[]
  readonly filteredCandidates: CandidateSummaryDTO[]
  readonly isLoading: boolean
  readonly error: string | null
  readonly filter: CandidateFilter
  setFilter(filter: CandidateFilter): void
  loadCandidates(): Promise<void>
  manager: CandidatesStateManager
} {
  if (!activeCandidatesManager || apiClient) {
    activeCandidatesManager = new CandidatesStateManager(apiClient)
  }

  return {
    get candidates() {
      return activeCandidatesManager!.candidates
    },
    get filteredCandidates() {
      return activeCandidatesManager!.filteredCandidates
    },
    get isLoading() {
      return activeCandidatesManager!.isLoading
    },
    get error() {
      return activeCandidatesManager!.error
    },
    get filter() {
      return activeCandidatesManager!.filter
    },
    setFilter: (f) => activeCandidatesManager!.setFilter(f),
    loadCandidates: () => activeCandidatesManager!.loadCandidates(),
    manager: activeCandidatesManager,
  }
}

export function useCandidateDetail(
  candidateId: string,
  apiClient?: IDiagnosticsApiClient
): {
  readonly candidate: CandidateDetailDTO | null
  readonly isLoading: boolean
  readonly isPromoting: boolean
  readonly error: string | null
  readonly promotionResult: PromotionResultDTO | null
  loadCandidate(): Promise<void>
  promoteAutonomous(runner?: string): Promise<PromotionResultDTO>
  manager: CandidateDetailStateManager
} {
  const manager = new CandidateDetailStateManager(candidateId, apiClient)

  return {
    get candidate() {
      return manager.candidate
    },
    get isLoading() {
      return manager.isLoading
    },
    get isPromoting() {
      return manager.isPromoting
    },
    get error() {
      return manager.error
    },
    get promotionResult() {
      return manager.promotionResult
    },
    loadCandidate: () => manager.loadCandidate(),
    promoteAutonomous: (r) => manager.promoteAutonomous(r),
    manager,
  }
}
