import type { HarnessOrchestrator } from '../../../../orchestrator/HarnessOrchestrator'

export interface RunningJobContext {
  jobId: string
  orchestrator?: HarnessOrchestrator
  abortController?: AbortController
  process?: { kill: (signal?: string) => void; pid?: number }
}

export interface IJobExecutionRegistry {
  getRunningOrchestrator(jobId: string): HarnessOrchestrator | undefined
  registerRunning(
    jobId: string,
    orchestrator?: HarnessOrchestrator,
    abortController?: AbortController,
    process?: { kill: (signal?: string) => void; pid?: number }
  ): void
  unregister(jobId: string): void
  getAbortController(jobId: string): AbortController | undefined
  getProcess(jobId: string): { kill: (signal?: string) => void; pid?: number } | undefined
}

export class JobExecutionRegistry implements IJobExecutionRegistry {
  private static instance: JobExecutionRegistry
  private runningJobs = new Map<string, RunningJobContext>()
  private pendingRefinements = new Map<
    string,
    { questions: any[]; resolve: (answers: Array<{ question: string; answer: string }>) => void }
  >()

  static getInstance(): JobExecutionRegistry {
    if (!JobExecutionRegistry.instance) {
      JobExecutionRegistry.instance = new JobExecutionRegistry()
    }
    return JobExecutionRegistry.instance
  }

  registerRunning(
    jobId: string,
    orchestrator?: HarnessOrchestrator,
    abortController?: AbortController,
    process?: { kill: (signal?: string) => void; pid?: number }
  ): void {
    this.runningJobs.set(jobId, {
      jobId,
      orchestrator,
      abortController,
      process,
    })
  }

  registerPendingRefinement(
    jobId: string,
    questions: any[],
    resolve: (answers: Array<{ question: string; answer: string }>) => void
  ): void {
    this.pendingRefinements.set(jobId, { questions, resolve })
  }

  getPendingRefinement(jobId: string): { questions: any[] } | undefined {
    const item = this.pendingRefinements.get(jobId)
    if (!item) return undefined
    return { questions: item.questions }
  }

  resolvePendingRefinement(
    jobId: string,
    answers: Array<{ question: string; answer: string }>
  ): boolean {
    const item = this.pendingRefinements.get(jobId)
    if (item) {
      this.pendingRefinements.delete(jobId)
      item.resolve(answers)
      return true
    }
    return false
  }

  getRunningOrchestrator(jobId: string): HarnessOrchestrator | undefined {
    return this.runningJobs.get(jobId)?.orchestrator
  }

  getAbortController(jobId: string): AbortController | undefined {
    return this.runningJobs.get(jobId)?.abortController
  }

  getProcess(jobId: string): { kill: (signal?: string) => void; pid?: number } | undefined {
    return this.runningJobs.get(jobId)?.process
  }

  unregister(jobId: string): void {
    this.runningJobs.delete(jobId)
    const pending = this.pendingRefinements.get(jobId)
    if (pending) {
      this.pendingRefinements.delete(jobId)
      pending.resolve([])
    }
  }

  getActiveJobs(): string[] {
    return Array.from(this.runningJobs.keys())
  }
}
