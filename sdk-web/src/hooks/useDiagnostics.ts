import type {
  IDiagnosticsApiClient,
  DiagnoseSessionDTO,
  DiagnoseBatchRunOptions,
  DiagnoseReportDTO,
  BatchProgressDTO,
} from '../types/diagnostics.js'
import { DiagnosticsApiClient } from '../api/diagnosticsApi.js'

export class DiagnosticsStateManager {
  private _pendingSessions: DiagnoseSessionDTO[] = []
  private _isRunning = false
  private _isLoading = false
  private _progress: BatchProgressDTO | null = null
  private _report: DiagnoseReportDTO | null = null
  private _error: string | null = null
  private listeners = new Set<() => void>()

  constructor(private readonly apiClient: IDiagnosticsApiClient = new DiagnosticsApiClient()) {}

  get pendingSessions(): DiagnoseSessionDTO[] {
    return this._pendingSessions
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get progress(): BatchProgressDTO | null {
    return this._progress
  }

  get report(): DiagnoseReportDTO | null {
    return this._report
  }

  get error(): string | null {
    return this._error
  }

  async loadSessions(): Promise<void> {
    this._isLoading = true
    this._error = null
    this.notify()

    try {
      const sessions = await this.apiClient.getSessions()
      this._pendingSessions = sessions.filter((s) => s.status === 'pending')
      this._isLoading = false
      this.notify()
    } catch (err: any) {
      this._error = err.message || 'Failed to load diagnose sessions'
      this._isLoading = false
      this.notify()
    }
  }

  updateProgress(progress: BatchProgressDTO): void {
    this._progress = progress
    this.notify()
  }

  async runBatch(opts?: DiagnoseBatchRunOptions): Promise<DiagnoseReportDTO | null> {
    this._isRunning = true
    this._error = null
    this._progress = null
    this.notify()

    try {
      const report = await this.apiClient.runBatch(opts)
      this._report = report
      this._isRunning = false
      this._pendingSessions = this._pendingSessions.slice(report.processedSessions)
      this.notify()
      return report
    } catch (err: any) {
      this._error = err.message || 'Failed to run diagnose batch'
      this._isRunning = false
      this.notify()
      return null
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

let activeDiagnosticsManager: DiagnosticsStateManager | null = null

export function useDiagnostics(apiClient?: IDiagnosticsApiClient): {
  readonly pendingSessions: DiagnoseSessionDTO[]
  readonly isRunning: boolean
  readonly isLoading: boolean
  readonly progress: BatchProgressDTO | null
  readonly report: DiagnoseReportDTO | null
  readonly error: string | null
  loadSessions(): Promise<void>
  runBatch(opts?: DiagnoseBatchRunOptions): Promise<DiagnoseReportDTO | null>
  updateProgress(progress: BatchProgressDTO): void
  manager: DiagnosticsStateManager
} {
  if (!activeDiagnosticsManager || apiClient) {
    activeDiagnosticsManager = new DiagnosticsStateManager(apiClient)
  }

  return {
    get pendingSessions() {
      return activeDiagnosticsManager!.pendingSessions
    },
    get isRunning() {
      return activeDiagnosticsManager!.isRunning
    },
    get isLoading() {
      return activeDiagnosticsManager!.isLoading
    },
    get progress() {
      return activeDiagnosticsManager!.progress
    },
    get report() {
      return activeDiagnosticsManager!.report
    },
    get error() {
      return activeDiagnosticsManager!.error
    },
    loadSessions: () => activeDiagnosticsManager!.loadSessions(),
    runBatch: (opts) => activeDiagnosticsManager!.runBatch(opts),
    updateProgress: (p) => activeDiagnosticsManager!.updateProgress(p),
    manager: activeDiagnosticsManager,
  }
}
