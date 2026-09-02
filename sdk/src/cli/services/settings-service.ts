import { join, dirname } from 'node:path'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { HarnessSettings } from '../../settings/HarnessSettings'
import type { HarnessSettingsMap, RunnerSettings, PhaseSettings } from '../../settings/SettingsSchema'
import { DEFAULT_SETTINGS } from '../../settings/DefaultSettings'
import { SettingsValidator } from '../../settings/SettingsValidator'
import { AtomicSettingsWriter } from '../../settings/AtomicSettingsWriter'
import { AnsiHelpers } from '../../ui/AnsiHelpers'

const KNOWN_RUNNERS = ['antigravity', 'claude', 'copilot', 'cursor', 'codex', 'kiro']
const KNOWN_PHASES = ['bootstrap', 'planning', 'implementation', 'review_tl', 'review_adv', 'memory', 'diagnose']

function resolveSettingsPath(scope: 'local' | 'global', cwd: string): string {
  if (scope === 'global') {
    return HarnessSettings.getGlobalSettingsPath()
  }
  return join(cwd, '.harness-kit', 'settings.json')
}

function loadSettingsMap(filePath: string): HarnessSettingsMap {
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content) as HarnessSettingsMap
    } catch {
      return {}
    }
  }
  return {}
}

function parseFlags(args: string[]): {
  positional: string[]
  flags: Record<string, string | boolean>
} {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    } else {
      positional.push(arg)
    }
  }

  return { positional, flags }
}

export async function cmdSettings(cwd: string, args: string[] = []): Promise<void> {
  const { positional, flags } = parseFlags(args)
  const subcommand = positional[0]
  const isJson = Boolean(flags['json'])

  // 1. Declarative Subcommand: SET
  if (subcommand === 'set') {
    const runner = positional[1] || (typeof flags['runner'] === 'string' ? flags['runner'] : undefined)
    const scope = (flags['scope'] === 'global' ? 'global' : 'local') as 'local' | 'global'
    const model = typeof flags['model'] === 'string' ? flags['model'] : undefined
    const effort = typeof flags['effort'] === 'string' ? flags['effort'] : undefined
    const phase = typeof flags['phase'] === 'string' ? flags['phase'].toLowerCase() : undefined
    const timeoutStr = typeof flags['timeout'] === 'string' ? flags['timeout'] : undefined
    const timeoutMs = timeoutStr ? parseInt(timeoutStr, 10) : undefined

    if (!runner) {
      const err = "Runner argument is required. Usage: hrns settings set <runner> [--model <model>] [--effort <effort>] [--phase <phase>] [--scope local|global] [--json]"
      if (isJson) {
        console.log(JSON.stringify({ status: 'ERROR', message: err }))
      } else {
        console.error(`${AnsiHelpers.red('Error:')} ${err}`)
      }
      return
    }

    try {
      if (model) SettingsValidator.validateModel(model)
      if (effort) SettingsValidator.validateEffort(effort)
    } catch (e: any) {
      if (isJson) {
        console.log(JSON.stringify({ status: 'ERROR', message: e.message }))
      } else {
        console.error(`${AnsiHelpers.red('Validation Error:')} ${e.message}`)
      }
      return
    }

    const settingsPath = resolveSettingsPath(scope, cwd)
    const current = loadSettingsMap(settingsPath)

    const runnerSettings: RunnerSettings = { ...(current[runner] ?? {}) }
    if (phase) {
      const existingPhases = runnerSettings.phases ?? {}
      const existingPhase = existingPhases[phase] ?? {}
      const updatedPhase: PhaseSettings = { ...existingPhase }
      if (model !== undefined) updatedPhase.model = model
      if (effort !== undefined) updatedPhase.effort = effort
      if (timeoutMs !== undefined) updatedPhase.timeoutMs = timeoutMs
      runnerSettings.phases = {
        ...existingPhases,
        [phase]: updatedPhase
      }
    } else {
      if (model !== undefined) runnerSettings.defaultModel = model
      if (effort !== undefined) runnerSettings.defaultEffort = effort
      if (timeoutMs !== undefined) runnerSettings.timeoutMs = timeoutMs
    }

    const updatedMap: HarnessSettingsMap = {
      ...current,
      [runner]: runnerSettings
    }

    try {
      const validated = SettingsValidator.validate(updatedMap)
      AtomicSettingsWriter.write(settingsPath, validated)

      if (isJson) {
        console.log(JSON.stringify({
          status: 'SUCCESS',
          scope,
          path: settingsPath,
          runner,
          settings: validated
        }))
      } else {
        console.log(`${AnsiHelpers.green('✓')} Updated settings for ${AnsiHelpers.bold(runner)} at ${settingsPath}`)
      }
    } catch (e: any) {
      if (isJson) {
        console.log(JSON.stringify({ status: 'ERROR', message: e.message }))
      } else {
        console.error(`${AnsiHelpers.red('Error:')} Failed to save settings: ${e.message}`)
      }
    }
    return
  }

  // 2. Declarative Subcommand: GET
  if (subcommand === 'get') {
    const runner = positional[1] || (typeof flags['runner'] === 'string' ? flags['runner'] : undefined)
    const scope = (flags['scope'] === 'global' ? 'global' : 'local') as 'local' | 'global'
    const settingsPath = resolveSettingsPath(scope, cwd)
    const current = loadSettingsMap(settingsPath)

    if (isJson) {
      const data = runner ? (current[runner] ?? {}) : current
      console.log(JSON.stringify({ status: 'SUCCESS', scope, path: settingsPath, data }))
      return
    }

    console.log(`\n${AnsiHelpers.cyan('Settings File:')} ${settingsPath}\n`)
    if (runner) {
      console.log(JSON.stringify(current[runner] ?? {}, null, 2))
    } else {
      console.log(JSON.stringify(current, null, 2))
    }
    return
  }

  // 3. Declarative Subcommand: DELETE
  if (subcommand === 'delete') {
    const scope = (flags['scope'] === 'global' ? 'global' : (positional[1] === 'global' ? 'global' : 'local')) as 'local' | 'global'
    const settingsPath = resolveSettingsPath(scope, cwd)

    if (existsSync(settingsPath)) {
      rmSync(settingsPath)
      if (isJson) {
        console.log(JSON.stringify({ status: 'SUCCESS', deleted: true, path: settingsPath }))
      } else {
        console.log(`${AnsiHelpers.green('✓')} Deleted ${settingsPath}`)
      }
    } else {
      if (isJson) {
        console.log(JSON.stringify({ status: 'SUCCESS', deleted: false, message: 'File does not exist' }))
      } else {
        console.log(`${AnsiHelpers.blue('i')} File does not exist, nothing to delete.`)
      }
    }
    return
  }

  // 4. Declarative Subcommand: RENEW
  if (subcommand === 'renew') {
    const scope = (flags['scope'] === 'global' ? 'global' : (positional[1] === 'global' ? 'global' : 'local')) as 'local' | 'global'
    const settingsPath = resolveSettingsPath(scope, cwd)

    AtomicSettingsWriter.write(settingsPath, DEFAULT_SETTINGS)
    if (isJson) {
      console.log(JSON.stringify({ status: 'SUCCESS', renewed: true, path: settingsPath, settings: DEFAULT_SETTINGS }))
    } else {
      console.log(`${AnsiHelpers.green('✓')} Settings renewed (recreated) at ${settingsPath}`)
    }
    return
  }

  // 5. Interactive Wizard Mode (when no subcommand, or subcommand === 'edit' / 'interactive')
  const { select, input } = await import('@inquirer/prompts')

  const targetScope = await select({
    message: 'Select settings scope:',
    choices: [
      { name: 'Local (.harness-kit/settings.json)', value: 'local' },
      { name: 'Global (~/.config/harness-kit/settings.json)', value: 'global' }
    ],
    default: 'local'
  }) as 'local' | 'global'

  const settingsPath = resolveSettingsPath(targetScope, cwd)
  const currentSettings = loadSettingsMap(settingsPath)

  const action = await select({
    message: 'What action do you want to perform?',
    choices: [
      { name: 'Configure Runner Default Model & Effort', value: 'runner_default' },
      { name: 'Configure Per-Phase Model Override', value: 'phase_override' },
      { name: 'Open in Text Editor', value: 'open_editor' },
      { name: 'Renew / Reset to Default Settings', value: 'renew' },
      { name: 'Delete Settings File', value: 'delete' }
    ]
  })

  if (action === 'delete') {
    if (existsSync(settingsPath)) {
      rmSync(settingsPath)
      console.log(`${AnsiHelpers.green('✓')} Deleted ${settingsPath}`)
    } else {
      console.log(`${AnsiHelpers.blue('i')} File does not exist, nothing to delete.`)
    }
    return
  }

  if (action === 'renew') {
    AtomicSettingsWriter.write(settingsPath, DEFAULT_SETTINGS)
    console.log(`${AnsiHelpers.green('✓')} Settings renewed at ${settingsPath}`)
    return
  }

  if (action === 'open_editor') {
    if (!existsSync(settingsPath)) {
      AtomicSettingsWriter.write(settingsPath, DEFAULT_SETTINGS)
    }
    console.log(`${AnsiHelpers.blue('►')} Opening in text editor...`)
    try {
      const isWindows = process.platform === 'win32'
      let hasVsCode = false
      try {
        execSync('code -v', { stdio: 'ignore' })
        hasVsCode = true
      } catch {}

      if (hasVsCode) {
        execSync(`code "${settingsPath}"`)
      } else if (isWindows) {
        execSync(`start "" "${settingsPath}"`)
      } else {
        const editor = process.env.EDITOR || process.env.VISUAL || 'nano'
        execSync(`${editor} "${settingsPath}"`, { stdio: 'inherit' })
      }
    } catch {
      console.error(`Please open the file manually: ${settingsPath}`)
    }
    return
  }

  if (action === 'runner_default') {
    const selectedRunner = await select({
      message: 'Select Runner to configure:',
      choices: KNOWN_RUNNERS.map(r => ({ name: r, value: r }))
    })

    const existingRunner = currentSettings[selectedRunner] ?? {}
    const modelInput = await input({
      message: `Default Model for ${selectedRunner} (leave empty to keep current '${existingRunner.defaultModel || 'none'}'):`,
      default: existingRunner.defaultModel || '',
      validate: (val) => {
        if (!val) return true
        try {
          SettingsValidator.validateModel(val.trim())
          return true
        } catch (err: any) {
          return err.message
        }
      }
    })

    const effortInput = await select({
      message: `Default Effort level for ${selectedRunner}:`,
      choices: [
        { name: '(keep current / default)', value: '' },
        { name: 'low', value: 'low' },
        { name: 'medium', value: 'medium' },
        { name: 'high', value: 'high' },
        { name: 'xhigh', value: 'xhigh' }
      ],
      default: existingRunner.defaultEffort || ''
    })

    const updatedRunner: RunnerSettings = {
      ...existingRunner,
      defaultModel: modelInput.trim() ? modelInput.trim() : existingRunner.defaultModel,
      defaultEffort: effortInput ? effortInput : existingRunner.defaultEffort
    }

    const updatedMap: HarnessSettingsMap = {
      ...currentSettings,
      [selectedRunner]: updatedRunner
    }

    const validated = SettingsValidator.validate(updatedMap)
    AtomicSettingsWriter.write(settingsPath, validated)
    console.log(`\n${AnsiHelpers.green('✓')} Successfully updated default model/effort for ${selectedRunner} at ${settingsPath}\n`)
    return
  }

  if (action === 'phase_override') {
    const selectedRunner = await select({
      message: 'Select Runner:',
      choices: KNOWN_RUNNERS.map(r => ({ name: r, value: r }))
    })

    const selectedPhase = await select({
      message: 'Select Phase to override:',
      choices: KNOWN_PHASES.map(p => ({ name: p, value: p }))
    })

    const existingRunner = currentSettings[selectedRunner] ?? {}
    const existingPhases = existingRunner.phases ?? {}
    const existingPhase = existingPhases[selectedPhase] ?? {}

    const phaseModel = await input({
      message: `Model override for ${selectedRunner} [${selectedPhase}] (leave empty to inherit):`,
      default: existingPhase.model || '',
      validate: (val) => {
        if (!val) return true
        try {
          SettingsValidator.validateModel(val.trim())
          return true
        } catch (err: any) {
          return err.message
        }
      }
    })

    const phaseEffort = await select({
      message: `Effort level for ${selectedRunner} [${selectedPhase}]:`,
      choices: [
        { name: '(inherit)', value: '' },
        { name: 'low', value: 'low' },
        { name: 'medium', value: 'medium' },
        { name: 'high', value: 'high' },
        { name: 'xhigh', value: 'xhigh' }
      ],
      default: existingPhase.effort || ''
    })

    const updatedPhase: PhaseSettings = {
      ...existingPhase,
      model: phaseModel.trim() ? phaseModel.trim() : undefined,
      effort: phaseEffort ? phaseEffort : undefined
    }

    const updatedRunner: RunnerSettings = {
      ...existingRunner,
      phases: {
        ...existingPhases,
        [selectedPhase]: updatedPhase
      }
    }

    const updatedMap: HarnessSettingsMap = {
      ...currentSettings,
      [selectedRunner]: updatedRunner
    }

    const validated = SettingsValidator.validate(updatedMap)
    AtomicSettingsWriter.write(settingsPath, validated)
    console.log(`\n${AnsiHelpers.green('✓')} Successfully updated phase override for ${selectedRunner} [${selectedPhase}] at ${settingsPath}\n`)
    return
  }
}

