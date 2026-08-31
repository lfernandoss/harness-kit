import { HttpServerError } from '../../domain/types'
import type { JobStoreRepository } from '../../adapters/outbound/repository/JobStoreRepository'
import type { JobStatusDto } from '../../adapters/inbound/http/dto/JobStatusDto'
import { JobExecutionRegistry } from '../../adapters/outbound/services/JobExecutionRegistry'
import { EventStreamBroadcaster } from '../../adapters/inbound/http/routes/EventStreamHandler'

export class GetJobStatusUseCase {
  constructor(private jobStore: JobStoreRepository) {}

  async execute(jobId: string): Promise<JobStatusDto> {
    if (!jobId || jobId.trim() === '') {
      throw new HttpServerError(400, 'INVALID_JOB_ID', 'Job ID is required')
    }

    const job = await this.jobStore.findById(jobId)
    if (!job) {
      throw new HttpServerError(404, 'JOB_NOT_FOUND', `Job with ID '${jobId}' not found`)
    }

    const runningOrch = JobExecutionRegistry.getInstance().getRunningOrchestrator(jobId)
    const pendingRefinement = JobExecutionRegistry.getInstance().getPendingRefinement(jobId)
    const currentPhase = runningOrch?.state?.currentPhase || (job.status === 'completed' ? 'DEPLOY' : (pendingRefinement ? 'REFINEMENT' : 'BOOTSTRAP'))
    const historyLogs = EventStreamBroadcaster.getInstance().getHistory(jobId)

    return {
      jobId: job.jobId,
      status: pendingRefinement ? ('waiting_for_input' as any) : job.status,
      phase: currentPhase,
      scope: job.request?.scope,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      progress: {
        phase: currentPhase,
      },
      historyLogs: historyLogs as any,
      pendingRefinement: pendingRefinement?.questions,
      error: job.error,
    }
  }
}
