# Design Specification: HarnessKit Memory (`harness-kit-memory`) - Web Desktop Cockpit Edition

**Date:** 2026-08-21  
**Status:** Approved for Implementation  
**Type:** Architecture & System Design (Web-First / Local Desktop Cockpit)  

---

## 1. Executive Summary

`harness-kit-memory` is a unified, 100% TypeScript engineering platform that merges **HarnessKit** (DDD scope refinement, TDD orchestrator, Socratic code review, Adversarial QA, Meta-Harness self-optimization) with **ai-memory** (persistent SQLite FTS5 store, Git-backed wiki, cross-agent handoffs, and lifecycle hooks).

In this **Web-First Desktop Cockpit** edition, the primary interface for running agents, configuring settings, initiating prompts, monitoring autonomous loops, and exploring the knowledge base is a **local desktop Web Application** (`http://localhost:49374`), replacing mandatory terminal commands with an interactive, real-time visual control center.

---

## 2. Architecture & Monorepo Structure

The project is structured as an npm workspaces monorepo at `C:\Users\psn_l\projetos\harness-kit-memory`:

```text
harness-kit-memory/
├── package.json               # Root workspace config, scripts (dev, build, test)
├── tsconfig.base.json         # Base TypeScript configuration (Node 20+, ESM, strict)
├── vitest.workspace.ts        # Unified Vitest workspace runner
├── packages/
│   ├── memory-engine/         # SQLite (better-sqlite3), FTS5, Git Wiki, LLM consolidation
│   ├── mcp-server/            # Model Context Protocol (@modelcontextprotocol/sdk) & hook router
│   ├── sdk/                   # Core orchestrator engine, agent runner, TDD loop, telemetry
│   └── web-ui/                # Complete Web Desktop Cockpit (Fastify API + React/Vite + Tailwind)
├── skills/                    # Prompt skills enriched with native memory tools:
│   ├── project-memory/        # Bi-directional sync with SQLite/Git wiki & graph indexes
│   ├── scope-refinement/      # 4-phase DDD domain specs stored as canonical memory
│   ├── tdd-orchestrator/      # Red-Green-Refactor loop with automatic gotcha logging
│   ├── the-grumpy-tech-lead/  # Socratic code reviewer querying past ADRs and rules
│   ├── adversarial-qa/        # Edge-case & security prober with history awareness
│   ├── autonomous-orchestrator/# Sovereign continuous loop with automatic handoff state machine
│   └── meta-harness/          # Self-optimization loop evaluating SQLite execution traces
├── agents/                    # Subagent definitions (CTO, Backend, QA, Tech Lead, etc.)
└── docs/                      # Architectural specifications, user manuals, and ADRs
```

---

## 3. Web Desktop Cockpit Subsystem (`packages/web-ui`)

The Web UI is the **central operating system** of HarnessKit Memory. It runs on `http://localhost:49374` (with WebSocket / SSE streaming for real-time telemetry):

### 3.1. Interactive Prompt & Execution Studio
* **1-Click Skill Triggers:** Launch any HarnessKit workflow directly from the UI without terminal commands:
  * **Initialize Project Memory:** Scans repository, initializes baseline ADRs, and builds the `.graph.json` index.
  * **Scope Refinement (DDD):** Interactive multi-step wizard guiding Problem Space → Context Map → Tactical Design → Test Scenarios.
  * **Autonomous Orchestration:** Start, pause, resume, or abort autonomous feature development loops with live status stream.
  * **Socratic Review & Adversarial QA:** Run code reviews and edge-case security audits with interactive feedback cards.
* **Live Execution Stream:** Real-time visual timeline showing agent turns, active tool calls, test runs (Red/Green state), and state machine transitions (`RUNNING`, `COMPLETED`, `RETRY`, `BLOCKED`, `FAILED`).
* **Emergency Brake & Hot-Interception:** "Stop/Pause" button to halt autonomous execution instantly, and an interactive prompt box to inject new constraints or edits mid-flight.

### 3.2. Settings & Agent Integration Center
* **1-Click Agent Setup:** Automated installation of MCP server and lifecycle hooks for installed local agents:
  * Claude Code (`~/.claude.json` / hook configurations)
  * Antigravity CLI (`agy` serverUrl & hook registrations)
  * OpenAI Codex (`config.toml` / hooks)
  * Cursor (`settings.json` MCP entry)
  * Gemini CLI, Devin, Kimi Code, Kiro CLI, Zed
* **LLM & Embedding Provider Manager:** UI for configuring API keys and endpoints for Anthropic, OpenAI, Google Gemini, Voyage, and local models (Ollama / LM Studio).
* **Workspace & Project Marker Manager:** View and edit `.harness-kit.toml` markers, capture exclusion patterns, decay policies, and operator slot settings.

### 3.3. Knowledge & Memory Explorer
* **Wiki & ADR Browser:** Tree view of project pages (ADRs, feature specs, decisions, gotchas, rules) with full markdown rendering, Mermaid diagrams, and Git revision history diffs.
* **Interactive 2D Knowledge Graph:** Force-directed visual graph showing connections between ADRs, features, domain aggregates, and entity links.
* **Handoff & Workstream Viewer:** View active and historical "where you left off" handoff packets between sessions.
* **Pending Writes & Auto-Improvement Approvals:** Review, approve, or reject proposed architectural lessons and wiki edits generated by the background LLM scheduler.

### 3.4. Meta-Harness & Telemetry Cockpit
* **Performance Curves:** Visual graphs showing execution time, token consumption, rework rates, and test pass percentages across sessions.
* **Pareto Frontier Explorer:** Visualization of optimal prompt harness configurations and one-click promotion of candidate skill prompt improvements.

---

## 4. Backend Engine Architecture

### 4.1. Core Server (`packages/mcp-server` & `packages/web-ui`)
* **Fastify Web Server:** Serves the compiled React/Vite SPA and exposes REST/WebSocket APIs for execution control, settings, and wiki operations.
* **Integrated MCP Server:** Implements `@modelcontextprotocol/sdk` (HTTP/SSE & STDIO) to expose memory and orchestration tools to connected agents.
* **Lifecycle Hooks Ingestion:** Background queue that receives prompt submissions, tool calls, and session boundaries from all configured agents.

### 4.2. Memory Engine (`packages/memory-engine`)
* **SQLite (WAL mode with `better-sqlite3`):** High-speed storage with FTS5 search index, entity graph links, session turns, and execution traces.
* **Git-Backed Markdown Wiki:** Automatic atomic git commits on page writes for complete transparency and version control.
* **Hybrid Retrieval (FTS5 + Entities + Graph + Vectors):** Fast, authority-weighted context recall.
* **LLM Consolidation:** Multi-provider adapters (Anthropic, OpenAI, Gemini, Ollama) for session synthesis and auto-improvement.

### 4.3. SDK & Agent Orchestrator (`packages/sdk`)
* **Headless & Web-Controlled Runner:** Exposes programmatic APIs for running agents, executing TDD cycles, running validation gates, and tracking state machine transitions, with real-time event emitters consumed by the Web UI.

---

## 5. Implementation Phases

1. **Phase 1: Monorepo Foundation & Memory Engine Core (`packages/memory-engine`)**
   * Workspace configuration, TypeScript setup, Vitest runner.
   * SQLite database (`better-sqlite3`), FTS5 tables, Git wiki manager, and hybrid search.
2. **Phase 2: MCP Server, API & Lifecycle Hooks Router (`packages/mcp-server`)**
   * MCP protocol tools, REST API for web control, hook receivers, and agent 1-click config managers.
3. **Phase 3: SDK Orchestrator & Event-Driven Engine (`packages/sdk`, `skills/`, `agents/`)**
   * Event-driven autonomous orchestrator, TDD loop runner, validation gates, and telemetry collectors.
   * Enrichment of prompt skills with memory tools.
4. **Phase 4: Web Desktop Cockpit (`packages/web-ui`)**
   * Build React/Vite + Tailwind frontend:
     * Prompt & Skill Execution Studio (with live streaming timeline)
     * Settings & 1-Click Agent Setup Manager
     * Wiki Explorer & 2D Knowledge Graph
     * Meta-Harness Telemetry & Handoff Cockpit
5. **Phase 5: End-to-End Verification & Documentation**
   * Vitest test suites (unit, integration, and E2E web API tests).
   * User guide for launching and operating the desktop cockpit.
