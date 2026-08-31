export interface PhaseSnapshotItem {
  phase: string
  verdict: string
  recordedAt?: string
}

export interface CycleDetailData {
  id: string
  sessionId: string
  state: string
  snapshots: PhaseSnapshotItem[]
  abortReason?: string
}

export interface CycleDetailDrawerProps {
  cycle?: CycleDetailData
  isOpen: boolean
  onResume?: (cycleId: string, fromPhase?: string) => void
  onAbort?: (cycleId: string) => void
  onClose?: () => void
}

export class CycleDetailDrawer {
  constructor(private readonly props: CycleDetailDrawerProps) {}

  triggerResume(fromPhase?: string): void {
    if (this.props.onResume && this.props.cycle) {
      this.props.onResume(this.props.cycle.id, fromPhase)
    }
  }

  triggerAbort(): void {
    if (this.props.onAbort && this.props.cycle) {
      this.props.onAbort(this.props.cycle.id)
    }
  }

  triggerClose(): void {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render(): string {
    if (!this.props.isOpen || !this.props.cycle) {
      return ''
    }

    const { cycle } = this.props
    const snapshotsHtml = cycle.snapshots
      .map(
        (s) =>
          `<li class="phase-snapshot-item">
            <span class="snapshot-phase">${s.phase}</span>
            <span class="snapshot-verdict">${s.verdict}</span>
          </li>`
      )
      .join('\n')

    return `
      <div class="swimlane-detail-drawer open">
        <div class="drawer-header">
          <h3>Cycle Details: ${cycle.id}</h3>
          <button class="btn-close-drawer" onclick="void(0)">×</button>
        </div>
        <div class="drawer-body">
          <div class="drawer-meta">
            <p><strong>Session:</strong> ${cycle.sessionId}</p>
            <p><strong>State:</strong> <span class="state-badge">${cycle.state}</span></p>
            ${cycle.abortReason ? `<p><strong>Abort Reason:</strong> ${cycle.abortReason}</p>` : ''}
          </div>
          <h4>Phase Progression</h4>
          <ul class="phase-snapshot-list">
            ${snapshotsHtml}
          </ul>
        </div>
        <div class="drawer-footer">
          ${
            cycle.state === 'RUNNING'
              ? `<button class="btn-abort-cycle">Abort Cycle</button>`
              : `<button class="btn-resume-cycle">Resume Cycle</button>`
          }
        </div>
      </div>
    `.trim()
  }
}
