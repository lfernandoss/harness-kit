# HarnessKit Memory (`harness-kit-memory`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `harness-kit-memory` in `C:\Users\psn_l\projetos\harness-kit-memory` by merging `ai-memory` and `harness-kit` into a unified 100% TypeScript platform with a Web Desktop Cockpit for prompt execution, settings, and memory browsing.

**Architecture:** Monorepo with npm workspaces (`memory-engine`, `mcp-server`, `sdk`, `web-ui`). The backend combines `better-sqlite3` FTS5 storage, Git-backed wiki, MCP server, and Fastify web server. The frontend is a Vite + React + Tailwind CSS Web Desktop Cockpit.

**Tech Stack:** TypeScript (ESM, Node 20+), `better-sqlite3`, `@modelcontextprotocol/sdk`, `fastify`, `simple-git`, `react`, `vite`, `tailwindcss`, `lucide-react`, `vitest`.

## Global Constraints

- Monorepo directory: `C:\Users\psn_l\projetos\harness-kit-memory`
- 100% TypeScript codebase (no Rust binary required)
- SQLite storage using `better-sqlite3` in WAL mode with FTS5
- Web-First execution & configuration via local desktop web app (`http://localhost:49374`)
- Do not run prohibited git write commands (`git push`, `git commit`, `git checkout` on main repo)

---

### Task 1: Monorepo Scaffolding & Root Configuration

**Files:**
- Create: `C:/Users/psn_l/projetos/harness-kit-memory/package.json`
- Create: `C:/Users/psn_l/projetos/harness-kit-memory/tsconfig.base.json`
- Create: `C:/Users/psn_l/projetos/harness-kit-memory/vitest.workspace.ts`
- Create: `C:/Users/psn_l/projetos/harness-kit-memory/.gitignore`

- [ ] **Step 1: Create root directories and root package.json with npm workspaces**
- [ ] **Step 2: Create base TypeScript configuration and Vitest workspace config**

---

### Task 2: Implement `packages/memory-engine`

**Files:**
- Create: `packages/memory-engine/package.json`
- Create: `packages/memory-engine/tsconfig.json`
- Create: `packages/memory-engine/src/database/schema.ts`
- Create: `packages/memory-engine/src/database/db.ts`
- Create: `packages/memory-engine/src/wiki/git-wiki.ts`
- Create: `packages/memory-engine/src/search/hybrid-search.ts`
- Create: `packages/memory-engine/src/search/entity-extractor.ts`
- Create: `packages/memory-engine/src/llm/providers.ts`
- Create: `packages/memory-engine/src/llm/consolidator.ts`
- Create: `packages/memory-engine/src/index.ts`

- [ ] **Step 1: Implement SQLite schema and database manager (`better-sqlite3`) with WAL mode and FTS5 tables**
- [ ] **Step 2: Implement Git-backed Wiki Manager for markdown persistence and frontmatter handling**
- [ ] **Step 3: Implement Hybrid Search engine (FTS5 BM25 + Entity RRF + Graph links + Authority weight)**
- [ ] **Step 4: Implement LLM Provider adapters (Anthropic, OpenAI, Gemini, Ollama) and Session Consolidator**
- [ ] **Step 5: Export public interface from `packages/memory-engine/src/index.ts`**

---

### Task 3: Implement `packages/mcp-server` & Lifecycle Hooks Router

**Files:**
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/tsconfig.json`
- Create: `packages/mcp-server/src/mcp/tools.ts`
- Create: `packages/mcp-server/src/mcp/server.ts`
- Create: `packages/mcp-server/src/hooks/router.ts`
- Create: `packages/mcp-server/src/hooks/installers.ts`
- Create: `packages/mcp-server/src/api/routes.ts`
- Create: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: Implement MCP Server tools (`memory_query`, `memory_write_page`, `memory_handoff_accept`, `memory_feedback`, `memory_lint`, `memory_auto_improve`, `harness_orchestrate`)**
- [ ] **Step 2: Implement Lifecycle Hooks Router and background observation spooler**
- [ ] **Step 3: Implement 1-Click Agent Setup installers (Claude Code, Antigravity, Cursor, Codex, Gemini CLI, etc.)**
- [ ] **Step 4: Implement REST and WebSocket/SSE endpoints for web communication**
- [ ] **Step 5: Export public interface from `packages/mcp-server/src/index.ts`**

---

### Task 4: Implement `packages/sdk` & Upgraded Prompt Skills

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/src/orchestrator/autonomous-orchestrator.ts`
- Create: `packages/sdk/src/orchestrator/state-machine.ts`
- Create: `packages/sdk/src/tdd/tdd-runner.ts`
- Create: `packages/sdk/src/validation/quality-gates.ts`
- Create: `packages/sdk/src/telemetry/meta-harness-tracer.ts`
- Create: `packages/sdk/src/cli/index.ts`
- Create: `packages/sdk/src/index.ts`
- Copy & update: `skills/` and `agents/` directories in `harness-kit-memory`

- [ ] **Step 1: Implement event-driven Autonomous Orchestrator and state machine**
- [ ] **Step 2: Implement TDD loop runner and gotcha recording**
- [ ] **Step 3: Implement Socratic Review (Grumpy Tech Lead) and Adversarial QA validation gates**
- [ ] **Step 4: Implement Meta-Harness telemetry tracer and evaluator**
- [ ] **Step 5: Copy and enrich all HarnessKit skills and subagent definitions**

---

### Task 5: Implement `packages/web-ui` (Web Desktop Cockpit)

**Files:**
- Create: `packages/web-ui/package.json`
- Create: `packages/web-ui/vite.config.ts`
- Create: `packages/web-ui/index.html`
- Create: `packages/web-ui/src/App.tsx`
- Create: `packages/web-ui/src/components/Navigation.tsx`
- Create: `packages/web-ui/src/components/ExecutionStudio.tsx`
- Create: `packages/web-ui/src/components/SettingsManager.tsx`
- Create: `packages/web-ui/src/components/WikiExplorer.tsx`
- Create: `packages/web-ui/src/components/KnowledgeGraph.tsx`
- Create: `packages/web-ui/src/components/MetaHarnessCockpit.tsx`
- Create: `packages/web-ui/src/server.ts`

- [ ] **Step 1: Set up Vite + React + Tailwind CSS client application**
- [ ] **Step 2: Build Interactive Execution Studio (Prompt triggers, live streaming, emergency brake)**
- [ ] **Step 3: Build 1-Click Agent Settings & Provider Manager**
- [ ] **Step 4: Build Wiki Explorer (Markdown renderer) and Interactive 2D Knowledge Graph**
- [ ] **Step 5: Build Meta-Harness & Handoff Cockpit**
- [ ] **Step 6: Integrate Fastify server to serve the SPA and API on `http://localhost:49374`**

---

### Task 6: Build, Verification & Documentation

**Files:**
- Create: `C:/Users/psn_l/projetos/harness-kit-memory/README.md`
- Create: `C:/Users/psn_l/projetos/harness-kit-memory/docs/DESKTOP-COCKPIT.md`

- [ ] **Step 1: Install dependencies and compile all workspace packages**
- [ ] **Step 2: Run verification test suite across packages**
- [ ] **Step 3: Verify server startup and Web Desktop Cockpit endpoint**
- [ ] **Step 4: Write comprehensive README and usage documentation**
