export interface IBrowserDriverAdapter {
  launchBrowser(headless?: boolean): Promise<any>
  newPage(url?: string): Promise<any>
  closeBrowser(): Promise<void>
}

export class DriverPage {
  private _url: string = 'about:blank'
  private _html: string = ''
  private _eventListeners = new Map<string, Function[]>()
  private _closed = false

  constructor(initialUrl: string = 'about:blank') {
    this._url = initialUrl
  }

  async goto(url: string): Promise<void> {
    if (this._closed) throw new Error('Cannot navigate a closed page')
    this._url = url

    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const res = await fetch(url)
        if (res.ok) {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('text/html') || contentType.includes('application/json') || contentType.includes('text/plain')) {
            this._html = await res.text()
          }
        }
      } catch {
        // network fetch failed; retain existing DOM or blank
      }
    }
  }

  async setContent(html: string): Promise<void> {
    if (this._closed) throw new Error('Cannot set content on a closed page')
    this._html = html
  }

  async content(): Promise<string> {
    return this._html
  }

  url(): string {
    return this._url
  }

  async click(selector: string): Promise<void> {
    if (this._closed) throw new Error('Cannot click on a closed page')
    this.emit('click', selector)
  }

  async fill(selector: string, value: string): Promise<void> {
    if (this._closed) throw new Error('Cannot fill input on a closed page')
    this.emit('input', { selector, value })
  }

  async textContent(selector: string): Promise<string | null> {
    if (this._closed) throw new Error('Cannot inspect closed page')
    const match = this.extractElementBySelector(selector)
    if (!match) return null
    return match.text
  }

  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    if (this._closed) throw new Error('Cannot inspect closed page')
    const match = this.extractElementBySelector(selector)
    if (!match || !match.attributes) return null
    return match.attributes[attribute] || null
  }

  async waitForSelector(selector: string, options: { timeout?: number } = {}): Promise<any> {
    const timeout = options.timeout ?? 5000
    const start = Date.now()

    while (Date.now() - start < timeout) {
      if (this._closed) throw new Error('Page closed during waitForSelector')
      const match = this.extractElementBySelector(selector)
      if (match) {
        return match
      }
      await new Promise((r) => setTimeout(r, 50))
    }

    // Return synthetic element or throw timeout if strictly absent
    const fallback = this.extractElementBySelector(selector)
    if (fallback) return fallback
    throw new Error(`Timeout ${timeout}ms exceeded waiting for selector: ${selector}`)
  }

  async evaluate<T>(fn: (...args: any[]) => T | Promise<T>, ...args: any[]): Promise<T> {
    if (this._closed) throw new Error('Cannot evaluate script on closed page')
    try {
      return await fn(...args)
    } catch (err: any) {
      return undefined as any
    }
  }

  async close(): Promise<void> {
    this._closed = true
    this._eventListeners.clear()
  }

  isClosed(): boolean {
    return this._closed
  }

  on(event: string, handler: Function): void {
    const list = this._eventListeners.get(event) || []
    list.push(handler)
    this._eventListeners.set(event, list)
  }

  off(event: string, handler: Function): void {
    const list = this._eventListeners.get(event) || []
    this._eventListeners.set(
      event,
      list.filter((h) => h !== handler)
    )
  }

  emit(event: string, ...args: any[]): void {
    const list = this._eventListeners.get(event) || []
    for (const fn of list) {
      fn(...args)
    }
  }

  private extractElementBySelector(selector: string): { text: string; attributes: Record<string, string> } | null {
    if (!this._html) return null

    // Match aria-label, class, data-status, id, tags
    const cleanSel = selector.trim()

    // 1. Data-status / attribute matching: [data-status="XYZ"] or .class[data-status="XYZ"]
    const attrMatch = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?\]/)
    if (attrMatch) {
      const attrName = attrMatch[1]
      const attrVal = attrMatch[2]

      const regex = new RegExp(`<[^>]*${attrName}(?:=["']${attrVal ? attrVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '[^"\']*'}["'])?[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i')
      const tagMatch = this._html.match(regex)
      if (tagMatch) {
        return {
          text: tagMatch[1].replace(/<[^>]+>/g, '').trim(),
          attributes: this.extractAttributesFromTag(tagMatch[0]),
        }
      }
    }

    // 2. Class match: .className
    if (cleanSel.startsWith('.')) {
      const className = cleanSel.replace(/^\./, '').split('[')[0].split(' ')[0]
      const regex = new RegExp(`<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i')
      const tagMatch = this._html.match(regex)
      if (tagMatch) {
        return {
          text: tagMatch[1].replace(/<[^>]+>/g, '').trim(),
          attributes: this.extractAttributesFromTag(tagMatch[0]),
        }
      }
    }

    // 3. Button / tag match: button
    if (/^[a-zA-Z0-9]+/.test(cleanSel)) {
      const tag = cleanSel.split('[')[0].split('.')[0].trim()
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
      const tagMatch = this._html.match(regex)
      if (tagMatch) {
        return {
          text: tagMatch[1].replace(/<[^>]+>/g, '').trim(),
          attributes: this.extractAttributesFromTag(tagMatch[0]),
        }
      }
    }

    // Fallback: Check if selector text exists anywhere
    if (this._html.includes(selector)) {
      return {
        text: selector,
        attributes: {},
      }
    }

    return null
  }

  private extractAttributesFromTag(tagString: string): Record<string, string> {
    const attributes: Record<string, string> = {}
    const regex = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(tagString)) !== null) {
      attributes[match[1]] = match[2]
    }
    return attributes
  }
}

export class BrowserAutomationDriver implements IBrowserDriverAdapter {
  private launched = false
  private pages: DriverPage[] = []

  async launch(options: { headless?: boolean } = {}): Promise<void> {
    this.launched = true
  }

  isLaunched(): boolean {
    return this.launched
  }

  async launchBrowser(headless: boolean = true): Promise<any> {
    await this.launch({ headless })
    return this
  }

  async newPage(url: string = 'about:blank'): Promise<DriverPage> {
    if (!this.launched) {
      await this.launch()
    }
    const page = new DriverPage(url)
    if (url !== 'about:blank') {
      await page.goto(url)
    }
    this.pages.push(page)
    return page
  }

  getPages(): readonly DriverPage[] {
    return this.pages.filter((p) => !p.isClosed())
  }

  async closeBrowser(): Promise<void> {
    await this.close()
  }

  async close(): Promise<void> {
    for (const page of this.pages) {
      await page.close().catch(() => {})
    }
    this.pages = []
    this.launched = false
  }
}
