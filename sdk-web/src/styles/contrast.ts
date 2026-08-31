import { ContrastRatioResult } from '../types/index.js';

function parseHex(hex: string): [number, number, number] {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleaned, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b];
}

function channelLuminance(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function computeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  const rL = channelLuminance(r);
  const gL = channelLuminance(g);
  const bL = channelLuminance(b);
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

export function computeContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = computeLuminance(fgHex);
  const lum2 = computeLuminance(bgHex);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

export function validateThemeContrast(fgHex: string, bgHex: string): ContrastRatioResult {
  const rawRatio = computeContrastRatio(fgHex, bgHex);
  const roundedRatio = Math.round(rawRatio * 100) / 100;
  return {
    ratio: roundedRatio,
    passesAA: rawRatio >= 4.5,
    fgColor: fgHex,
    bgColor: bgHex,
  };
}
