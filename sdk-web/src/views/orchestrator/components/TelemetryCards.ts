import { sanitizeHtml } from '../../../utils/ansiParser.js'

export interface TelemetryCardsProps {
  tokensUsed?: number
  costEstimate?: number
  completedCycles?: number
  durationSeconds?: number
}

export function renderTelemetryCards(props: TelemetryCardsProps = {}): string {
  const tokens = props.tokensUsed ?? 0
  const cost = props.costEstimate ?? 0
  const cycles = props.completedCycles ?? 0
  const duration = props.durationSeconds ?? 0

  const formattedTokens = tokens.toLocaleString('en-US')
  const formattedCost = `$${cost.toFixed(2)}`
  const formattedDuration = `${duration}s`


  return `
<div class="telemetry-cards-grid">
  <div class="telemetry-card card-tokens">
    <div class="card-label">Tokens Consumed</div>
    <div class="card-value">${sanitizeHtml(formattedTokens)}</div>
  </div>

  <div class="telemetry-card card-cost">
    <div class="card-label">Est. Cost</div>
    <div class="card-value">${sanitizeHtml(formattedCost)}</div>
  </div>

  <div class="telemetry-card card-cycles">
    <div class="card-label">Cycles Completed</div>
    <div class="card-value">${sanitizeHtml(String(cycles))}</div>
  </div>

  <div class="telemetry-card card-duration">
    <div class="card-label">Elapsed Time</div>
    <div class="card-value">${sanitizeHtml(formattedDuration)}</div>
  </div>
</div>
`.trim()
}

export const TelemetryCards = renderTelemetryCards
