import { describe, it, expect } from 'vitest'
import {
  renderSkillCostBreakdownTable,
  SkillCostBreakdownTable,
} from '../SkillCostBreakdownTable.js'
import {
  renderModelCostDistributionChart,
  ModelCostDistributionChart,
  aggregateModelCost,
} from '../ModelCostDistributionChart.js'
import type { TokenUsage, TokenEntry } from '../../../types/telemetry.js'

describe('1.3 Presentation Components — SkillCostBreakdownTable & ModelCostDistributionChart (T04)', () => {
  const dummyBySkill: Record<string, TokenUsage> = {
    'tdd-orchestrator': {
      inputTokens: 50000,
      outputTokens: 10000,
      cacheCreationTokens: 0,
      cacheReadTokens: 20000,
      costUsd: 0.45,
    },
    'adversarial-qa': {
      inputTokens: 80000,
      outputTokens: 25000,
      cacheCreationTokens: 0,
      cacheReadTokens: 35000,
      costUsd: 0.85,
    },
    'the-grumpy-tech-lead': {
      inputTokens: 20000,
      outputTokens: 5000,
      cacheCreationTokens: 0,
      cacheReadTokens: 10000,
      costUsd: 0.18,
    },
  }

  const dummyEntries: TokenEntry[] = [
    {
      timestamp: 1700000000000,
      skill: 'tdd-orchestrator',
      agent: 'developer-backend',
      model: 'claude-3-7-sonnet',
      inputTokens: 50000,
      outputTokens: 10000,
      cacheCreationTokens: 0,
      cacheReadTokens: 20000,
      costUsd: 0.45,
    },
    {
      timestamp: 1700000001000,
      skill: 'adversarial-qa',
      agent: 'harness-qa',
      model: 'gemini-3.7-flash',
      inputTokens: 80000,
      outputTokens: 25000,
      cacheCreationTokens: 0,
      cacheReadTokens: 35000,
      costUsd: 0.85,
    },
  ]

  describe('SkillCostBreakdownTable', () => {
    it('Should render a table row for each skill in bySkill record', () => {
      const html = renderSkillCostBreakdownTable({ bySkill: dummyBySkill })

      expect(html).toContain('tdd-orchestrator')
      expect(html).toContain('adversarial-qa')
      expect(html).toContain('the-grumpy-tech-lead')
    })

    it('Should sort rows in descending order of costUsd by default', () => {
      const html = renderSkillCostBreakdownTable({ bySkill: dummyBySkill })

      const advIndex = html.indexOf('adversarial-qa')
      const tddIndex = html.indexOf('tdd-orchestrator')
      const leadIndex = html.indexOf('the-grumpy-tech-lead')

      // 0.85 (adv) > 0.45 (tdd) > 0.18 (lead)
      expect(advIndex).toBeLessThan(tddIndex)
      expect(tddIndex).toBeLessThan(leadIndex)
    })

    it('Should format numerical token counts with locale thousands separators', () => {
      const html = renderSkillCostBreakdownTable({ bySkill: dummyBySkill })

      expect(html).toContain('50,000')
      expect(html).toContain('80,000')
      expect(html).toContain('$0.8500')
    })

    it('Should export alias component function', () => {
      expect(typeof SkillCostBreakdownTable).toBe('function')
    })
  })

  describe('ModelCostDistributionChart', () => {
    it('Should aggregate and render token cost grouped by model tier', () => {
      const aggregated = aggregateModelCost(dummyEntries)
      expect(aggregated.length).toBeGreaterThan(0)

      const html = renderModelCostDistributionChart({ entries: dummyEntries })
      expect(html).toContain('model-distribution-chart')
      expect(html).toContain('claude-3-7-sonnet')
      expect(html).toContain('gemini-3.7-flash')
    })

    it('Should apply Itaú theme-calibrated chart color palette', () => {
      const lightHtml = renderModelCostDistributionChart({ entries: dummyEntries, theme: 'light' })
      const darkHtml = renderModelCostDistributionChart({ entries: dummyEntries, theme: 'dark' })

      expect(lightHtml).toContain('palette-itau')
      expect(darkHtml).toContain('palette-itau')
    })

    it('Should render cost and percentage metrics in distribution items', () => {
      const html = renderModelCostDistributionChart({ entries: dummyEntries })

      expect(html).toContain('$0.85')
      expect(html).toContain('%')
    })

    it('Should export alias component function', () => {
      expect(typeof ModelCostDistributionChart).toBe('function')
    })
  })
})
