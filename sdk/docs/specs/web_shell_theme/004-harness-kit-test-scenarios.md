# Test Scenarios — harness-kit

**Domain:** web_shell_theme
**Project:** harness-kit
**Framework:** Vitest
**Date:** 2026-08-25

## Section 1 — Unit Tests

### 1.1 Styles and Token Contrast

**Itaú Design Tokens & WCAG AA Contrast:**
- [ ] Should define `--color-primary` as `#EC7000` (Itaú Orange) and `--color-secondary` as `#003399` (Itaú Navy) in light mode
- [ ] Should calculate contrast ratio ≥ 4.5:1 between `--text-primary` and `--bg-surface` in light mode (`#121212` on `#FFFFFF`)
- [ ] Should calculate contrast ratio ≥ 4.5:1 between `--text-primary` and `--bg-surface` in dark mode (`#F4F5F7` on `#1E1E1E`)
- [ ] Should calculate contrast ratio ≥ 4.5:1 between primary button text and background in both light and dark themes
- [ ] Should define calibrated dark mode surface hierarchy (`#121212` canvas, `#1E1E1E` card surface, `#2D2D2D` elevated surface)

### 1.2 Value Objects and Types

**ThemeMode Validation:**
- [ ] Should validate `'light'` and `'dark'` as valid `ThemeMode` instances
- [ ] Should reject unknown string values (e.g., `'dim'`, `'sepia'`) as invalid `ThemeMode`

**NavigationItem Contract:**
- [ ] Should construct immutable `NavigationItem` with mandatory `id`, `label`, and `path`
- [ ] Should preserve optional `badge` and `icon` properties without mutation

**ServerHostConfig Validation:**
- [ ] Should validate `ServerHostConfig` when `host === '127.0.0.1'`, `port > 0`, and `staticDir` is non-empty
- [ ] Should reject `ServerHostConfig` when `host` is set to external binding (e.g., `0.0.0.0`)

### 1.3 Hooks and State Services

**ThemeManager & useTheme:**
- [ ] Should return `'light'` as default theme when `localStorage` has no stored preference and OS prefers light
- [ ] Should return `'dark'` when `localStorage` has no stored preference and OS prefers dark (`prefers-color-scheme: dark`)
- [ ] Should transition from `'light'` to `'dark'` upon `toggleTheme()` invocation
- [ ] Should set `document.documentElement.dataset.theme` immediately upon theme change
- [ ] Should persist updated theme to `localStorage` under key `'harness_theme'`
- [ ] Should handle `localStorage` access errors gracefully (e.g., in private browsing mode) without throwing unhandled exceptions

**useResponsiveSidebar:**
- [ ] Should initialize sidebar as expanded (`isOpen = true`) on viewport widths ≥ 768px
- [ ] Should initialize sidebar as collapsed (`isOpen = false`) on viewport widths < 768px
- [ ] Should toggle `isOpen` state when `toggle()` is called
- [ ] Should set `isOpen = false` when `close()` is called

### 1.4 Components

**WorkspaceHeader:**
- [ ] Should render current workspace title and server connection status badge
- [ ] Should render theme toggle button with `aria-label="Toggle theme"`
- [ ] Should display moon icon in light mode and sun icon in dark mode
- [ ] Should invoke `toggleTheme()` when theme button is clicked
- [ ] Should render mobile hamburger menu button visible only on viewport < 768px

**ResponsiveSidebar:**
- [ ] Should render navigation links for `/run`, `/settings`, `/reports`, `/diagnose`, and `/candidates`
- [ ] Should apply active CSS class and `aria-current="page"` to the currently matched route
- [ ] Should apply collapsed CSS class when `isOpen` is `false`
- [ ] Should trigger `onClose` callback when overlay backdrop is clicked on mobile viewport

---

## Section 2 — Integration Tests

### 2.1 Theme Persistence and Storage Synchronization

- [ ] Should synchronize theme state across tabs when `StorageEvent` for key `'harness_theme'` is emitted on `window`
- [ ] Should update `document.documentElement.dataset.theme` when external tab changes theme from `'light'` to `'dark'`
- [ ] Should ignore `StorageEvent` mutations for unrelated keys

### 2.2 Web Server Host and Static File Delivery

**Static File Serving:**
- [ ] Should serve `index.html` with `Content-Type: text/html; charset=utf-8` on root path `/`
- [ ] Should serve static JS, CSS, and SVG assets with correct MIME types (`application/javascript`, `text/css`, `image/svg+xml`)
- [ ] Should return `/health` endpoint with status 200 and JSON payload `{"status":"ok"}`

**SPA Fallback Routing:**
- [ ] Should return `index.html` with status 200 for non-file route requests (e.g., `/run`, `/settings`, `/reports`)
- [ ] Should return 404 for missing static asset paths containing file extensions (e.g., `/assets/missing.js`)

**Localhost Binding & Port Fallback:**
- [ ] Should bind strictly to `127.0.0.1` and refuse connections from external network interfaces
- [ ] Should attempt alternative port (e.g., 3001) if port 3000 is occupied and return bound address

### 2.3 Responsive Navigation and Route Transitions

- [ ] Should update URL and render matching view component when sidebar navigation link is clicked
- [ ] Should close mobile overlay drawer automatically upon route selection without page reload

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

- [ ] **Should load application shell with persistent theme and responsive navigation on first visit**
  - Given: A browser client opens `http://127.0.0.1:3000` with no prior stored theme preference
  - When: The HTML shell and React application mount
  - Then: Page renders `WorkspaceHeader`, `ResponsiveSidebar`, and view container with Itaú light theme tokens applied (`data-theme="light"`) and contrast ≥ 4.5:1

- [ ] **Should toggle and persist dark theme mode across session reloads**
  - Given: Application is open in light mode
  - When: User clicks the theme toggle button in `WorkspaceHeader`
  - Then: `document.documentElement` receives `data-theme="dark"`, dark surface variables are applied, and `localStorage.getItem('harness_theme')` equals `'dark'`

- [ ] **Should navigate between SDK views seamlessly in responsive layout**
  - Given: User is viewing `/run` on desktop viewport (width > 768px)
  - When: User clicks on `/settings` navigation link in `ResponsiveSidebar`
  - Then: URL updates to `/settings`, active styling moves to Settings link, and header persists without flickering

### 3.2 Alternative and Error Flows

- [ ] **Should fallback to default light theme when localStorage is corrupted or inaccessible**
  - Given: `localStorage.getItem('harness_theme')` contains an invalid payload (e.g., `"invalid_mode"`)
  - When: `ThemeManager` initializes
  - Then: Application falls back to `'light'` mode safely and applies valid Itaú design tokens

- [ ] **Should adapt navigation drawer on mobile viewport resize**
  - Given: User is viewing application on desktop with expanded sidebar
  - When: Browser viewport is resized below 768px
  - Then: Sidebar transitions to collapsed drawer and hamburger toggle button appears in header

### 3.3 Security & Localhost Protection Scenarios

- [ ] **Should prevent directory traversal attacks on static asset server**
  - Given: `WebServerHost` is listening on `127.0.0.1:3000`
  - When: An HTTP client sends `GET /../../etc/passwd` or `GET /..%2F..%2Fpackage.json`
  - Then: Server rejects request with HTTP 403 Forbidden or HTTP 400 Bad Request and does not leak filesystem contents

- [ ] **Should prevent remote LAN hosts from connecting to local web server**
  - Given: `WebServerHost` is started on local developer machine
  - When: Request arrives from a remote network interface IP
  - Then: Server rejects connection as socket listener is bound exclusively to `127.0.0.1`
