---
doc_type: adr
domain: testing
stack: [vitest, typescript, nodejs, cross-spawn, playwright, axe-core]
node_id: "adr:tests"
tags: [testing, unit-tests, integration-tests, e2e-tests, coverage, vitest]
edges:
  - relation: references
    target: "adr:architecture"
updated: 2026-08-27
---
# Testing Protocol

## OVERVIEW
Estratégia de testes orientada a TDD estrito com execução hermética em nível unitário via Vitest, validação de integração opt-in para CLIs externos e suíte E2E automatizada para a interface web (`sdk-web`).

## COMMANDS
| Type | Command | Description |
|------|---------|-------------|
| Unit (SDK) | `npm.cmd test` | Executa a suíte de testes unitários e de integração hermética do SDK |
| Unit (Web) | `npm.cmd --prefix sdk-web test` | Executa a suíte completa de testes unitários e de componentes do sdk-web |
| E2E | `npm.cmd run test:e2e` | Executa testes end-to-end do runtime e fluxos de trabalho |
| Watch | `npm.cmd run test:watch` | Executa o Vitest em modo interativo contínuo |
| Integration Gated | `env AGY_INTEGRATION_TEST=true npm.cmd test` | Executa testes de integração ao vivo com binários de agentes instalados |

## MINIMUM COVERAGE
REQUIRED: Manter os seguintes níveis mínimos de cobertura:

| Layer | Coverage | Description |
|-------|----------|-------------|
| Domain / Core | 90% | Invariantes de contratos, parsing e tratamento de erros |
| Application / Use Cases | 85% | Casos de uso de orquestração e gates de validação |
| Infrastructure / Adapters | 80% | Runners de CLI, sanitização de ambiente e adapters de processo |
| Presentation (sdk-web) | 85% | Componentes visuais, hooks, rotas e acessibilidade WCAG AA |
| Global | 85% | Média total de cobertura do projeto |

## PATTERNS & BEST PRACTICES
REQUIRED: Simulação de streams de processos filhos sem dependência de binários externos em testes unitários.
REQUIRED: Isolamento de credenciais e teste de padrões sensíveis com `AbstractCliRunner.filterSensitiveEnv`.
REQUIRED: Verificação automatizada de conformidade de acessibilidade (contraste >= 4.5:1) em componentes web.
FORBIDDEN: Testes que dependem de estado global compartilhado entre execuções sem limpeza em `beforeEach` / `afterEach`.
FORBIDDEN: Ignorar erros de quota da API sem mapeamento para `AgentRunnerErrorCode.QUOTA_EXCEEDED`.

## TOOLING
- **Framework:** Vitest ^4.1.10
- **Assertions:** Vitest built-in matchers (Chai-compatible) e axe-core para acessibilidade
- **Mocks/Stubs:** Vitest `vi.mock` e `vi.fn` com streams virtuais de processo
- **Coverage:** `@vitest/coverage-v8` ^4.1.10
- **CI Integration:** Execução automatizada de `npm test` e suítes E2E em pipelines de PR

## TROUBLESHOOTING
- **Flaky tests:** Verificar timers assíncronos e limpeza de manipuladores de processo em `AbstractCliRunner`.
- **Debug mode:** Executar com variável `DEBUG=true` para inspecionar comandos de spawn e telemetria de stdin/stdout.

## REFERENCES

- [**README.md**](../README.md): Main documentation index.
- [**ARCHITECTURE.md**](./ARCHITECTURE.md): System architecture and patterns.\n