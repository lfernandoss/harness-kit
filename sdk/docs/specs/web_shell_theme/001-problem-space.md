# Strategic Design — Problem Space: Web Server Host and Application Shell

**Domain:** web_shell_theme | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event (past tense) | Command (trigger) | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `WebServerHostStarted` | `StartWebServerHost` | `WebServerHost` | Node.js HTTP / OS Sockets | Host Runtime Info |
| 2 | `StaticSpaAssetsServed` | `RequestStaticRoute` | `StaticAssetServer` | Browser HTTP Client | Rendered HTML Shell |
| 3 | `ThemePreferenceInitialized` | `InitializeTheme` | `ThemeManager` | LocalStorage / OS Media Query | Active Theme Token Set |
| 4 | `ThemeModeToggled` | `ToggleThemeMode` | `ThemeManager` | LocalStorage / DOM Root | Applied CSS Custom Properties |
| 5 | `NavigationRouteSelected` | `SelectNavigationRoute` | `NavigationShell` | Browser History API | Active View Layout |
| 6 | `ResponsiveSidebarToggled` | `ToggleSidebarState` | `NavigationShell` | Viewport Media Engine | Sidebar View State |
| 7 | `WebServerHostShutdown` | `ShutdownWebServerHost` | `WebServerHost` | OS Process (SIGINT/SIGTERM) | Server Shutdown Status |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Itaú Brand Theme & Token System** | Core | Core visual identity differentiator: WCAG AA compliant Itaú palette (orange/navy/graphite), dark/light token mapping, and FOUC prevention. |
| **Application Shell & Responsive Navigation** | Core | Structural layout, responsive viewport adaptation, and route shell coordination for all web views. |
| **Local Web Server Host** | Supporting | Localhost static asset serving, SPA fallback routing, and graceful HTTP lifecycle on `127.0.0.1`. |
| **Browser Preference Persistence** | Generic | Commodity `localStorage` and `matchMedia` adapter for user theme preference persistence. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `WebServerHost` | Embedded HTTP server daemon hosting the precompiled SPA and static assets on localhost. | Binds strictly to `127.0.0.1`. |
| `ApplicationShell` | Top-level React layout container providing persistent header, responsive sidebar, and main view slot. | Frame only; does not hold feature state. |
| `ItauThemeTokens` | Structured CSS custom properties encoding Itaú Unibanco brand identity (Orange `#EC7000`, Navy `#003399`, Grafites). | Must satisfy WCAG AA 4.5:1 contrast. |
| `ThemeMode` | Discrete visual display mode (`light` or `dark`) governing the active token set. | Stored in `localStorage` as `'light'` \| `'dark'`. |
| `ThemeManager` | Client-side domain service managing theme state, system preference detection (`prefers-color-scheme`), and persistence. | Single source of truth for theme state. |
| `ThemeToggle` | Interactive accessible UI control triggering instantaneous theme mode transitions. | Accessible button with ARIA labels. |
| `NavigationShell` | Layout component managing primary sidebar routes (`/run`, `/settings`, `/reports`, `/diagnose`, `/candidates`). | Declarative navigation router shell. |
| `ResponsiveSidebar` | Adaptive navigation drawer that expands on desktop and collapses into an overlay drawer on mobile viewports. | Breakpoint at 768px (`md`). |
| `ContrastRatioCompliance` | WCAG AA requirement enforcing ≥ 4.5:1 text/background contrast across both light and dark themes. | Enforced via automated CSS token tests. |
| `SpaFallbackHandler` | Web server route handler returning `index.html` for client-side HTML5 history navigation requests. | Handles 404s on static files appropriately. |
| `FoucMitigation` | Script execution strategy applying theme CSS classes prior to DOM paint to eliminate visual flashing. | Inline script in `index.html` `<head>`. |
| `WorkspaceHeader` | Top banner displaying active workspace directory, connection status, and theme toggle controls. | Anchored at top of Application Shell. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `ThemeManager` guarantee that theme tokens never fall back to an unstyled state when `localStorage` is disabled or corrupted?
- How is WCAG AA 4.5:1 contrast guaranteed across all interactive states (hover, focus-visible, active, disabled) in both light and dark modes?

**Scalability and Performance**
- How does the `WebServerHost` serve static bundles efficiently without memory leaks or file handle exhaustion during rapid client reloads?
- How does the SPA shell prevent layout shifts (CLS) and flash of unstyled content (FOUC) during initial page load and hydration?

**Security and Sensitive Data**
- Why must the `WebServerHost` bind strictly to `127.0.0.1` (localhost) rather than `0.0.0.0`, preventing LAN or external network access to local development assets?
- How does the static asset server prevent directory traversal attacks (e.g., `../../etc/passwd` or accessing parent `.env` files)?

**Concurrency and Failures**
- How does `WebServerHost` handle port collision when default port `3000` is already in use by another process on the developer's machine?
- How are concurrent browser tabs synchronized when theme mode is changed in one tab (via `StorageEvent` listener)?

**Responsibility Boundaries Between Layers**
- How is the `ApplicationShell` decoupled from feature view business logic so that adding or removing SDK subcommands does not alter the core navigation architecture?

---

**Architecture Tip:** Implement theme switching purely through CSS Custom Properties on `:root` / `[data-theme]` attributes with zero JavaScript rerenders of child components.
