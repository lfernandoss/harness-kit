export interface SessionSummaryOption {
  id: string
  label: string
  createdAt: string
}

export interface SessionSelectorProps {
  sessions: SessionSummaryOption[]
  selectedSessionId?: string
  onSelectSession?: (sessionId: string) => void
}

export class SessionSelector {
  constructor(private readonly props: SessionSelectorProps) {}

  handleSelect(sessionId: string): void {
    if (this.props.onSelectSession) {
      this.props.onSelectSession(sessionId)
    }
  }

  render(): string {
    const optionsHtml = this.props.sessions
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === this.props.selectedSessionId ? 'selected' : ''}>
            ${s.label} (${s.id})
          </option>`
      )
      .join('\n')

    return `
      <div class="swimlane-session-selector">
        <label for="session-select-dropdown" class="selector-label">Active Session:</label>
        <select id="session-select-dropdown" class="session-dropdown">
          ${optionsHtml}
        </select>
      </div>
    `.trim()
  }
}
