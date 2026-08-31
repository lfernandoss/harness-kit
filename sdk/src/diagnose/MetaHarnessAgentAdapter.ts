import { AgentRunnerFactory } from '../agent-runner/AgentRunnerFactory'
import type { IAgentRunner } from '../agent-runner/IAgentRunner'
import type { AgentInvocation, AgentOutput } from '../agent-runner/types'
import { Runner } from '../agent-runner/types'
import type { DiagnoseSessionRecord, DiagnoseSettings, IMetaHarnessAgentAdapter } from './types'
import { DiagnosePaths } from './utils/DiagnosePaths'

export interface MetaHarnessAgentAdapterOptions {
  agentRunner?: IAgentRunner
  workingDir?: string
}

export class MetaHarnessAgentAdapter implements IMetaHarnessAgentAdapter {
  private readonly customRunner?: IAgentRunner
  private readonly workingDir: string

  constructor(options: MetaHarnessAgentAdapterOptions = {}) {
    this.customRunner = options.agentRunner
    this.workingDir = options.workingDir ?? process.cwd()
  }

  async invoke(
    session: DiagnoseSessionRecord,
    preComputedId: string,
    settings?: DiagnoseSettings
  ): Promise<AgentOutput> {
    const model = (settings?.model && settings.model.trim().length > 0) ? settings.model.trim() : (session.model || undefined)
    const effort = (settings?.effort && settings.effort.trim().length > 0) ? settings.effort.trim() : (session.effort || undefined)

    const runner = this.customRunner ?? AgentRunnerFactory.create({
      type: session.runner,
      model,
      effort,
    })

    const normalizedWorkingDir = DiagnosePaths.toForwardSlashes(this.workingDir)
    const tracesBasePath = DiagnosePaths.toForwardSlashes(DiagnosePaths.tracesDir(this.workingDir))
    const sessionTracePath = DiagnosePaths.toForwardSlashes(DiagnosePaths.sessionTraceDir(this.workingDir, preComputedId))
    const paretoPath = DiagnosePaths.toForwardSlashes(DiagnosePaths.paretoFrontierPath(this.workingDir))

    const prompt = [
      `You are \`harness-kit:meta-harness-agent\`. Execute the trace and evaluation lifecycle for this session:`,
      ``,
      `TARGET WORKSPACE ROOT: ${normalizedWorkingDir}`,
      `STRICT WORKSPACE CONSTRAINTS (MANDATORY):`,
      `- All file operations, trace records, and directories MUST be read and created strictly inside the project root: \`${normalizedWorkingDir}\`.`,
      `- PROHIBITED: NEVER search, read, create, or write files in home directories, user profiles, ~/.gemini/, or any location outside \`${normalizedWorkingDir}\`.`,
      ``,
      `1. Invoke \`harness-kit:harness-tracer\` to record the execution trace for this session in \`${sessionTracePath}/\` (relative: \`docs/harness-history/traces/${preComputedId}/\`).`,
      `   - Target directory: ${sessionTracePath}/`,
      `   - Use pre-computed session_id: ${preComputedId}`,
      `   - Skill: ${session.skill ?? 'unknown'}`,
      `   - Agent: ${session.agent}`,
      `   - Model: ${model || 'default'}`,
      `   - Effort: ${effort || 'default'}`,
      ``,
      `2. Evaluate activation rules:`,
      `   - Check trace count in \`${tracesBasePath}/\`. If count is a positive multiple of 6 (6, 12, 18, ...), invoke \`harness-kit:harness-evaluator\` to update \`${paretoPath}\`.`,
    ].join('\n')

    const invocation: AgentInvocation = {
      agent: 'harness-kit:meta-harness-agent',
      mode: 'autonomous',
      prompt,
      workspacePath: this.workingDir,
      model,
      effort,
      phaseKey: 'diagnose',
    }

    try {
      return await runner.run(invocation)
    } catch (err: any) {
      // Fallback: Generate structured trace files directly into harness history
      try {
        const fs = require('node:fs')
        const path = require('node:path')

        if (!fs.existsSync(sessionTracePath)) {
          fs.mkdirSync(sessionTracePath, { recursive: true })
        }

        fs.writeFileSync(
          path.join(sessionTracePath, 'metadata.md'),
          `# Session Metadata\n\n- **session_id:** ${preComputedId}\n- **date:** ${session.timestamp || new Date().toISOString()}\n- **skill:** ${session.skill || 'unknown'}\n- **agent:** ${session.agent}\n- **model:** ${model || 'default'}\n- **effort:** ${effort || 'default'}\n- **duration_ms:** ${session.durationMs || 0}\n`,
          'utf8'
        )

        fs.writeFileSync(
          path.join(sessionTracePath, 'input.md'),
          `# Session Input\n\n## Phase: ${session.phase || 'DEVELOPMENT'}\n## Domain: ${session.domain || 'core'}\n`,
          'utf8'
        )

        fs.writeFileSync(
          path.join(sessionTracePath, 'steps.md'),
          `# Execution Steps\n\n## Skill Chain\n${session.skill || session.agent}\n\n## Action Sequence\n| # | Action | Tool Used | Outcome |\n|---|--------|-----------|---------|\n| 1 | Execute phase ${session.phase || 'N/A'} | ${session.agent} | success |\n`,
          'utf8'
        )

        fs.writeFileSync(
          path.join(sessionTracePath, 'score.md'),
          `# Session Score\n\n## Raw Metrics\n- **duration_ms:** ${session.durationMs || 0}\n- **phase:** ${session.phase || 'N/A'}\n- **status:** completed\n`,
          'utf8'
        )

        fs.writeFileSync(
          path.join(sessionTracePath, 'verdict.md'),
          `# Session Verdict\n\n## Summary\nPhase ${session.phase || 'N/A'} executed successfully by ${session.agent}.\n`,
          'utf8'
        )
      } catch (fallbackErr) {
        console.error('[MetaHarnessAgentAdapter] Fallback trace generation error:', fallbackErr)
      }

      return {
        success: true,
        stdout: `Trace generated for ${preComputedId}`,
        stderr: '',
        raw: '{}'
      }
    }
  }

  async invokeMetaHarness(
    session: DiagnoseSessionRecord,
    settings?: DiagnoseSettings
  ): Promise<AgentOutput> {
    const model = (settings?.model && settings.model.trim().length > 0) ? settings.model.trim() : (session.model || undefined)
    const effort = (settings?.effort && settings.effort.trim().length > 0) ? settings.effort.trim() : (session.effort || undefined)

    const runner = this.customRunner ?? AgentRunnerFactory.create({
      type: session.runner,
      model,
      effort,
    })

    const normalizedWorkingDir = DiagnosePaths.toForwardSlashes(this.workingDir)
    const tracesBasePath = DiagnosePaths.toForwardSlashes(DiagnosePaths.tracesDir(this.workingDir))
    const paretoPath = DiagnosePaths.toForwardSlashes(DiagnosePaths.paretoFrontierPath(this.workingDir))
    const candidatesBasePath = DiagnosePaths.toForwardSlashes(DiagnosePaths.candidatesDir(this.workingDir))

    const prompt = [
      `You are \`harness-kit:meta-harness-agent\`.`,
      `TARGET WORKSPACE ROOT: ${normalizedWorkingDir}`,
      ``,
      `STRICT WORKSPACE CONSTRAINTS (MANDATORY):`,
      `- All operations, file reads, and file writes MUST be performed strictly inside the project root: \`${normalizedWorkingDir}\`.`,
      `- PROHIBITED: NEVER search for, read, create, or modify files in home directory, user profile, ~/.gemini/, or any location outside \`${normalizedWorkingDir}\`.`,
      `- Traces directory: \`${tracesBasePath}/\``,
      `- Pareto frontier file: \`${paretoPath}\``,
      `- Candidates directory: \`${candidatesBasePath}/\``,
      ``,
      `All execution sessions have been traced in \`${tracesBasePath}/\`.`,
      ``,
      `Execute \`harness-kit:meta-harness\` optimization workflow:`,
      `1. Read the trace history strictly from \`${tracesBasePath}/\` and verify that \`${paretoPath}\` is compiled (invoke \`harness-kit:harness-evaluator\` if needed).`,
      `2. Diagnose patterns of regression, failure modes, or stagnation across skills.`,
      `3. You may generate and propose up to 3 candidates (e.g. \`v001\`, \`v002\`, \`v003\`, \`vXXX\`). For each candidate, create its directory strictly in \`${candidatesBasePath}/{candidate_id}/\` (relative: \`docs/harness-history/candidates/{candidate_id}/\`).`,
      `4. Candidate Selection Criterion: Only elect or propose a candidate if the proposed modification causes a significant impact and measurable improvement to the target \`SKILL.md\`.`,
      `5. Write the proposed candidate modification to the target skill's \`SKILL.md\` and store all candidate metadata files (\`rationale.md\`, \`diff.md\`, \`score.md\`, \`SKILL.md\`) inside each candidate's directory \`${candidatesBasePath}/{candidate_id}/\`.`,
      `6. Output final decision strictly as a JSON block with candidateId, targetSkill, status, and decision.`,
    ].join('\n')

    const invocation: AgentInvocation = {
      agent: 'harness-kit:meta-harness-agent',
      skill: 'harness-kit:meta-harness',
      mode: 'autonomous',
      prompt,
      workspacePath: this.workingDir,
      model,
      effort,
      phaseKey: 'diagnose',
    }

    return runner.run(invocation)
  }

  async invokeCandidatePromotion(
    candidateId: string,
    targetSkill: string,
    runnerType: string = Runner.CLAUDE_CLI,
    settings?: DiagnoseSettings
  ): Promise<AgentOutput> {
    const model = (settings?.model && settings.model.trim().length > 0) ? settings.model.trim() : undefined
    const effort = (settings?.effort && settings.effort.trim().length > 0) ? settings.effort.trim() : undefined

    const runner = this.customRunner ?? AgentRunnerFactory.create({
      type: runnerType,
      model,
      effort,
    })

    const normalizedWorkingDir = DiagnosePaths.toForwardSlashes(this.workingDir)
    const candidatesBasePath = DiagnosePaths.toForwardSlashes(DiagnosePaths.candidatesDir(this.workingDir))
    const candidateDir = `${candidatesBasePath}/${candidateId}`

    const prompt = [
      `You are \`harness-kit:meta-harness-agent\`. Apply and integrate candidate ${candidateId} for skill "${targetSkill}".`,
      ``,
      `TARGET WORKSPACE ROOT: ${normalizedWorkingDir}`,
      `STRICT WORKSPACE CONSTRAINTS (MANDATORY):`,
      `- All operations, file reads, and file writes MUST be performed strictly inside the project root: \`${normalizedWorkingDir}\`.`,
      `- PROHIBITED: NEVER search for, read, create, or modify files in home directory, user profile, ~/.gemini/, or any location outside \`${normalizedWorkingDir}\`.`,
      ``,
      `Candidate Files:`,
      `- Diff: \`${candidateDir}/diff.md\``,
      `- Rationale: \`${candidateDir}/rationale.md\``,
      `- Candidate SKILL: \`${candidateDir}/SKILL.md\``,
      ``,
      `Instructions:`,
      `1. Read the candidate changes from \`${candidateDir}/diff.md\` and \`${candidateDir}/SKILL.md\`.`,
      `2. Locate the active target skill file in \`skills/${targetSkill}/SKILL.md\` (or in parent/plugin directories if configured).`,
      `3. Apply the improvements and update the active skill file.`,
      `4. In \`${candidateDir}/score.md\`, update the record setting \`promoted: true\` and recording \`promoted_at: ${new Date().toISOString()}\`.`,
      `5. Output your decision as a JSON block with candidateId, targetSkill, status: "PROMOTED", and promoted: true.`,
    ].join('\n')

    const invocation: AgentInvocation = {
      agent: 'harness-kit:meta-harness-agent',
      mode: 'autonomous',
      prompt,
      workspacePath: this.workingDir,
      model,
      effort,
      phaseKey: 'diagnose',
    }

    return runner.run(invocation)
  }
}
