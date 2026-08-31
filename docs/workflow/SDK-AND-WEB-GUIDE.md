# Harness Kit — Guia Completo do SDK & SDK Web

Este documento detalha a arquitetura, o funcionamento interno, os protocolos de comunicação com os CLIs de agentes de IA e os exemplos práticos de uso do **Harness Kit SDK** e do **SDK Web**.

---

## 1. Visão Geral

O **Harness Kit SDK** (`@lfernandoss/hrns`) é o motor autônomo de orquestração de desenvolvimento guiado por testes (**Test-Driven Development - TDD**). Ele implementa o ciclo soberano de software:

$$\text{Bootstrap} \longrightarrow \text{Refinement} \longrightarrow \text{Planning} \longrightarrow \text{Development (TDD)} \longrightarrow \text{Review (TL + QA)} \longrightarrow \text{Memory} \longrightarrow \text{Deploy}$$

O SDK opera de duas formas complementares:
1. **Motor CLI / Programático**: Executado diretamente no terminal via `hrns run` ou importado como biblioteca TypeScript/Node.js.
2. **SDK Web Daemon**: Servidor HTTP embutido com interface visual Single Page Application (SPA) na porta `3000`, permitindo disparo de jobs, questionário socrático, visualização de timeline reativa, streaming de logs via Server-Sent Events (SSE) e governança de custos.

---

## 2. Arquitetura do SDK (Hexagonal / Ports & Adapters)

O SDK segue rigorosamente os princípios de **Clean Architecture**:

```
                              ┌─────────────────────────────────────────┐
                              │            INBOUND ADAPTERS             │
                              │  CLI (`hrns`) │ HTTP API │ Web SPA UI   │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       APPLICATION LAYER                                          │
│  - RunOrchestratorJobUseCase    - GetJobStatusUseCase    - UpdateSettingsUseCase                 │
│  - ResumeOrchestratorJobUseCase - AbortJobUseCase        - GetTokensTelemetryUseCase             │
└──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          DOMAIN CORE                                             │
│  - HarnessOrchestrator (FSM)    - RefinementHandler      - PlanningPhaseHandler                  │
│  - FileStateManager (STATE)     - DevelopmentHandler     - QualityReviewGate                     │
└──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │            OUTBOUND ADAPTERS            │
                              │  IAgentRunner (CLIs) │ Git Worktrees    │
                              │  JobStoreRepository  │ EventBroadcaster │
                              └─────────────────────────────────────────┘
```

---

## 3. Como o SDK se Comunica com os CLIs de IA (Agent Runners)

O SDK não depende de nenhum provedor específico de IA no núcleo do seu domínio. Toda invocação para modelos de linguagem é desacoplada através da porta **`IAgentRunner`** e gerenciada pela **`AgentRunnerFactory`**.

### 🔌 A Interface `IAgentRunner`

```typescript
export interface IAgentRunner {
  run(
    invocation: AgentInvocation,
    options?: RunnerExecutionOptions
  ): Promise<AgentRunnerResult>
  abort(jobId?: string): Promise<void>
}
```

### 🤖 Runners Suportados e Protocolo de Execução

Cada runner herda de `AbstractCliRunner`, que gerencia spawn de subprocessos, streams de stdin/stdout/stderr, controle de timeouts, cancelamento com `AbortController` e sanitização de dados:

| Runner ID | CLI Binário | Modelo Padrão | Protocolo de Comunicação |
| :--- | :--- | :--- | :--- |
| **`antigravity-cli`** | `agy` | `gemini-3.7-flash` | Execução não-interativa via prompt estruturado e captura de streams stdio. |
| **`claude-cli`** | `claude` | `claude-3-7-sonnet` | Invocação com flag `--output-format stream-json` e parsing determinístico de NDJSON. |
| **`copilot-cli`** | `copilot` | `gpt-5.6-sol` | Execução em subshell com injeção de contexto via stdin. |
| **`cursor-cli`** | `cursor` | `agent-mode` | Invocação em background via IPC e monitoramento de logs. |
| **`codex-cli`** | `codex` | `codex-v2` | Execução desacoplada para tarefas de backend e refatoração. |
| **`kiro-cli`** | `kiro` | `bedrock-claude` | Invocação via AWS CLI wrapper. |

### 🛡️ Extração Determinística de Dados (`JsonExtractionProtocol`)

Para evitar que textos conversacionais ou formatações Markdown quebrem o fluxo da máquina de estados, o SDK utiliza o `JsonExtractionProtocol`:
- Remove cercas de código (fences) ` ```json ` e ` ``` `.
- Localiza o primeiro `[` ou `{` e o respectivo par de fechamento `]` ou `}`.
- Sanitiza escapes inválidos e quebras de linha antes de executar `JSON.parse()`.

### 🌿 Isolamento Hermético com Git Worktrees

Para garantir que execuções concorrentes ou testes não poluam o branch principal do desenvolvedor:
1. O runner cria um worktree efêmero isolado em `.worktrees/job-<jobId>`.
2. Executa um **JIT Sync** buscando atualizações remotas da branch base.
3. Roda todas as fases (TDD, testes de unidade, criação de arquivos).
4. Ao concluir, realiza commit estruturado, sincroniza a telemetria (`tokens.jsonl`) para a raiz e remove o worktree de forma limpa.

---

## 4. Como Funciona o SDK Web (Web Dashboard)

O **SDK Web** é uma aplicação completa servida diretamente pelo daemon do SDK sem necessidade de configuração complexa de servidores externos.

### 🌐 Endpoints Principais do Servidor (`HttpServer`)

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/` | Serve a Single Page Application (SPA) Web UI com tema Itaú. |
| `GET` | `/docs` | Documentação interativa Swagger OpenAPI. |
| `POST` | `/orchestrator/run` | Enfileira um job autônomo com chave de idempotência (`202 Accepted`). |
| `GET` | `/orchestrator/stream` | Canal de streaming Server-Sent Events (SSE) para logs e transições de fase. |
| `GET` | `/orchestrator/status/:id` | Consulta o status, fase ativa e histórico completo de logs do job. |
| `GET` | `/orchestrator/jobs/latest` | Retorna o job mais recente para recuperação automática após reload (`F5`). |
| `POST` | `/orchestrator/refine/questions` | Gera as 5-8 questões arquiteturais do Software Architect para o modo Deep Thinking. |
| `POST` | `/api/workspace/select-folder` | Aciona o explorador nativo de pastas do sistema operacional. |
| `GET` | `/orchestrator/telemetry/tokens` | Métricas de custo em USD e consumo de tokens agregados. |

---

### 🎨 Recursos Visuais do Web Dashboard

#### 1. Timeline Reativa com Efeito de Loop
Durante a execução de qualquer fase:
- **Nó Ativo**: Recebe animação de **onda de radar translúcida** (`pulseRadar`) e um **anel orbital tracejado giratório** (`rotateLoop`).
- **Ícone**: O número da fase transforma-se em um ícone de loop em rotação (`⟳`).
- **Badge de Status**: Exibe a pílula `⟳ Em Loop TDD` com brilho intermitente.
- **Nós Concluídos**: Recebem a cor verde (`#00875A`) com check (`✓`).
- **Barra de Progresso**: Linha conectora preenche dinamicamente à medida que o pipeline avança.

#### 2. Questionário Socrático Interativo (`deep_thinking`)
Ao selecionar o modo **Deep Thinking**:
1. O usuário pode iniciar diretamente ou clicar em **"🧠 Personalizar Respostas Socráticas"**.
2. Abre-se o modal com as questões formuladas pelo arquiteto (contendo contexto sistêmico, recomendação opinativa e campo de resposta editável).
3. Ao confirmar, o orquestrador consolida as decisões em `docs/product/REFINEMENT.md` antes de gerar testes e código.

#### 3. Auto-Recuperação de Estado (`F5 Resilience`)
Se o desenvolvedor fechar ou recarregar a página (`F5`):
- O dashboard lê o `harness_active_job_id` no `localStorage`.
- Restaura os logs anteriores no console do terminal.
- Sincroniza a timeline com a fase exata em que o agente está trabalhando.
- Reconecta instantaneamente ao canal SSE em tempo real.

---

## 5. Exemplos Práticos de Uso

### Exemplo 1: Via Web Dashboard (Interface Gráfica)

1. Inicie o servidor SDK:
   ```bash
   cd sdk
   npm run build
   node dist/server/index.js
   ```
2. Abra no navegador: **`http://127.0.0.1:3000/`**
3. Digite o escopo no campo de texto:
   > *"Implementar endpoint de login com autenticação JWT, refresh token e testes unitários no Vitest."*
4. Selecione o runner desejado (ex: **Antigravity CLI**).
5. Escolha o modo de execução (**Deep Thinking**, **Thinking** ou **Fast**).
6. Clique em **"📁 Selecionar Pasta"** para escolher o diretório do projeto.
7. Clique em **"▶ Iniciar Ciclo Autônomo"** e acompanhe a timeline e os logs em tempo real.

---

### Exemplo 2: Via Linha de Comando (CLI)

#### Execução Padrão Autônoma (Thinking Mode)
```bash
hrns run \
  --agent antigravity-cli \
  --scope "Implementar rota de checkout com validação de cartão de crédito e testes TDD"
```

#### Execução com Refinamento Socrático (Deep Thinking)
```bash
hrns run \
  --agent claude-cli \
  --mode deep_thinking \
  --scope "Migrar arquitetura de sessão para Redis Cluster com failover automático"
```

#### Execução Rápida (Fast Mode)
```bash
hrns run \
  --mode fast \
  --scope "Corrigir bug de validação de CPF no formulário de cadastro"
```

---

### Exemplo 3: Via HTTP REST API (cURL / CI/CD)

#### 1. Disparar um Job Autônomo
```bash
curl -X POST http://127.0.0.1:3000/orchestrator/run \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "ci-deploy-20260830-01",
    "scope": "Adicionar sanitização de inputs contra XSS e SQL Injection",
    "agent": "antigravity-cli",
    "mode": "thinking",
    "project": ["C:/Users/psn_l/projetos/harness-kit"],
    "action": "reset"
  }'
```

**Resposta (`202 Accepted`):**
```json
{
  "jobId": "80bc292a-da2d-43f6-b661-9ff6202848eb",
  "status": "queued",
  "enqueuedAt": "2026-08-30T17:43:25.528Z",
  "statusUrl": "/orchestrator/status/80bc292a-da2d-43f6-b661-9ff6202848eb"
}
```

#### 2. Acompanhar os Logs via Server-Sent Events (SSE)
```bash
curl -N http://127.0.0.1:3000/orchestrator/stream?jobId=80bc292a-da2d-43f6-b661-9ff6202848eb
```

#### 3. Consultar o Status e a Fase Atual
```bash
curl http://127.0.0.1:3000/orchestrator/status/80bc292a-da2d-43f6-b661-9ff6202848eb
```

---

### Exemplo 4: Uso Programático em TypeScript / Node.js

```typescript
import { HarnessOrchestrator } from '@lfernandoss/hrns/orchestrator'
import { AgentRunnerFactory } from '@lfernandoss/hrns/agent-runner'
import { Complexity } from '@lfernandoss/hrns/types'

async function executeCustomPipeline() {
  const runner = AgentRunnerFactory.create({
    type: 'antigravity-cli',
    model: 'gemini-3.7-flash',
    effort: 'high',
  })

  const orchestrator = new HarnessOrchestrator({
    scope: 'Construir pipeline de notificações push com RabbitMQ e Vitest',
    projectPaths: ['/caminho/para/o/projeto'],
    complexity: Complexity.HIGH,
    agentRunner: runner,
    enableRefinement: true,
    refinementAnswers: [
      {
        question: 'Qual a política de retry em falhas de entrega?',
        answer: 'Exponential backoff com dead-letter exchange após 3 tentativas.'
      }
    ]
  })

  orchestrator.on('phase_change', (phase) => {
    console.log(`[PIPELINE] Transição para a fase: ${phase}`)
  })

  const result = await orchestrator.run()
  console.log('Resultado da execução:', result)
}

executeCustomPipeline()
```

---

## 6. Governança e Resumo de Comandos

| Comando / Recurso | Descrição |
| :--- | :--- |
| `npm run build` | Compila o SDK TypeScript para JavaScript executável (`dist/`). |
| `node dist/server/index.js` | Inicia o daemon do servidor HTTP e da interface Web SPA na porta `3000`. |
| `hrns init` | Inicializa a estrutura de governança `docs/` e `GEMINI.md` no workspace. |
| `hrns run` | Executa o loop autônomo TDD via linha de comando. |
| `hrns diagnose` | Executa análise retrospectiva com o Meta-Harness e gera candidatos a melhoria. |
| `DELETE /orchestrator/jobs/clean` | Purga jobs finalizados da memória e remove worktrees antigos. |
