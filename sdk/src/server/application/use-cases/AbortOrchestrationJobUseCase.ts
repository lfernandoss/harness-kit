import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { HttpServerError } from '../../domain/types'
import type { JobStoreRepository } from '../../adapters/outbound/repository/JobStoreRepository'
import type { WorkspaceLockManager } from '../../adapters/outbound/mutex/WorkspaceLockManager'
import { JobExecutionRegistry } from '../../adapters/outbound/services/JobExecutionRegistry'
import { EventStreamBroadcaster } from '../../adapters/inbound/http/routes/EventStreamHandler'

const execAsync = promisify(exec)

export class AbortOrchestrationJobUseCase {
  constructor(
    private jobStore: JobStoreRepository,
    private lockManager: WorkspaceLockManager,
    private executionRegistry: JobExecutionRegistry = JobExecutionRegistry.getInstance(),
    private broadcaster: EventStreamBroadcaster = EventStreamBroadcaster.getInstance()
  ) {}

  async execute(
    jobId: string,
    reason = 'Execution aborted by user'
  ): Promise<{ aborted: boolean; jobId: string }> {
    const job = await this.jobStore.findById(jobId)
    if (!job) {
      throw new HttpServerError(404, 'JOB_NOT_FOUND', `Job '${jobId}' not found.`)
    }

    const abortController = this.executionRegistry.getAbortController(jobId)
    if (abortController && !abortController.signal.aborted) {
      abortController.abort()
    }

    const runnerProcess = this.executionRegistry.getProcess(jobId)
    if (runnerProcess) {
      try {
        if (runnerProcess.pid) {
          await this.killProcessTree(runnerProcess.pid)
        } else if (typeof runnerProcess.kill === 'function') {
          runnerProcess.kill('SIGKILL')
        }
      } catch (err) {
        console.warn(`Failed to cleanly kill runner process tree for job ${jobId}:`, err)
      }
    }

    await this.jobStore.updateStatus(jobId, 'aborted', {
      code: 'USER_ABORTED',
      message: reason,
    })

    await this.lockManager.releaseLock(job.workspacePath, jobId)

    this.broadcaster.broadcast(jobId, {
      type: 'log_chunk',
      stream: 'stderr',
      text: `\n[ABORTED] Job execution was terminated: ${reason}\n`,
      timestamp: Date.now(),
      jobId,
    })

    this.executionRegistry.unregister(jobId)

    return { aborted: true, jobId }
  }

  private async killProcessTree(pid: number): Promise<void> {
    const isWindows = process.platform === 'win32'
    if (isWindows) {
      try {
        await execAsync(`taskkill /pid ${pid} /t /f`)
      } catch {}
    } else {
      try {
        await execAsync(`kill -9 -${pid}`)
      } catch {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {}
      }
    }
  }
}
