import { describe, it, expect } from 'vitest'
import { renderParallelCycleModal, ParallelCycleModalProps } from '../ParallelCycleModal'

describe('ParallelCycleModal', () => {
  it('renders modal with dynamic task rows and dispatch button', () => {
    const props: ParallelCycleModalProps = {
      isOpen: true,
      initialTasks: [
        { scope: 'Build Auth API', category: 'backend', agent: 'antigravity-cli' },
        { scope: 'Build Login UI', category: 'frontend', agent: 'antigravity-cli' }
      ]
    }

    const html = renderParallelCycleModal(props)

    expect(html).toContain('modal-parallel-cycles')
    expect(html).toContain('Build Auth API')
    expect(html).toContain('Build Login UI')
    expect(html).toContain('Disparar Ciclos Paralelos')
    expect(html).toContain('data-task-index="0"')
    expect(html).toContain('data-task-index="1"')
  })

  it('renders hidden when isOpen is false', () => {
    const html = renderParallelCycleModal({ isOpen: false })
    expect(html).not.toContain('open')
  })
})
