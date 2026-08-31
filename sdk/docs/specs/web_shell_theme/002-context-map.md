# Strategic Design — Context Map: Web Server Host and Application Shell

**Domain:** web_shell_theme | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **Web Server Host Context** | Manages local HTTP server lifecycle on `127.0.0.1`, serves static SPA bundle assets, and handles SPA fallback routing. | Excludes business API routing, WebSocket event handling, and agent execution. | Platform / Host Core | `WebServerHost`, `ServerConfig`, `StaticAssetServer`, `SpaFallbackHandler` |
| **Itaú Theme & Token Context** | Manages design tokens, switches between Itaú light/dark modes, enforces WCAG AA contrast, and prevents FOUC. | Excludes component UI layout and routing logic. | Design System / Frontend Core | `ThemeManager`, `ThemeMode`, `ItauThemeTokens`, `ContrastValidator` |
| **Application Shell & Navigation Context** | Coordinates top-level layout, persistent workspace status header, collapsible/responsive sidebar navigation, and view container slots. | Excludes inner domain view logic (Run, Settings, Reports, Diagnose payloads). | Frontend UX / App Shell | `ApplicationShell`, `WorkspaceHeader`, `ResponsiveSidebar`, `NavigationRoute` |
| **Browser Persistence Context** | Persists theme mode to `localStorage` and synchronizes with `prefers-color-scheme` and cross-tab `StorageEvent` mutations. | Excludes domain theme validation and CSS variable manipulation. | Frontend Platform | `ThemeStorageAdapter`, `SystemPreferenceObserver` |

## Section 2 — Context Map

```
[Application Shell Context] → [Itaú Theme & Token Context]
Pattern       : Customer-Supplier
Direction     : Downstream (App Shell) consumes Upstream (Theme Tokens)
Justification : Application shell components consume CSS variables and theme toggle hook provided by Theme Context.

[Itaú Theme & Token Context] → [Browser Persistence Context]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream (Theme Context) wraps browser APIs
Justification : Protects theme domain model from missing/corrupted localStorage or unsupported media query engines.

[Web Server Host Context] → [Application Shell Context]
Pattern       : Open Host Service (Static Bundle Delivery)
Direction     : Upstream (Server) serves static bundle assets to Downstream (Browser Client)
Justification : Server hosts precompiled static bundle and HTML5 fallback without runtime code coupling to React components.

[Application Shell Context] → [Feature Views (External)]
Pattern       : Open Host Service / Published Language
Direction     : Upstream (Shell) provides routing frame and layout slots to Downstream (Feature Views)
Justification : Feature views mount into shell slots conforming to standard navigation route contracts.
```

## Section 3 — Core Domain Highlight

```
Context   : Itaú Theme & Token Context + Application Shell Context
Reason    : Provides the distinctive Itaú Unibanco corporate visual identity (Orange/Navy), dark mode adaptation, WCAG AA compliance, and responsive shell for all SDK interactions.
Investment: Dedicated design token architecture, automated contrast verification tests, responsive drawer transitions, and zero-FOUC initialization.
```

## Section 4 — Architectural Decisions

### ADR-01: CSS Custom Properties & Semantic Token Architecture
- **Decision:** Use CSS Custom Properties on `:root` and `[data-theme]` attributes mapping Itaú brand colors (`#EC7000`, `#003399`, `#121212`) to semantic tokens (`--color-bg-primary`, `--color-text-primary`, `--color-accent`), rather than runtime CSS-in-JS style injection.
- **Context:** Eliminates runtime JavaScript overhead, prevents theme flickering, and enables instantaneous theme switching.
- **Consequences:** Fast rendering and full separation of theme tokens from component logic; requires strict token discipline in CSS.

### ADR-02: Zero-FOUC Theme Initialization with LocalStorage Sync
- **Decision:** Inject a synchronous inline script in `index.html` `<head>` that reads `localStorage.getItem('harness_theme')` (with fallback to `window.matchMedia('(prefers-color-scheme: dark)')`) and sets `document.documentElement.dataset.theme` before first paint.
- **Context:** Prevents white flash when loading dark mode in modern browsers.
- **Consequences:** Guarantees zero flash of unstyled content; requires inline script snippet in entry HTML.

### ADR-03: Strict Localhost HTTP Server Host (`127.0.0.1`)
- **Decision:** Web server host strictly binds to `127.0.0.1` (with dynamic port selection if 3000 is occupied), serving SPA static assets with HTML5 history API fallback (`index.html`).
- **Context:** Developer tool designed for local pair programming and unattended execution without exposing endpoints to LAN or public network.
- **Consequences:** Prevents accidental external exposure; eliminates need for complex auth in initial local-only phase.

### ADR-04: View-Agnostic Responsive Shell with Route Contracts
- **Decision:** Structure `ApplicationShell` with fixed header, responsive collapsible sidebar (breakpoint 768px), and an `<Outlet />` slot accepting route declarations without importing feature components directly.
- **Context:** Allows feature views (Run, Settings, Reports, etc.) to be developed and loaded independently.
- **Consequences:** Strong architectural boundary; zero coupling between shell layout and orchestrator business logic.
