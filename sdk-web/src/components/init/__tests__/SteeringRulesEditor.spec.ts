import { describe, it, expect, vi } from 'vitest'
import {
  renderSteeringRulesEditor,
  SteeringRulesEditor,
  type SteeringRulesEditorProps,
} from '../SteeringRulesEditor.js'
import type { SteeringRulesPayload } from '../../../types/index.js'

describe('SteeringRulesEditor Component', () => {
  const defaultRules: SteeringRulesPayload = {
    user: ['Global default rule'],
    bootstrap: [],
    planning: ['Plan rule default'],
    implementation: [],
    review: ['Review rule default'],
    memory: [],
  }

  it('should render navigation tabs for all 6 execution phases', () => {
    const html = renderSteeringRulesEditor({
      defaultRules,
      customRules: {},
      activePhase: 'planning',
    })

    expect(html).toContain('data-phase="user"')
    expect(html).toContain('data-phase="bootstrap"')
    expect(html).toContain('data-phase="planning"')
    expect(html).toContain('data-phase="implementation"')
    expect(html).toContain('data-phase="review"')
    expect(html).toContain('data-phase="memory"')
    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-selected="true"')
  })

  it('should display default inherited rules as read-only badges/cards', () => {
    const html = renderSteeringRulesEditor({
      defaultRules,
      customRules: {},
      activePhase: 'planning',
    })

    expect(html).toContain('Plan rule default')
    expect(html).toContain('default-rule-badge')
  })

  it('should display custom editable rules with remove action buttons', () => {
    const html = renderSteeringRulesEditor({
      defaultRules,
      customRules: {
        planning: ['Custom user breakdown rule'],
      },
      activePhase: 'planning',
    })

    expect(html).toContain('Custom user breakdown rule')
    expect(html).toContain('btn-remove-rule')
    expect(html).toContain('custom-rule-item')
  })

  it('should render rule addition form with input and Add button', () => {
    const html = renderSteeringRulesEditor({
      defaultRules,
      customRules: {},
      activePhase: 'implementation',
    })

    expect(html).toContain('input-add-rule')
    expect(html).toContain('btn-add-rule')
    expect(html).toContain('placeholder')
  })

  it('should provide alias export SteeringRulesEditor', () => {
    expect(SteeringRulesEditor).toBe(renderSteeringRulesEditor)
  })
})
