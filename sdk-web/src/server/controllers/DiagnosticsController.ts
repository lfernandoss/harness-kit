import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  DiagnoseSessionDTO,
  CandidateSummaryDTO,
  CandidateDetailDTO,
  DiagnoseBatchRunOptions,
  PromotionResultDTO,
  DiagnoseReportDTO,
  BatchProgressDTO,
} from '../../types/diagnostics.js'
import {
  validateDiagnoseBatchRunOptions,
  validateCandidateId,
  createCandidateSummaryDTO,
  createCandidateDetailDTO,
} from '../../types/diagnostics.js'
import { CandidateReader } from '../../../../sdk/src/diagnose/CandidateReader.js'
import { CandidatePromotionService } from '../../../../sdk/src/diagnose/CandidatePromotionService.js'
import { MetaHarnessAgentAdapter } from '../../../../sdk/src/diagnose/MetaHarnessAgentAdapter.js'
import { JsonlSessionLedger } from '../../../../sdk/src/diagnose/JsonlSessionLedger.js'
import { DiagnosePaths } from '../../../../sdk/src/diagnose/utils/DiagnosePaths.js'
import type { DiagnoseService } from '../../../../sdk/src/diagnose/DiagnoseService.js'

export interface DiagnosticsControllerOptions {
  diagnoseService?: DiagnoseService
  ledger?: any
  candidateReader?: any
  agentAdapter?: any
  workingDir?: string
}

const ALLOWED_RUNNERS = new Set([
  'claude-cli',
  'antigravity-cli',
  'copilot-cli',
  'codex-cli',
  'cursor-cli',
  'kiro-cli',
  'claude',
  'agy',
  'copilot',
  'cursor',
])

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

export class DiagnosticsController {
  private readonly diagnoseService?: DiagnoseService
  private readonly ledger: any
  private readonly candidateReader: any
  private readonly agentAdapter: any
  private readonly workingDir: string

  constructor(options: DiagnosticsControllerOptions = {}) {
    this.workingDir = options.workingDir ?? process.cwd()
    this.ledger = options.ledger ?? new JsonlSessionLedger(this.workingDir)
    this.candidateReader = options.candidateReader ?? CandidateReader
    this.agentAdapter = options.agentAdapter ?? new MetaHarnessAgentAdapter({ workingDir: this.workingDir })
    this.diagnoseService = options.diagnoseService
  }

  async getSessions(): Promise<DiagnoseSessionDTO[]> {
    const records = this.ledger.loadPending ? this.ledger.loadPending() : []
    const mapped: DiagnoseSessionDTO[] = records.map((r: any) => ({
      sessionId: r.sessionId,
      timestamp: r.timestamp,
      runner: r.runner,
      model: r.model ?? r.snapshot?.model ?? '',
      phase: r.phase ?? 'DEVELOPMENT',
      domain: r.domain,
      status: r.status === 'completed' ? 'processed' : 'pending',
      snapshot: r.snapshot,
    }))

    return sanitizeObject(mapped)
  }

  async runBatch(
    options: DiagnoseBatchRunOptions,
    onProgress?: (progress: BatchProgressDTO) => void
  ): Promise<DiagnoseReportDTO> {
    const validatedOpts = validateDiagnoseBatchRunOptions(options)
    const batchSize = validatedOpts.batchSize ?? 3

    if (this.diagnoseService?.processAllPendingInBatches) {
      const res = await this.diagnoseService.processAllPendingInBatches(batchSize, (batch) => {
        if (onProgress) {
          onProgress({
            processed: batch.processed,
            remaining: batch.remaining,
            total: (batch.sessionIds?.length ?? 0) + batch.remaining,
          })
        }
      })

      const report: DiagnoseReportDTO = {
        processedSessions: res.processed,
        remainingSessions: res.remaining,
        sessionIds: res.sessionIds ?? [],
        traceIds: res.traceIds ?? [],
        candidateCreated: res.candidateCreated
          ? {
              candidateId: res.candidateCreated.candidateId,
              targetSkill: res.candidateCreated.targetSkill,
              status: (res.candidateCreated.status as any) ?? 'PROPOSED',
              path: res.candidateCreated.path ?? '',
              shortRationale: res.candidateCreated.rationale?.slice(0, 150),
            }
          : null,
      }
      return sanitizeObject(report)
    }

    if (this.diagnoseService?.processNextBatch) {
      const res = await this.diagnoseService.processNextBatch(batchSize)
      if (onProgress) {
        onProgress({
          processed: res.processed,
          remaining: res.remaining,
        })
      }

      const report: DiagnoseReportDTO = {
        processedSessions: res.processed,
        remainingSessions: res.remaining,
        sessionIds: res.sessionIds ?? [],
        traceIds: res.traceIds ?? [],
      }
      return sanitizeObject(report)
    }

    return {
      processedSessions: 0,
      remainingSessions: 0,
      sessionIds: [],
    }
  }

  async getCandidates(): Promise<CandidateSummaryDTO[]> {
    if (this.candidateReader?.listCandidates) {
      const result = this.candidateReader.listCandidates(this.workingDir)
      return sanitizeObject(result)
    }

    const candidatesBaseDir = DiagnosePaths.candidatesDir(this.workingDir)
    if (!existsSync(candidatesBaseDir)) {
      return []
    }

    const entries = readdirSync(candidatesBaseDir, { withFileTypes: true })
    const candidateDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

    const summaries: CandidateSummaryDTO[] = []
    for (const id of candidateDirs) {
      try {
        validateCandidateId(id)
      } catch {
        continue
      }

      const info = this.candidateReader.readCandidateFromDisk(this.workingDir, id)
      if (info) {
        summaries.push(
          createCandidateSummaryDTO({
            candidateId: info.candidateId,
            targetSkill: info.targetSkill,
            status: info.status as any,
            path: info.path ?? `docs/harness-history/candidates/${id}`,
            shortRationale: info.rationale ? info.rationale.slice(0, 150) : undefined,
          })
        )
      }
    }

    return sanitizeObject(summaries)
  }

  async getCandidate(candidateId: string): Promise<CandidateDetailDTO | null> {
    this.assertValidCandidateId(candidateId)

    const info = this.candidateReader.readCandidateFromDisk(this.workingDir, candidateId)
    if (!info) {
      return null
    }

    const candidateDir = DiagnosePaths.candidateDir(this.workingDir, candidateId)
    let promptDiff = info.proposedChange ?? ''
    const diffPath = join(candidateDir, 'diff.md')
    if (existsSync(diffPath)) {
      try {
        promptDiff = readFileSync(diffPath, 'utf8')
      } catch {}
    }

    const runnerCmd = CandidatePromotionService.buildRunnerCommand(
      'claude-cli',
      candidateId,
      info.targetSkill,
      this.workingDir
    )

    const detail = createCandidateDetailDTO({
      candidateId: info.candidateId,
      targetSkill: info.targetSkill,
      status: (info.status as any) ?? 'PROPOSED',
      path: info.path ?? `docs/harness-history/candidates/${candidateId}`,
      rationale: info.rationale ?? '',
      promptDiff,
      runnerCommand: runnerCmd,
    })

    return sanitizeObject(detail)
  }

  async promoteCandidate(
    candidateId: string,
    opts: { runner?: string } = {}
  ): Promise<PromotionResultDTO> {
    this.assertValidCandidateId(candidateId)

    const runnerType = opts.runner ?? 'claude-cli'
    this.assertSafeRunner(runnerType)

    const candidate = await this.getCandidate(candidateId)
    const targetSkill = candidate?.targetSkill ?? 'unknown'

    try {
      if (this.agentAdapter?.invokeCandidatePromotion) {
        const output = await this.agentAdapter.invokeCandidatePromotion(
          candidateId,
          targetSkill,
          runnerType
        )

        return {
          success: true,
          candidateId,
          targetSkill,
          runnerType,
        }
      }

      return {
        success: true,
        candidateId,
        targetSkill,
        runnerType,
      }
    } catch (err: any) {
      return {
        success: false,
        candidateId,
        targetSkill,
        runnerType,
        error: err.message || 'Promotion failed',
      }
    }
  }

  private assertValidCandidateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new InvalidCandidateIdError('Candidate ID must be a non-empty string')
    }

    if (id.includes('..') || id.includes('/') || id.includes('\\') || id.includes('%')) {
      throw new InvalidCandidateIdError('Directory traversal or invalid characters detected in candidate ID')
    }

    validateCandidateId(id)
  }

  private assertSafeRunner(runner: string): void {
    if (
      !runner ||
      typeof runner !== 'string' ||
      runner.includes(';') ||
      runner.includes('&') ||
      runner.includes('|') ||
      runner.includes('`') ||
      runner.includes('$') ||
      runner.includes('\n') ||
      !ALLOWED_RUNNERS.has(runner.trim())
    ) {
      throw new ShellInjectionError(`Disallowed or unsafe runner string: ${runner}`)
    }
  }
}

export class InvalidCandidateIdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCandidateIdError'
  }
}

export class ShellInjectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShellInjectionError'
  }
}
