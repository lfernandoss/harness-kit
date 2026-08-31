import type {
  ProductReport,
  TokenUsage,
  TelemetryAuditEvent,
  TelemetryFilterCriteria,
  CacheSavingsMetrics,
  IReportApiClient,
  LiveTokenDeltaPayload,
} from '../types/telemetry.js'

export const MODEL_TIER_RATES: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number; cacheReadPerMillion: number }
> = {
  fast: { inputPerMillion: 0.15, outputPerMillion: 0.6, cacheReadPerMillion: 0.0375 },
  medium: { inputPerMillion: 3.0, outputPerMillion: 15.0, cacheReadPerMillion: 0.75 },
  large: { inputPerMillion: 5.0, outputPerMillion: 15.0, cacheReadPerMillion: 1.25 },
  extra_large: { inputPerMillion: 15.0, outputPerMillion: 75.0, cacheReadPerMillion: 3.75 },
}

export function calculateTierCost(
  tier: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number = 0
): number {
  const rates = MODEL_TIER_RATES[tier] || MODEL_TIER_RATES.medium
  const inputCost = (inputTokens / 1_000_000) * rates.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMillion
  const cacheCost = (cacheReadTokens / 1_000_000) * rates.cacheReadPerMillion
  return inputCost + outputCost + cacheCost
}

export function computeCacheSavings(
  totals: TokenUsage,
  averageCacheRate: number = 0.000000235
): CacheSavingsMetrics {
  const cachedTokens = totals.cacheReadTokens || 0
  const inputTokens = totals.inputTokens || 0
  const totalInputs = inputTokens + cachedTokens

  if (totalInputs === 0 || cachedTokens === 0) {
    return {
      cachedTokens: 0,
      estimatedSavedUsd: 0,
      hitRatioPercentage: 0,
    }
  }

  const estimatedSavedUsd = cachedTokens * averageCacheRate
  const hitRatioPercentage = (cachedTokens / totalInputs) * 100

  return {
    cachedTokens,
    estimatedSavedUsd,
    hitRatioPercentage,
  }
}

export function filterAuditEntries(
  events: TelemetryAuditEvent[],
  criteria: TelemetryFilterCriteria
): TelemetryAuditEvent[] {
  if (!events || !Array.isArray(events)) return []
  if (!criteria || Object.keys(criteria).length === 0) return [...events]

  const searchLower = criteria.search ? criteria.search.toLowerCase() : null

  return events.filter((e) => {
    if (criteria.skill && e.skill !== criteria.skill) {
      return false
    }

    if (criteria.model && e.model !== criteria.model) {
      return false
    }

    if (criteria.agent && e.agent !== criteria.agent) {
      return false
    }

    if (searchLower) {
      const matchAgent = e.agent ? e.agent.toLowerCase().includes(searchLower) : false
      const matchSkill = e.skill ? e.skill.toLowerCase().includes(searchLower) : false
      const matchModel = e.model ? e.model.toLowerCase().includes(searchLower) : false
      const matchAuditId = e.auditId ? e.auditId.toLowerCase().includes(searchLower) : false
      if (!matchAgent && !matchSkill && !matchModel && !matchAuditId) {
        return false
      }
    }

    return true
  })
}

export class DefaultReportApiClient implements IReportApiClient {
  private readonly baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  async fetchReport(): Promise<ProductReport> {
    const url = `${this.baseUrl}/api/reports`
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to fetch report`)
    }

    return res.json()
  }
}

export class TelemetryReportStateManager {
  public report: ProductReport | null = null
  public isLoading: boolean = false
  public error: Error | null = null
  private readonly apiClient: IReportApiClient

  constructor(apiClient?: IReportApiClient) {
    this.apiClient = apiClient ?? new DefaultReportApiClient()
  }

  async loadReport(): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      this.report = await this.apiClient.fetchReport()
    } catch (err: any) {
      this.error = err instanceof Error ? err : new Error(String(err))
      this.report = null
    } finally {
      this.isLoading = false
    }
  }

  async refresh(): Promise<void> {
    return this.loadReport()
  }

  handleLiveDelta(payload: LiveTokenDeltaPayload): void {
    if (!this.report || !payload || !payload.delta) return

    const delta = payload.delta
    const totals = this.report.tokenReport.totals
    totals.inputTokens += delta.inputTokens || 0
    totals.outputTokens += delta.outputTokens || 0
    totals.cacheCreationTokens = (totals.cacheCreationTokens || 0) + (delta.cacheCreationTokens || 0)
    totals.cacheReadTokens += delta.cacheReadTokens || 0
    totals.costUsd += delta.costUsd || 0

    const skill = payload.skill || 'orchestrator'
    if (!this.report.tokenReport.bySkill[skill]) {
      this.report.tokenReport.bySkill[skill] = {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0,
      }
    }

    const skillTotals = this.report.tokenReport.bySkill[skill]
    skillTotals.inputTokens += delta.inputTokens || 0
    skillTotals.outputTokens += delta.outputTokens || 0
    skillTotals.cacheCreationTokens = (skillTotals.cacheCreationTokens || 0) + (delta.cacheCreationTokens || 0)
    skillTotals.cacheReadTokens += delta.cacheReadTokens || 0
    skillTotals.costUsd += delta.costUsd || 0
  }
}

export function useTelemetryReport(apiClient?: IReportApiClient): TelemetryReportStateManager {
  return new TelemetryReportStateManager(apiClient)
}
