import { describe, it, expect, vi } from 'vitest';
import { WorkspaceHeader, renderWorkspaceHeader } from '../WorkspaceHeader.js';
import { ApplicationShell, renderApplicationShell } from '../ApplicationShell.js';

describe('1.4 Components — WorkspaceHeader & ApplicationShell', () => {
  describe('WorkspaceHeader', () => {
    it('Should render current workspace title and server connection status badge', () => {
      const html = renderWorkspaceHeader({
        workspaceName: 'my-project-repo',
        isConnected: true,
        theme: 'light',
      });

      expect(html).toContain('my-project-repo');
      expect(html).toMatch(/connection-badge|status-badge/);
      expect(html).toContain('Connected');
    });

    it('Should render default workspace title when none is provided', () => {
      const html = renderWorkspaceHeader({
        isConnected: true,
        theme: 'light',
      });

      expect(html).toContain('Harness Kit');
    });

    it('Should render theme toggle button with aria-label="Toggle theme"', () => {
      const html = renderWorkspaceHeader({
        theme: 'light',
      });

      expect(html).toContain('aria-label="Toggle theme"');
      expect(html).toMatch(/theme-toggle/);
    });

    it('Should display moon icon in light mode and sun icon in dark mode', () => {
      const htmlLight = renderWorkspaceHeader({ theme: 'light' });
      expect(htmlLight).toMatch(/🌙|moon/i);

      const htmlDark = renderWorkspaceHeader({ theme: 'dark' });
      expect(htmlDark).toMatch(/☀️|sun/i);
    });

    it('Should render mobile hamburger menu button with accessible label', () => {
      const html = renderWorkspaceHeader({
        theme: 'light',
      });

      expect(html).toMatch(/hamburger-btn|sidebar-toggle/);
      expect(html).toContain('aria-label="Toggle navigation"');
    });
  });

  describe('ApplicationShell', () => {
    it('Should render top-level layout with header, responsive sidebar, and main content slot', () => {
      const html = renderApplicationShell({
        workspaceName: 'harness-kit-demo',
        theme: 'dark',
        isSidebarOpen: true,
        currentPath: '/run',
        content: '<div class="view-run">Run View Content</div>',
      });

      expect(html).toContain('data-theme="dark"');
      expect(html).toContain('app-shell');
      expect(html).toContain('workspace-header');
      expect(html).toContain('sidebar');
      expect(html).toContain('Run View Content');
    });

    it('Should apply sticky header styling and structural layout classes', () => {
      const html = renderApplicationShell({
        theme: 'light',
        content: '<p>Body</p>',
      });

      expect(html).toContain('header-sticky');
      expect(html).toContain('main-content');
    });
  });
});
