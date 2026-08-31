import { CycleCard, CycleCardModel } from './CycleCard'

export interface CategoryLaneModel {
  category: string
  displayName: string
  cycles: CycleCardModel[]
  isCollapsed?: boolean
}

export interface CategoryLaneProps {
  lane: CategoryLaneModel
  baseTime: string
  scale?: number
  onSelectCycle?: (cycleId: string, sessionId: string) => void
}

export class CategoryLane {
  constructor(private readonly props: CategoryLaneProps) {}

  render(): string {
    const cardsHtml = this.props.lane.cycles
      .map((c) => {
        const card = new CycleCard({
          cycle: c,
          baseTime: this.props.baseTime,
          scale: this.props.scale,
          onSelect: this.props.onSelectCycle,
        })
        return card.render()
      })
      .join('\n')

    return `
      <div class="swimlane-category-lane" data-category="${this.props.lane.category}">
        <div class="lane-header">
          <span class="lane-title">${this.props.lane.displayName}</span>
          <span class="lane-count">(${this.props.lane.cycles.length})</span>
        </div>
        <div class="lane-track" style="position: relative; width: 100%;">
          ${cardsHtml}
        </div>
      </div>
    `.trim()
  }
}
