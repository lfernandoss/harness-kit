import { ThemeMode } from '../../types/index.js';

export interface WorkspaceHeaderProps {
  workspaceName?: string;
  isConnected?: boolean;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
}

export function renderWorkspaceHeader(props: WorkspaceHeaderProps): string {
  const workspaceTitle = props.workspaceName || 'Harness Kit';
  const isConnected = props.isConnected !== false;
  const currentTheme = props.theme || 'light';
  const themeIcon = currentTheme === 'light' ? '🌙' : '☀️';

  return `
<header class="workspace-header header-sticky">
  <div class="header-left">
    <button class="hamburger-btn sidebar-toggle" aria-label="Toggle navigation" type="button">
      <span class="hamburger-icon">☰</span>
    </button>
    <div class="workspace-info">
      <span class="workspace-title">${workspaceTitle}</span>
      <span class="connection-badge status-badge ${isConnected ? 'status-connected' : 'status-disconnected'}">
        ${isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  </div>
  <div class="header-right">
    <button class="theme-toggle-btn theme-toggle" aria-label="Toggle theme" type="button">
      <span class="theme-icon">${themeIcon}</span>
    </button>
  </div>
</header>
`.trim();
}

export const WorkspaceHeader = renderWorkspaceHeader;
