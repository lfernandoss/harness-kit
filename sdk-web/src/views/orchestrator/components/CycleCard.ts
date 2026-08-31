import { calculateTimelineOffset, calculateCardWidth } from '../../../utils/timeScaleUtils'

export interface CycleCardModel {
  id: string
  sessionId: string
  category: string
  state: 'INITIALIZED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED'
  label?: string
  startTime: string
  endTime?: string
  currentPhase?: string
}

export interface CycleCardProps {
  cycle: CycleCardModel
  baseTime: string
  scale?: number
  onSelect?: (cycleId: string, sessionId: string) => void
}

export class CycleCard {
  constructor(private readonly props: CycleCardProps) {}

  handleClick(): void {
    if (this.props.onSelect) {
      this.props.onSelect(this.props.cycle.id, this.props.cycle.sessionId)
    }
  }

  render(): string {
    const scale = this.props.scale || 1
    const offset = calculateTimelineOffset(this.props.cycle.startTime, this.props.baseTime, scale)
    const width = calculateCardWidth(this.props.cycle.startTime, this.props.cycle.endTime, scale, 48)

    const stateColors: Record<string, string> = {
      INITIALIZED: 'var(--swimlane-status-initialized, #004990)',
      RUNNING: 'var(--swimlane-status-running, #0070F3)',
      COMPLETED: 'var(--swimlane-status-completed, #107C41)',
      FAILED: 'var(--swimlane-status-failed, #D83B01)',
      ABORTED: 'var(--swimlane-status-aborted, #5C5C5C)',
    }

    const bgColor = stateColors[this.props.cycle.state] || '#5C5C5C'

    return `
      <div class="swimlane-cycle-card"
           data-cycle-id="${this.props.cycle.id}"
           data-session-id="${this.props.cycle.sessionId}"
           style="position: absolute; left: ${offset}px; width: ${width}px; background-color: ${bgColor};"
           role="button"
           tabindex="0">
        <div class="cycle-card-header">
          <span class="cycle-card-id">${this.props.cycle.id}</span>
          <span class="cycle-card-badge">${this.props.cycle.state}</span>
        </div>
        ${this.props.cycle.currentPhase ? `<span class="cycle-card-phase">${this.props.cycle.currentPhase}</span>` : ''}
      </div>
    `.trim()
  }
}
