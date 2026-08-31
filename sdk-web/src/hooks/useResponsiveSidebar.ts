export class SidebarStateManager {
  private _isOpen: boolean;
  private listeners: Set<(open: boolean) => void> = new Set();

  constructor(initialOpen?: boolean) {
    if (typeof initialOpen === 'boolean') {
      this._isOpen = initialOpen;
    } else {
      this._isOpen = SidebarStateManager.getInitialState();
    }
    this.initResizeListener();
  }

  private static getInitialState(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      if (window.matchMedia) {
        const mq = window.matchMedia('(min-width: 768px)');
        return mq.matches;
      }
      if (typeof window.innerWidth === 'number') {
        return window.innerWidth >= 768;
      }
    } catch {
      // Safe fallback
    }
    return true;
  }

  private initResizeListener(): void {
    if (typeof window === 'undefined') return;
    try {
      if (window.matchMedia) {
        const mq = window.matchMedia('(min-width: 768px)');
        mq.addEventListener?.('change', (e: MediaQueryListEvent) => {
          this._isOpen = e.matches;
          this.notify();
        });
      }
    } catch {
      // Ignore if matchMedia event listener is not available
    }
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  toggle(): void {
    this._isOpen = !this._isOpen;
    this.notify();
  }

  close(): void {
    this._isOpen = false;
    this.notify();
  }

  open(): void {
    this._isOpen = true;
    this.notify();
  }

  subscribe(callback: (open: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this._isOpen);
    }
  }
}

let activeSidebarManager: SidebarStateManager | null = null;

export function useResponsiveSidebar(): {
  isOpen: boolean;
  toggle(): void;
  close(): void;
  open(): void;
} {
  if (!activeSidebarManager) {
    activeSidebarManager = new SidebarStateManager();
  }

  return {
    get isOpen() {
      return activeSidebarManager!.isOpen;
    },
    toggle: () => activeSidebarManager!.toggle(),
    close: () => activeSidebarManager!.close(),
    open: () => activeSidebarManager!.open(),
  };
}
