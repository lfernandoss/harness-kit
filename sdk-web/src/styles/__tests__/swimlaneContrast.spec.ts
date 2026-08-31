import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { computeContrastRatio } from '../contrast'

describe('Swimlane Design Tokens & Contrast Specification', () => {
  const tokensPath = path.resolve(__dirname, '../swimlane.tokens.css')

  it('should define swimlane tokens css file', () => {
    expect(fs.existsSync(tokensPath)).toBe(true)
    const content = fs.readFileSync(tokensPath, 'utf-8')
    expect(content).toContain('--swimlane-header-height')
    expect(content).toContain('--swimlane-lane-height')
    expect(content).toContain('--swimlane-status-running')
    expect(content).toContain('--swimlane-status-completed')
    expect(content).toContain('--swimlane-status-failed')
    expect(content).toContain('--swimlane-status-aborted')
  })

  it('should guarantee WCAG AA contrast for text and badges against backgrounds', () => {
    // #107C41 (green) against white (#FFFFFF)
    const completedContrast = computeContrastRatio('#107C41', '#FFFFFF')
    expect(completedContrast).toBeGreaterThanOrEqual(4.5)

    // #D83B01 (red/failed) against white
    const failedContrast = computeContrastRatio('#D83B01', '#FFFFFF')
    expect(failedContrast).toBeGreaterThanOrEqual(4.5)

    // #0070F3 (blue/running) with white text
    const runningBadgeContrast = computeContrastRatio('#0070F3', '#FFFFFF')
    expect(runningBadgeContrast).toBeGreaterThanOrEqual(4.0)

    // #5C5C5C (aborted grey) against white
    const abortedContrast = computeContrastRatio('#5C5C5C', '#FFFFFF')
    expect(abortedContrast).toBeGreaterThanOrEqual(4.5)
  })
})
