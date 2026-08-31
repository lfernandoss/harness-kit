import type { BatchProgressDTO } from '../../types/diagnostics.js'

export interface BatchExecutionPanelProps {
  pendingCount?: number
  isRunning?: boolean
  progress?: BatchProgressDTO | null
  batchSize?: number
  selectedRunner?: string
  selectedModel?: string
  selectedEffort?: string
  onRunBatch?: () => void
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderBatchExecutionPanel(props: BatchExecutionPanelProps = {}): string {
  const pendingCount = props.pendingCount ?? 0
  const isRunning = Boolean(props.isRunning)
  const progress = props.progress
  const batchSize = props.batchSize ?? 3
  const isRunDisabled = isRunning || pendingCount === 0

  let progressBarHtml = ''
  if (isRunning && progress) {
    const total = progress.total ?? (progress.processed + progress.remaining)
    const pct = total > 0 ? Math.floor((progress.processed / total) * 100) : 0

    progressBarHtml = `
      <div class="batch-progress-container">
        <div class="progress-header">
          <span class="progress-title">Processing Diagnose Batch...</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="progress-counts">
          <span class="count-processed"><strong>${progress.processed}</strong> processed</span>
          <span class="count-remaining"><strong>${progress.remaining}</strong> remaining</span>
        </div>
      </div>
    `.trim()
  }

  return `
<div class="batch-execution-panel card">
  <div class="panel-header">
    <h3 class="panel-title">Batch Execution Controls</h3>
    <span class="badge badge-info">${pendingCount} Pending Sessions</span>
  </div>

  <div class="panel-body">
    <div class="form-row">
      <div class="form-group">
        <label for="diagnose-batch-size">Batch Size</label>
        <input
          type="number"
          id="diagnose-batch-size"
          name="batchSize"
          class="form-input input-batch-size"
          min="1"
          max="20"
          value="${batchSize}"
          ${isRunning ? 'disabled' : ''}
        />
      </div>

      <div class="form-group">
        <label for="diagnose-runner-select">Agent Runner Override</label>
        <select
          id="diagnose-runner-select"
          name="agentType"
          class="form-select select-runner"
          ${isRunning ? 'disabled' : ''}
        >
          <option value="claude-cli" ${props.selectedRunner === 'claude-cli' ? 'selected' : ''}>Claude CLI (claude)</option>
          <option value="antigravity-cli" ${props.selectedRunner === 'antigravity-cli' ? 'selected' : ''}>Antigravity CLI (agy)</option>
          <option value="cursor-cli" ${props.selectedRunner === 'cursor-cli' ? 'selected' : ''}>Cursor CLI (agent)</option>
          <option value="copilot-cli" ${props.selectedRunner === 'copilot-cli' ? 'selected' : ''}>Copilot CLI (copilot)</option>
          <option value="kiro-cli" ${props.selectedRunner === 'kiro-cli' ? 'selected' : ''}>Kiro CLI (kiro-cli)</option>
        </select>
      </div>
    </div>

    ${progressBarHtml}
  </div>

  <div class="panel-footer">
    <button
      type="button"
      class="btn btn-primary btn-run-batch"
      ${isRunDisabled ? 'disabled' : ''}
    >
      ${isRunning ? 'Running Batch...' : 'Run Diagnose Batch'}
    </button>
  </div>
</div>
`.trim()
}

export const BatchExecutionPanel = renderBatchExecutionPanel
