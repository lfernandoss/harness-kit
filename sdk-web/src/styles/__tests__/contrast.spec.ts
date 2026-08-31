import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  computeLuminance,
  computeContrastRatio,
  validateThemeContrast,
} from '../contrast.js';

describe('1.1 Styles and Token Contrast', () => {
  const cssPath = path.resolve(__dirname, '../theme.tokens.css');

  it('Should define --color-primary as #EC7000 (Itaú Orange) and --color-secondary as #003399 (Itaú Navy) in light mode', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toMatch(/--itau-orange:\s*#EC7000/i);
    expect(cssContent).toMatch(/--itau-navy:\s*#003399/i);
    expect(cssContent).toMatch(/--color-primary:\s*#EC7000/i);
    expect(cssContent).toMatch(/--color-secondary:\s*#003399/i);
  });

  it('Should calculate contrast ratio >= 4.5:1 between --text-primary and --bg-surface in light mode (#121212 on #FFFFFF)', () => {
    const textPrimary = '#121212';
    const bgSurface = '#FFFFFF';
    const result = validateThemeContrast(textPrimary, bgSurface);

    expect(result.passesAA).toBe(true);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    expect(result.fgColor).toBe(textPrimary);
    expect(result.bgColor).toBe(bgSurface);
  });

  it('Should calculate contrast ratio >= 4.5:1 between --text-primary and --bg-surface in dark mode (#F4F5F7 on #1E1E1E)', () => {
    const textPrimary = '#F4F5F7';
    const bgSurface = '#1E1E1E';
    const result = validateThemeContrast(textPrimary, bgSurface);

    expect(result.passesAA).toBe(true);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Should calculate contrast ratio >= 4.5:1 between primary button text and background in both light and dark themes', () => {
    // Light mode: Navy primary with white text OR high contrast text on orange
    const lightButtonNavy = validateThemeContrast('#FFFFFF', '#003399');
    expect(lightButtonNavy.passesAA).toBe(true);
    expect(lightButtonNavy.ratio).toBeGreaterThanOrEqual(4.5);

    const lightButtonOrange = validateThemeContrast('#121212', '#EC7000');
    expect(lightButtonOrange.passesAA).toBe(true);
    expect(lightButtonOrange.ratio).toBeGreaterThanOrEqual(4.5);

    // Dark mode: high contrast button with text
    const darkButton = validateThemeContrast('#121212', '#FF851A');
    expect(darkButton.passesAA).toBe(true);
    expect(darkButton.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Should define calibrated dark mode surface hierarchy (#121212 canvas, #1E1E1E card surface, #2D2D2D elevated surface)', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toMatch(/--bg-canvas:\s*#121212/i);
    expect(cssContent).toMatch(/--bg-surface:\s*#1E1E1E/i);
    expect(cssContent).toMatch(/--bg-surface-elevated:\s*#2D2D2D/i);
  });

  it('Should compute relative luminance accurately for black, white and brand colors', () => {
    expect(computeLuminance('#000000')).toBeCloseTo(0, 4);
    expect(computeLuminance('#FFFFFF')).toBeCloseTo(1, 4);
    expect(computeLuminance('#FFF')).toBeCloseTo(1, 4);
    expect(computeLuminance('#000')).toBeCloseTo(0, 4);
    expect(computeContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });
});
