---
doc_type: adr
domain: architecture
stack: [typescript, nodejs, vitest, harness-kit, react, fastify]
node_id: "adr:architecture"
tags: [architecture, design-patterns, folder-structure, agent-runner, sdk-web]
edges:
  - relation: references
    target: "adr:tests"
updated: 2026-08-27
---
# Arquitetura do Projeto

## OVERVIEW
Framework modular em TypeScript/Node.js estruturado em Clean Architecture com orquestração autônoma de TDD. O fluxo de dados conecta o runtime CLI/Server através de Casos de Uso, Gateways de Execução de Agentes, Repositórios e interface web local (`sdk-web`).

## FOLDER STRUCTURE
<folder_structure>
```
sdk/src/                          # Core SDK e runtime CLI
├── agent-runner/                 # Adapters de execução de CLI/SDK para agentes externos
├── cli/                          # Comandos de terminal, parsers de flag e formatação UI
├── orchestrator/                 # Motor do loop autônomo e gerenciamento de fases
├── server/                       # Camada HTTP/OpenAPI, rotas REST e casos de uso de jobs
├── validation-gate/              # Avaliação de qualidade e decisões com Tech Lead e QA
└── diagnose/                     # Coleta de telemetria, diagnóstico e evolução de harnesses
sdk-web/src/                      # Interface Web SPA e servidor host local
├── components/                   # Componentes de layout, init, settings, telemetria e candidatos
├── context/                      # Contextos React e gerenciamento de tema Itaú
├── hooks/                        # Hooks de integração com APIs e Server-Sent Events (SSE)
├── routes/                       # Roteamento SPA de visões do aplicativo
├── server/                       # WebServerHost local (127.0.0.1) e rotas de relatórios/diagnóstico
├── styles/                       # Tokens de design Itaú Unibanco e conformidade WCAG AA
└── views/                        # Visões principais (Orchestration, Settings, Telemetry, Diagnostics)
```
</folder_structure>

## LAYERS
- **Domain**: Define contratos invariantes (`AgentInvocation`, `AgentOutput`, `TokenUsage`), tipos fundamentais e erros tipados de domínio (`AgentRunnerError`).
- **Application**: Orquestra o ciclo de vida de execução de tarefas, transição de estados do harness e casos de uso REST.
- **Adapters / Infrastructure**: Implementa a integração com processos externos via `cross-spawn`, parsing de stdout/stderr, sanitização de ambiente e repositórios em memória ou disco.
- **Presentation (sdk-web)**: Interface web React SPA servida localmente em `127.0.0.1` com paleta Itaú Unibanco, SSE em tempo real e controle de execução.

## MODULES
| Module | Responsibility | Location |
|--------|-----------------|-------------|
| Agent Runner | Execução padronizada e isolamento de processos para múltiplos CLIs e SDKs de IA | `sdk/src/agent-runner/` |
| Orchestrator | Governança da máquina de estados autônoma (Fases A a E, reentrância e reworks) | `sdk/src/orchestrator/` |
| Validation Gate | Execução de gates de qualidade combinando score de Tech Lead e QA adversário | `sdk/src/validation-gate/` |
| Server | API HTTP assíncrona para controle de jobs, filas e telemetria de tokens | `sdk/src/server/` |
| Diagnose & Telemetry | Rastreamento de execução, análise de Pareto e evolução contínua de prompts | `sdk/src/diagnose/` |
| Web Shell & App (`sdk-web`) | Interface web local com tema Itaú, dashboards e streaming SSE | `sdk-web/src/` |

## PATTERNS
<code_patterns>
# REQUIRED: Herança de AbstractCliRunner com parsing isolado e registro dinâmico
export class CustomCLIRunner extends AbstractCliRunner {
  readonly type = 'custom-cli'
  protected get binaryName(): string { return 'custom' }
  protected override get writePromptToStdin(): boolean { return true }
}
AgentRunnerRegistry.register({ type: 'custom-cli', constructor: CustomCLIRunner })

# FORBIDDEN: Propagação de segredos ou tokens de autenticação no ambiente do processo filho
// Evitar repassar process.env bruto sem sanitização de chaves sensíveis
const child = spawn('custom', args, { env: process.env }) // WRONG
</code_patterns>

## INTEGRATIONS
| External Service / Component | Purpose | Connection / Authentication Method |
|------------------------------|---------|-------------------------------------|
| Google Antigravity (`agy`) | Execução autônoma de subagentes | Process CLI spawn via stdin com sanitização de ambiente |
| Anthropic Claude Code (`claude`) | Execução de tarefas via CLI/SDK | CLI subprocess e `@anthropic-ai/sdk` |
| GitHub Copilot CLI (`copilot`) | Execução de agentes Copilot | CLI subprocess e `@github/copilot-sdk` |
| Cursor Agent (`cursor`) | Execução de agentes Cursor | CLI subprocess e `@cursor/sdk` |
| Localhost Web Host | Hospedagem de interface web local | Binding estrito em `127.0.0.1` via Node.js HTTP |

## REFERENCES

- [**README.md**](../README.md): Main documentation index.
- [**TESTS.md**](./TESTS.md): Testing strategies and commands.\n