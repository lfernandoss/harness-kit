import { sanitizeHtml } from '../../../utils/ansiParser.js'

export const ALL_PHASES: readonly string[] = [
  'BOOTSTRAP',
  'REFINEMENT',
  'PLANNING',
  'DEVELOPMENT',
  'REVIEW',
  'MEMORY',
  'TRANSITION',
  'DEPLOY',
]

export interface PhaseTimelineProps {
  currentPhase: string
  completedPhases?: string[]
  skippedPhases?: string[]
}

export function renderPhaseTimeline(props: PhaseTimelineProps): string {
  const currentPhase = props.currentPhase
  const completedPhases = new Set(props.completedPhases || [])
  const skippedPhases = new Set(props.skippedPhases || [])

  const stepsHtml = ALL_PHASES.map((phase, index) => {
    const isActive = phase === currentPhase
    const isDone = completedPhases.has(phase)
    const isSkipped = skippedPhases.has(phase)

    let statusClass = 'pending'
    if (isActive) statusClass = 'active'
    else if (isDone) statusClass = 'done'
    else if (isSkipped) statusClass = 'skipped'

    let statusBadge = ''
    if (isActive) statusBadge = '<span class="status-badge pulse">Active</span>'
    else if (isDone) statusBadge = '<span class="status-badge check">✓</span>'
    else if (isSkipped) statusBadge = '<span class="status-badge skip">Skipped</span>'

    return `
      <div
        class="phase-step ${statusClass}"
        data-phase="${sanitizeHtml(phase)}"
        data-index="${index}"
      >
        <div class="step-indicator">
          <span class="step-num">${index + 1}</span>
          ${statusBadge}
        </div>
        <div class="step-label">${sanitizeHtml(phase)}</div>
      </div>
    `.trim()
  }).join('\n')

  return `
<div class="phase-timeline-container" role="progressbar" aria-label="Pipeline Stages">
  <div class="phase-timeline">
    ${stepsHtml}
  </div>
</div>
`.trim()
}

export const PhaseTimeline = renderPhaseTimeline
