import { ThemeMode, isThemeMode, ThemeContextValue, IThemeStorageAdapter } from '../types/index.js';

export class LocalStorageThemeAdapter implements IThemeStorageAdapter {
  private readonly storageKey: string;

  constructor(storageKey = 'harness_theme') {
    this.storageKey = storageKey;
  }

  getTheme(): ThemeMode | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(this.storageKey);
        if (value && isThemeMode(value)) {
          return value;
        }
      }
    } catch {
      // Safe fallback on security restrictions
    }
    return null;
  }

  setTheme(mode: ThemeMode): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, mode);
      }
    } catch {
      // Safe fallback on storage quota/security restrictions
    }
  }
}

export class ThemeManager {
  private static readonly STORAGE_KEY = 'harness_theme';
  private static readonly adapter: IThemeStorageAdapter = new LocalStorageThemeAdapter(ThemeManager.STORAGE_KEY);
  private static listeners: Set<(mode: ThemeMode) => void> = new Set();
  private static isListeningToStorage = false;

  constructor() {
    this.initStorageListener();
  }

  private initStorageListener(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (typeof window.addEventListener === 'function') {
        window.addEventListener('storage', (event: StorageEvent) => {
          if (event.key === ThemeManager.STORAGE_KEY && event.newValue && isThemeMode(event.newValue)) {
            const newTheme = event.newValue;
            if (typeof document !== 'undefined' && document.documentElement) {
              document.documentElement.dataset.theme = newTheme;
            }
            for (const listener of ThemeManager.listeners) {
              listener(newTheme);
            }
          }
        });
      }
    } catch {
      // Ignore if window / event listener unsupported
    }
  }

  static getInitialTheme(): ThemeMode {
    const stored = this.adapter.getTheme();
    if (stored && isThemeMode(stored)) {
      return stored;
    }

    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        if (query && query.matches) {
          return 'dark';
        }
      }
    } catch {
      // Fallback to light
    }

    return 'light';
  }

  static applyTheme(mode: ThemeMode): void {
    const safeMode = isThemeMode(mode) ? mode : 'light';
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dataset.theme = safeMode;
      }
      this.adapter.setTheme(safeMode);
    } catch {
      // Graceful error handling
    }

    for (const listener of ThemeManager.listeners) {
      listener(safeMode);
    }
  }

  static toggle(current: ThemeMode): ThemeMode {
    const nextMode: ThemeMode = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextMode);
    return nextMode;
  }

  subscribe(callback: (mode: ThemeMode) => void): () => void {
    ThemeManager.listeners.add(callback);
    return () => {
      ThemeManager.listeners.delete(callback);
    };
  }
}

// Global active theme context value singleton for state management
let activeThemeContext: ThemeContextValue | null = null;

export function setActiveThemeContext(context: ThemeContextValue | null): void {
  activeThemeContext = context;
}

export function getActiveThemeContext(): ThemeContextValue | null {
  return activeThemeContext;
}

export function createThemeContextValue(initialTheme?: ThemeMode): ThemeContextValue {
  let currentTheme: ThemeMode = initialTheme || ThemeManager.getInitialTheme();
  ThemeManager.applyTheme(currentTheme);

  const manager = new ThemeManager();
  manager.subscribe((newTheme) => {
    currentTheme = newTheme;
  });

  const value: ThemeContextValue = {
    get theme() {
      return currentTheme;
    },
    toggleTheme() {
      currentTheme = ThemeManager.toggle(currentTheme);
    },
    setTheme(mode: ThemeMode) {
      currentTheme = isThemeMode(mode) ? mode : 'light';
      ThemeManager.applyTheme(currentTheme);
    },
  };

  setActiveThemeContext(value);
  return value;
}
