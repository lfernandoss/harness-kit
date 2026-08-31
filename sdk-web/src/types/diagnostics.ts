export interface DiagnoseSessionDTO {
  readonly sessionId: string
  readonly timestamp: string
  readonly runner: string
  readonly model: string
  readonly phase: string
  readonly domain?: string
  readonly status: 'pending' | 'processed'
}

export interface CandidateSummaryDTO {
  readonly candidateId: string
  readonly targetSkill: string
  readonly status: 'PROPOSED' | 'APPLIED' | 'PROMOTED'
  readonly path: string
  readonly shortRationale?: string
}

export interface CandidateDetailDTO extends CandidateSummaryDTO {
  readonly rationale: string
  readonly promptDiff: string
  readonly generatedAt?: string
  readonly runnerCommand: string
}

export interface DiagnoseBatchRunOptions {
  readonly batchSize?: number
  readonly agentType?: string
  readonly model?: string
  readonly effort?: string
}

export interface PromotionResultDTO {
  readonly success: boolean
  readonly candidateId: string
  readonly targetSkill: string
  readonly runnerType: string
  readonly error?: string
}

export interface DiagnoseReportDTO {
  readonly processedSessions: number
  readonly remainingSessions: number
  readonly sessionIds: string[]
  readonly traceIds?: string[]
  readonly candidateCreated?: CandidateSummaryDTO | null
  readonly agent?: string
  readonly model?: string
  readonly effort?: string
  readonly summary?: string
}

export interface BatchProgressDTO {
  readonly processed: number
  readonly remaining: number
  readonly total?: number
}

export function validateDiagnoseBatchRunOptions(options: unknown): DiagnoseBatchRunOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('DiagnoseBatchRunOptions must be an object')
  }

  const raw = options as Record<string, any>

  if (raw.batchSize !== undefined) {
    if (typeof raw.batchSize !== 'number' || !Number.isInteger(raw.batchSize) || raw.batchSize < 1) {
      throw new Error(`Invalid batch size: ${raw.batchSize}. Must be an integer >= 1`)
    }
  }

  const batchSize = raw.batchSize !== undefined ? raw.batchSize : undefined
  const agentType = typeof raw.agentType === 'string' ? raw.agentType : undefined
  const model = typeof raw.model === 'string' ? raw.model : undefined
  const effort = typeof raw.effort === 'string' ? raw.effort : undefined

  return Object.freeze({
    batchSize,
    agentType,
    model,
    effort,
  })
}

const CANDIDATE_ID_REGEX = /^candidate-\d{4}-\d{2}-\d{2}-\d{3}$/

export function validateCandidateId(id: string): string {
  if (!id || typeof id !== 'string' || !CANDIDATE_ID_REGEX.test(id)) {
    throw new Error(`Candidate ID "${id}" does not match pattern candidate-YYYY-MM-DD-NNN`)
  }
  return id
}

export function createCandidateSummaryDTO(dto: CandidateSummaryDTO): CandidateSummaryDTO {
  validateCandidateId(dto.candidateId)
  if (!dto.targetSkill || typeof dto.targetSkill !== 'string') {
    throw new Error('CandidateSummaryDTO requires a valid targetSkill')
  }
  const validStatuses = new Set(['PROPOSED', 'APPLIED', 'PROMOTED'])
  if (!validStatuses.has(dto.status)) {
    throw new Error(`Invalid status "${dto.status}". Must be PROPOSED, APPLIED, or PROMOTED`)
  }

  return Object.freeze({
    candidateId: dto.candidateId,
    targetSkill: dto.targetSkill,
    status: dto.status,
    path: dto.path,
    shortRationale: dto.shortRationale,
  })
}

export function createCandidateDetailDTO(dto: CandidateDetailDTO): CandidateDetailDTO {
  const summary = createCandidateSummaryDTO(dto)
  return Object.freeze({
    ...summary,
    rationale: String(dto.rationale ?? ''),
    promptDiff: String(dto.promptDiff ?? ''),
    generatedAt: dto.generatedAt,
    runnerCommand: String(dto.runnerCommand ?? `hrns candidate review ${dto.candidateId}`),
  })
}

export interface IDiagnosticsApiClient {
  getSessions(): Promise<DiagnoseSessionDTO[]>
  runBatch(opts?: DiagnoseBatchRunOptions): Promise<DiagnoseReportDTO>
  getCandidates(): Promise<CandidateSummaryDTO[]>
  getCandidate(id: string): Promise<CandidateDetailDTO>
  promoteCandidate(id: string, opts?: { runner?: string }): Promise<PromotionResultDTO>
}
