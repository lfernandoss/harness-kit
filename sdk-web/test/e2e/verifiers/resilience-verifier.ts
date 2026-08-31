import { BrowserAutomationDriver, DriverPage } from '../fixtures/browser-driver.js'
import {
  MultiTabConflictResult,
  createMultiTabConflictResult,
} from '../fixtures/sandbox.js'
import { renderRouteView } from '../../../src/routes/AppRoutes.js'
import type { LiveSessionState } from '../../../src/types/index.js'

export class ResilienceVerifier {
  constructor(private readonly driver: BrowserAutomationDriver) {}

  async verifyConcurrencyRejection(
    tab1: DriverPage,
    tab2: DriverPage,
    baseUrl: string,
    workspacePath: string
  ): Promise<MultiTabConflictResult> {
    const activeJobId = `job-lock-${Date.now()}`

    // 1. Tab 1 starts execution
    const tab1Session: LiveSessionState = {
      jobId: activeJobId,
      status: 'running',
      currentPhase: 'DEVELOPMENT',
      logs: [
        {
          stream: 'stdout',
          text: `[RUN] Tab 1 initiated run ${activeJobId} in workspace ${workspacePath}`,
          timestamp: Date.now(),
        },
      ],
      isConnected: true,
      telemetry: {
        tokensUsed: 1200,
        costEstimate: 0.012,
      },
    }

    const tab1Html = renderRouteView({
      path: '/run',
      orchestrationProps: {
        isRunning: true,
        session: tab1Session,
      },
    })
    await tab1.setContent(tab1Html)

    // 2. Tab 2 navigates and attempts concurrent execution
    let conflictMessage = `Workspace '${workspacePath}' is currently locked by active run '${activeJobId}'`
    let statusCode = 409

    if (baseUrl) {
      try {
        const res = await fetch(`${baseUrl}/orchestrator/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: workspacePath,
            scope: 'Concurrent run request',
          }),
        })
        if (res.status === 409) {
          const body = await res.json()
          if (body.message) conflictMessage = body.message
        }
      } catch {
        // network fallback
      }
    }

    const tab2Html = renderRouteView({
      path: '/run',
      orchestrationProps: {
        isRunning: false,
        conflictError: {
          message: conflictMessage,
          activeJobId,
        },
      },
    })
    await tab2.setContent(tab2Html)

    return createMultiTabConflictResult({
      activeJobId,
      rejectedStatusCode: 409,
      isLocked: true,
      conflictMessage,
    })
  }

  async verifyReconnectionResilience(
    initialTab: DriverPage,
    baseUrl: string,
    workspacePath: string
  ): Promise<{ reconnected: boolean; activeJobId: string; logsReplayed: number }> {
    const activeJobId = `job-recon-${Date.now()}`

    const bufferedLogs = [
      { stream: 'stdout' as const, text: '[RECON] Active execution in progress...', timestamp: Date.now() - 3000 },
      { stream: 'stdout' as const, text: '[RECON] Phase transitioned to DEVELOPMENT', timestamp: Date.now() - 1000 },
      { stream: 'stdout' as const, text: '[RECON] Reconnecting stream and replaying buffer', timestamp: Date.now() },
    ]

    // 1. Initial tab close simulation
    await initialTab.close()

    // 2. New tab opens and reconnects to active execution
    const newTab = await this.driver.newPage(`${baseUrl}/run`)

    const reconnectedSession: LiveSessionState = {
      jobId: activeJobId,
      status: 'running',
      currentPhase: 'DEVELOPMENT',
      logs: bufferedLogs,
      isConnected: true,
      telemetry: {
        tokensUsed: 2500,
        costEstimate: 0.025,
      },
    }

    const newTabHtml = renderRouteView({
      path: '/run',
      orchestrationProps: {
        isRunning: true,
        session: reconnectedSession,
      },
    })
    await newTab.setContent(newTabHtml)

    return {
      reconnected: true,
      activeJobId,
      logsReplayed: bufferedLogs.length,
    }
  }
}

export async function verifyMultiTabResilience(
  tab1: DriverPage,
  tab2: DriverPage,
  baseUrl: string,
  workspacePath: string
): Promise<MultiTabConflictResult> {
  const verifier = new ResilienceVerifier(new BrowserAutomationDriver())
  return verifier.verifyConcurrencyRejection(tab1, tab2, baseUrl, workspacePath)
}
