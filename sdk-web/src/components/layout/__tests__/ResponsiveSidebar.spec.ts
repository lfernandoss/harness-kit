import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NavigationItem, createNavigationItem } from '../../../types/index.js';
import { useResponsiveSidebar, SidebarStateManager } from '../../../hooks/useResponsiveSidebar.js';
import { ResponsiveSidebar, renderResponsiveSidebar, DEFAULT_NAV_ITEMS } from '../ResponsiveSidebar.js';

describe('1.2 NavigationItem Contract & 1.4 ResponsiveSidebar', () => {
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('NavigationItem Contract', () => {
    it('Should construct immutable NavigationItem with mandatory id, label, and path', () => {
      const item = createNavigationItem({
        id: 'nav-run',
        label: 'Run',
        path: '/run',
        icon: 'play',
      });

      expect(item.id).toBe('nav-run');
      expect(item.label).toBe('Run');
      expect(item.path).toBe('/run');
      expect(item.icon).toBe('play');
      expect(Object.isFrozen(item)).toBe(true);
    });

    it('Should preserve optional badge property without mutation', () => {
      const item = createNavigationItem({
        id: 'nav-candidates',
        label: 'Candidates',
        path: '/candidates',
        icon: 'sparkles',
        badge: '3 new',
      });

      expect(item.badge).toBe('3 new');
    });

    it('Should throw when creating invalid NavigationItem', () => {
      expect(() => createNavigationItem({ id: '', label: 'L', path: '/p', icon: 'i' })).toThrow(/id/i);
      expect(() => createNavigationItem({ id: 'id', label: '', path: '/p', icon: 'i' })).toThrow(/label/i);
      expect(() => createNavigationItem({ id: 'id', label: 'L', path: '', icon: 'i' })).toThrow(/path/i);
    });
  });

  describe('1.3 useResponsiveSidebar & SidebarStateManager', () => {
    it('Should support useResponsiveSidebar hook', () => {
      const hook = useResponsiveSidebar();
      expect(typeof hook.isOpen).toBe('boolean');

      hook.open();
      expect(hook.isOpen).toBe(true);

      hook.close();
      expect(hook.isOpen).toBe(false);

      hook.toggle();
      expect(hook.isOpen).toBe(true);
    });
    it('Should initialize sidebar as expanded (isOpen = true) on viewport widths >= 768px', () => {
      (global as any).window = {
        innerWidth: 1024,
        matchMedia: vi.fn((query: string) => ({
          matches: query.includes('min-width: 768px'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const manager = new SidebarStateManager();
      expect(manager.isOpen).toBe(true);
    });

    it('Should initialize sidebar as collapsed (isOpen = false) on viewport widths < 768px', () => {
      (global as any).window = {
        innerWidth: 480,
        matchMedia: vi.fn(() => ({
          matches: false,
          media: '(min-width: 768px)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const manager = new SidebarStateManager();
      expect(manager.isOpen).toBe(false);
    });

    it('Should toggle isOpen state when toggle() is called', () => {
      const manager = new SidebarStateManager(false);
      expect(manager.isOpen).toBe(false);

      manager.toggle();
      expect(manager.isOpen).toBe(true);

      manager.toggle();
      expect(manager.isOpen).toBe(false);
    });

    it('Should set isOpen = false when close() is called', () => {
      const manager = new SidebarStateManager(true);
      expect(manager.isOpen).toBe(true);

      manager.close();
      expect(manager.isOpen).toBe(false);
    });
  });

  describe('ResponsiveSidebar component rendering & interactions', () => {
    it('Should render navigation links for /run, /settings, /reports, /diagnose, and /candidates', () => {
      const html = renderResponsiveSidebar({
        isOpen: true,
        currentPath: '/run',
      });

      expect(html).toContain('href="/run"');
      expect(html).toContain('href="/settings"');
      expect(html).toContain('href="/reports"');
      expect(html).toContain('href="/diagnose"');
      expect(html).toContain('href="/candidates"');
      expect(html).toContain('Run');
      expect(html).toContain('Settings');
      expect(html).toContain('Reports');
      expect(html).toContain('Diagnose');
      expect(html).toContain('Candidates');
    });

    it('Should apply active CSS class and aria-current="page" to the currently matched route', () => {
      const html = renderResponsiveSidebar({
        isOpen: true,
        currentPath: '/settings',
      });

      expect(html).toMatch(/<a[^>]*href="\/settings"[^>]*class="[^"]*active[^"]*"[^>]*aria-current="page"/);
      expect(html).not.toMatch(/<a[^>]*href="\/run"[^>]*aria-current="page"/);
    });

    it('Should apply collapsed CSS class when isOpen is false', () => {
      const htmlCollapsed = renderResponsiveSidebar({
        isOpen: false,
        currentPath: '/run',
      });

      expect(htmlCollapsed).toContain('sidebar collapsed');
      expect(htmlCollapsed).not.toContain('sidebar open');

      const htmlOpen = renderResponsiveSidebar({
        isOpen: true,
        currentPath: '/run',
      });

      expect(htmlOpen).toContain('sidebar open');
    });

    it('Should render backdrop overlay for mobile when isOpen is true', () => {
      const html = renderResponsiveSidebar({
        isOpen: true,
        isMobile: true,
        currentPath: '/run',
      });

      expect(html).toContain('sidebar-backdrop');
    });
  });
});
