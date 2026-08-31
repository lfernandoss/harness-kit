import { sanitizeHtml } from '../../../utils/ansiParser.js'
import { ALL_PHASES } from './PhaseTimeline.js'

export interface SteeringDrawerProps {
  jobId: string
  isOpen: boolean
  currentPhase?: string
  isSubmitting?: boolean
  error?: string | null
}

export function renderSteeringDrawer(props: SteeringDrawerProps): string {
  const isOpen = Boolean(props.isOpen)
  const isSubmitting = Boolean(props.isSubmitting)
  const currentPhase = props.currentPhase || 'DEVELOPMENT'
  const error = props.error || null

  const rollbackOptionsHtml = ALL_PHASES.map((p) => {
    return `<option value="${sanitizeHtml(p)}" ${p === currentPhase ? 'selected' : ''}>${sanitizeHtml(p)}</option>`
  }).join('\n')

  const errorBannerHtml = error
    ? `
    <div class="steering-error-banner" role="alert">
      <span>⚠️ ${sanitizeHtml(error)}</span>
    </div>
  `
    : ''

  return `
<aside class="steering-drawer ${isOpen ? 'open' : 'closed'}" aria-hidden="${isOpen ? 'false' : 'true'}">
  <div class="drawer-header">
    <h3 class="drawer-title">Mid-Run Session Steering</h3>
    <button type="button" class="btn-close-drawer" aria-label="Close steering drawer">✕</button>
  </div>

  <div class="drawer-body">
    <p class="drawer-desc">
      Inject dynamic constraints, roll back phases, or adjust QA/TL score thresholds mid-flight.
    </p>

    ${errorBannerHtml}

    <form class="steering-form" id="steering-form">
      <div class="form-section">
        <h4 class="section-title">1. Dynamic Rule Injection</h4>
        <div class="form-group">
          <label for="steering-rule-input" class="form-label">Directive or Constraint</label>
          <textarea
            id="steering-rule-input"
            name="rule"
            rows="3"
            class="form-textarea add-rule-input"
            placeholder="e.g. Enforce strict error boundaries and no any types..."
            ${isSubmitting ? 'disabled' : ''}
          ></textarea>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">2. Phase Rollback</h4>
        <div class="form-group">
          <label for="steering-rollback-select" class="form-label">Rollback Target Phase</label>
          <select
            id="steering-rollback-select"
            name="targetPhase"
            class="form-select rollback-select"
            ${isSubmitting ? 'disabled' : ''}
          >
            <option value="">-- Select phase to rollback --</option>
            ${rollbackOptionsHtml}
          </select>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">3. Score Override Thresholds</h4>
        <div class="score-sliders-grid">
          <div class="form-group">
            <label for="steering-score-tl" class="form-label">Tech Lead Threshold (0-10)</label>
            <input
              type="number"
              id="steering-score-tl"
              name="tl"
              min="0"
              max="10"
              step="0.1"
              placeholder="e.g. 8.5"
              class="form-input score-tl-slider"
              ${isSubmitting ? 'disabled' : ''}
            />
          </div>

          <div class="form-group">
            <label for="steering-score-adv" class="form-label">Adversarial QA Threshold (0-10)</label>
            <input
              type="number"
              id="steering-score-adv"
              name="adv"
              min="0"
              max="10"
              step="0.1"
              placeholder="e.g. 8.5"
              class="form-input score-adv-slider"
              ${isSubmitting ? 'disabled' : ''}
            />
          </div>
        </div>
      </div>

      <div class="drawer-actions">
        <button
          type="submit"
          class="btn btn-primary btn-submit-steering"
          ${isSubmitting ? 'disabled' : ''}
        >
          ${isSubmitting ? 'Submitting...' : 'Apply Steering Action'}
        </button>
      </div>
    </form>
  </div>
</aside>
`.trim()
}

export const SteeringDrawer = renderSteeringDrawer
