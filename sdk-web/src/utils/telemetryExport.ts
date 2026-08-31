import type { TelemetryAuditEvent, ExportOptions } from '../types/telemetry.js'

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

export function sanitizeTelemetryEvents(events: TelemetryAuditEvent[]): TelemetryAuditEvent[] {
  return sanitizeObject(events)
}

export function convertToCsv(events: TelemetryAuditEvent[]): string {
  const sanitized = sanitizeTelemetryEvents(events)
  const header = 'timestamp,skill,agent,model,inputTokens,outputTokens,costUsd'
  const rows = sanitized.map((e) => {
    const ts = e.timestamp || 0
    const skill = (e.skill || '').replace(/"/g, '""')
    const agent = (e.agent || '').replace(/"/g, '""')
    const model = (e.model || '').replace(/"/g, '""')
    const inTokens = e.inputTokens || 0
    const outTokens = e.outputTokens || 0
    const cost = (e.costUsd || 0).toFixed(6)
    return `${ts},"${skill}","${agent}","${model}",${inTokens},${outTokens},${cost}`
  })

  return [header, ...rows].join('\n')
}

export function convertToJson(events: TelemetryAuditEvent[]): string {
  const sanitized = sanitizeTelemetryEvents(events)
  return JSON.stringify(sanitized, null, 2)
}

export function exportTelemetryData(
  events: TelemetryAuditEvent[],
  options: ExportOptions = { format: 'json' }
): void {
  const format = options.format || 'json'
  const filename = options.filename || `telemetry-report.${format}`
  const content = format === 'csv' ? convertToCsv(events) : convertToJson(events)
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;'

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
