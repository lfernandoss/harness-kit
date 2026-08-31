# Tactical Design — harness-kit

**Domain:** web_shell_theme | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `ItauThemeTokens` | Styles / Design Tokens | CSS custom properties on `:root` and `[data-theme='dark']`; enforces WCAG AA 4.5:1 contrast | *see snippet below* |
| `ApplicationShell` | Component / App Frame | Top-level layout with header, responsive sidebar, and main `<Outlet />` slot | *see snippet below* |
| `WorkspaceHeader` | Component / Header | Displays workspace info, connection badge, theme toggle button, and hamburger toggle | *see snippet below* |
| `ResponsiveSidebar` | Component / Navigation | Renders primary routes; auto-collapses on viewports < 768px into an overlay drawer | *see snippet below* |
| `ThemeManager` | Integration / State Service | Manages theme mode state, `localStorage` persistence, and `data-theme` attribute updates | *see snippet below* |
| `WebServerHost` | Host / Inbound Adapter | Binds strictly to `127.0.0.1`; serves static SPA assets with HTML5 fallback to `index.html` | *see snippet below* |

```css
:root { --itau-orange: #EC7000; --itau-navy: #003399; --bg-surface: #FFFFFF; --text-primary: #121212; }
[data-theme='dark'] { --bg-surface: #1E1E1E; --text-primary: #F4F5F7; --color-primary: #FF851A; }
// Design tokens mapped to semantic variables for WCAG AA compliance
```

```typescript
const ApplicationShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme(); const { isOpen, toggle } = useResponsiveSidebar();
  return <div className="app-shell" data-theme={theme}><WorkspaceHeader /><ResponsiveSidebar isOpen={isOpen} />{children}</div>;
};
```

```typescript
const WorkspaceHeader: React.FC<{ workspaceName?: string }> = ({ workspaceName }) => {
  const { theme, toggleTheme } = useTheme();
  return <header className="workspace-header"><span>{workspaceName}</span><button aria-label="Toggle theme" onClick={toggleTheme}>{theme}</button></header>;
};
```

```typescript
const ResponsiveSidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}><nav><NavLink to="/run">Run</NavLink></nav></aside>;
};
```

```typescript
class ThemeManager {
  static getInitialTheme(): ThemeMode { return (localStorage.getItem('harness_theme') as ThemeMode) || 'light'; }
  static applyTheme(mode: ThemeMode): void { document.documentElement.dataset.theme = mode; localStorage.setItem('harness_theme', mode); }
}
```

```typescript
class WebServerHost {
  constructor(private readonly config: ServerHostConfig) {}
  async start(): Promise<string> { /* binds 127.0.0.1, serves staticDir + fallback */ return `http://${this.config.host}:${this.config.port}`; }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `ThemeMode` | Domain / Value Object | Strict union: `'light' \| 'dark'` | *see snippet below* |
| `NavigationItem` | Component / Contract | Immutable link descriptor: `{ id, label, path, icon, badge? }` | *see snippet below* |
| `ServerHostConfig` | Host / DTO Contract | Validates `port > 0`, `host === '127.0.0.1'`, and `staticDir` exists | *see snippet below* |
| `ThemeContextValue` | Integration / State Contract | State interface: `{ theme, toggleTheme, setTheme }` | *see snippet below* |
| `ContrastRatioResult` | Styles / VO Contract | `{ ratio: number, passesAA: boolean, fgColor: string, bgColor: string }` | *see snippet below* |

```typescript
type ThemeMode = 'light' | 'dark';
const isThemeMode = (val: unknown): val is ThemeMode => val === 'light' || val === 'dark';
```

```typescript
interface NavigationItem {
  readonly id: string; readonly label: string; readonly path: string;
  readonly icon: string; readonly badge?: string;
}
```

```typescript
interface ServerHostConfig {
  readonly port: number; readonly host: string; // strictly 127.0.0.1
  readonly staticDir: string; readonly fallbackFile: string;
}
```

```typescript
interface ThemeContextValue {
  readonly theme: ThemeMode; toggleTheme(): void;
  setTheme(mode: ThemeMode): void;
}
```

```typescript
interface ContrastRatioResult {
  readonly ratio: number; readonly passesAA: boolean; // ratio >= 4.5
  readonly fgColor: string; readonly bgColor: string;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `useTheme` | Provides current `ThemeMode` and toggle handlers | `ThemeContext`, `localStorage`, `document.documentElement` | *see snippet below* |
| `useResponsiveSidebar` | Manages sidebar expanded/collapsed state and viewport resize | `window.matchMedia('(min-width: 768px)')` | *see snippet below* |
| `serveStaticWithFallback` | Serves static assets preventing directory traversal, with SPA fallback | Node HTTP stream, MIME resolver, `fs` | *see snippet below* |
| `validateThemeContrast` | Verifies relative luminance and contrast ratio between token pairs | Color math utility, CSS token definitions | *see snippet below* |

```typescript
function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

```typescript
function useResponsiveSidebar(): { isOpen: boolean; toggle(): void; close(): void } {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, toggle: () => setIsOpen(prev => !prev), close: () => setIsOpen(false) };
}
```

```typescript
async function serveStaticWithFallback(reqPath: string, config: ServerHostConfig): Promise<{ status: number; filePath: string; contentType: string }> {
  // checks path traversal, maps extension to MIME, returns fallbackFile on 404
  return { status: 200, filePath: targetPath, contentType: resolvedMime };
}
```

```typescript
function validateThemeContrast(fgHex: string, bgHex: string): ContrastRatioResult {
  const ratio = computeContrastRatio(fgHex, bgHex);
  return { ratio, passesAA: ratio >= 4.5, fgColor: fgHex, bgColor: bgHex };
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `ThemeChanged` | User clicks theme toggle or `setTheme()` is called | `{ previousTheme: ThemeMode, currentTheme: ThemeMode, timestamp: number }` | `document.documentElement`, `localStorage`, UI Components |
| `StorageThemeSynced` | `StorageEvent` fired when theme changes in another browser tab | `{ newTheme: ThemeMode }` | `ThemeManager`, `useTheme` |
| `SidebarToggled` | User toggles hamburger button or viewport crosses 768px breakpoint | `{ isOpen: boolean, source: 'user' \| 'breakpoint' }` | `ResponsiveSidebar`, `ApplicationShell` |
| `ServerHostListening` | Web server finishes binding to port on `127.0.0.1` | `{ host: string, port: number, url: string }` | Host Lifecycle Manager, CLI Console |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `IThemeStorageAdapter` | `getTheme()`, `setTheme(mode)` | `ThemeMode \| null`, `void` |
| `IWebServerHost` | `start()`, `stop()`, `getAddress()` | `Promise<string>`, `Promise<void>`, `string` |

```typescript
interface IThemeStorageAdapter {
  getTheme(): ThemeMode | null;
  setTheme(mode: ThemeMode): void;
}
```

```typescript
interface IWebServerHost {
  start(): Promise<string>; stop(): Promise<void>;
  getAddress(): string;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Setup Itaú Design Tokens and Theme Switcher Infrastructure",
    "description": "Defines CSS custom properties for Itaú Unibanco light and dark themes with automated WCAG AA contrast validation.",
    "scope": [
      "sdk-web/src/styles/theme.tokens.css",
      "sdk-web/src/styles/__tests__/contrast.spec.ts"
    ],
    "acceptance": [
      "Defines semantic tokens for Itaú orange (#EC7000), navy (#003399), and calibrated dark mode surfaces",
      "Passes WCAG AA minimum 4.5:1 contrast ratio verification across all text and surface color pairings"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement ThemeManager and useTheme Hook with Cross-Tab Sync",
    "description": "Creates theme context and hook managing light/dark mode transitions, localStorage persistence, and cross-tab storage sync.",
    "scope": [
      "sdk-web/src/context/ThemeContext.tsx",
      "sdk-web/src/hooks/useTheme.ts",
      "sdk-web/src/hooks/__tests__/useTheme.spec.ts"
    ],
    "acceptance": [
      "Toggles theme mode between light and dark, persisting selection to localStorage under key harness_theme",
      "Synchronizes theme updates across multiple open browser tabs via window storage event listener",
      "Applies data-theme attribute to document.documentElement without layout shift"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Responsive ApplicationShell and WorkspaceHeader Components",
    "description": "Builds top-level app frame containing fixed header with workspace metadata, connection badge, and theme toggle control.",
    "scope": [
      "sdk-web/src/components/layout/ApplicationShell.tsx",
      "sdk-web/src/components/layout/WorkspaceHeader.tsx",
      "sdk-web/src/components/layout/__tests__/WorkspaceHeader.spec.ts"
    ],
    "acceptance": [
      "Renders workspace title, connection badge, and accessible theme toggle button with proper ARIA attributes",
      "Maintains sticky header position while child view content scrolls in main slot",
      "Dispatches sidebar toggle events to responsive drawer state manager"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement ResponsiveSidebar Navigation and Route Frame",
    "description": "Implements responsive sidebar drawer supporting desktop expansion and mobile collapsible drawer with routing items for SDK views.",
    "scope": [
      "sdk-web/src/components/layout/ResponsiveSidebar.tsx",
      "sdk-web/src/hooks/useResponsiveSidebar.ts",
      "sdk-web/src/components/layout/__tests__/ResponsiveSidebar.spec.ts"
    ],
    "acceptance": [
      "Renders navigation links for /run, /settings, /reports, /diagnose, and /candidates with active state highlighting",
      "Automatically collapses sidebar below 768px viewport width and opens as an overlay drawer with backdrop",
      "Closes overlay drawer upon navigation link selection or backdrop click"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Web Server Host with SPA Fallback and Localhost Security",
    "description": "Builds local HTTP server in sdk-web that binds to 127.0.0.1, serves precompiled static SPA assets, and handles SPA fallback routing.",
    "scope": [
      "sdk-web/src/server/WebServerHost.ts",
      "sdk-web/src/server/StaticAssetServer.ts",
      "sdk-web/src/server/__tests__/WebServerHost.spec.ts"
    ],
    "acceptance": [
      "Binds strictly to 127.0.0.1 and handles dynamic port fallback if default port is in use",
      "Serves static assets with correct MIME types and prevents directory traversal attacks outside static root",
      "Returns index.html with status 200 for HTML5 history client-side routes and provides /health endpoint"
    ],
    "depends_on": "04"
  }
]
```
