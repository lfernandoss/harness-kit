export type ThemeMode = 'light' | 'dark';

export const isThemeMode = (val: unknown): val is ThemeMode =>
  val === 'light' || val === 'dark';

export interface ContrastRatioResult {
  readonly ratio: number;
  readonly passesAA: boolean;
  readonly fgColor: string;
  readonly bgColor: string;
}

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly badge?: string;
}

export function createNavigationItem(item: NavigationItem): NavigationItem {
  if (!item.id || typeof item.id !== 'string') {
    throw new Error('NavigationItem must have a valid string id');
  }
  if (!item.label || typeof item.label !== 'string') {
    throw new Error('NavigationItem must have a valid string label');
  }
  if (!item.path || typeof item.path !== 'string') {
    throw new Error('NavigationItem must have a valid string path');
  }
  return Object.freeze({ ...item });
}

export interface ServerHostConfig {
  readonly port: number;
  readonly host: string;
  readonly staticDir: string;
  readonly fallbackFile: string;
}

export function validateServerHostConfig(config: ServerHostConfig): void {
  if (!config) {
    throw new Error('ServerHostConfig must be defined');
  }
  if (config.host !== '127.0.0.1') {
    throw new Error(`Server host must strictly be bound to 127.0.0.1 (got: ${config.host})`);
  }
  if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) {
    throw new Error(`Server port must be a valid integer between 1 and 65535 (got: ${config.port})`);
  }
  if (!config.staticDir || typeof config.staticDir !== 'string' || config.staticDir.trim() === '') {
    throw new Error('Server staticDir must be a non-empty string path');
  }
  if (!config.fallbackFile || typeof config.fallbackFile !== 'string') {
    throw new Error('Server fallbackFile must be a valid string filename');
  }
}

export interface ThemeContextValue {
  readonly theme: ThemeMode;
  toggleTheme(): void;
  setTheme(mode: ThemeMode): void;
}

export interface IThemeStorageAdapter {
  getTheme(): ThemeMode | null;
  setTheme(mode: ThemeMode): void;
}

export interface IWebServerHost {
  start(): Promise<string>;
  stop(): Promise<void>;
  getAddress(): string;
}

export type WizardStep =
  | 'detection'
  | 'overwrite_guard'
  | 'steering_editor'
  | 'settings_setup'
  | 'summary';

export type PhaseSteeringKey =
  | 'user'
  | 'bootstrap'
  | 'planning'
  | 'implementation'
  | 'review'
  | 'memory';

export type SteeringRulesPayload = Record<PhaseSteeringKey, string[]>;

export interface WorkspaceInitStatusDTO {
  readonly workspacePath: string;
  readonly hasExistingProduct: boolean;
  readonly hasExistingSettings: boolean;
  readonly defaultRules: SteeringRulesPayload;
}

export interface InitializeWorkspaceDTO {
  readonly workspacePath?: string;
  readonly forceOverwrite?: boolean;
  readonly customSteeringRules?: Partial<SteeringRulesPayload>;
  readonly createSettings?: boolean;
}

export interface WorkspaceInitResultDTO {
  readonly success: boolean;
  readonly workspacePath: string;
  readonly createdFiles: string[];
  readonly settingsPath?: string;
}

export interface IWorkspaceInitApiClient {
  fetchStatus(workspacePath?: string): Promise<WorkspaceInitStatusDTO>;
  getStatus(workspacePath?: string): Promise<WorkspaceInitStatusDTO>;
  initializeWorkspace(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO>;
  initialize(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO>;
}

export enum RunMode {
  QUICK = 'quick',
  FAST = 'fast',
  THINKING = 'thinking',
  DEEP_THINKING = 'deep_thinking',
}

export enum Phase {
  BOOTSTRAP = 'BOOTSTRAP',
  REFINEMENT = 'REFINEMENT',
  PLANNING = 'PLANNING',
  DEVELOPMENT = 'DEVELOPMENT',
  REVIEW = 'REVIEW',
  MEMORY = 'MEMORY',
  TRANSITION = 'TRANSITION',
  DEPLOY = 'DEPLOY',
  CASCADE_BLOCKED = 'CASCADE_BLOCKED',
  HALTED = 'HALTED',
}

export type ExecutionMode = 'quick' | 'fast' | 'thinking' | 'deep_thinking';

export interface RunConfigDTO {
  readonly scope: string;
  readonly mode: RunMode | ExecutionMode | string;
  readonly agent?: string;
  readonly model?: string;
  readonly effort?: string;
  readonly action?: 'reset' | 'resume';
  readonly projectPaths?: string[];
  readonly project?: string | string[];
  readonly idempotencyKey?: string;
  readonly skipValidation?: boolean;
  readonly skipMemory?: boolean;
  readonly skipDeploy?: boolean;
}


export type SteeringRequestDTO =
  | { type: 'add_rule'; rule: string }
  | { type: 'rollback'; targetPhase: string }
  | { type: 'override_score'; tl?: number; adv?: number };

export type JobEventDTO =
  | { type: 'phase_change'; phase: string; timestamp: number; jobId?: string; fromPhase?: string; toPhase?: string }
  | { type: 'log_chunk'; stream: 'stdout' | 'stderr'; text: string; timestamp?: number; jobId?: string }
  | { type: 'telemetry'; tokensUsed: number; costEstimate: number; timestamp?: number; jobId?: string }
  | { type: 'steering_applied'; action: SteeringRequestDTO; timestamp: number; jobId?: string };

export interface LogChunkDTO {
  readonly stream: 'stdout' | 'stderr';
  readonly text: string;
  readonly timestamp?: number;
}

export interface LiveSessionState {
  readonly jobId: string;
  readonly status: 'queued' | 'running' | 'completed' | 'failed' | 'aborted';
  readonly currentPhase: string;
  readonly logs: LogChunkDTO[];
  readonly isConnected: boolean;
  readonly telemetry?: {
    tokensUsed: number;
    costEstimate: number;
  };
}

export interface AnsiFormattedChunk {
  readonly rawText: string;
  readonly cssClass: string;
  readonly fgColor?: string;
  readonly bgColor?: string;
}

export interface IOrchestrationApiClient {
  startJob(config: RunConfigDTO): Promise<{ jobId: string; status: string }>;
  resumeJob?(jobId: string, overrides?: Partial<RunConfigDTO>): Promise<{ jobId: string; status: string }>;
  abortJob(jobId: string, reason?: string): Promise<void>;
  steerJob(jobId: string, action: SteeringRequestDTO): Promise<void>;
  getStatus?(jobId: string): Promise<{ status: string }>;
}

export interface IEventStreamClient {
  connect(jobId: string): void;
  disconnect(): void;
  onEvent(handler: (event: JobEventDTO) => void): () => void;
}

export * from './settings.types.js'
export * from './diagnostics.js'
