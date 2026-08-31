import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useWorkspaceInit,
  WorkspaceInitStateManager,
} from '../useWorkspaceInit.js'
import { WorkspaceInitApiClient } from '../../services/WorkspaceInitApiClient.js'
import type {
  WorkspaceInitStatusDTO,
  WorkspaceInitResultDTO,
  WizardStep,
  PhaseSteeringKey,
} from '../../types/index.js'

describe('useWorkspaceInit Hook & State Manager', () => {
  let mockApiClient: WorkspaceInitApiClient
  let defaultStatus: WorkspaceInitStatusDTO

  beforeEach(() => {
    defaultStatus = {
      workspacePath: '/projects/my-app',
      hasExistingProduct: false,
      hasExistingSettings: false,
      defaultRules: {
        user: ['User default rule'],
        bootstrap: [],
        planning: ['Plan default rule'],
        implementation: [],
        review: [],
        memory: [],
      },
    }

    mockApiClient = {
      fetchStatus: vi.fn().mockResolvedValue(defaultStatus),
      getStatus: vi.fn().mockResolvedValue(defaultStatus),
      initializeWorkspace: vi.fn().mockResolvedValue({
        success: true,
        workspacePath: '/projects/my-app',
        createdFiles: ['DEVELOPMENT-STATE.md', 'BOOTSTRAP-CONFIG.json'],
      } as WorkspaceInitResultDTO),
      initialize: vi.fn().mockResolvedValue({
        success: true,
        workspacePath: '/projects/my-app',
        createdFiles: ['DEVELOPMENT-STATE.md', 'BOOTSTRAP-CONFIG.json'],
      } as WorkspaceInitResultDTO),
    } as unknown as WorkspaceInitApiClient
  })

  it("should initialize wizard at 'detection' step", () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    expect(manager.currentStep).toBe('detection')
    expect(manager.isLoading).toBe(false)
    expect(manager.isSubmitting).toBe(false)
    expect(manager.error).toBeNull()
  })

  it("should advance from 'detection' to 'steering_editor' when workspace is clean", async () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    await manager.loadStatus('/projects/my-app')

    expect(manager.status).toEqual(defaultStatus)
    expect(manager.currentStep).toBe('steering_editor')
  })

  it("should advance from 'detection' to 'overwrite_guard' if hasExistingProduct is true", async () => {
    (mockApiClient.fetchStatus as any).mockResolvedValueOnce({
      ...defaultStatus,
      hasExistingProduct: true,
    })

    const manager = new WorkspaceInitStateManager(mockApiClient)
    await manager.loadStatus('/projects/my-app')

    expect(manager.currentStep).toBe('overwrite_guard')
    expect(manager.status?.hasExistingProduct).toBe(true)
  })

  it("should transition to 'steering_editor' upon confirmOverwrite", async () => {
    (mockApiClient.fetchStatus as any).mockResolvedValueOnce({
      ...defaultStatus,
      hasExistingProduct: true,
    })

    const manager = new WorkspaceInitStateManager(mockApiClient)
    await manager.loadStatus('/projects/my-app')
    expect(manager.currentStep).toBe('overwrite_guard')

    manager.confirmOverwrite()
    expect(manager.forceOverwrite).toBe(true)
    expect(manager.currentStep).toBe('steering_editor')
  })

  it("should revert to 'detection' upon cancelOverwrite", async () => {
    (mockApiClient.fetchStatus as any).mockResolvedValueOnce({
      ...defaultStatus,
      hasExistingProduct: true,
    })

    const manager = new WorkspaceInitStateManager(mockApiClient)
    await manager.loadStatus('/projects/my-app')
    expect(manager.currentStep).toBe('overwrite_guard')

    manager.cancelOverwrite()
    expect(manager.forceOverwrite).toBe(false)
    expect(manager.currentStep).toBe('detection')
  })

  it('should update draft steering rules when updatePhaseRules is called', () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    manager.updatePhaseRules('implementation', ['Write red tests first', 'Run vitest'])

    expect(manager.customSteeringRules.implementation).toEqual([
      'Write red tests first',
      'Run vitest',
    ])
  })

  it('should add and remove rule item for a specific phase', () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    manager.addPhaseRule('planning', 'Add task breakdown')
    expect(manager.customSteeringRules.planning).toEqual(['Add task breakdown'])

    manager.addPhaseRule('planning', 'Review invariants')
    expect(manager.customSteeringRules.planning).toEqual([
      'Add task breakdown',
      'Review invariants',
    ])

    manager.removePhaseRule('planning', 0)
    expect(manager.customSteeringRules.planning).toEqual(['Review invariants'])
  })

  it('should navigate through steps with goToNext, goToPrev, and goToStep', () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    manager.goToStep('steering_editor')
    expect(manager.currentStep).toBe('steering_editor')

    manager.goToNext()
    expect(manager.currentStep).toBe('settings_setup')

    manager.goToPrev()
    expect(manager.currentStep).toBe('steering_editor')
  })

  it("should set isSubmitting: true during initialization execution and transition to 'summary' upon success", async () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    manager.goToStep('settings_setup')
    manager.setCreateSettings(true)
    manager.updatePhaseRules('implementation', ['TDD Rule'])

    const submitPromise = manager.submitInit()
    expect(manager.isSubmitting).toBe(true)

    await submitPromise

    expect(manager.isSubmitting).toBe(false)
    expect(manager.currentStep).toBe('summary')
    expect(manager.result).toBeDefined()
    expect(manager.result?.success).toBe(true)
    expect(mockApiClient.initializeWorkspace).toHaveBeenCalledWith({
      workspacePath: undefined,
      forceOverwrite: false,
      createSettings: true,
      customSteeringRules: {
        implementation: ['TDD Rule'],
      },
    })
  })

  it('should handle API errors gracefully by recording error without losing form draft', async () => {
    (mockApiClient.initializeWorkspace as any).mockRejectedValueOnce(
      new Error('Conflict: workspace locked')
    )

    const manager = new WorkspaceInitStateManager(mockApiClient)
    manager.goToStep('settings_setup')
    manager.updatePhaseRules('user', ['Keep this draft rule'])

    await manager.submitInit()

    expect(manager.isSubmitting).toBe(false)
    expect(manager.error).toBe('Conflict: workspace locked')
    expect(manager.currentStep).toBe('settings_setup')
    expect(manager.customSteeringRules.user).toEqual(['Keep this draft rule'])
  })

  it('should subscribe and notify state listeners when state changes', () => {
    const manager = new WorkspaceInitStateManager(mockApiClient)
    const listener = vi.fn()
    const unsubscribe = manager.subscribe(listener)

    manager.goToStep('steering_editor')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    manager.goToStep('settings_setup')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
