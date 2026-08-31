import { describe, it, expect } from 'vitest'
import {
  renderOverwriteGuardDialog,
  OverwriteGuardDialog,
} from '../OverwriteGuardDialog.js'

describe('OverwriteGuardDialog Component', () => {
  it('should render open dialog when isOpen is true with warning message regarding existing docs/product', () => {
    const html = renderOverwriteGuardDialog({
      isOpen: true,
      workspacePath: '/projects/my-app',
    })

    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('docs/product')
    expect(html).toContain('Overwrite')
    expect(html).toContain('Cancel')
    expect(html).toContain('btn-overwrite-confirm')
    expect(html).toContain('btn-overwrite-cancel')
  })

  it('should render hidden/closed attributes when isOpen is false', () => {
    const html = renderOverwriteGuardDialog({
      isOpen: false,
    })

    expect(html).toContain('hidden')
  })

  it('should provide alias export OverwriteGuardDialog', () => {
    expect(OverwriteGuardDialog).toBe(renderOverwriteGuardDialog)
  })
})
