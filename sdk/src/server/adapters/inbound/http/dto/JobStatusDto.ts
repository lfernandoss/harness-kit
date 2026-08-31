import type { JobStatus } from '../../../../domain/types'

export interface JobStatusDto {
  jobId: string
  status: JobStatus
  phase?: string
  scope?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  progress?: {
    phase?: string
    step?: number
  }
  historyLogs?: Array<{ type: string; text?: string; phase?: string; timestamp?: number }>
  pendingRefinement?: any[]
  error?: {
    code: string
    message: string
  }
}
