import type {
  ISettingsApiClient,
  SettingsScope,
  HarnessSettingsMap,
  SettingsApiPayload,
  SettingsDiagnostic,
} from '../types/settings.types.js'

export interface SettingsApiClientOptions {
  baseUrl?: string
  fetchFn?: typeof fetch
}

export class SettingsApiClient implements ISettingsApiClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options?: SettingsApiClientOptions) {
    this.baseUrl = (options?.baseUrl || '').replace(/\/+$/, '')
    this.fetchFn =
      options?.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any))
  }

  async fetchSettings(scope: SettingsScope = 'global', project?: string): Promise<SettingsApiPayload> {
    const params = new URLSearchParams()
    params.set('scope', scope)
    if (project) {
      params.set('project', project)
    }

    const url = `${this.baseUrl}/orchestrator/settings?${params.toString()}`
    const res = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      let errorMessage = `Failed to fetch settings (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async saveSettings(
    scope: SettingsScope,
    settings: HarnessSettingsMap,
    project?: string
  ): Promise<SettingsApiPayload> {
    const url = `${this.baseUrl}/orchestrator/settings`
    const body: Record<string, any> = {
      scope,
      project,
      settings,
    }

    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errorMessage = `Failed to save settings (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async renewSettings(scope: SettingsScope, project?: string): Promise<SettingsApiPayload> {
    const url = `${this.baseUrl}/orchestrator/settings/renew`
    const body = {
      scope,
      project,
    }

    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errorMessage = `Failed to renew settings (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }

  async deleteSettings(scope: SettingsScope, project?: string): Promise<void> {
    const url = `${this.baseUrl}/orchestrator/settings`
    const body = {
      scope,
      project,
    }

    const res = await this.fetchFn(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errorMessage = `Failed to delete settings (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }
  }

  async validateSettings(data: unknown): Promise<SettingsDiagnostic> {
    const url = `${this.baseUrl}/orchestrator/settings/validate`
    const body = {
      settings: data,
    }

    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errorMessage = `Settings validation request failed (HTTP ${res.status})`
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return res.json()
  }
}
