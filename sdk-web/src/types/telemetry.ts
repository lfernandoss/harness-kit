export interface BacklogSummary {
  total: number
  byStatus: {
    NOT_STARTED: number
    IN_PROGRESS: number
    COMPLETED: number
    BLOCKED: number
    FAILED: number
  }
  avgScoreTL: number | null
  avgScoreAdv: number | null
}

export interface FeatureProgress {
  featureId: string
  title: string
  status: string
  totalTasks: number
  completedTasks: number
  reworks: number
}

export interface TaskSummary {
  total: number
  byStatus: {
    NOT_STARTED: number
    IN_PROGRESS: number
    COMPLETED: number
    BLOCKED: number
    FAILED: number
  }
  byFeature: Record<string, FeatureProgress>
}

export interface ConfigSnapshot {
  projectPaths: string[]
  currentPhase: string
  scoreThresholdTL: number
  scoreThresholdAdv: number
  maxReworks: number
  completedCycles: number
}

export interface DecisionSummary {
  totalDecisions: number
  recentDecisions: string[]
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens: number
  costUsd: number
}

export interface TokenEntry {
  timestamp: number
  skill: string
  agent?: string
  model?: string
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens: number
  costUsd: number
  metadata?: string
}

export interface TokenReport {
  entries: TokenEntry[]
  events: any[]
  totals: TokenUsage
  bySkill: Record<string, TokenUsage>
}

export interface ProductReport {
  backlogSummary: BacklogSummary
  taskSummary: TaskSummary
  configSnapshot: ConfigSnapshot
  decisionSummary: DecisionSummary
  tokenReport: TokenReport
}

export interface TelemetryFilterCriteria {
  readonly skill?: string
  readonly model?: string
  readonly agent?: string
  readonly search?: string
}

export interface SkillCostRow {
  readonly skill: string
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly costUsd: number
}

export interface ModelDistributionItem {
  readonly model: string
  readonly tier: string
  readonly costUsd: number
  readonly percentage: number
}

export interface CacheSavingsMetrics {
  readonly cachedTokens: number
  readonly estimatedSavedUsd: number
  readonly hitRatioPercentage: number
}

export interface ExportOptions {
  readonly format: 'json' | 'csv'
  readonly filename?: string
  readonly sanitizePaths?: boolean
}

export interface TelemetryAuditEvent extends TokenEntry {
  auditId?: string
}

export interface IReportApiClient {
  fetchReport(): Promise<ProductReport>
}

export interface ITelemetryExporter {
  exportToFile(events: TelemetryAuditEvent[], options: ExportOptions): void
}

export interface LiveTokenDeltaPayload {
  delta: TokenUsage
  skill?: string
  model?: string
  jobId?: string
}
