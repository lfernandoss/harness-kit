import { describe, it, expect } from 'vitest'
import {
  renderCandidateList,
  CandidateList,
} from '../CandidateList.js'
import {
  renderCandidateDetailModal,
  CandidateDetailModal,
} from '../CandidateDetailModal.js'
import type { CandidateSummaryDTO, CandidateDetailDTO } from '../../../types/diagnostics.js'

describe('1.1 CandidateList & CandidateDetailModal Components (T05)', () => {
  const dummyCandidates: CandidateSummaryDTO[] = [
    {
      candidateId: 'candidate-2026-08-27-001',
      targetSkill: 'tdd-orchestrator',
      status: 'PROPOSED',
      path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
      shortRationale: 'Optimize RED phase verification',
    },
    {
      candidateId: 'candidate-2026-08-27-002',
      targetSkill: 'adversarial-qa',
      status: 'PROMOTED',
      path: 'docs/harness-history/candidates/candidate-2026-08-27-002',
      shortRationale: 'Deep security testing',
    },
    {
      candidateId: 'candidate-2026-08-27-003',
      targetSkill: 'the-grumpy-tech-lead',
      status: 'APPLIED',
      path: 'docs/harness-history/candidates/candidate-2026-08-27-003',
    },
  ]

  const dummyDetail: CandidateDetailDTO = {
    candidateId: 'candidate-2026-08-27-001',
    targetSkill: 'tdd-orchestrator',
    status: 'PROPOSED',
    path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
    rationale: 'Comprehensive red phase diagnostics and test runner fix.',
    promptDiff: '--- a/skills/tdd-orchestrator/SKILL.md\n+++ b/skills/tdd-orchestrator/SKILL.md\n@@ -10,3 +10,4 @@\n+Strict test failure verification',
    runnerCommand: 'hrns candidate review candidate-2026-08-27-001',
  }

  describe('CandidateList', () => {
    it('Should render candidate cards with appropriate status badges (PROPOSED, APPLIED, PROMOTED)', () => {
      const html = renderCandidateList({
        candidates: dummyCandidates,
        selectedFilter: 'ALL',
      })

      expect(html).toContain('candidate-2026-08-27-001')
      expect(html).toContain('candidate-2026-08-27-002')
      expect(html).toContain('candidate-2026-08-27-003')

      expect(html).toContain('badge-proposed')
      expect(html).toContain('badge-promoted')
      expect(html).toContain('badge-applied')

      expect(html).toContain('tdd-orchestrator')
      expect(html).toContain('adversarial-qa')
      expect(html).toContain('the-grumpy-tech-lead')
    })

    it('Should filter candidate cards when status filter is selected', () => {
      const html = renderCandidateList({
        candidates: dummyCandidates,
        selectedFilter: 'PROPOSED',
      })

      expect(html).toContain('candidate-2026-08-27-001')
      expect(html).not.toContain('candidate-2026-08-27-002')
      expect(html).not.toContain('candidate-2026-08-27-003')
    })
  })

  describe('CandidateDetailModal', () => {
    it('Should render CandidateDetailModal with diff preview, rationale, and promotion button', () => {
      const html = renderCandidateDetailModal({
        isOpen: true,
        candidate: dummyDetail,
        isPromoting: false,
      })

      expect(html).toContain('candidate-2026-08-27-001')
      expect(html).toContain('tdd-orchestrator')
      expect(html).toContain('Comprehensive red phase diagnostics')
      expect(html).toContain('Strict test failure verification')
      expect(html).toContain('hrns candidate review candidate-2026-08-27-001')
      expect(html).toContain('Apply via LLM')
      expect(html).not.toContain('disabled')
    })

    it('Should disable promotion button and show loading state when isPromoting is true', () => {
      const html = renderCandidateDetailModal({
        isOpen: true,
        candidate: dummyDetail,
        isPromoting: true,
      })

      expect(html).toContain('disabled')
      expect(html).toContain('Applying via LLM...')
    })

    it('Should render error banner when promotion error is present', () => {
      const html = renderCandidateDetailModal({
        isOpen: true,
        candidate: dummyDetail,
        isPromoting: false,
        error: 'Runner rate limit exceeded',
      })

      expect(html).toContain('Runner rate limit exceeded')
      expect(html).toContain('alert-danger')
    })

    it('Should be hidden when isOpen is false', () => {
      const html = renderCandidateDetailModal({
        isOpen: false,
        candidate: dummyDetail,
      })

      expect(html).toContain('display: none;')
    })
  })
})
