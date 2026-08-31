import { NavigationItem, createNavigationItem } from '../../types/index.js';

export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  createNavigationItem({ id: 'nav-run', label: 'Run', path: '/run', icon: 'play' }),
  createNavigationItem({ id: 'nav-settings', label: 'Settings', path: '/settings', icon: 'settings' }),
  createNavigationItem({ id: 'nav-reports', label: 'Reports', path: '/reports', icon: 'file-text' }),
  createNavigationItem({ id: 'nav-diagnose', label: 'Diagnose', path: '/diagnose', icon: 'activity' }),
  createNavigationItem({ id: 'nav-candidates', label: 'Candidates', path: '/candidates', icon: 'sparkles' }),
];

export interface ResponsiveSidebarProps {
  isOpen: boolean;
  currentPath?: string;
  isMobile?: boolean;
  items?: NavigationItem[];
  onClose?: () => void;
  onNavigate?: (path: string) => void;
}

export function renderResponsiveSidebar(props: ResponsiveSidebarProps): string {
  const { isOpen, currentPath = '/', isMobile = false, items = DEFAULT_NAV_ITEMS } = props;
  const stateClass = isOpen ? 'open' : 'collapsed';

  const navLinks = items
    .map((item) => {
      const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
      const activeClass = isActive ? 'active' : '';
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      const badgeHtml = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';

      return `
      <li class="nav-item">
        <a href="${item.path}" class="nav-link ${activeClass}"${ariaCurrent} data-route="${item.path}">
          <span class="nav-icon nav-icon-${item.icon}"></span>
          <span class="nav-label">${item.label}</span>
          ${badgeHtml}
        </a>
      </li>
      `.trim();
    })
    .join('\n');

  const backdropHtml = isMobile && isOpen ? '<div class="sidebar-backdrop" aria-hidden="true"></div>' : '';

  return `
${backdropHtml}
<aside class="sidebar ${stateClass}" aria-label="Main Navigation">
  <nav class="sidebar-nav">
    <ul class="nav-list">
      ${navLinks}
    </ul>
  </nav>
</aside>
`.trim();
}

export const ResponsiveSidebar = renderResponsiveSidebar;
