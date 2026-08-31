import { ThemeContextValue } from '../types/index.js';
import { getActiveThemeContext, createThemeContextValue } from '../context/ThemeContext.js';

export function useTheme(): ThemeContextValue {
  const context = getActiveThemeContext();
  if (!context) {
    // If not explicitly set via provider, initialize default context
    return createThemeContextValue();
  }
  return context;
}
