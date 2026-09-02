export interface ParallelTaskConfig {
  scope: string
  category: string
  agent: string
}

export interface ParallelCycleModalProps {
  isOpen: boolean
  initialTasks?: ParallelTaskConfig[]
}

export function renderParallelCycleModal(props: ParallelCycleModalProps): string {
  const isOpen = Boolean(props.isOpen)
  const tasks = props.initialTasks && props.initialTasks.length > 0
    ? props.initialTasks
    : [
        { scope: 'Tarefa 1: Backend API', category: 'backend', agent: 'antigravity-cli' },
        { scope: 'Tarefa 2: Frontend UI', category: 'frontend', agent: 'antigravity-cli' },
      ]

  const tasksHtml = tasks
    .map(
      (task, idx) => `
    <div class="task-row-card" data-task-index="${idx}" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-default); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 700; font-size: 13px;">Ciclo #${idx + 1}</span>
        <span class="badge badge-category" style="background: var(--itau-orange); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${task.category}</span>
      </div>
      <div class="form-group" style="margin-bottom: 8px;">
        <label class="form-label" style="font-size: 12px;">Escopo / Descrição</label>
        <input type="text" class="form-control input-task-scope" value="${task.scope.replace(/"/g, '&quot;')}" placeholder="Descreva a tarefa deste ciclo..." required />
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label class="form-label" style="font-size: 12px;">Categoria</label>
          <select class="form-control select-task-category">
            <option value="backend" ${task.category === 'backend' ? 'selected' : ''}>Backend</option>
            <option value="frontend" ${task.category === 'frontend' ? 'selected' : ''}>Frontend</option>
            <option value="qa" ${task.category === 'qa' ? 'selected' : ''}>QA / Testes</option>
            <option value="devops" ${task.category === 'devops' ? 'selected' : ''}>DevOps</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-size: 12px;">Runner</label>
          <select class="form-control select-task-agent">
            <option value="antigravity-cli" ${task.agent === 'antigravity-cli' ? 'selected' : ''}>Antigravity CLI</option>
            <option value="claude-cli" ${task.agent === 'claude-cli' ? 'selected' : ''}>Claude Code</option>
            <option value="copilot-cli" ${task.agent === 'copilot-cli' ? 'selected' : ''}>GitHub Copilot</option>
          </select>
        </div>
      </div>
    </div>
  `
    )
    .join('')

  return `
<div id="modalParallelCycles" class="modal-overlay modal-parallel-cycles ${isOpen ? 'open' : ''}" style="display: ${isOpen ? 'flex' : 'none'};">
  <div class="modal-card" style="max-width: 720px;">
    <div class="modal-header">
      <h3 style="font-size: 18px; font-weight: 700;">🚀 Disparar Múltiplos Ciclos em Paralelo</h3>
      <button type="button" class="btn-icon btn-close-modal" onclick="document.getElementById('modalParallelCycles').style.display='none'">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Cada ciclo será provisionado em um <strong>Git Worktree independente</strong> com seu próprio <strong>Session ID</strong> exclusivo.
      </p>
      <div id="parallelTasksList">
        ${tasksHtml}
      </div>
      <button type="button" id="btnAddParallelTaskRow" class="btn btn-outline" style="width: 100%; margin-top: 8px;">
        + Adicionar Mais Uma Tarefa Concorrente
      </button>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline" onclick="document.getElementById('modalParallelCycles').style.display='none'">Cancelar</button>
      <button type="button" id="btnConfirmParallelDispatch" class="btn btn-primary">
        ⚡ Disparar Ciclos Paralelos
      </button>
    </div>
  </div>
</div>
`.trim()
}
