import type { ProductReport } from '../../types/telemetry.js'
import { ReportDataAggregator } from '../../../../sdk/src/cli/services/report/ReportDataAggregator.js'
import { FileStateManager } from '../../../../sdk/src/file-state/FileStateManager.js'
import { TokenLedger } from '../../../../sdk/src/telemetry/TokenLedger.js'

export interface ReportControllerOptions {
  aggregator?: any
  workingDir?: string
}

const SENSITIVE_TOKEN_REGEX = /(?:sk-[a-zA-Z0-9_-]+|ghp_[a-zA-Z0-9]+|secret_[a-zA-Z0-9]+|bearer\s+[a-zA-Z0-9._-]+)/gi

export function sanitizeCredentials(text: string): string {
  if (!text || typeof text !== 'string') return text
  return text.replace(SENSITIVE_TOKEN_REGEX, '[REDACTED]')
}

export function sanitizeObject<T>(obj: T): T {
  if (!obj) return obj
  if (typeof obj === 'string') {
    return sanitizeCredentials(obj) as any
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as any
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {}
    for (const [k, v] of Object.entries(obj as Record<string, any>)) {
      res[k] = sanitizeObject(v)
    }
    return res as any
  }
  return obj
}

export class ReportController {
  private readonly aggregator: any
  private readonly workingDir: string

  constructor(options: ReportControllerOptions = {}) {
    this.workingDir = options.workingDir ?? process.cwd()
    if (options.aggregator) {
      this.aggregator = options.aggregator
    } else {
      try {
        const fsm = new FileStateManager(this.workingDir)
        const ledger = new TokenLedger(this.workingDir)
        this.aggregator = new ReportDataAggregator(fsm, ledger)
      } catch {
        this.aggregator = {
          aggregate: () => this.getDefaultReport(),
        }
      }
    }
  }

  async getReport(): Promise<ProductReport> {
    try {
      const report = this.aggregator.aggregate()
      return sanitizeObject(report)
    } catch {
      return this.getDefaultReport()
    }
  }

  private getDefaultReport(): ProductReport {
    return {
      backlogSummary: {
        total: 0,
        byStatus: {
          NOT_STARTED: 0,
          IN_PROGRESS: 0,
          COMPLETED: 0,
          BLOCKED: 0,
          FAILED: 0,
        },
        avgScoreTL: null,
        avgScoreAdv: null,
      },
      taskSummary: {
        total: 0,
        byStatus: {
          NOT_STARTED: 0,
          IN_PROGRESS: 0,
          COMPLETED: 0,
          BLOCKED: 0,
          FAILED: 0,
        },
        byFeature: {},
      },
      configSnapshot: {
        projectPaths: [],
        currentPhase: 'BOOTSTRAP',
        scoreThresholdTL: 0,
        scoreThresholdAdv: 0,
        maxReworks: 0,
        completedCycles: 0,
      },
      decisionSummary: {
        totalDecisions: 0,
        recentDecisions: [],
      },
      tokenReport: {
        entries: [],
        events: [],
        totals: {
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          costUsd: 0,
        },
        bySkill: {},
      },
    }
  }
}
