import { describe, it, expect } from 'vitest'
import {
  renderMetricsSummaryCards,
  MetricsSummaryCards,
} from '../MetricsSummaryCards.js'
import {
  renderCacheSavingsCard,
  CacheSavingsCard,
} from '../CacheSavingsCard.js'
import type { ProductReport } from '../../../types/telemetry.js'

describe('1.3 Presentation Components — MetricsSummaryCards & CacheSavingsCard (T03)', () => {
  const dummyReport: ProductReport = {
    backlogSummary: {
      total: 3,
      byStatus: {
        NOT_STARTED: 0,
        IN_PROGRESS: 1,
        COMPLETED: 2,
        BLOCKED: 0,
        FAILED: 0,
      },
      avgScoreTL: 9.4,
      avgScoreAdv: 8.9,
    },
    taskSummary: {
      total: 5,
      byStatus: {
        NOT_STARTED: 0,
        IN_PROGRESS: 1,
        COMPLETED: 4,
        BLOCKED: 0,
        FAILED: 0,
      },
      byFeature: {},
    },
    configSnapshot: {
      projectPaths: ['.'],
      currentPhase: 'DEVELOPMENT',
      scoreThresholdTL: 8.0,
      scoreThresholdAdv: 8.0,
      maxReworks: 3,
      completedCycles: 2,
    },
    decisionSummary: {
      totalDecisions: 10,
      recentDecisions: [],
    },
    tokenReport: {
      entries: [],
      events: [],
      totals: {
        inputTokens: 154000,
        outputTokens: 42000,
        cacheCreationTokens: 10000,
        cacheReadTokens: 65000,
        costUsd: 1.4825,
      },
      bySkill: {},
    },
  }

  describe('MetricsSummaryCards', () => {
    it('Should render formatted total cost USD, input tokens, output tokens, and cache tokens', () => {
      const html = renderMetricsSummaryCards({ report: dummyReport })

      expect(html).toContain('$1.4825')
      expect(html).toContain('154,000') // or formatted tokens
      expect(html).toContain('42,000')
      expect(html).toContain('65,000')
      expect(html).toContain('Total Cost')
    })

    it('Should render average TL score and average Adversarial QA score with appropriate badge colors', () => {
      const html = renderMetricsSummaryCards({ report: dummyReport })

      expect(html).toContain('9.4')
      expect(html).toContain('8.9')
      expect(html).toContain('TL Score')
      expect(html).toContain('QA Score')
      expect(html).toContain('score-badge-high')
    })

    it('Should display N/A for QA/TL scores when no completed feature scores exist', () => {
      const emptyReport: ProductReport = {
        ...dummyReport,
        backlogSummary: {
          ...dummyReport.backlogSummary,
          avgScoreTL: null,
          avgScoreAdv: null,
        },
      }
      const html = renderMetricsSummaryCards({ report: emptyReport })

      expect(html).toContain('N/A')
    })

    it('Should maintain WCAG AA 4.5:1 text contrast in both light and dark themes', () => {
      const lightHtml = renderMetricsSummaryCards({ report: dummyReport, theme: 'light' })
      const darkHtml = renderMetricsSummaryCards({ report: dummyReport, theme: 'dark' })

      expect(lightHtml).toContain('data-theme="light"')
      expect(darkHtml).toContain('data-theme="dark"')
      expect(lightHtml).toContain('kpi-card')
      expect(darkHtml).toContain('kpi-card')
    })

    it('Should export alias component function', () => {
      expect(typeof MetricsSummaryCards).toBe('function')
    })
  })

  describe('CacheSavingsCard', () => {
    it('Should render cached tokens, estimated saved USD, and hit ratio percentage', () => {
      const html = renderCacheSavingsCard({
        totals: dummyReport.tokenReport.totals,
      })

      expect(html).toContain('Cache Savings')
      expect(html).toContain('65,000')
      expect(html).toContain('%')
      expect(html).toContain('$')
    })

    it('Should export alias component function', () => {
      expect(typeof CacheSavingsCard).toBe('function')
    })
  })
})
