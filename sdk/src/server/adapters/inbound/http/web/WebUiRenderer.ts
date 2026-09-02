export class WebUiRenderer {
  static getWebUiHtml(initialPath: string = '/'): string {
    return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harness Kit — Autonomous TDD Orchestration Web Dashboard</title>
  <style>
    /* Itaú Design Tokens & Theme Variables */
    :root {
      --itau-orange: #EC7000;
      --itau-navy: #003399;
      --itau-navy-hover: #002266;
      --itau-orange-hover: #D66500;
      --bg-canvas: #F4F5F7;
      --bg-surface: #FFFFFF;
      --bg-surface-elevated: #FFFFFF;
      --bg-sidebar: #001A4D;
      --bg-header: #FFFFFF;
      --text-primary: #121212;
      --text-secondary: #5E6C84;
      --text-muted: #7A869A;
      --text-sidebar: #E2E8F0;
      --text-sidebar-muted: #94A3B8;
      --border-default: #DFE1E6;
      --border-subtle: #EBECF0;
      --border-focus: #003399;
      --status-connected: #00875A;
      --status-disconnected: #DE350B;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
      --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
      --terminal-bg: #0F172A;
      --terminal-text: #38BDF8;
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    [data-theme='dark'] {
      --itau-orange: #FF851A;
      --itau-navy: #4C82FB;
      --itau-navy-hover: #356AE6;
      --itau-orange-hover: #FA7505;
      --bg-canvas: #0F172A;
      --bg-surface: #1E293B;
      --bg-surface-elevated: #334155;
      --bg-sidebar: #0B1120;
      --bg-header: #1E293B;
      --text-primary: #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --text-sidebar: #E2E8F0;
      --text-sidebar-muted: #64748B;
      --border-default: #334155;
      --border-subtle: #1E293B;
      --border-focus: #4C82FB;
      --status-connected: #36B37E;
      --status-disconnected: #FF5630;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
      --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.6);
      --terminal-bg: #020617;
      --terminal-text: #38BDF8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: background-color 0.2s, color 0.2s;
    }

    /* Layout */
    .app-shell { display: flex; flex-direction: column; height: 100vh; }
    
    /* Header */
    .workspace-header {
      height: 60px;
      background-color: var(--bg-header);
      border-bottom: 1px solid var(--border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      box-shadow: var(--shadow-sm);
      z-index: 10;
    }
    .header-brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--itau-orange), var(--itau-navy));
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 18px;
    }
    .brand-title { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
    .brand-tag {
      font-size: 11px; padding: 2px 8px;
      background-color: var(--border-subtle);
      border: 1px solid var(--border-default);
      border-radius: 12px; font-weight: 600; color: var(--text-secondary);
    }
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .status-badge {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600;
      padding: 4px 10px; border-radius: 16px;
    }
    .status-connected { background-color: rgba(0, 135, 90, 0.15); color: var(--status-connected); }
    .status-disconnected { background-color: rgba(222, 53, 11, 0.15); color: var(--status-disconnected); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background-color: currentColor; }

    .btn-icon {
      background: none; border: 1px solid var(--border-default);
      color: var(--text-primary); padding: 8px 12px; border-radius: 8px;
      cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;
      transition: all 0.2s;
    }
    .btn-icon:hover { background-color: var(--border-subtle); }

    /* App Body */
    .app-body { display: flex; flex: 1; overflow: hidden; }

    /* Sidebar */
    .app-sidebar {
      width: 240px;
      background-color: var(--bg-sidebar);
      display: flex; flex-direction: column;
      padding: 20px 12px;
      gap: 6px;
      flex-shrink: 0;
    }
    .nav-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px;
      color: var(--text-sidebar); text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: all 0.15s;
    }
    .nav-link:hover { background-color: rgba(255, 255, 255, 0.08); color: #FFFFFF; }
    .nav-link.active {
      background-color: var(--itau-orange);
      color: #FFFFFF;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(236, 112, 0, 0.3);
    }
    .nav-icon { font-size: 18px; }

    .sidebar-footer {
      margin-top: auto; padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 11px; color: var(--text-sidebar-muted);
      text-align: center;
    }

    /* Content Area */
    .app-content {
      flex: 1;
      padding: 28px 32px;
      overflow-y: auto;
      background-color: var(--bg-canvas);
    }

    .view-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--shadow-sm);
      margin-bottom: 24px;
    }
    .view-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    .view-subtitle { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; }

    /* Form Inputs */
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary); }
    .form-control {
      width: 100%; padding: 10px 14px;
      background-color: var(--bg-canvas);
      border: 1px solid var(--border-default);
      border-radius: 8px; font-size: 14px; color: var(--text-primary);
      outline: none; transition: border-color 0.2s;
    }
    .form-control:focus { border-color: var(--border-focus); }
    textarea.form-control { resize: vertical; min-height: 90px; font-family: inherit; }

    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
      border: none; cursor: pointer; transition: all 0.15s;
    }
    .btn-primary { background-color: var(--itau-orange); color: white; }
    .btn-primary:hover { background-color: var(--itau-orange-hover); }
    .btn-secondary { background-color: var(--itau-navy); color: white; }
    .btn-secondary:hover { background-color: var(--itau-navy-hover); }
    .btn-outline { background-color: transparent; border: 1px solid var(--border-default); color: var(--text-primary); }
    .btn-outline:hover { background-color: var(--border-subtle); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Timeline */
    .timeline-container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin: 28px 0 16px;
      position: relative;
      padding: 0 10px;
    }
    .timeline-track-bg {
      position: absolute;
      top: 20px;
      left: 40px;
      right: 40px;
      height: 4px;
      background-color: var(--border-default);
      border-radius: 2px;
      z-index: 1;
    }
    .timeline-track-fill {
      position: absolute;
      top: 20px;
      left: 40px;
      height: 4px;
      background: linear-gradient(90deg, var(--status-connected), var(--itau-orange));
      border-radius: 2px;
      z-index: 1;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      width: 16%;
    }
    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      z-index: 2;
      position: relative;
      min-width: 90px;
    }
    .step-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--bg-canvas);
      border: 2px solid var(--border-default);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .step-completed .step-circle {
      background-color: var(--status-connected);
      border-color: var(--status-connected);
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(0, 135, 90, 0.3);
    }
    .step-completed .step-label {
      color: var(--status-connected);
      font-weight: 700;
    }

    /* Active Step Visual Loop Effects */
    .step-active .step-circle {
      background-color: var(--itau-orange);
      border-color: var(--itau-orange);
      color: #FFFFFF;
      box-shadow: 0 0 16px rgba(236, 112, 0, 0.5);
      animation: pulseActive 2s infinite ease-in-out;
    }

    /* Rotating Outer Loop Ring */
    .step-active .step-circle::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2.5px dashed var(--itau-orange);
      animation: rotateLoop 3s linear infinite;
    }

    /* Expanding Pulse Radar Wave */
    .step-active .step-circle::before {
      content: '';
      position: absolute;
      inset: -14px;
      border-radius: 50%;
      border: 1.5px solid rgba(236, 112, 0, 0.6);
      animation: pulseRadar 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }

    .step-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: center;
    }
    .step-active .step-label {
      color: var(--itau-orange);
      font-weight: 700;
    }

    .step-badge-status {
      display: none;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 2px;
    }
    .step-active .step-badge-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: rgba(236, 112, 0, 0.15);
      color: var(--itau-orange);
      border: 1px solid rgba(236, 112, 0, 0.3);
      animation: badgeGlow 1.5s ease-in-out infinite alternate;
    }
    .step-completed .step-badge-status {
      display: inline-flex;
      align-items: center;
      background-color: rgba(0, 135, 90, 0.1);
      color: var(--status-connected);
      border: 1px solid rgba(0, 135, 90, 0.2);
    }

    .spinning-icon {
      display: inline-block;
      animation: rotateLoop 1.2s linear infinite;
      font-size: 14px;
    }

    @keyframes rotateLoop {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulseRadar {
      0% { transform: scale(0.7); opacity: 0.9; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    @keyframes pulseActive {
      0% { transform: scale(1); }
      50% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }

    @keyframes badgeGlow {
      0% { opacity: 0.8; box-shadow: 0 0 0 rgba(236, 112, 0, 0); }
      100% { opacity: 1; box-shadow: 0 0 6px rgba(236, 112, 0, 0.4); }
    }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 10px; padding: 18px; box-shadow: var(--shadow-sm);
    }
    .kpi-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; }
    .kpi-value { font-size: 24px; font-weight: 700; color: var(--text-primary); }

    /* Terminal Console */
    .terminal-window {
      background-color: var(--terminal-bg);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      display: flex; flex-direction: column;
      height: 380px;
    }
    .terminal-header {
      background-color: rgba(255, 255, 255, 0.05);
      padding: 10px 16px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 12px; color: #94A3B8; font-family: monospace;
    }
    .terminal-body {
      flex: 1; padding: 16px;
      overflow-y: auto; font-family: 'Consolas', 'Courier New', monospace;
      font-size: 13px; line-height: 1.5; color: #E2E8F0;
      white-space: pre-wrap; word-break: break-all;
    }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .data-table th { text-align: left; padding: 10px 14px; font-size: 12px; color: var(--text-secondary); border-bottom: 2px solid var(--border-default); }
    .data-table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid var(--border-subtle); }

    /* Modal */
    .modal-overlay {
      display: none; position: fixed; inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      z-index: 9999;
      align-items: center; justify-content: center;
      padding: 20px;
    }
    .modal-overlay.open { display: flex; }
    .modal-card {
      background-color: var(--bg-surface);
      border-radius: 12px;
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-lg);
      width: 100%; max-width: 820px;
      max-height: 90vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: modalFadeIn 0.2s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-default);
      display: flex; align-items: center; justify-content: space-between;
      background-color: var(--bg-surface-elevated);
    }
    .modal-body {
      padding: 24px; overflow-y: auto; flex: 1;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-default);
      display: flex; align-items: center; justify-content: flex-end;
      gap: 12px; background-color: var(--border-subtle);
    }
    .question-card {
      background-color: var(--bg-canvas);
      border: 1px solid var(--border-default);
      border-radius: 8px; padding: 16px; margin-bottom: 16px;
    }
    .question-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary); }
    .question-context { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
    .question-rec { font-size: 12px; font-weight: 600; color: var(--itau-orange); margin-bottom: 8px; }

    /* View Switcher */
    .view-section { display: none; }
    .view-section.active { display: block; }
  </style>
</head>
<body>
  <div class="app-shell">
    <!-- Header -->
    <header class="workspace-header">
      <div class="header-brand">
        <div class="brand-logo">H</div>
        <div>
          <span class="brand-title">Harness Kit</span>
          <span class="brand-tag">v0.6.1</span>
        </div>
      </div>
      <div class="header-actions">
        <div id="connBadge" class="status-badge status-connected">
          <span class="status-dot"></span>
          <span id="connText">Connected (127.0.0.1:3000)</span>
        </div>
        <button id="themeToggle" class="btn-icon" title="Alternar tema">
          <span id="themeIcon">🌙</span>
        </button>
      </div>
    </header>

    <!-- App Body -->
    <div class="app-body">
      <!-- Sidebar -->
      <aside class="app-sidebar">
        <a href="#/run" class="nav-link active" data-route="run">
          <span class="nav-icon">🚀</span>
          <span>Orchestration</span>
        </a>
        <a href="#/settings" class="nav-link" data-route="settings">
          <span class="nav-icon">⚙️</span>
          <span>Settings</span>
        </a>
        <a href="#/reports" class="nav-link" data-route="reports">
          <span class="nav-icon">📊</span>
          <span>Reports & Cost</span>
        </a>
        <a href="#/diagnose" class="nav-link" data-route="diagnose">
          <span class="nav-icon">🧬</span>
          <span>Diagnostics & Meta-Loop</span>
        </a>
        <a href="/docs" class="nav-link" target="_blank">
          <span class="nav-icon">📖</span>
          <span>Swagger Docs ↗</span>
        </a>
        <div class="sidebar-footer">
          Harness Kit Web Shell<br>Autonomous TDD
        </div>
      </aside>

      <!-- Main Content -->
      <main class="app-content">
        <!-- VIEW 1: RUN / ORCHESTRATION -->
        <section id="view-run" class="view-section active">
          <!-- Multi-Task Concurrent Tab Bar -->
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-default); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; gap: 10px; align-items: center; overflow-x: auto;" id="hubTasksTabBar">
            <button type="button" id="btnHubNewTaskTab" class="btn btn-primary btn-sm" style="white-space: nowrap; display: flex; align-items: center; gap: 6px;">
              <span>+ Nova Tarefa Paralela</span>
            </button>
            <div id="hubActiveTasksPills" style="display: flex; gap: 8px; align-items: center; flex: 1; overflow-x: auto;">
              <!-- Dynamic task pills rendered here -->
            </div>
          </div>

          <div class="view-card">
            <div id="activeTaskMetaBar" style="display: none; background: rgba(0, 51, 153, 0.05); border: 1px solid var(--itau-navy); border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>Sessão 1:1:</strong> <code id="lblActiveSessionId">sess-none</code> |
                <strong>Ciclo:</strong> <code id="lblActiveCycleId">cycle-none</code> |
                <strong>Worktree:</strong> <span id="lblActiveWorktree">isolado</span>
              </div>
              <span id="lblActiveTaskBadge" class="status-badge status-connected" style="font-size: 11px;">RUNNING</span>
            </div>

            <h2 class="view-title" id="hubFormTitle">🚀 Autonomous Orchestration Hub</h2>
            <p class="view-subtitle">Dispare e acompanhe tarefas autônomas em paralelo com aprovação de specs (Bootstrap → Refinement → Planning → Development → Review → Memory).</p>
            
            <form id="runForm">
              <div class="form-group">
                <label class="form-label" for="scopeInput">Project Scope / PRD Description</label>
                <textarea id="scopeInput" class="form-control" placeholder="Ex: Implementar autenticação JWT com refresh token e testes unitários completos em Vitest..." required>implementar no web ao clickar em Project Workspace Path abrir o explorador de arquivos para selecionar a pasta do projeto</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="agentSelect">Agent Runner</label>
                  <select id="agentSelect" class="form-control">
                    <option value="antigravity-cli" selected>Antigravity CLI (Gemini 3.7 Flash)</option>
                    <option value="claude-cli">Claude Code CLI (Sonnet / Opus)</option>
                    <option value="copilot-cli">GitHub Copilot CLI (GPT-5.6 Sol)</option>
                    <option value="cursor-cli">Cursor CLI (Agent mode)</option>
                    <option value="codex-cli">Codex CLI</option>
                    <option value="kiro-cli">Kiro CLI</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="modeSelect">Execution Mode</label>
                  <select id="modeSelect" class="form-control">
                    <option value="deep_thinking" selected>Deep Thinking (Questionário Socrático + Alta Complexidade)</option>
                    <option value="thinking">Thinking (Padrão Autônomo Completo)</option>
                    <option value="fast">Fast (Rápido - Baixa Complexidade 003+004)</option>
                    <option value="quick">Quick (Prototipagem Rápida - Pula Review e Memory)</option>
                  </select>
                </div>
              </div>

              <div id="deepThinkingAlert" style="margin-bottom: 16px; padding: 12px 16px; background: rgba(236,112,0,0.1); border: 1px solid var(--itau-orange); border-radius: 8px; font-size: 13px;">
                💡 <strong>Modo Deep Thinking:</strong> As decisões arquiteturais socráticas serão validadas e consolidadas em <code>docs/product/REFINEMENT.md</code> antes da escrita de código.
              </div>

              <div class="form-group">
                <label class="form-label" for="projectInput">Project Workspace Path</label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" id="projectInput" class="form-control" value="C:/Users/psn_l/projetos/harness-kit" placeholder="Caminho absoluto da pasta do projeto..." required style="flex: 1;" />
                  <button type="button" id="btnBrowseFolder" class="btn btn-outline" style="white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                    <span>📁 Selecionar Pasta</span>
                  </button>
                </div>
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; align-items: center;">
                <button type="submit" class="btn btn-primary" id="btnStartRun">
                  <span>▶ Iniciar Ciclo Autônomo</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btnViewSocraticQuestions" style="display: flex; align-items: center; gap: 6px;" title="Ver questões socráticas geradas no Refinamento">
                  <span>🧠 Ver Questões Socráticas</span>
                </button>
                <button type="button" class="btn btn-outline" id="btnAbortJob" style="border-color: var(--status-disconnected); color: var(--status-disconnected);" title="Cancela a execução em andamento e limpa o estado">
                  <span>🛑 Cancelar / Excluir Execução</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Phase Timeline -->
          <div class="view-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <h3 class="view-title" style="font-size: 16px; margin-bottom: 0;">TDD Pipeline Lifecycle</h3>
              <span id="pipelineStatusTag" style="font-size: 11px; font-weight: 700; color: var(--text-secondary); padding: 3px 10px; border-radius: 12px; background-color: var(--border-subtle);">
                Status: AGUARDANDO JOB
              </span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Ciclo TDD autônomo com feedback loop contínuo e validação de qualidade.</p>
            <div class="timeline-container">
              <div class="timeline-track-bg"></div>
              <div class="timeline-track-fill" id="timelineTrackFill"></div>
              <div class="timeline-step" id="step-BOOTSTRAP">
                <div class="step-circle"><span class="step-num">1</span></div>
                <span class="step-label">Bootstrap</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-REFINEMENT">
                <div class="step-circle"><span class="step-num">2</span></div>
                <span class="step-label">Refinement</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-PLANNING">
                <div class="step-circle"><span class="step-num">3</span></div>
                <span class="step-label">Planning</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-DEVELOPMENT">
                <div class="step-circle"><span class="step-num">4</span></div>
                <span class="step-label">Development</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-REVIEW">
                <div class="step-circle"><span class="step-num">5</span></div>
                <span class="step-label">Review (TL+QA)</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-MEMORY">
                <div class="step-circle"><span class="step-num">6</span></div>
                <span class="step-label">Memory</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
            </div>
          </div>

          <!-- Spec Approval Gate Banner (Human-in-the-Loop) -->
          <div id="specApprovalBanner" class="view-card" style="display: none; border-left: 4px solid var(--itau-orange); background: rgba(236,112,0,0.06); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div style="flex: 1;">
                <h3 style="font-size: 16px; font-weight: 700; color: var(--itau-orange); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                  <span>📋 Gate de Aprovação: Especificações & Arquitetura Prontas</span>
                </h3>
                <p style="font-size: 13px; color: var(--text-primary); margin-bottom: 10px;">
                  As fases de Refinamento e Planejamento foram concluídas com sucesso para esta tarefa. Revise o design antes de autorizar a escrita de código.
                </p>
                <div id="specSummaryBox" style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 6px; padding: 10px; font-family: monospace; font-size: 12px; margin-bottom: 12px; max-height: 120px; overflow-y: auto; color: var(--text-primary);">
                  Especificação aprovada pelo Software Architect. Pronto para desenvolvimento.
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button type="button" id="btnApproveSpecAndDev" class="btn btn-primary">
                <span>✅ Aprovar Spec e Iniciar Desenvolvimento</span>
              </button>
              <button type="button" id="btnInspectFullSpec" class="btn btn-outline">
                <span>👁️ Inspecionar Decisões Arquiteturais</span>
              </button>
              <button type="button" id="btnRejectSpec" class="btn btn-secondary">
                <span>✏️ Solicitar Ajustes</span>
              </button>
            </div>
          </div>

          <!-- Live Terminal Console -->
          <div class="terminal-window">
            <div class="terminal-header">
              <span>● LIVE LOG CONSOLE (Server-Sent Events / stdout)</span>
              <span id="activeJobLabel">Job: IDLE</span>
            </div>
            <div class="terminal-body" id="logTerminal">[HRNS Server] Connected to localhost daemon on port 3000.
[HRNS Server] Ready to receive orchestration jobs.
> Pronto para executar tarefas autônomas.</div>
          </div>
        </section>

        <!-- VIEW 2: SETTINGS -->
        <section id="view-settings" class="view-section">
          <div class="view-card">
            <h2 class="view-title">⚙️ Settings & Agent Configurations</h2>
            <p class="view-subtitle">Ajuste os modelos de IA, níveis de esforço de raciocínio e timeouts por fase sem mexer no código.</p>

            <div class="form-row" style="margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label">Scope</label>
                <select id="settingsScope" class="form-control">
                  <option value="global">Global (~/.config/harness-kit/settings.json)</option>
                  <option value="project" selected>Project (.harness-kit/settings.json)</option>
                </select>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-title">Bootstrap Model</div>
                <div class="kpi-value" style="font-size: 16px;">gemini-3.7-flash</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Planning Model</div>
                <div class="kpi-value" style="font-size: 16px;">anthropic.claude-5-sonnet</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Implementation Model</div>
                <div class="kpi-value" style="font-size: 16px;">gpt-5.6-luna (xhigh)</div>
              </div>
            </div>

            <button class="btn btn-primary" id="btnSaveSettings">💾 Salvar Configurações</button>
            <button class="btn btn-outline" id="btnRenewSettings">🔄 Restaurar Padrões</button>
          </div>
        </section>

        <!-- VIEW 3: REPORTS & TELEMETRY -->
        <section id="view-reports" class="view-section">
          <div class="view-card">
            <h2 class="view-title">📊 Token Telemetry & Financial Cost Analytics</h2>
            <p class="view-subtitle">Métricas agregadas em tempo real a partir de tokens.jsonl.</p>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-title">Total Estimated Cost</div>
                <div class="kpi-value" style="color: var(--itau-orange);">$7.76 USD</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Cache Read Savings</div>
                <div class="kpi-value" style="color: var(--status-connected);">+$11.06 USD</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Total Tokens</div>
                <div class="kpi-value">3.73M</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Backlog Health</div>
                <div class="kpi-value" style="color: var(--status-connected);">100% Passing</div>
              </div>
            </div>

            <h3 style="font-size: 16px; margin: 20px 0 8px;">Breakdown por Skill do Harness</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Skill / Agente</th>
                  <th>Input Tokens</th>
                  <th>Output Tokens</th>
                  <th>Cache Read</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>tdd-orchestrator</strong></td>
                  <td>1,274</td>
                  <td>16,776</td>
                  <td>1,962,417</td>
                  <td>$2.86</td>
                </tr>
                <tr>
                  <td><strong>scope-refinement</strong></td>
                  <td>2,759</td>
                  <td>14,806</td>
                  <td>793,672</td>
                  <td>$2.99</td>
                </tr>
                <tr>
                  <td><strong>project-memory</strong></td>
                  <td>13</td>
                  <td>4,684</td>
                  <td>240,743</td>
                  <td>$0.75</td>
                </tr>
                <tr>
                  <td><strong>the-grumpy-tech-lead</strong></td>
                  <td>57</td>
                  <td>3,372</td>
                  <td>287,236</td>
                  <td>$0.55</td>
                </tr>
                <tr>
                  <td><strong>adversarial-qa</strong></td>
                  <td>57</td>
                  <td>3,323</td>
                  <td>323,149</td>
                  <td>$0.37</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- VIEW 4: DIAGNOSTICS & META-HARNESS LOOP (UNIFIED) -->
        <section id="view-diagnose" class="view-section">
          <div class="view-card">
            <h2 class="view-title">🧬 Harness Diagnostics & Meta-Harness Loop</h2>
            <p class="view-subtitle">HarnessKit continuously evaluates and optimizes its own prompt harnesses based on real execution telemetry.</p>
            
            <!-- Meta-Harness Optimization Loop Flow -->
            <div style="margin: 20px 0; padding: 20px; background: #0d1117; border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="font-size: 14px; font-weight: 700; color: var(--itau-orange); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span>🧬 Meta-Harness Optimization Loop</span>
              </div>
              <pre style="margin: 0; font-family: monospace; font-size: 12px; color: #58a6ff; line-height: 1.6; white-space: pre; overflow-x: auto;">
Sessions (real work)
       ↓
 meta-harness-agent    ← runs harness-tracer (records execution traces to docs/harness-history/)
       ↓
 harness-evaluator     ← aggregates traces, calculates Pareto frontier scores
       ↓
 meta-harness          ← proposes targeted improvements to SKILL.md instructions
       ↓
 Human review & promotion
              </pre>
            </div>

            <!-- Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 20px 0;">
              <div style="padding: 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Sessões Pendentes</div>
                <div id="diagnosePendingCount" style="font-size: 28px; font-weight: 700; color: var(--itau-orange); margin-top: 4px;">0</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">diagnose-sessions.jsonl</div>
              </div>
              <div style="padding: 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Traces Gravados</div>
                <div id="diagnoseTracesCount" style="font-size: 28px; font-weight: 700; color: var(--status-connected); margin-top: 4px;">0</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">docs/harness-history/traces/</div>
              </div>
              <div style="padding: 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Candidatos Gerados</div>
                <div id="diagnoseCandidatesCount" style="font-size: 28px; font-weight: 700; color: #8b5cf6; margin-top: 4px;">0</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">docs/harness-history/candidates/</div>
              </div>
            </div>

            <!-- Action Controls -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
              <button class="btn btn-primary" id="btnRunDiagnosis">⚡ Executar Diagnóstico em Lote (Batch of 3)</button>
              <button class="btn btn-outline" id="btnEvaluatePareto">📊 Avaliar Pareto Frontier</button>
              <button class="btn btn-outline" id="btnProposeCandidate">💡 Propor Otimização (Meta-Harness)</button>
              <button class="btn btn-outline" id="btnRefreshDiagnose">🔄 Atualizar Status</button>
            </div>

            <!-- Dedicated Live Terminal -->
            <div style="margin-top: 16px;">
              <label class="form-label">Terminal de Diagnóstico & Tracing</label>
              <div id="diagnoseTerminal" style="background: #0d1117; color: #58a6ff; font-family: monospace; font-size: 12px; padding: 14px; border-radius: 8px; min-height: 140px; max-height: 240px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;">[DIAGNOSE] Pronto para executar análise retrospectiva de sessões.</div>
            </div>

            <!-- Traces Subsection -->
            <div style="margin-top: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label class="form-label" style="margin-bottom: 0;">📁 Traces de Sessões Gravados (docs/harness-history/traces/)</label>
                <span id="tracesFoundBadge" class="status-badge status-connected" style="font-size: 11px;">0 traces</span>
              </div>
              <div id="tracesListContainer" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                <span style="font-size: 12px; color: var(--text-secondary);">Carregando traces gravados...</span>
              </div>
            </div>

            <!-- Candidates Subsection -->
            <div style="margin-top: 32px; border-top: 1px solid var(--border-color); padding-top: 24px;">
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">💡 Meta-Harness Improvement Candidates</h3>
              <p class="view-subtitle" style="margin-bottom: 16px;">Otimizações de prompt e regras geradas autonomamente pelo meta-harness-agent para evolução contínua.</p>
              
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID do Candidato</th>
                    <th>Skill Alvo</th>
                    <th>Gatilho / Hipótese Causal</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody id="candidatesTableBody">
                  <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 16px;">Carregando candidatos a melhoria...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>

  <!-- SOCRATIC REFINEMENT QUESTIONNAIRE MODAL -->
  <div id="socraticModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-size: 18px; font-weight: 700;">🧠 Questionário Socrático de Arquitetura</h3>
        <button type="button" id="btnCloseSocraticModal" class="btn-icon">✕</button>
      </div>
      <div class="modal-body" id="socraticModalBody">
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
          O <strong>Software Architect</strong> formulou as seguintes questões críticas para consolidar em <code>docs/product/REFINEMENT.md</code> antes de iniciar o planejamento e desenvolvimento.
        </p>
        <div id="questionsContainer">
          <!-- Dynamically populated question cards -->
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" id="btnAcceptAllRecs" class="btn btn-outline">
          ✅ Aceitar Recomendações
        </button>
        <button type="button" id="btnConfirmAndStart" class="btn btn-primary">
          🚀 Confirmar Respostas e Iniciar TDD
        </button>
      </div>
    </div>
  </div>

  <!-- IN-BROWSER INSTANT FOLDER PICKER MODAL -->
  <div id="folderPickerModal" class="modal-overlay">
    <div class="modal-card" style="max-width: 680px; width: 100%;">
      <div class="modal-header">
        <h3 style="font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span>📁 Selecionar Pasta do Workspace</span>
        </h3>
        <button type="button" id="btnCloseFolderPickerModal" class="btn-icon">✕</button>
      </div>
      <div class="modal-body" style="padding: 16px 20px;">
        <!-- Path Navigation Bar -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
          <button type="button" id="btnFolderUp" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" title="Subir um nível">
            ⬆ Subir
          </button>
          <input type="text" id="folderPickerCurrentPathInput" class="form-control" style="font-family: monospace; font-size: 13px; flex: 1;" placeholder="Caminho da pasta..." />
          <button type="button" id="btnFolderGo" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" title="Ir para o caminho">
            ➔ Ir
          </button>
        </div>

        <!-- Quick Shortcuts -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Atalhos:</span>
          <div id="folderPickerShortcuts" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
        </div>

        <!-- Directory List -->
        <div id="folderPickerList" style="border: 1px solid var(--border-default); border-radius: 6px; max-height: 280px; min-height: 180px; overflow-y: auto; background: var(--bg-surface-elevated); padding: 4px;">
          <!-- Populated dynamically with folders -->
        </div>
      </div>
      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" id="btnTryNativePicker" class="btn btn-outline" style="font-size: 12px;" title="Tentar abrir seletor nativo do Windows">
          🖥️ Diálogo do SO
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" id="btnCancelFolderPicker" class="btn btn-outline">
            Cancelar
          </button>
          <button type="button" id="btnConfirmFolderPicker" class="btn btn-primary">
            ✅ Selecionar Esta Pasta
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // SPA Navigation
    function navigateTo(route) {
      if (route === 'candidates') route = 'diagnose';
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

      const activeLink = document.querySelector(\`.nav-link[data-route="\${route}"]\`);
      if (activeLink) activeLink.classList.add('active');

      const targetSection = document.getElementById(\`view-\${route}\`);
      if (targetSection) targetSection.classList.add('active');

      if (route === 'diagnose') {
        refreshDiagnoseStatus();
      }
    }

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#/', '') || 'run';
      navigateTo(hash);
    });

    document.querySelectorAll('.nav-link[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        const route = link.getAttribute('data-route');
        if (route) navigateTo(route);
      });
    });

    // Theme Switcher
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlEl = document.documentElement;

    function applyTheme(theme) {
      htmlEl.setAttribute('data-theme', theme);
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('harness_theme', theme);
    }

    const savedTheme = localStorage.getItem('harness_theme') || 'light';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') || 'light';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });

    // Logging & Status Helper
    const logTerminal = document.getElementById('logTerminal');
    const activeJobLabel = document.getElementById('activeJobLabel');

    function appendLog(msg) {
      const time = new Date().toLocaleTimeString('pt-BR');
      logTerminal.textContent += '\\n[' + time + '] ' + msg;
      logTerminal.scrollTop = logTerminal.scrollHeight;
    }

    // Timeline Updates with Loop Indicator
    function updateTimeline(phase) {
      const phaseOrder = ['BOOTSTRAP', 'REFINEMENT', 'PLANNING', 'DEVELOPMENT', 'REVIEW', 'MEMORY'];
      const currentUpper = phase ? phase.toUpperCase() : '';
      let currentIndex = phaseOrder.indexOf(currentUpper);
      if (currentIndex === -1 && currentUpper === 'DEPLOY') {
        currentIndex = phaseOrder.length; // all completed
      }
      if (currentIndex === -1) return;

      const trackFill = document.getElementById('timelineTrackFill');
      if (trackFill) {
        const percent = Math.min(100, Math.max(0, (currentIndex / (phaseOrder.length - 1)) * 100));
        trackFill.style.width = percent + '%';
      }

      const statusTag = document.getElementById('pipelineStatusTag');
      if (statusTag) {
        if (currentIndex >= phaseOrder.length) {
          statusTag.textContent = 'Status: CICLO CONCLUÍDO (100%)';
          statusTag.style.color = 'var(--status-connected)';
        } else {
          statusTag.textContent = 'Status: EXECUTANDO FASE ' + phaseOrder[currentIndex];
          statusTag.style.color = 'var(--itau-orange)';
        }
      }

      phaseOrder.forEach((p, idx) => {
        const el = document.getElementById('step-' + p);
        if (!el) return;
        const circleEl = el.querySelector('.step-circle');
        const badgeEl = el.querySelector('.step-badge-status');

        el.classList.remove('step-active', 'step-completed');
        if (idx < currentIndex) {
          el.classList.add('step-completed');
          if (circleEl) circleEl.innerHTML = '<span class="step-check">✓</span>';
          if (badgeEl) badgeEl.textContent = '✓ Concluído';
        } else if (idx === currentIndex) {
          el.classList.add('step-active');
          if (circleEl) circleEl.innerHTML = '<span class="spinning-icon">⟳</span>';
          if (badgeEl) badgeEl.innerHTML = '<span class="spinning-icon">⟳</span> Em Loop TDD';
        } else {
          if (circleEl) circleEl.innerHTML = '<span class="step-num">' + (idx + 1) + '</span>';
          if (badgeEl) badgeEl.textContent = 'Aguardando';
        }
      });
    }

    function resetTimeline() {
      const phaseOrder = ['BOOTSTRAP', 'REFINEMENT', 'PLANNING', 'DEVELOPMENT', 'REVIEW', 'MEMORY'];
      const trackFill = document.getElementById('timelineTrackFill');
      if (trackFill) trackFill.style.width = '0%';

      const statusTag = document.getElementById('pipelineStatusTag');
      if (statusTag) {
        statusTag.textContent = 'Status: AGUARDANDO JOB';
        statusTag.style.color = 'var(--text-secondary)';
      }

      phaseOrder.forEach((p, idx) => {
        const el = document.getElementById('step-' + p);
        if (!el) return;
        el.classList.remove('step-active', 'step-completed');
        const circleEl = el.querySelector('.step-circle');
        const badgeEl = el.querySelector('.step-badge-status');
        if (circleEl) circleEl.innerHTML = '<span class="step-num">' + (idx + 1) + '</span>';
        if (badgeEl) badgeEl.textContent = 'Aguardando';
      });
    }

    // Folder & Scope Persistence
    const projectInput = document.getElementById('projectInput');
    const scopeInput = document.getElementById('scopeInput');
    const btnBrowseFolder = document.getElementById('btnBrowseFolder');

    // Carregar pasta e escopo previamente salvos
    const savedFolderInit = localStorage.getItem('harness_last_project_path');
    if (savedFolderInit && !projectInput.value) {
      projectInput.value = savedFolderInit;
    }
    const savedScopeInit = localStorage.getItem('harness_last_scope');
    if (savedScopeInit && !scopeInput.value) {
      scopeInput.value = savedScopeInit;
    }

    projectInput.addEventListener('input', () => {
      localStorage.setItem('harness_last_project_path', projectInput.value.trim());
    });
    projectInput.addEventListener('change', () => {
      localStorage.setItem('harness_last_project_path', projectInput.value.trim());
    });
    scopeInput.addEventListener('input', () => {
      localStorage.setItem('harness_last_scope', scopeInput.value);
    });

    // In-Browser Instant Folder Picker Controller
    const folderPickerModal = document.getElementById('folderPickerModal');
    const btnCloseFolderPickerModal = document.getElementById('btnCloseFolderPickerModal');
    const btnCancelFolderPicker = document.getElementById('btnCancelFolderPicker');
    const btnConfirmFolderPicker = document.getElementById('btnConfirmFolderPicker');
    const btnFolderUp = document.getElementById('btnFolderUp');
    const btnFolderGo = document.getElementById('btnFolderGo');
    const btnTryNativePicker = document.getElementById('btnTryNativePicker');
    const folderPickerCurrentPathInput = document.getElementById('folderPickerCurrentPathInput');
    const folderPickerShortcuts = document.getElementById('folderPickerShortcuts');
    const folderPickerList = document.getElementById('folderPickerList');

    let pickerCurrentPath = '';
    let pickerParentPath = null;

    function openFolderPickerModal(startPath) {
      pickerCurrentPath = startPath || (projectInput ? projectInput.value.trim() : '') || '';
      folderPickerModal.classList.add('open');
      loadFolderDirectory(pickerCurrentPath);
    }

    function closeFolderPickerModal() {
      folderPickerModal.classList.remove('open');
    }

    if (btnCloseFolderPickerModal) btnCloseFolderPickerModal.onclick = closeFolderPickerModal;
    if (btnCancelFolderPicker) btnCancelFolderPicker.onclick = closeFolderPickerModal;

    folderPickerModal.addEventListener('click', (e) => {
      if (e.target === folderPickerModal) closeFolderPickerModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && folderPickerModal.classList.contains('open')) {
        closeFolderPickerModal();
      }
    });

    async function loadFolderDirectory(targetPath) {
      folderPickerList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">⏳ Carregando diretórios...</div>';

      try {
        const url = '/api/workspace/browse' + (targetPath ? '?path=' + encodeURIComponent(targetPath) : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Status ' + res.status);
        const data = await res.json();

        pickerCurrentPath = data.currentPath || targetPath;
        pickerParentPath = data.parentPath;
        folderPickerCurrentPathInput.value = pickerCurrentPath;

        if (btnFolderUp) {
          btnFolderUp.disabled = !pickerParentPath;
        }

        // Render Shortcuts
        const shortcuts = [];
        if (data.homePath) {
          shortcuts.push({ label: '🏠 Início', path: data.homePath });
        }
        const savedProject = localStorage.getItem('harness_last_project_path');
        if (savedProject && savedProject !== pickerCurrentPath) {
          shortcuts.push({ label: '⭐ Recente', path: savedProject });
        }
        if (data.drives && data.drives.length > 0) {
          data.drives.forEach(d => {
            shortcuts.push({ label: '💾 ' + d, path: d });
          });
        }

        folderPickerShortcuts.innerHTML = shortcuts.map(s => {
          return '<button type="button" class="btn btn-outline shortcut-pill" data-path="' + s.path + '" style="padding: 3px 8px; font-size: 11px; border-radius: 4px;">' + s.label + '</button>';
        }).join('');

        folderPickerShortcuts.querySelectorAll('.shortcut-pill').forEach(btn => {
          btn.onclick = () => loadFolderDirectory(btn.getAttribute('data-path'));
        });

        // Render Folder List
        if (!data.directories || data.directories.length === 0) {
          folderPickerList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">Nenhuma subpasta encontrada neste diretório.</div>';
          return;
        }

        folderPickerList.innerHTML = data.directories.map(name => {
          return '<div class="folder-row" data-name="' + name + '" style="display: flex; align-items: center; gap: 8px; padding: 7px 12px; cursor: pointer; border-radius: 4px; font-size: 13px; user-select: none; border-bottom: 1px solid var(--border-default);">' +
            '<span style="font-size: 15px;">📁</span>' +
            '<span style="font-weight: 500; flex: 1;">' + name + '</span>' +
            '<span style="color: var(--text-secondary); font-size: 11px;">➔ Abrir</span>' +
          '</div>';
        }).join('');

        folderPickerList.querySelectorAll('.folder-row').forEach(row => {
          row.addEventListener('mouseenter', () => {
            row.style.background = 'var(--bg-surface)';
          });
          row.addEventListener('mouseleave', () => {
            row.style.background = 'transparent';
          });
          row.addEventListener('click', () => {
            const folderName = row.getAttribute('data-name');
            const sep = pickerCurrentPath.endsWith('/') ? '' : '/';
            const nextPath = pickerCurrentPath + sep + folderName;
            loadFolderDirectory(nextPath);
          });
        });
      } catch (err) {
        folderPickerList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-danger); font-size: 13px;">Erro ao ler diretório: ' + err.message + '</div>';
      }
    }

    if (btnFolderUp) {
      btnFolderUp.onclick = () => {
        if (pickerParentPath) loadFolderDirectory(pickerParentPath);
      };
    }

    if (btnFolderGo) {
      btnFolderGo.onclick = () => {
        const val = folderPickerCurrentPathInput.value.trim();
        if (val) loadFolderDirectory(val);
      };
    }

    if (folderPickerCurrentPathInput) {
      folderPickerCurrentPathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = folderPickerCurrentPathInput.value.trim();
          if (val) loadFolderDirectory(val);
        }
      });
    }

    if (btnConfirmFolderPicker) {
      btnConfirmFolderPicker.onclick = () => {
        if (pickerCurrentPath) {
          projectInput.value = pickerCurrentPath;
          localStorage.setItem('harness_last_project_path', pickerCurrentPath);
          appendLog('[EXPLORER] ✅ Pasta selecionada e salva: ' + pickerCurrentPath);
        }
        closeFolderPickerModal();
      };
    }

    if (btnTryNativePicker) {
      btnTryNativePicker.onclick = async () => {
        btnTryNativePicker.disabled = true;
        btnTryNativePicker.textContent = '⏳ Abrindo SO...';
        try {
          const res = await fetch('/api/workspace/select-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPath: pickerCurrentPath })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.selectedPath) {
              pickerCurrentPath = data.selectedPath;
              folderPickerCurrentPathInput.value = data.selectedPath;
              loadFolderDirectory(data.selectedPath);
            }
          }
        } catch {}
        btnTryNativePicker.disabled = false;
        btnTryNativePicker.textContent = '🖥️ Diálogo do SO';
      };
    }

    async function handleBrowseFolder() {
      openFolderPickerModal(projectInput.value.trim());
    }

    if (btnBrowseFolder) btnBrowseFolder.addEventListener('click', handleBrowseFolder);

    // Mode Selector Handler
    const modeSelect = document.getElementById('modeSelect');
    const deepThinkingAlert = document.getElementById('deepThinkingAlert');
    modeSelect.addEventListener('change', () => {
      deepThinkingAlert.style.display = modeSelect.value === 'deep_thinking' ? 'block' : 'none';
    });

    // Socratic Modal Logic
    const socraticModal = document.getElementById('socraticModal');
    const btnCloseSocraticModal = document.getElementById('btnCloseSocraticModal');
    const questionsContainer = document.getElementById('questionsContainer');
    const btnAcceptAllRecs = document.getElementById('btnAcceptAllRecs');
    const btnConfirmAndStart = document.getElementById('btnConfirmAndStart');
    const btnViewSocraticQuestions = document.getElementById('btnViewSocraticQuestions');

    let currentQuestions = [];
    let activeRefinementJobId = null;
    const dismissedSocraticModals = new Set();

    function renderAndOpenSocraticModal(questions, jobId) {
      currentQuestions = questions || [];
      activeRefinementJobId = jobId || localStorage.getItem('harness_active_job_id');

      // Render Questions pre-filled with default recommendations
      questionsContainer.innerHTML = currentQuestions.map((q, idx) => \`
        <div class="question-card">
          <div class="question-title">❓ Questão \${idx + 1}/\${currentQuestions.length}: \${q.question}</div>
          \${q.context ? \`<div class="question-context">ℹ️ <strong>Impacto Sistêmico / Contexto:</strong> \${q.context}</div>\` : ''}
          <div class="question-rec">💡 <strong>Recomendação Padrão do Arquiteto:</strong> \${q.recommendation}</div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>Sua Decisão (Edite ou mantenha a recomendação padrão):</span>
              <button type="button" onclick="document.getElementById('ans-\${idx}').value = currentQuestions[\${idx}].recommendation" style="background: none; border: none; color: var(--itau-orange); cursor: pointer; font-size: 11px; text-decoration: underline;">Restaurar Padrão</button>
            </label>
            <input type="text" id="ans-\${idx}" class="form-control" value="\${(q.recommendation || '').replace(/"/g, '&quot;')}" />
          </div>
        </div>
      \`).join('') + \`
        <div class="question-card" style="border-left: 3px solid var(--itau-navy);">
          <div class="question-title">📝 Informações Adicionais / Requisitos Extras (Opcional)</div>
          <div class="form-group" style="margin-bottom: 0;">
            <input type="text" id="ans-additional" class="form-control" placeholder="Ex: Priorizar compatibilidade com Node 20+, sem bibliotecas externas..." />
          </div>
        </div>
      \`;

      socraticModal.classList.add('open');
      appendLog(\`[REFINEMENT] 📋 Modal com as \${currentQuestions.length} questões socráticas formuladas pelo Software Architect.\`);
    }

    async function handleViewSocraticQuestions() {
      const activeJobId = localStorage.getItem('harness_active_job_id');

      if (btnViewSocraticQuestions) {
        btnViewSocraticQuestions.disabled = true;
        btnViewSocraticQuestions.innerHTML = '<span>⏳ Carregando Questões...</span>';
      }

      try {
        let questionsToDisplay = null;
        let targetJobId = activeJobId;

        if (activeJobId) {
          const res = await fetch(\`/orchestrator/status/\${activeJobId}\`);
          if (res.ok) {
            const data = await res.json();
            if (data.pendingRefinement && data.pendingRefinement.length > 0) {
              questionsToDisplay = data.pendingRefinement;
            }
          }
        }

        if (!questionsToDisplay) {
          const latestRes = await fetch('/orchestrator/jobs/latest');
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            if (latestData && latestData.pendingRefinement && latestData.pendingRefinement.length > 0) {
              questionsToDisplay = latestData.pendingRefinement;
              targetJobId = latestData.jobId;
            }
          }
        }

        if (!questionsToDisplay && currentQuestions && currentQuestions.length > 0) {
          questionsToDisplay = currentQuestions;
        }

        // If no questions yet from running job, fetch questions preview for the scope
        if (!questionsToDisplay || questionsToDisplay.length === 0) {
          const project = document.getElementById('projectInput').value;
          const scope = document.getElementById('scopeInput').value;
          const agent = document.getElementById('agentSelect').value;
          if (scope.trim()) {
            const genRes = await fetch('/orchestrator/refine/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scope, agent, project })
            });
            if (genRes.ok) {
              const genData = await genRes.json();
              if (genData && genData.questions && genData.questions.length > 0) {
                questionsToDisplay = genData.questions;
              }
            }
          }
        }

        if (questionsToDisplay && questionsToDisplay.length > 0) {
          if (targetJobId) dismissedSocraticModals.delete(targetJobId);
          if (activeTaskId) dismissedSocraticModals.delete(activeTaskId);
          renderAndOpenSocraticModal(questionsToDisplay, targetJobId);
        } else {
          appendLog('[INFO] ⏳ Preencha o escopo para consultar as questões socráticas do Software Architect.');
        }
      } catch (err) {
        appendLog('[ERROR] Falha ao carregar questões socráticas: ' + err.message);
      } finally {
        if (btnViewSocraticQuestions) {
          btnViewSocraticQuestions.disabled = false;
          btnViewSocraticQuestions.innerHTML = '<span>🧠 Ver Questões Socráticas</span>';
        }
      }
    }

    if (btnViewSocraticQuestions) {
      btnViewSocraticQuestions.addEventListener('click', handleViewSocraticQuestions);
    }

    function dismissSocraticModal() {
      socraticModal.classList.remove('open');
      if (activeRefinementJobId) dismissedSocraticModals.add(activeRefinementJobId);
      if (activeTaskId) dismissedSocraticModals.add(activeTaskId);
    }

    btnCloseSocraticModal.addEventListener('click', dismissSocraticModal);

    socraticModal.addEventListener('click', (e) => {
      if (e.target === socraticModal) {
        dismissSocraticModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && socraticModal.classList.contains('open')) {
        dismissSocraticModal();
      }
    });

    btnAcceptAllRecs.addEventListener('click', () => {
      currentQuestions.forEach((q, idx) => {
        const ansInput = document.getElementById('ans-' + idx);
        if (ansInput) ansInput.value = q.recommendation;
      });
      const additionalInput = document.getElementById('ans-additional');
      if (additionalInput) additionalInput.value = '';
    });

    btnConfirmAndStart.addEventListener('click', async () => {
      const answers = currentQuestions.map((q, idx) => {
        const ansInput = document.getElementById('ans-' + idx);
        return {
          question: q.question,
          answer: (ansInput ? ansInput.value.trim() : '') || q.recommendation
        };
      });

      const additionalInput = document.getElementById('ans-additional');
      if (additionalInput && additionalInput.value.trim()) {
        answers.push({
          question: 'Any additional information?',
          answer: additionalInput.value.trim()
        });
      }

      socraticModal.classList.remove('open');
      const jobId = activeRefinementJobId || localStorage.getItem('harness_active_job_id');
      if (jobId) dismissedSocraticModals.delete(jobId);
      if (activeTaskId) dismissedSocraticModals.delete(activeTaskId);

      if (jobId) {
        appendLog('[REFINEMENT] 🚀 Enviando ' + answers.length + ' respostas socráticas para o Job ' + jobId + '...');
        try {
          await fetch('/orchestrator/jobs/' + jobId + '/refine-answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, answers })
          });
        } catch (err) {
          console.warn('Erro ao submeter respostas socráticas:', err);
        }
      }
    });

    // Multi-Task Autonomous Orchestration Hub State
    let hubTasks = [];
    let activeTaskId = null; // null => "+ Nova Tarefa" mode

    function renderHubTasksTabBar() {
      const tabBar = document.getElementById('hubActiveTasksPills');
      const btnNew = document.getElementById('btnHubNewTaskTab');
      if (!tabBar) return;

      if (btnNew) {
        if (activeTaskId === null) {
          btnNew.classList.remove('btn-outline');
          btnNew.classList.add('btn-primary');
        } else {
          btnNew.classList.remove('btn-primary');
          btnNew.classList.add('btn-outline');
        }
      }

      tabBar.innerHTML = hubTasks.map((t, idx) => {
        const isActive = t.cycleId === activeTaskId;
        const shortScope = (t.scope || 'Tarefa ' + (idx + 1)).slice(0, 20) + '...';
        const isWaitingSpec = t.status === 'WAITING_SPEC_APPROVAL';
        const badgeColor = isWaitingSpec ? 'var(--itau-orange)' : (t.status === 'RUNNING' ? 'var(--itau-navy)' : 'var(--border-default)');
        const statusText = isWaitingSpec ? 'APROVAR SPEC' : (t.status || 'RUNNING');
        const bg = isActive ? 'var(--itau-navy)' : 'var(--bg-surface-elevated)';
        const textCol = isActive ? '#ffffff' : 'var(--text-primary)';
        const borderCol = isActive ? 'var(--itau-orange)' : 'var(--border-default)';

        return '<div class="hub-task-pill" data-cycle-id="' + t.cycleId + '" style="cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid ' + borderCol + '; background: ' + bg + '; color: ' + textCol + '; font-size: 12px; font-weight: 600; white-space: nowrap;">' +
          '<span>⚡ ' + shortScope + '</span>' +
          '<span style="background: ' + badgeColor + '; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 10px;">' + statusText + '</span>' +
          '<span class="btn-abort-task" data-cycle-id="' + t.cycleId + '" title="Cancelar ciclo" style="cursor: pointer; opacity: 0.7; font-size: 14px; margin-left: 4px;">✕</span>' +
        '</div>';
      }).join('');

      tabBar.querySelectorAll('.hub-task-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          selectHubTask(pill.getAttribute('data-cycle-id'));
        });
      });

      tabBar.querySelectorAll('.btn-abort-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          abortHubTask(btn.getAttribute('data-cycle-id'));
        });
      });
    }

    function saveHubTasksToStorage() {
      try {
        localStorage.setItem('harness_hub_tasks', JSON.stringify(hubTasks));
      } catch {}
    }

    window.selectHubTask = function(cycleId) {
      activeTaskId = cycleId;
      try {
        localStorage.setItem('harness_hub_active_task_id', cycleId || '');
      } catch {}
      renderHubTasksTabBar();

      const metaBar = document.getElementById('activeTaskMetaBar');
      const specBanner = document.getElementById('specApprovalBanner');
      const formTitle = document.getElementById('hubFormTitle');
      const btnStartRun = document.getElementById('btnStartRun');

      if (!cycleId) {
        // "+ Nova Tarefa" mode
        if (metaBar) metaBar.style.display = 'none';
        if (specBanner) specBanner.style.display = 'none';
        if (formTitle) formTitle.textContent = '🚀 Autonomous Orchestration Hub (Nova Tarefa)';
        resetTimeline();
        logTerminal.textContent = '[HRNS Server] Pronto para configurar e iniciar uma nova tarefa autônoma em paralelo.';
        activeJobLabel.textContent = 'Modo: Nova Tarefa';
        if (btnStartRun) {
          btnStartRun.disabled = false;
          btnStartRun.innerHTML = '<span>▶ Iniciar Ciclo Autônomo</span>';
        }
        return;
      }

      const task = hubTasks.find(t => t.cycleId === cycleId);
      if (!task) return;

      if (formTitle) formTitle.textContent = '🚀 Tarefa: ' + (task.scope || task.cycleId);

      if (metaBar) {
        metaBar.style.display = 'flex';
        document.getElementById('lblActiveSessionId').textContent = task.sessionId || 'sess-none';
        document.getElementById('lblActiveCycleId').textContent = task.cycleId;
        document.getElementById('lblActiveWorktree').textContent = task.worktreePath || 'isolado';
        const badge = document.getElementById('lblActiveTaskBadge');
        if (badge) {
          badge.textContent = task.status;
          badge.className = 'status-badge ' + (task.status === 'RUNNING' ? 'status-connected' : 'status-reconnecting');
        }
      }

      if (scopeInput) scopeInput.value = task.scope || '';
      if (agentSelect) agentSelect.value = task.agent || 'antigravity-cli';
      if (modeSelect) modeSelect.value = task.mode || 'thinking';

      updateTimeline(task.currentPhase || 'BOOTSTRAP');

      if (specBanner) {
        if (task.status === 'WAITING_SPEC_APPROVAL') {
          specBanner.style.display = 'block';
          const specBox = document.getElementById('specSummaryBox');
          if (specBox) specBox.textContent = task.specSummary || 'Especificação e decisões arquiteturais prontas para validação.';
        } else {
          specBanner.style.display = 'none';
        }
      }

      logTerminal.textContent = task.logs && task.logs.length > 0 ? task.logs.join(String.fromCharCode(10)) : '> Aguardando saída do agente...';
      logTerminal.scrollTop = logTerminal.scrollHeight;
      activeJobLabel.textContent = 'Ciclo: ' + task.cycleId + ' (' + task.status + ')';
    };

    window.abortHubTask = async function(cycleId) {
      if (!confirm('Deseja realmente cancelar este ciclo?')) return;
      try {
        await fetch('/orchestrator/jobs/' + cycleId + '/abort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        await fetch('/api/cycles/' + cycleId + '/abort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Cancelado pelo usuário no Hub' })
        });
      } catch {}

      const interval = jobPollIntervals.get(cycleId);
      if (interval) {
        clearInterval(interval);
        jobPollIntervals.delete(cycleId);
      }
      const es = jobEventSources.get(cycleId);
      if (es) {
        es.close();
        jobEventSources.delete(cycleId);
      }

      hubTasks = hubTasks.filter(t => t.cycleId !== cycleId);
      saveHubTasksToStorage();
      renderHubTasksTabBar();
      if (activeTaskId === cycleId) {
        selectHubTask(hubTasks.length > 0 ? hubTasks[0].cycleId : null);
      }
    };

    const btnHubNewTaskTab = document.getElementById('btnHubNewTaskTab');
    if (btnHubNewTaskTab) {
      btnHubNewTaskTab.onclick = () => selectHubTask(null);
    }

    // Spec Approval Actions
    const btnApproveSpecAndDev = document.getElementById('btnApproveSpecAndDev');
    const btnRejectSpec = document.getElementById('btnRejectSpec');
    const btnInspectFullSpec = document.getElementById('btnInspectFullSpec');

    if (btnApproveSpecAndDev) {
      btnApproveSpecAndDev.onclick = async () => {
        if (!activeTaskId) return;
        btnApproveSpecAndDev.disabled = true;
        btnApproveSpecAndDev.textContent = '⏳ Aprovando...';
        try {
          const res = await fetch('/api/cycles/' + activeTaskId + '/approve-spec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            const task = hubTasks.find(t => t.cycleId === activeTaskId);
            if (task) {
              task.status = 'RUNNING';
              task.currentPhase = 'DEVELOPMENT';
              task.logs.push('[GATE] ✅ Especificação APROVADA pelo operador humano! Iniciando Desenvolvimento TDD.');
            }
            selectHubTask(activeTaskId);
          } else {
            alert('Falha ao aprovar spec.');
          }
        } catch (err) {
          alert('Erro: ' + err.message);
        } finally {
          btnApproveSpecAndDev.disabled = false;
          btnApproveSpecAndDev.textContent = '✅ Aprovar Spec e Iniciar Desenvolvimento';
        }
      };
    }

    if (btnRejectSpec) {
      btnRejectSpec.onclick = async () => {
        if (!activeTaskId) return;
        const feedback = prompt('Descreva os ajustes necessários na especificação/arquitetura:');
        if (feedback === null) return;
        try {
          const res = await fetch('/api/cycles/' + activeTaskId + '/reject-spec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback })
          });
          if (res.ok) {
            const task = hubTasks.find(t => t.cycleId === activeTaskId);
            if (task) {
              task.status = 'RUNNING';
              task.currentPhase = 'REFINEMENT';
              task.logs.push('[GATE] ✏️ Ajuste de spec solicitado: ' + feedback + '. Retornando para Refinamento.');
            }
            selectHubTask(activeTaskId);
          }
        } catch (err) {
          alert('Erro: ' + err.message);
        }
      };
    }

    if (btnInspectFullSpec) {
      btnInspectFullSpec.onclick = () => {
        if (activeTaskId) dismissedSocraticModals.delete(activeTaskId);
        if (activeRefinementJobId) dismissedSocraticModals.delete(activeRefinementJobId);
        handleViewSocraticQuestions();
      };
    }

    // Multi-Job EventSources and Polling Registry
    const jobEventSources = new Map();
    const jobPollIntervals = new Map();

    // Run Job Dispatcher (Multi-Task Hub with Real CLI Agent Execution)
    async function dispatchRunJob(payload) {
      currentQuestions = [];
      const btnStartRun = document.getElementById('btnStartRun');
      if (btnStartRun) {
        btnStartRun.disabled = true;
        btnStartRun.innerHTML = '<span>⏳ Enfileirando Job...</span>';
      }

      try {
        const res = await fetch('/orchestrator/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const jobId = data.jobId;

          const newTask = {
            cycleId: jobId,
            sessionId: 'sess-' + jobId.slice(0, 8),
            scope: payload.scope,
            category: 'backend',
            agent: payload.agent,
            mode: payload.mode,
            status: 'RUNNING',
            currentPhase: 'BOOTSTRAP',
            worktreePath: (payload.project && payload.project[0] ? payload.project[0] + '/.worktrees/' + jobId : '.worktrees/' + jobId),
            specSummary: '',
            logs: [
              '[SERVER] ✅ Job enfileirado com sucesso! ID: ' + jobId,
              '[AGENT] Inicializando runner CLI: ' + payload.agent + ' (modo: ' + payload.mode + ')...',
              '[WORKTREE] Sandbox isolado em: .worktrees/' + jobId,
              '[PIPELINE] Fase 1: BOOTSTRAP iniciada.'
            ]
          };

          hubTasks.push(newTask);
          saveHubTasksToStorage();
          renderHubTasksTabBar();
          selectHubTask(jobId);

          connectSseStream(jobId);
          startStatusPolling(jobId);
        } else {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          alert('Falha ao iniciar job (' + res.status + '): ' + (err.message || err.error));
        }
      } catch (err) {
        alert('Falha de conexão: ' + err.message);
      } finally {
        if (btnStartRun) {
          btnStartRun.disabled = false;
          btnStartRun.innerHTML = '<span>▶ Iniciar Ciclo Autônomo</span>';
        }
      }
    }

    function connectSseStream(jobId) {
      if (jobEventSources.has(jobId)) return;

      if (window.EventSource) {
        const es = new EventSource('/orchestrator/stream?jobId=' + jobId);
        jobEventSources.set(jobId, es);
        es.onmessage = (event) => {
          try {
            const item = JSON.parse(event.data);
            const task = hubTasks.find(t => t.cycleId === jobId);

            if (item.type === 'log_chunk' && item.text) {
              if (task) {
                task.logs.push(item.text);
                saveHubTasksToStorage();
              }
              if (activeTaskId === jobId) appendLog(item.text);
            } else if (item.type === 'phase_change') {
              if (task) {
                task.currentPhase = item.phase;
                task.logs.push('[PIPELINE] ➔ Transição de fase: ' + item.phase);
                saveHubTasksToStorage();
              }
              if (activeTaskId === jobId) {
                appendLog('[PIPELINE] ➔ Transição de fase: ' + item.phase);
                updateTimeline(item.phase);
              }
              renderHubTasksTabBar();
            } else if (item.type === 'interactive_refinement' && item.questions) {
              if (task) {
                task.status = 'WAITING_SPEC_APPROVAL';
                task.specSummary = 'Software Architect formulou ' + item.questions.length + ' questões socráticas de refinamento.';
                task.logs.push('[REFINEMENT] 🧠 ' + item.questions.length + ' questões prontas para validação.');
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId && !dismissedSocraticModals.has(jobId)) {
                renderAndOpenSocraticModal(item.questions, jobId);
              }
            } else if (item.type === 'status_change') {
              if (task) {
                task.status = item.status.toUpperCase();
                task.logs.push('[STATUS] Job ' + jobId + ': ' + item.status);
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId) {
                appendLog('[STATUS] Job ' + jobId + ': ' + item.status);
              }
            }
          } catch {
            if (activeTaskId === jobId) appendLog('[SSE] ' + event.data);
          }
        };
        es.onerror = () => {
          // SSE reconnects automatically
        };
      }
    }

    function startStatusPolling(jobId) {
      if (jobPollIntervals.has(jobId)) return;

      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch('/orchestrator/status/' + jobId);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const task = hubTasks.find(t => t.cycleId === jobId);
            if (task && statusData.phase) {
              task.currentPhase = statusData.phase;
              if (activeTaskId === jobId) updateTimeline(statusData.phase);
            }
            if (statusData.pendingRefinement && statusData.pendingRefinement.length > 0) {
              if (task) {
                task.status = 'WAITING_SPEC_APPROVAL';
                task.specSummary = statusData.pendingRefinement.length + ' questões de arquitetura aguardando validação.';
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId && !dismissedSocraticModals.has(jobId) && !socraticModal.classList.contains('open')) {
                renderAndOpenSocraticModal(statusData.pendingRefinement, jobId);
              }
            }
            if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'aborted') {
              if (task) {
                task.status = statusData.status.toUpperCase();
                task.logs.push('[SERVER] Job finalizado com status: ' + statusData.status.toUpperCase());
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId) {
                appendLog('[SERVER] Job finalizado com status: ' + statusData.status.toUpperCase());
                activeJobLabel.textContent = 'Job: ' + jobId + ' (' + statusData.status.toUpperCase() + ')';
              }
              clearInterval(interval);
              jobPollIntervals.delete(jobId);
              const es = jobEventSources.get(jobId);
              if (es) {
                es.close();
                jobEventSources.delete(jobId);
              }
            }
          }
        } catch {}
      }, 2500);
      jobPollIntervals.set(jobId, interval);
    }

    // Auto-Restore State on Page Load (Instant Cache + Dynamic Server Sync)
    async function restoreActiveJobOnLoad() {
      const savedFolder = localStorage.getItem('harness_last_project_path');
      if (savedFolder && projectInput) {
        projectInput.value = savedFolder;
      }
      const savedScope = localStorage.getItem('harness_last_scope');
      if (savedScope && scopeInput) {
        scopeInput.value = savedScope;
      }

      // 1. Instant hydration from client localStorage cache
      try {
        const cached = localStorage.getItem('harness_hub_tasks');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            hubTasks = parsed;
            renderHubTasksTabBar();
            const savedActiveId = localStorage.getItem('harness_hub_active_task_id');
            if (savedActiveId && hubTasks.some(t => t.cycleId === savedActiveId)) {
              selectHubTask(savedActiveId);
            } else if (hubTasks.length > 0) {
              selectHubTask(hubTasks[0].cycleId);
            }
          }
        }
      } catch {}

      // 2. Dynamic server synchronization: query active jobs and reconcile state
      try {
        const res = await fetch('/orchestrator/jobs/active');
        if (res.ok) {
          const data = await res.json();
          const serverActiveJobs = data.activeJobs || [];

          for (const sJob of serverActiveJobs) {
            const jId = sJob.jobId;
            let task = hubTasks.find(t => t.cycleId === jId);

            try {
              const statusRes = await fetch('/orchestrator/status/' + jId);
              if (statusRes.ok) {
                const sData = await statusRes.json();
                const taskScope = sData.scope || (sJob.request && sJob.request.scope) || ('Tarefa ' + jId.slice(0, 8));
                const taskAgent = (sJob.request && sJob.request.agent) || 'antigravity-cli';
                const taskMode = (sJob.request && sJob.request.mode) || 'thinking';
                const taskStatus = sData.pendingRefinement ? 'WAITING_SPEC_APPROVAL' : (sData.status ? sData.status.toUpperCase() : 'RUNNING');
                const taskPhase = sData.phase || 'BOOTSTRAP';

                let logs = [];
                if (sData.historyLogs && Array.isArray(sData.historyLogs) && sData.historyLogs.length > 0) {
                  logs = sData.historyLogs.map(item => {
                    if (typeof item === 'string') return item;
                    if (item.text) return item.text;
                    if (item.type === 'phase_change') return '[PIPELINE] ➔ Transição de fase: ' + item.phase;
                    return JSON.stringify(item);
                  });
                } else if (task && task.logs && task.logs.length > 0) {
                  logs = task.logs;
                } else {
                  logs = [
                    '[RESTORE] ✅ Sessão recuperada dinamicamente: ' + jId,
                    '[STATUS] ' + taskStatus + ' | Fase: ' + taskPhase
                  ];
                }

                if (!task) {
                  task = {
                    cycleId: jId,
                    sessionId: 'sess-' + jId.slice(0, 8),
                    scope: taskScope,
                    category: 'backend',
                    agent: taskAgent,
                    mode: taskMode,
                    status: taskStatus,
                    currentPhase: taskPhase,
                    worktreePath: sJob.workspacePath ? sJob.workspacePath + '/.worktrees/' + jId : '.worktrees/' + jId,
                    specSummary: sData.pendingRefinement ? (sData.pendingRefinement.length + ' questões de arquitetura aguardando validação.') : '',
                    logs: logs
                  };
                  hubTasks.push(task);
                } else {
                  task.status = taskStatus;
                  task.currentPhase = taskPhase;
                  if (logs.length >= task.logs.length) {
                    task.logs = logs;
                  }
                  if (sData.pendingRefinement) {
                    task.status = 'WAITING_SPEC_APPROVAL';
                    task.specSummary = sData.pendingRefinement.length + ' questões de arquitetura aguardando validação.';
                  }
                }

                // Reconnect SSE streaming and polling for ongoing jobs
                if (taskStatus === 'RUNNING' || taskStatus === 'QUEUED' || taskStatus === 'WAITING_SPEC_APPROVAL' || taskStatus === 'WAITING_FOR_INPUT') {
                  connectSseStream(jId);
                  startStatusPolling(jId);
                }
              }
            } catch {}
          }
        }
      } catch {}

      // 3. Reconcile any cached tasks that were RUNNING to check if they completed
      for (const t of hubTasks) {
        if (!jobPollIntervals.has(t.cycleId) && (t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'WAITING_SPEC_APPROVAL')) {
          try {
            const sRes = await fetch('/orchestrator/status/' + t.cycleId);
            if (sRes.ok) {
              const sData = await sRes.json();
              t.status = sData.pendingRefinement ? 'WAITING_SPEC_APPROVAL' : (sData.status ? sData.status.toUpperCase() : t.status);
              t.currentPhase = sData.phase || t.currentPhase;
              if (sData.historyLogs && Array.isArray(sData.historyLogs) && sData.historyLogs.length > t.logs.length) {
                t.logs = sData.historyLogs.map(item => typeof item === 'string' ? item : (item.text || JSON.stringify(item)));
              }
              if (t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'WAITING_SPEC_APPROVAL') {
                connectSseStream(t.cycleId);
                startStatusPolling(t.cycleId);
              }
            }
          } catch {}
        }
      }

      renderHubTasksTabBar();
      saveHubTasksToStorage();

      const lastActiveId = localStorage.getItem('harness_hub_active_task_id');
      if (lastActiveId && hubTasks.some(t => t.cycleId === lastActiveId)) {
        selectHubTask(lastActiveId);
      } else if (hubTasks.length > 0 && activeTaskId === null) {
        selectHubTask(hubTasks[0].cycleId);
      }
    }

    restoreActiveJobOnLoad();

    // Run Form Submit (Parallel Task Dispatch with Real CLI Execution)
    const runForm = document.getElementById('runForm');
    runForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const scope = document.getElementById('scopeInput').value.trim();
      const agent = document.getElementById('agentSelect').value;
      const mode = document.getElementById('modeSelect').value;
      const project = document.getElementById('projectInput').value.trim();

      if (!scope) {
        alert('Por favor, informe o escopo da tarefa.');
        return;
      }

      await dispatchRunJob({
        scope,
        agent,
        mode,
        project: [project],
        idempotencyKey: 'job-' + Date.now(),
        action: 'reset',
        parallel: true
      });
    });

    // Abort and Clean Current Job Execution
    async function handleAbortJob() {
      if (activeTaskId) {
        await abortHubTask(activeTaskId);
        return;
      }
      const activeJobId = localStorage.getItem('harness_active_job_id');

      if (!confirm('Deseja realmente cancelar e excluir a execução atual para reiniciar?')) {
        return;
      }

      appendLog('[USER] 🛑 Solicitando cancelamento e exclusão da execução atual...');
      btnAbortJob.disabled = true;
      btnAbortJob.innerHTML = '<span>⏳ Cancelando...</span>';

      try {
        if (activeJobId) {
          await fetch('/orchestrator/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: activeJobId })
          });
        }
        await fetch('/orchestrator/jobs/clean', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxAgeMs: 0 })
        });
      } catch (err) {
        console.warn('Erro ao cancelar job no servidor:', err);
      }

      // Limpar chave de job ativo
      localStorage.removeItem('harness_active_job_id');

      // Fechar SSE e parar polling
      if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
      }
      if (activePollInterval) {
        clearInterval(activePollInterval);
        activePollInterval = null;
      }

      // Resetar UI
      const btnStartRun = document.getElementById('btnStartRun');
      btnStartRun.disabled = false;
      btnStartRun.innerHTML = '<span>▶ Iniciar Ciclo Autônomo</span>';

      activeJobLabel.textContent = 'Job: IDLE';
      const statusTag = document.getElementById('pipelineStatusTag');
      if (statusTag) {
        statusTag.textContent = 'Status: CANCELADO / PRONTO PARA NOVO CICLO';
        statusTag.style.color = 'var(--status-disconnected)';
      }

      resetTimeline();

      appendLog('[SERVER] 🛑 Execução cancelada e limpa. Pronto para iniciar um novo ciclo.');
      btnAbortJob.disabled = false;
      btnAbortJob.innerHTML = '<span>🛑 Cancelar / Excluir Execução</span>';
    }

    if (btnAbortJob) {
      btnAbortJob.addEventListener('click', handleAbortJob);
    }

    // Diagnose Batch Execution & Status Handler
    const btnRunDiagnosis = document.getElementById('btnRunDiagnosis');
    const btnRefreshDiagnose = document.getElementById('btnRefreshDiagnose');
    const diagnosePendingCount = document.getElementById('diagnosePendingCount');
    const diagnoseTracesCount = document.getElementById('diagnoseTracesCount');
    const diagnoseCandidatesCount = document.getElementById('diagnoseCandidatesCount');
    const candidatesTableBody = document.getElementById('candidatesTableBody');
    const diagnoseTerminal = document.getElementById('diagnoseTerminal');

    function appendDiagnoseLog(msg) {
      if (diagnoseTerminal) {
        const time = new Date().toLocaleTimeString('pt-BR');
        diagnoseTerminal.textContent += '\\n[' + time + '] ' + msg;
        diagnoseTerminal.scrollTop = diagnoseTerminal.scrollHeight;
      }
      appendLog(msg);
    }

    async function refreshDiagnoseStatus() {
      const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
      try {
        const res = await fetch('/api/diagnose/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath: project })
        });
        if (res.ok) {
          const data = await res.json();
          if (diagnosePendingCount && data.pendingCount !== undefined) {
            diagnosePendingCount.textContent = data.pendingCount;
          }
          if (diagnoseTracesCount && data.tracesCount !== undefined) {
            diagnoseTracesCount.textContent = data.tracesCount;
          }
          if (diagnoseCandidatesCount && data.candidatesCount !== undefined) {
            diagnoseCandidatesCount.textContent = data.candidatesCount;
          }
          const tracesListContainer = document.getElementById('tracesListContainer');
          const tracesFoundBadge = document.getElementById('tracesFoundBadge');
          if (tracesFoundBadge && data.tracesCount !== undefined) {
            tracesFoundBadge.textContent = (data.tracesCount || 0) + ' traces';
          }
          if (tracesListContainer) {
            if (data.traces && data.traces.length > 0) {
              tracesListContainer.innerHTML = data.traces.map(t => \`
                <div style="padding: 6px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-family: monospace; display: flex; align-items: center; gap: 6px;">
                  <span>📄</span>
                  <strong>\${t.id}</strong>
                  <span style="color: var(--text-secondary);">(\${t.skill})</span>
                </div>
              \`).join('');
            } else {
              tracesListContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-secondary);">Nenhum trace gravado ainda. Clique em "Executar Diagnóstico em Lote".</span>';
            }
          }
          if (candidatesTableBody) {
            if (data.candidates && data.candidates.length > 0) {
              candidatesTableBody.innerHTML = data.candidates.map(c => \`
                <tr>
                  <td><code>\${c.id}</code></td>
                  <td><strong>\${c.skill}</strong></td>
                  <td>\${c.rationale}</td>
                  <td>
                    \${c.status === 'PROMOTED' ? '<span class="status-badge status-connected">PROMOTED</span>' : (c.status === 'APPLIED' ? '<span class="status-badge" style="background: rgba(236,112,0,0.15); color: var(--itau-orange);">APPLIED</span>' : '<span class="status-badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">PROPOSED</span>')}
                  </td>
                  <td>
                    \${c.status === 'PROMOTED' ? '<span style="font-size: 11px; color: var(--status-connected); font-weight: 600;">✅ Ativo</span>' : \`<button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="handlePromoteCandidate('\${c.id}')">🚀 Promover</button>\`}
                  </td>
                </tr>
              \`).join('');
            } else {
              candidatesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 16px;">Nenhum candidato a melhoria gerado ainda. Clique em "Propor Otimização (Meta-Harness)".</td></tr>';
            }
          }
        }
      } catch {}
    }

    if (btnRefreshDiagnose) {
      btnRefreshDiagnose.addEventListener('click', async () => {
        await refreshDiagnoseStatus();
        appendDiagnoseLog('🔄 Status das sessões atualizado com sucesso.');
      });
    }

    if (btnRunDiagnosis) {
      btnRunDiagnosis.addEventListener('click', async () => {
        const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
        btnRunDiagnosis.disabled = true;
        btnRunDiagnosis.innerHTML = '<span>⏳ Processando Lote de Diagnóstico...</span>';
        appendDiagnoseLog('🧬 Iniciando processamento do lote de sessões pendentes...');

        try {
          const res = await fetch('/api/diagnose/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath: project, batchSize: 3 })
          });
          const data = await res.json();
          if (data.success) {
            appendDiagnoseLog(\`✅ Processamento concluído! Sessões processadas: \${data.processed ?? 0}, Restantes: \${data.remaining ?? 0}\`);
            if (data.traceIds && data.traceIds.length > 0) {
              appendDiagnoseLog(\`📁 Traces gravados: \${data.traceIds.join(', ')} (verifique em docs/harness-history/traces/)\`);
            }
            if (data.candidateCreated) {
              appendDiagnoseLog(\`💡 Novo candidato gerado: \${data.candidateCreated.id} para skill \${data.candidateCreated.skill}\`);
            }
            await refreshDiagnoseStatus();
          } else {
            appendDiagnoseLog(\`⚠️ Aviso no diagnóstico: \${data.error || data.message || 'Falha ao processar sessões'}\`);
          }
        } catch (err) {
          appendDiagnoseLog(\`❌ Erro ao disparar diagnóstico: \${err.message}\`);
        } finally {
          btnRunDiagnosis.disabled = false;
          btnRunDiagnosis.innerHTML = '<span>⚡ Executar Diagnóstico em Lote (Batch of 3)</span>';
        }
      });
    }

    const btnEvaluatePareto = document.getElementById('btnEvaluatePareto');
    if (btnEvaluatePareto) {
      btnEvaluatePareto.addEventListener('click', async () => {
        const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
        btnEvaluatePareto.disabled = true;
        btnEvaluatePareto.innerHTML = '<span>⏳ Avaliando Pareto Frontier...</span>';
        appendDiagnoseLog('📊 [EVALUATOR] Iniciando cálculo da Fronteira de Pareto e scores compostos...');

        try {
          const res = await fetch('/api/diagnose/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath: project })
          });
          const data = await res.json();
          if (data.success) {
            appendDiagnoseLog(\`✅ Avaliação concluída! Sessões avaliadas: \${data.totalEvaluated}, Melhor Score: \${data.bestScore}\`);
            appendDiagnoseLog(\`🏆 Configuração Ótima: \${data.optimalChain}\`);
            appendDiagnoseLog(\`📝 docs/harness-history/pareto-frontier.md e score.md atualizados com sucesso!\`);
            await refreshDiagnoseStatus();
          } else {
            appendDiagnoseLog(\`⚠️ Aviso na avaliação: \${data.error || 'Falha ao avaliar traces'}\`);
          }
        } catch (err) {
          appendDiagnoseLog(\`❌ Erro ao avaliar Pareto: \${err.message}\`);
        } finally {
          btnEvaluatePareto.disabled = false;
          btnEvaluatePareto.innerHTML = '<span>📊 Avaliar Pareto Frontier</span>';
        }
      });
    }

    const btnProposeCandidate = document.getElementById('btnProposeCandidate');
    if (btnProposeCandidate) {
      btnProposeCandidate.addEventListener('click', async () => {
        const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
        btnProposeCandidate.disabled = true;
        btnProposeCandidate.innerHTML = '<span>⏳ Propondo Otimização...</span>';
        appendDiagnoseLog('💡 [META-HARNESS] Analisando histórico e propondo candidato de melhoria direcionada...');

        try {
          const res = await fetch('/api/diagnose/propose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath: project })
          });
          const data = await res.json();
          if (data.success) {
            appendDiagnoseLog(\`✅ Novo Candidato gerado: \${data.candidateId} para a skill \${data.targetSkill}\`);
            appendDiagnoseLog(\`📁 Arquivos salvos em \${data.path}/ (rationale.md, SKILL.md, diff.md, score.md)\`);
            await refreshDiagnoseStatus();
          } else {
            appendDiagnoseLog(\`⚠️ Aviso na proposição: \${data.error || 'Falha ao propor candidato'}\`);
          }
        } catch (err) {
          appendDiagnoseLog(\`❌ Erro ao propor melhoria: \${err.message}\`);
        } finally {
          btnProposeCandidate.disabled = false;
          btnProposeCandidate.innerHTML = '<span>💡 Propor Otimização (Meta-Harness)</span>';
        }
      });
    }

    window.handlePromoteCandidate = async function(candidateId) {
      if (!confirm(\`Deseja promover o candidato \${candidateId} para ser a regra ativa oficial em skills/?\`)) {
        return;
      }
      const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
      appendDiagnoseLog(\`🚀 [PROMOTION] Promovendo candidato \${candidateId} para produção...\`);

      try {
        const res = await fetch('/api/diagnose/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath: project, candidateId })
        });
        const data = await res.json();
        if (data.success) {
          appendDiagnoseLog(\`✅ \${data.message || 'Candidato promovido com sucesso!'}\`);
          await refreshDiagnoseStatus();
        } else {
          appendDiagnoseLog(\`❌ Erro na promoção: \${data.error || 'Falha ao promover candidato'}\`);
        }
      } catch (err) {
        appendDiagnoseLog(\`❌ Erro de conexão na promoção: \${err.message}\`);
      }
    };

    // Carregar status do diagnóstico na inicialização
    refreshDiagnoseStatus();

    // Health Polling
    async function checkHealth() {
      try {
        const res = await fetch('/health');
        const badge = document.getElementById('connBadge');
        const text = document.getElementById('connText');
        if (res.ok) {
          badge.className = 'status-badge status-connected';
          text.textContent = 'Connected (127.0.0.1:3000)';
        } else {
          badge.className = 'status-badge status-disconnected';
          text.textContent = 'Degraded';
        }
      } catch {
        const badge = document.getElementById('connBadge');
        const text = document.getElementById('connText');
        badge.className = 'status-badge status-disconnected';
        text.textContent = 'Disconnected';
      }
    }

    setInterval(checkHealth, 10000);
  </script>
</body>
</html>`;
  }
}
