import type {
  IWorkspaceInitApiClient,
  WorkspaceInitStatusDTO,
  InitializeWorkspaceDTO,
  WorkspaceInitResultDTO,
} from '../types/index.js'

export interface ApiClientOptions {
  baseUrl?: string
  fetchFn?: typeof fetch
}

export class WorkspaceInitApiClient implements IWorkspaceInitApiClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options?: ApiClientOptions) {
    this.baseUrl = (options?.baseUrl || '').replace(/\/+$/, '')
    this.fetchFn =
      options?.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any))
  }

  async fetchStatus(workspacePath?: string): Promise<WorkspaceInitStatusDTO> {
    return this.getStatus(workspacePath)
  }

  async getStatus(workspacePath?: string): Promise<WorkspaceInitStatusDTO> {
    const query = workspacePath ? `?path=${encodeURIComponent(workspacePath)}` : ''
    const url = `${this.baseUrl}/api/workspace/init/status${query}`

    const res = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      let errorMessage = `Failed to get workspace init status (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async initializeWorkspace(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO> {
    return this.initialize(dto)
  }

  async initialize(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO> {
    const url = `${this.baseUrl}/api/workspace/init`

    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(dto),
    })

    if (!res.ok) {
      let errorMessage = `Workspace initialization failed (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }
}
