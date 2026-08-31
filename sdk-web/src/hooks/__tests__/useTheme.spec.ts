import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isThemeMode, ThemeMode } from '../../types/index.js';
import { ThemeManager } from '../../context/ThemeContext.js';
import { useTheme } from '../useTheme.js';

describe('1.2 ThemeMode Value Object & 1.3 ThemeManager', () => {
  let originalWindow: any;
  let originalDocument: any;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    originalWindow = global.window;
    originalDocument = global.document;

    const mockDocumentElement = {
      dataset: {} as Record<string, string>,
      setAttribute: vi.fn((key: string, val: string) => {
        mockDocumentElement.dataset[key.replace('data-', '')] = val;
      }),
      getAttribute: vi.fn((key: string) => mockDocumentElement.dataset[key.replace('data-', '')]),
    };

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    const mockWindow = {
      localStorage: mockLocalStorage,
      matchMedia: vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    (global as any).window = mockWindow;
    (global as any).document = {
      documentElement: mockDocumentElement,
    };
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    (global as any).document = originalDocument;
    vi.restoreAllMocks();
  });

  describe('ThemeMode validation', () => {
    it("Should validate 'light' and 'dark' as valid ThemeMode instances", () => {
      expect(isThemeMode('light')).toBe(true);
      expect(isThemeMode('dark')).toBe(true);
    });

    it("Should reject unknown string values (e.g., 'dim', 'sepia') as invalid ThemeMode", () => {
      expect(isThemeMode('dim')).toBe(false);
      expect(isThemeMode('sepia')).toBe(false);
      expect(isThemeMode('')).toBe(false);
      expect(isThemeMode(null)).toBe(false);
      expect(isThemeMode(undefined)).toBe(false);
      expect(isThemeMode(123)).toBe(false);
    });
  });

  describe('ThemeManager state & persistence', () => {
    it("Should return 'light' as default theme when localStorage has no stored preference and OS prefers light", () => {
      expect(ThemeManager.getInitialTheme()).toBe('light');
    });

    it("Should return 'dark' when localStorage has no stored preference and OS prefers dark (prefers-color-scheme: dark)", () => {
      (global.window as any).matchMedia = vi.fn((query: string) => ({
        matches: query.includes('prefers-color-scheme: dark'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(ThemeManager.getInitialTheme()).toBe('dark');
    });

    it("Should transition from 'light' to 'dark' upon toggleTheme() invocation", () => {
      const nextTheme = ThemeManager.toggle('light');
      expect(nextTheme).toBe('dark');
      expect(global.document.documentElement.dataset.theme).toBe('dark');
      expect(global.window.localStorage.getItem('harness_theme')).toBe('dark');
    });

    it("Should transition from 'dark' to 'light' upon toggleTheme() invocation", () => {
      const nextTheme = ThemeManager.toggle('dark');
      expect(nextTheme).toBe('light');
      expect(global.document.documentElement.dataset.theme).toBe('light');
      expect(global.window.localStorage.getItem('harness_theme')).toBe('light');
    });

    it("Should set document.documentElement.dataset.theme immediately upon theme change", () => {
      ThemeManager.applyTheme('dark');
      expect(global.document.documentElement.dataset.theme).toBe('dark');
    });

    it("Should persist updated theme to localStorage under key 'harness_theme'", () => {
      ThemeManager.applyTheme('dark');
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith('harness_theme', 'dark');
      expect(mockStorage['harness_theme']).toBe('dark');
    });

    it("Should handle localStorage access errors gracefully (e.g., in private browsing mode) without throwing unhandled exceptions", () => {
      (global.window.localStorage.getItem as any).mockImplementation(() => {
        throw new Error('SecurityError: The operation is insecure.');
      });
      (global.window.localStorage.setItem as any).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        const theme = ThemeManager.getInitialTheme();
        expect(theme).toBe('light');
      }).not.toThrow();

      expect(() => {
        ThemeManager.applyTheme('dark');
      }).not.toThrow();
    });

    it("Should fallback to default light theme when localStorage is corrupted with invalid value", () => {
      mockStorage['harness_theme'] = 'invalid_theme_value';
      expect(ThemeManager.getInitialTheme()).toBe('light');
    });
  });

  describe('2.1 Theme Persistence and Storage Synchronization', () => {
    it("Should synchronize theme state across tabs when StorageEvent for key 'harness_theme' is emitted on window", () => {
      let listener: any;
      (global.window.addEventListener as any).mockImplementation((event: string, fn: any) => {
        if (event === 'storage') listener = fn;
      });

      const manager = new ThemeManager();
      const mockCallback = vi.fn();
      const unsubscribe = manager.subscribe(mockCallback);

      listener({
        key: 'harness_theme',
        newValue: 'dark',
        oldValue: 'light',
      });

      expect(mockCallback).toHaveBeenCalledWith('dark');
      expect(global.document.documentElement.dataset.theme).toBe('dark');

      unsubscribe();
    });

    it("Should ignore StorageEvent mutations for unrelated keys", () => {
      let listener: any;
      (global.window.addEventListener as any).mockImplementation((event: string, fn: any) => {
        if (event === 'storage') listener = fn;
      });

      const manager = new ThemeManager();
      const mockCallback = vi.fn();
      const unsubscribe = manager.subscribe(mockCallback);

      listener({
        key: 'other_unrelated_key',
        newValue: 'some_value',
      });

      expect(mockCallback).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('Should support useTheme hook and setTheme explicitly', () => {
      const themeContext = useTheme();
      expect(themeContext.theme).toBeDefined();

      themeContext.setTheme('dark');
      expect(themeContext.theme).toBe('dark');

      themeContext.setTheme('light');
      expect(themeContext.theme).toBe('light');

      themeContext.toggleTheme();
      expect(themeContext.theme).toBe('dark');
    });
  });
});
