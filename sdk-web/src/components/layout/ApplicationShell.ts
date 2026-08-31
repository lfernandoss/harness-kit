import { ThemeMode } from '../../types/index.js';
import { renderWorkspaceHeader } from './WorkspaceHeader.js';
import { renderResponsiveSidebar } from './ResponsiveSidebar.js';

export interface ApplicationShellProps {
  workspaceName?: string;
  theme?: ThemeMode;
  isConnected?: boolean;
  isSidebarOpen?: boolean;
  currentPath?: string;
  content?: string;
}

export function renderApplicationShell(props: ApplicationShellProps): string {
  const currentTheme = props.theme || 'light';
  const headerHtml = renderWorkspaceHeader({
    workspaceName: props.workspaceName,
    isConnected: props.isConnected,
    theme: currentTheme,
  });

  const sidebarHtml = renderResponsiveSidebar({
    isOpen: props.isSidebarOpen ?? true,
    currentPath: props.currentPath || '/',
  });

  const innerContent = props.content || '<div class="view-container"></div>';

  return `
<div class="app-shell" data-theme="${currentTheme}">
  ${headerHtml}
  <div class="app-body">
    ${sidebarHtml}
    <main class="main-content app-content">
      ${innerContent}
    </main>
  </div>
</div>
`.trim();
}

export const ApplicationShell = renderApplicationShell;
