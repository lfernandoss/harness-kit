import { describe, it, expect } from 'vitest'
import { renderPhaseTimeline, ALL_PHASES } from '../components/PhaseTimeline.js'
import { renderTelemetryCards } from '../components/TelemetryCards.js'
import { Phase } from '../../../types/index.js'



describe('1.3 PhaseTimeline & TelemetryCards components', () => {
  describe('PhaseTimeline rendering', () => {
    it('Should render all pipeline stages from BOOTSTRAP to DEPLOY', () => {
      const html = renderPhaseTimeline({
        currentPhase: Phase.PLANNING,
        completedPhases: [Phase.BOOTSTRAP],
      })

      expect(html).toContain('BOOTSTRAP')
      expect(html).toContain('PLANNING')
      expect(html).toContain('DEVELOPMENT')
      expect(html).toContain('REVIEW')
      expect(html).toContain('MEMORY')
      expect(html).toContain('DEPLOY')
    })

    it('Should mark completed phases with completed visual badge', () => {
      const html = renderPhaseTimeline({
        currentPhase: Phase.DEVELOPMENT,
        completedPhases: [Phase.BOOTSTRAP, Phase.PLANNING],
      })

      expect(html).toMatch(/phase-step[^>]*done[^>]*data-phase="BOOTSTRAP"/)
      expect(html).toMatch(/phase-step[^>]*done[^>]*data-phase="PLANNING"/)
    })

    it('Should highlight the current active phase with pulsating active indicator', () => {
      const html = renderPhaseTimeline({
        currentPhase: Phase.DEVELOPMENT,
        completedPhases: [Phase.BOOTSTRAP, Phase.PLANNING],
      })

      expect(html).toMatch(/phase-step[^>]*active[^>]*data-phase="DEVELOPMENT"/)
    })

    it('Should display skipped stages with distinct disabled styling when skip flags are active', () => {
      const html = renderPhaseTimeline({
        currentPhase: Phase.DEVELOPMENT,
        completedPhases: [Phase.BOOTSTRAP, Phase.PLANNING],
        skippedPhases: [Phase.REVIEW, Phase.MEMORY],
      })

      expect(html).toMatch(/phase-step[^>]*skipped[^>]*data-phase="REVIEW"/)
      expect(html).toMatch(/phase-step[^>]*skipped[^>]*data-phase="MEMORY"/)
    })
  })

  describe('TelemetryCards rendering', () => {
    it('Should render token usage, cost estimate, and cycle metrics', () => {
      const html = renderTelemetryCards({
        tokensUsed: 125000,
        costEstimate: 0.38,
        completedCycles: 2,
        durationSeconds: 45,
      })

      expect(html).toContain('125,000')
      expect(html).toContain('$0.38')
      expect(html).toContain('2')
      expect(html).toContain('45s')
    })
  })
})
