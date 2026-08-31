import { describe, it, expect, vi } from 'vitest'
import { renderSteeringDrawer } from '../components/SteeringDrawer.js'
import { renderAbortConfirmModal } from '../components/AbortConfirmModal.js'
import { Phase } from '../../../types/index.js'



describe('1.3 SteeringDrawer & AbortConfirmModal components', () => {
  describe('SteeringDrawer rendering', () => {
    it('Should display form inputs for rule text, phase rollback dropdown, and score override sliders', () => {
      const html = renderSteeringDrawer({
        jobId: 'job-123',
        isOpen: true,
        currentPhase: Phase.DEVELOPMENT,
      })

      expect(html).toContain('steering-drawer open')
      expect(html).toContain('add-rule-input')
      expect(html).toContain('rollback-select')
      expect(html).toContain('score-tl-slider')
      expect(html).toContain('score-adv-slider')
    })

    it('Should disable submit button while steering request is in-flight', () => {
      const html = renderSteeringDrawer({
        jobId: 'job-123',
        isOpen: true,
        currentPhase: Phase.DEVELOPMENT,
        isSubmitting: true,
      })

      expect(html).toContain('disabled')
      expect(html).toContain('Submitting...')
    })
  })

  describe('AbortConfirmModal rendering', () => {
    it('Should render confirmation dialog for aborting execution', () => {
      const html = renderAbortConfirmModal({
        jobId: 'job-123',
        isOpen: true,
      })

      expect(html).toContain('abort-confirm-modal')
      expect(html).toContain('Abort Execution')
      expect(html).toContain('Are you sure you want to abort')
      expect(html).toContain('btn-confirm-abort')
    })
  })
})
