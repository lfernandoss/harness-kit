"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebUiRenderer = void 0;
class WebUiRenderer {
    static getWebUiHtml(initialPath = '/') {
        return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harness Kit — Autonomous TDD Orchestration Web Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    /* ==========================================================================
       Itaú Unibanco Enterprise Design Tokens & 2026 SaaS Aesthetic
       ========================================================================== */
    :root {
      /* Brand Colors */
      --itau-orange: #EC7000;
      --itau-orange-hover: #D66500;
      --itau-orange-light: rgba(236, 112, 0, 0.08);
      --itau-orange-glow: rgba(236, 112, 0, 0.28);
      --itau-orange-gradient: linear-gradient(135deg, #FF851A 0%, #EC7000 50%, #D66500 100%);
      --itau-navy: #003399;
      --itau-navy-hover: #002266;
      --itau-navy-light: rgba(0, 51, 153, 0.08);
      --itau-navy-gradient: linear-gradient(135deg, #003399 0%, #001A4D 100%);
      --itau-gold: #FDB913;
      --itau-gold-light: rgba(253, 185, 19, 0.12);

      /* Canvas & Surfaces */
      --bg-canvas: #F8FAFC;
      --bg-surface: #FFFFFF;
      --bg-surface-elevated: #FFFFFF;
      --bg-sidebar: #001438;
      --bg-sidebar-hover: rgba(255, 255, 255, 0.06);
      --bg-sidebar-active: rgba(236, 112, 0, 0.16);
      --bg-header: rgba(255, 255, 255, 0.92);

      /* Typography */
      --text-primary: #0F172A;
      --text-secondary: #475569;
      --text-muted: #94A3B8;
      --text-sidebar: #E2E8F0;
      --text-sidebar-muted: #94A3B8;

      /* Borders & Dividers */
      --border-default: #E2E8F0;
      --border-subtle: #F1F5F9;
      --border-focus: #EC7000;

      /* Status */
      --status-connected: #10B981;
      --status-disconnected: #F43F5E;

      /* Shadows */
      --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
      --shadow-md: 0 4px 16px -2px rgba(0, 32, 96, 0.07), 0 2px 6px -1px rgba(0, 32, 96, 0.04);
      --shadow-lg: 0 12px 32px -4px rgba(0, 32, 96, 0.1), 0 4px 12px -2px rgba(0, 32, 96, 0.05);
      --shadow-glow: 0 0 24px rgba(236, 112, 0, 0.28);

      /* Terminal */
      --terminal-bg: #0A0F1D;
      --terminal-text: #38BDF8;

      /* Fonts */
      --font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace;
    }

    [data-theme='dark'] {
      /* Brand Colors in Dark Mode */
      --itau-orange: #FF7A00;
      --itau-orange-hover: #FA6B00;
      --itau-orange-light: rgba(255, 122, 0, 0.12);
      --itau-orange-glow: rgba(255, 122, 0, 0.38);
      --itau-orange-gradient: linear-gradient(135deg, #FF9433 0%, #FF7A00 50%, #E66000 100%);
      --itau-navy: #3B82F6;
      --itau-navy-hover: #2563EB;
      --itau-navy-light: rgba(59, 130, 246, 0.12);
      --itau-navy-gradient: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      --itau-gold: #FBBF24;
      --itau-gold-light: rgba(251, 191, 36, 0.14);

      /* Canvas & Surfaces */
      --bg-canvas: #070B14;
      --bg-surface: #0E1626;
      --bg-surface-elevated: #152238;
      --bg-sidebar: #050811;
      --bg-sidebar-hover: rgba(255, 255, 255, 0.05);
      --bg-sidebar-active: rgba(255, 122, 0, 0.2);
      --bg-header: rgba(14, 22, 38, 0.92);

      /* Typography */
      --text-primary: #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --text-sidebar: #E2E8F0;
      --text-sidebar-muted: #64748B;

      /* Borders & Dividers */
      --border-default: #1E2E4A;
      --border-subtle: #142036;
      --border-focus: #FF7A00;

      /* Status */
      --status-connected: #10B981;
      --status-disconnected: #F43F5E;

      /* Shadows */
      --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.6);
      --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.5);
      --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.6);
      --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.75);
      --shadow-glow: 0 0 28px rgba(255, 122, 0, 0.35);

      /* Terminal */
      --terminal-bg: #050812;
      --terminal-text: #38BDF8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-family);
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: background-color 0.25s ease, color 0.25s ease;
      background-image: radial-gradient(at 0% 0%, rgba(236, 112, 0, 0.03) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0, 51, 153, 0.04) 0px, transparent 50%);
      background-attachment: fixed;
    }

    /* Custom Sleek Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 999px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

    /* Layout */
    .app-shell { display: flex; flex-direction: column; height: 100vh; }
    
    /* Top Header */
    .workspace-header {
      height: 64px;
      background-color: var(--bg-header);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      box-shadow: var(--shadow-xs);
      z-index: 20;
    }
    .header-brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo {
      width: 36px; height: 36px;
      background: var(--itau-orange-gradient);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 19px;
      box-shadow: var(--shadow-glow);
      position: relative;
      overflow: hidden;
    }
    .brand-logo::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 50%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%);
    }
    .brand-title {
      font-size: 19px; font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.6px;
      display: flex; align-items: center; gap: 8px;
    }
    .brand-pro-tag {
      font-size: 10px; font-weight: 800;
      padding: 2px 7px;
      background: var(--itau-orange-gradient);
      color: #FFFFFF;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(236, 112, 0, 0.35);
    }
    .brand-tag {
      font-size: 11px; padding: 2px 8px;
      background-color: var(--border-subtle);
      border: 1px solid var(--border-default);
      border-radius: 12px; font-weight: 600; color: var(--text-secondary);
      font-family: var(--font-mono);
    }
    .header-actions { display: flex; align-items: center; gap: 14px; }
    
    .status-badge {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 600;
      padding: 6px 14px; border-radius: 999px;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .status-connected {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--status-connected);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .status-disconnected {
      background-color: rgba(244, 63, 94, 0.1);
      color: var(--status-disconnected);
      border-color: rgba(244, 63, 94, 0.25);
    }
    .status-dot-pulse {
      width: 8px; height: 8px; border-radius: 50%;
      background-color: currentColor;
      position: relative;
    }
    .status-dot-pulse::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0.4;
      animation: beaconPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes beaconPing {
      75%, 100% { transform: scale(2.2); opacity: 0; }
    }

    .theme-toggle-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      width: 38px; height: 38px;
      border-radius: 10px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: var(--shadow-xs);
    }
    .theme-toggle-btn:hover {
      background-color: var(--border-subtle);
      border-color: var(--border-focus);
      transform: translateY(-1px);
    }

    /* App Body */
    .app-body { display: flex; flex: 1; overflow: hidden; }

    /* Sidebar */
    .app-sidebar {
      width: 256px;
      background-color: var(--bg-sidebar);
      display: flex; flex-direction: column;
      padding: 24px 14px;
      gap: 4px;
      flex-shrink: 0;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
    }
    .sidebar-category {
      font-size: 10px; font-weight: 800;
      color: rgba(255, 255, 255, 0.35);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding: 12px 14px 6px;
      margin-top: 6px;
    }
    .nav-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 9px;
      color: var(--text-sidebar); text-decoration: none;
      font-size: 13.5px; font-weight: 500;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .nav-link:hover {
      background-color: var(--bg-sidebar-hover);
      color: #FFFFFF;
      transform: translateX(3px);
    }
    .nav-link.active {
      background: var(--bg-sidebar-active);
      color: #FFFFFF;
      font-weight: 600;
      border-left: 3px solid var(--itau-orange);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    .nav-svg {
      flex-shrink: 0;
      color: var(--text-sidebar-muted);
      transition: color 0.18s;
    }
    .nav-link:hover .nav-svg,
    .nav-link.active .nav-svg {
      color: var(--itau-orange);
    }

    .sidebar-footer {
      margin-top: auto; padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .sidebar-status-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px;
      font-size: 11px;
      color: var(--text-sidebar-muted);
    }
    .sidebar-status-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; font-weight: 700; color: #FFFFFF;
    }

    /* Content Area */
    .app-content {
      flex: 1;
      padding: 28px 36px;
      overflow-y: auto;
      background-color: transparent;
    }

    /* SaaS Hero KPI Grid */
    .saas-hero-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .saas-kpi-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 14px;
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    .saas-kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--border-focus);
    }
    .saas-kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: var(--itau-orange-gradient);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .saas-kpi-card:hover::before { opacity: 1; }
    .saas-kpi-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .saas-kpi-title {
      font-size: 11px; font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .saas-pulse-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10px; font-weight: 800;
      padding: 2px 7px; border-radius: 999px;
      background: var(--itau-orange-light);
      color: var(--itau-orange);
      letter-spacing: 0.4px;
    }
    .saas-pulse-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background-color: var(--itau-orange);
      animation: beaconPing 1.8s infinite;
    }
    .saas-pill-tag {
      font-size: 10px; font-weight: 700;
      padding: 2px 6px; border-radius: 6px;
      background: var(--border-subtle);
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
    }
    .saas-kpi-val {
      font-size: 22px; font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .saas-kpi-sub {
      font-size: 12px; color: var(--text-secondary);
    }

    /* Cards & Containers */
    .view-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 16px;
      padding: 26px 28px;
      box-shadow: var(--shadow-sm);
      margin-bottom: 24px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .view-title {
      font-size: 20px; font-weight: 800;
      margin-bottom: 6px;
      color: var(--text-primary);
      letter-spacing: -0.4px;
      display: flex; align-items: center; gap: 10px;
    }
    .view-subtitle {
      font-size: 13.5px; color: var(--text-secondary);
      margin-bottom: 22px; line-height: 1.5;
    }

    /* Form Inputs */
    .form-group { margin-bottom: 18px; }
    .form-label {
      display: block; font-size: 12.5px; font-weight: 700;
      margin-bottom: 7px; color: var(--text-primary);
      letter-spacing: 0.1px;
    }
    .form-control {
      width: 100%; padding: 11px 16px;
      background-color: var(--bg-canvas);
      border: 1px solid var(--border-default);
      border-radius: 10px; font-size: 14px;
      color: var(--text-primary);
      font-family: inherit;
      outline: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .form-control:focus {
      border-color: var(--itau-orange);
      background-color: var(--bg-surface);
      box-shadow: 0 0 0 3.5px var(--itau-orange-light);
    }
    textarea.form-control {
      resize: vertical; min-height: 95px; line-height: 1.5;
    }

    .form-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 11px 22px; border-radius: 10px; font-size: 13.5px; font-weight: 700;
      border: none; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      letter-spacing: -0.2px;
      user-select: none;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary {
      background: var(--itau-orange-gradient);
      color: #FFFFFF;
      box-shadow: 0 2px 10px rgba(236, 112, 0, 0.32);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #FF9433 0%, #F57500 50%, #E06800 100%);
      box-shadow: 0 4px 16px rgba(236, 112, 0, 0.42);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: var(--itau-navy);
      color: #FFFFFF;
      box-shadow: 0 2px 8px rgba(0, 51, 153, 0.25);
    }
    .btn-secondary:hover {
      background-color: var(--itau-navy-hover);
      box-shadow: 0 4px 14px rgba(0, 51, 153, 0.35);
      transform: translateY(-1px);
    }
    .btn-outline {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      box-shadow: var(--shadow-xs);
    }
    .btn-outline:hover {
      background-color: var(--border-subtle);
      border-color: var(--text-muted);
      transform: translateY(-1px);
    }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }

    /* Timeline Stepper */
    .timeline-container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin: 32px 0 18px;
      position: relative;
      padding: 0 16px;
    }
    .timeline-track-bg {
      position: absolute;
      top: 22px; left: 45px; right: 45px;
      height: 4px;
      background-color: var(--border-default);
      border-radius: 4px;
      z-index: 1;
    }
    .timeline-track-fill {
      position: absolute;
      top: 22px; left: 45px;
      height: 4px;
      background: linear-gradient(90deg, var(--status-connected) 0%, var(--itau-orange) 100%);
      border-radius: 4px;
      z-index: 1;
      transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 0 12px var(--itau-orange-glow);
      width: 16%;
    }
    .timeline-step {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      z-index: 2; position: relative; min-width: 90px;
    }
    .step-circle {
      width: 44px; height: 44px;
      border-radius: 50%;
      background-color: var(--bg-surface);
      border: 2px solid var(--border-default);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800;
      color: var(--text-muted);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      box-shadow: var(--shadow-sm);
    }
    .step-completed .step-circle {
      background-color: var(--status-connected);
      border-color: var(--status-connected);
      color: #FFFFFF;
      box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35);
    }
    .step-completed .step-label {
      color: var(--status-connected);
      font-weight: 700;
    }
    .step-active .step-circle {
      background: var(--itau-orange-gradient);
      border-color: var(--itau-orange);
      color: #FFFFFF;
      box-shadow: var(--shadow-glow);
      animation: pulseActive 2.2s infinite ease-in-out;
    }
    .step-active .step-circle::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2.5px dashed var(--itau-orange);
      animation: rotateLoop 4s linear infinite;
    }
    .step-active .step-circle::before {
      content: '';
      position: absolute;
      inset: -14px;
      border-radius: 50%;
      border: 1.5px solid var(--itau-orange-glow);
      animation: pulseRadar 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }

    .step-label {
      font-size: 12px; font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .step-active .step-label {
      color: var(--itau-orange);
    }

    .step-badge-status {
      display: none;
      font-size: 10px; font-weight: 800;
      padding: 3px 9px; border-radius: 12px;
      margin-top: 2px;
    }
    .step-active .step-badge-status {
      display: inline-flex; align-items: center; gap: 5px;
      background-color: var(--itau-orange-light);
      color: var(--itau-orange);
      border: 1px solid rgba(236, 112, 0, 0.3);
      animation: badgeGlow 1.6s ease-in-out infinite alternate;
    }
    .step-completed .step-badge-status {
      display: inline-flex; align-items: center;
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--status-connected);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    @keyframes rotateLoop {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulseRadar {
      0% { transform: scale(0.7); opacity: 0.9; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    @keyframes pulseActive {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes badgeGlow {
      0% { opacity: 0.85; box-shadow: 0 0 0 rgba(236, 112, 0, 0); }
      100% { opacity: 1; box-shadow: 0 0 8px rgba(236, 112, 0, 0.4); }
    }

    /* KPI Cards in Settings & Reports */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .kpi-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 12px; padding: 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .kpi-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border-focus);
    }
    .kpi-title {
      font-size: 11.5px; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.7px; margin-bottom: 8px;
    }
    .kpi-value {
      font-size: 26px; font-weight: 800;
      color: var(--text-primary); letter-spacing: -0.5px;
    }

    /* Developer Grade Terminal */
    .terminal-window {
      background-color: var(--terminal-bg);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column;
      height: 400px;
    }
    .terminal-header {
      background-color: rgba(255, 255, 255, 0.04);
      padding: 10px 18px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px; color: #94A3B8;
      font-family: var(--font-mono);
    }
    .terminal-window-dots {
      display: flex; align-items: center; gap: 6px;
    }
    .terminal-dot {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .terminal-dot.red { background-color: #FF5F56; }
    .terminal-dot.yellow { background-color: #FFBD2E; }
    .terminal-dot.green { background-color: #27C93F; }

    .terminal-actions {
      display: flex; align-items: center; gap: 8px;
    }
    .terminal-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #E2E8F0;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-family);
      cursor: pointer;
      display: flex; align-items: center; gap: 4px;
      transition: all 0.15s;
    }
    .terminal-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #FFFFFF;
    }

    .terminal-body {
      flex: 1; padding: 18px;
      overflow-y: auto; font-family: var(--font-mono);
      font-size: 13px; line-height: 1.6; color: #E2E8F0;
      white-space: pre-wrap; word-break: break-all;
    }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .data-table th {
      text-align: left; padding: 12px 16px;
      font-size: 11.5px; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 2px solid var(--border-default);
    }
    .data-table td {
      padding: 13px 16px; font-size: 13.5px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .data-table tr:hover td {
      background-color: var(--border-subtle);
    }

    /* Modals */
    .modal-overlay {
      display: none; position: fixed; inset: 0;
      background-color: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
      align-items: center; justify-content: center;
      padding: 24px;
    }
    .modal-overlay.open { display: flex; }
    .modal-card {
      background-color: var(--bg-surface);
      border-radius: 16px;
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-lg);
      width: 100%; max-width: 820px;
      max-height: 90vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      padding: 20px 26px;
      border-bottom: 1px solid var(--border-default);
      display: flex; align-items: center; justify-content: space-between;
      background-color: var(--bg-surface-elevated);
    }
    .modal-body {
      padding: 26px; overflow-y: auto; flex: 1;
    }
    .modal-footer {
      padding: 18px 26px;
      border-top: 1px solid var(--border-default);
      display: flex; align-items: center; justify-content: flex-end;
      gap: 12px; background-color: var(--border-subtle);
    }
    .question-card {
      background-color: var(--bg-canvas);
      border: 1px solid var(--border-default);
      border-radius: 12px; padding: 18px; margin-bottom: 18px;
    }
    .question-title { font-size: 14.5px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary); }
    .question-context { font-size: 12.5px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.5; }
    .question-rec { font-size: 12.5px; font-weight: 700; color: var(--itau-orange); margin-bottom: 8px; }

    /* View Switcher */
    .view-section { display: none; }
    .view-section.active { display: block; animation: fadeInView 0.2s ease-out; }
    @keyframes fadeInView {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  
        /* Cybernetic Mission Control & Autonomous Agent HUD Styles */
    .hud-container { position: relative; width: 100%; }
    .hud-panel {
      background: #090d19;
      border: 1px solid rgba(56, 189, 248, 0.22);
      border-radius: 14px;
      box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      position: relative;
    }
    .hud-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      border-bottom: 1px solid rgba(56, 189, 248, 0.15);
      background: rgba(15, 23, 42, 0.6);
      border-radius: 13px 13px 0 0;
    }
    .hud-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .hud-pill-cyan {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #38bdf8;
    }
    .hud-pill-emerald {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }
    .hud-pill-amber {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }
    .hud-pill-rose {
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #fb7185;
    }
    .agent-matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .agent-card {
      background: #0b1122;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 18px;
      position: relative;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .agent-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      background: #0f1830;
      transform: translateY(-3px);
      box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.5);
    }
    .agent-card.active {
      border-color: #38bdf8;
      background: #111d3a;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);
    }
    .agent-tag {
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.06);
      color: #94a3b8;
    }
    @media (max-width: 960px) {
      .onboarding-grid-2col {
        grid-template-columns: 1fr !important;
      }
    }

</style>

  <!-- Onboarding 3D & Motion CDNs -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>

</head>
<body>
  <div class="app-shell">
    <!-- Header -->
    <header class="workspace-header">
      <div class="header-brand">
        <div class="brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="brand-title">
            <span>Harness Kit</span>
            <span class="brand-pro-tag">PRO</span>
            <span class="brand-tag">v0.6.1</span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <div id="connBadge" class="status-badge status-connected">
          <span class="status-dot-pulse"></span>
          <span id="connText">Connected (127.0.0.1:3000)</span>
        </div>
        <button id="themeToggle" class="theme-toggle-btn" title="Alternar tema Claro / Escuro">
          <span id="themeIcon">🌙</span>
        </button>
      </div>
    </header>

    <!-- App Body -->
    <div class="app-body">
      <!-- Sidebar -->
      <aside class="app-sidebar">

        <div class="sidebar-category" style="color: #38bdf8;">✨ Comece Aqui</div>
        <a href="#/onboarding" class="nav-link" data-route="onboarding" style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; margin-bottom: 8px;">
          <svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>
          <span style="font-weight: 700; color: #38bdf8;">Mission Control (Swarm)</span>
        </a>

        <div class="sidebar-category">Core Engine</div>
        <a href="#/run" class="nav-link active" data-route="run">
          <svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
          <span>Orchestration</span>
        </a>
        <a href="#/settings" class="nav-link" data-route="settings">
          <svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Settings & Models</span>
        </a>

        <div class="sidebar-category">Observability</div>
        <a href="#/reports" class="nav-link" data-route="reports">
          <svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>Reports & Cost</span>
        </a>
        <a href="#/diagnose" class="nav-link" data-route="diagnose">
          <svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l3 3"/><path d="M4 18l3 3"/></svg>
          <span>Diagnostics & Meta-Loop</span>
        </a>

        <div class="sidebar-category">Resources</div>
        <a href="/docs" class="nav-link" target="_blank">
          <svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span>Swagger OpenAPI ↗</span>
        </a>

        <div class="sidebar-footer">
          <div class="sidebar-status-card">
            <div class="sidebar-status-header">
              <span>TDD Sovereign Hub</span>
              <span style="color: var(--status-connected);">● Online</span>
            </div>
            <div>Worktree: <strong>Isolated</strong></div>
            <div style="margin-top: 4px; font-size: 10px; color: var(--text-sidebar-muted);">Itaú Unibanco Design System</div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="app-content">
        <!-- VIEW 1: RUN / ORCHESTRATION -->
        <section id="view-run" class="view-section active">
          <!-- SaaS Core KPI Highlights -->
          <div class="saas-hero-kpi-grid">
            <div class="saas-kpi-card">
              <div class="saas-kpi-header">
                <span class="saas-kpi-title">AUTONOMOUS TDD ENGINE</span>
                <span class="saas-pulse-badge"><span class="saas-pulse-dot"></span>ACTIVE</span>
              </div>
              <div class="saas-kpi-val">Sovereign FSM</div>
              <div class="saas-kpi-sub">Bootstrap → Spec → TDD → Memory</div>
            </div>
            <div class="saas-kpi-card">
              <div class="saas-kpi-header">
                <span class="saas-kpi-title">DECISION GATE VERDICT</span>
                <span class="saas-pill-tag">PASS</span>
              </div>
              <div class="saas-kpi-val" style="color: var(--status-connected);">1.00 <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">/ 1.00</span></div>
              <div class="saas-kpi-sub">Tech Lead + Adversarial QA Gates</div>
            </div>
            <div class="saas-kpi-card">
              <div class="saas-kpi-header">
                <span class="saas-kpi-title">DEFAULT RUNNER & MODEL</span>
                <span class="saas-pill-tag">CONFIGURED</span>
              </div>
              <div class="saas-kpi-val" style="color: var(--itau-orange); font-size: 19px;" id="heroActiveRunnerName">Antigravity CLI</div>
              <div class="saas-kpi-sub" id="heroActiveRunnerModel">Gemini 3.7 Flash • Fallback Active</div>
            </div>
            <div class="saas-kpi-card">
              <div class="saas-kpi-header">
                <span class="saas-kpi-title">WORKSPACE JIT SANDBOX</span>
                <span class="saas-pill-tag">ISOLATED</span>
              </div>
              <div class="saas-kpi-val" style="font-size: 19px;">Git Worktrees</div>
              <div class="saas-kpi-sub">Zero Branch Pollution Guaranteed</div>
            </div>
          </div>

          <!-- Multi-Task Concurrent Tab Bar -->
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-default); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; overflow-x: auto;" id="hubTasksTabBar">
            <button type="button" id="btnHubNewTaskTab" class="btn btn-primary btn-sm" style="white-space: nowrap; display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 12.5px;">
              <span>+ Nova Tarefa Paralela</span>
            </button>
            <div id="hubActiveTasksPills" style="display: flex; gap: 8px; align-items: center; flex: 1; overflow-x: auto;">
              <!-- Dynamic task pills rendered here -->
            </div>
          </div>

          <div class="view-card">
            <div id="activeTaskMetaBar" style="display: none; background: rgba(0, 51, 153, 0.05); border: 1px solid var(--itau-navy); border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>Sessão 1:1:</strong> <code id="lblActiveSessionId">sess-none</code> |
                <strong>Ciclo:</strong> <code id="lblActiveCycleId">cycle-none</code> |
                <strong>Worktree:</strong> <span id="lblActiveWorktree">isolado</span>
              </div>
              <span id="lblActiveTaskBadge" class="status-badge status-connected" style="font-size: 11px;">RUNNING</span>
            </div>

            <h2 class="view-title" id="hubFormTitle">🚀 Autonomous Orchestration Hub</h2>
            <p class="view-subtitle">Dispare e acompanhe tarefas autônomas em paralelo com aprovação de specs (Bootstrap → Refinement → Planning → Development → Review → Memory).</p>
            
            <form id="runForm">
              <div class="form-group">
                <label class="form-label" for="scopeInput">Project Scope / PRD Description</label>
                <textarea id="scopeInput" class="form-control" placeholder="Ex: Implementar autenticação JWT com refresh token e testes unitários completos em Vitest..." required>implementar no web ao clickar em Project Workspace Path abrir o explorador de arquivos para selecionar a pasta do projeto</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="agentSelect">Agent Runner</label>
                  <select id="agentSelect" class="form-control">
                    <option value="antigravity-cli" selected>Antigravity CLI (Gemini 3.7 Flash)</option>
                    <option value="claude-cli">Claude Code CLI (Sonnet / Opus)</option>
                    <option value="copilot-cli">GitHub Copilot CLI (GPT-5.6 Sol)</option>
                    <option value="cursor-cli">Cursor CLI (Agent mode)</option>
                    <option value="codex-cli">Codex CLI</option>
                    <option value="kiro-cli">Kiro CLI</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="modeSelect">Execution Mode</label>
                  <select id="modeSelect" class="form-control">
                    <option value="deep_thinking" selected>Deep Thinking (Questionário Socrático + Alta Complexidade)</option>
                    <option value="thinking">Thinking (Padrão Autônomo Completo)</option>
                    <option value="fast">Fast (Rápido - Baixa Complexidade 003+004)</option>
                    <option value="quick">Quick (Prototipagem Rápida - Pula Review e Memory)</option>
                  </select>
                </div>
              </div>

              <div id="deepThinkingAlert" style="margin-bottom: 16px; padding: 12px 16px; background: rgba(236,112,0,0.1); border: 1px solid var(--itau-orange); border-radius: 8px; font-size: 13px;">
                💡 <strong>Modo Deep Thinking:</strong> As decisões arquiteturais socráticas serão validadas e consolidadas em <code>docs/product/REFINEMENT.md</code> antes da escrita de código.
              </div>

              <div class="form-group">
                <label class="form-label" for="projectInput">Project Workspace Path</label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" id="projectInput" class="form-control" value="C:/Users/psn_l/projetos/harness-kit" placeholder="Caminho absoluto da pasta do projeto..." required style="flex: 1;" />
                  <button type="button" id="btnBrowseFolder" class="btn btn-outline" style="white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                    <span>📁 Selecionar Pasta</span>
                  </button>
                </div>
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; align-items: center;">
                <button type="submit" class="btn btn-primary" id="btnStartRun">
                  <span>▶ Iniciar Ciclo Autônomo</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btnViewSocraticQuestions" style="display: flex; align-items: center; gap: 6px;" title="Ver questões socráticas geradas no Refinamento">
                  <span>🧠 Ver Questões Socráticas</span>
                </button>
                <button type="button" class="btn btn-outline" id="btnAbortJob" style="border-color: var(--status-disconnected); color: var(--status-disconnected);" title="Cancela a execução em andamento e limpa o estado">
                  <span>🛑 Cancelar / Excluir Execução</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Phase Timeline -->
          <div class="view-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <h3 class="view-title" style="font-size: 16px; margin-bottom: 0;">TDD Pipeline Lifecycle</h3>
              <span id="pipelineStatusTag" style="font-size: 11px; font-weight: 700; color: var(--text-secondary); padding: 3px 10px; border-radius: 12px; background-color: var(--border-subtle);">
                Status: AGUARDANDO JOB
              </span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Ciclo TDD autônomo com feedback loop contínuo e validação de qualidade.</p>
            <div class="timeline-container">
              <div class="timeline-track-bg"></div>
              <div class="timeline-track-fill" id="timelineTrackFill"></div>
              <div class="timeline-step" id="step-BOOTSTRAP">
                <div class="step-circle"><span class="step-num">1</span></div>
                <span class="step-label">Bootstrap</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-REFINEMENT">
                <div class="step-circle"><span class="step-num">2</span></div>
                <span class="step-label">Refinement</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-PLANNING">
                <div class="step-circle"><span class="step-num">3</span></div>
                <span class="step-label">Planning</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-DEVELOPMENT">
                <div class="step-circle"><span class="step-num">4</span></div>
                <span class="step-label">Development</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-REVIEW">
                <div class="step-circle"><span class="step-num">5</span></div>
                <span class="step-label">Review (TL+QA)</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
              <div class="timeline-step" id="step-MEMORY">
                <div class="step-circle"><span class="step-num">6</span></div>
                <span class="step-label">Memory</span>
                <span class="step-badge-status">Aguardando</span>
              </div>
            </div>
          </div>

          <!-- Spec Approval Gate Banner (Human-in-the-Loop) -->
          <div id="specApprovalBanner" class="view-card" style="display: none; border-left: 4px solid var(--itau-orange); background: rgba(236,112,0,0.06); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div style="flex: 1;">
                <h3 style="font-size: 16px; font-weight: 700; color: var(--itau-orange); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                  <span>📋 Gate de Aprovação: Especificações & Arquitetura Prontas</span>
                </h3>
                <p style="font-size: 13px; color: var(--text-primary); margin-bottom: 10px;">
                  As fases de Refinamento e Planejamento foram concluídas com sucesso para esta tarefa. Revise o design antes de autorizar a escrita de código.
                </p>
                <div id="specSummaryBox" style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 6px; padding: 10px; font-family: monospace; font-size: 12px; margin-bottom: 12px; max-height: 120px; overflow-y: auto; color: var(--text-primary);">
                  Especificação aprovada pelo Software Architect. Pronto para desenvolvimento.
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button type="button" id="btnApproveSpecAndDev" class="btn btn-primary">
                <span>✅ Aprovar Spec e Iniciar Desenvolvimento</span>
              </button>
              <button type="button" id="btnInspectFullSpec" class="btn btn-outline">
                <span>👁️ Inspecionar Decisões Arquiteturais</span>
              </button>
              <button type="button" id="btnRejectSpec" class="btn btn-secondary">
                <span>✏️ Solicitar Ajustes</span>
              </button>
            </div>
          </div>

          <!-- Live Terminal Console -->
          <div class="terminal-window">
            <div class="terminal-header">
              <div class="terminal-window-dots">
                <span class="terminal-dot red"></span>
                <span class="terminal-dot yellow"></span>
                <span class="terminal-dot green"></span>
                <span style="margin-left: 8px; font-weight: 700; color: #E2E8F0; font-size: 11.5px; letter-spacing: 0.3px;">● LIVE TDD LOG CONSOLE</span>
              </div>
              <div class="terminal-actions">
                <span id="activeJobLabel" style="font-family: var(--font-mono); font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.06); color: var(--terminal-text);">Job: IDLE</span>
                <button type="button" id="btnCopyTerminal" class="terminal-btn" title="Copiar logs completos para a área de transferência">📋 Copiar</button>
                <button type="button" id="btnAutoscrollTerminal" class="terminal-btn" title="Alternar rolagem automática">⬇️ Auto-scroll</button>
                <button type="button" id="btnClearTerminal" class="terminal-btn" title="Limpar mensagens do console">🧹 Limpar</button>
              </div>
            </div>
            <div class="terminal-body" id="logTerminal">[HRNS Server] Connected to localhost daemon on port 3000.
[HRNS Server] Ready to receive orchestration jobs.
> Pronto para executar tarefas autônomas.</div>
          </div>
        </section>

        <!-- VIEW 2: SETTINGS -->
        <section id="view-settings" class="view-section">
          <div class="view-card">
            <h2 class="view-title">⚙️ Settings & Agent Configurations</h2>
            <p class="view-subtitle">Ajuste os modelos de IA, níveis de esforço de raciocínio e timeouts por fase sem mexer no código.</p>

            <div class="form-row" style="margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label">Scope</label>
                <select id="settingsScope" class="form-control">
                  <option value="global">Global (~/.config/harness-kit/settings.json)</option>
                  <option value="project" selected>Project (.harness-kit/settings.json)</option>
                </select>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-title">Bootstrap Model</div>
                <div class="kpi-value" style="font-size: 16px;">gemini-3.7-flash</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Planning Model</div>
                <div class="kpi-value" style="font-size: 16px;">anthropic.claude-5-sonnet</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Implementation Model</div>
                <div class="kpi-value" style="font-size: 16px;">gpt-5.6-luna (xhigh)</div>
              </div>
            </div>

            <button class="btn btn-primary" id="btnSaveSettings">💾 Salvar Configurações</button>
            <button class="btn btn-outline" id="btnRenewSettings">🔄 Restaurar Padrões</button>
          </div>
        </section>

        <!-- VIEW 3: REPORTS & TELEMETRY -->
        <section id="view-reports" class="view-section">
          <div class="view-card">
            <h2 class="view-title">📊 Token Telemetry & Financial Cost Analytics</h2>
            <p class="view-subtitle">Métricas agregadas em tempo real a partir de tokens.jsonl.</p>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-title">Total Estimated Cost</div>
                <div class="kpi-value" style="color: var(--itau-orange);">$7.76 USD</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Cache Read Savings</div>
                <div class="kpi-value" style="color: var(--status-connected);">+$11.06 USD</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Total Tokens</div>
                <div class="kpi-value">3.73M</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Backlog Health</div>
                <div class="kpi-value" style="color: var(--status-connected);">100% Passing</div>
              </div>
            </div>

            <h3 style="font-size: 16px; margin: 20px 0 8px;">Breakdown por Skill do Harness</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Skill / Agente</th>
                  <th>Input Tokens</th>
                  <th>Output Tokens</th>
                  <th>Cache Read</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>tdd-orchestrator</strong></td>
                  <td>1,274</td>
                  <td>16,776</td>
                  <td>1,962,417</td>
                  <td>$2.86</td>
                </tr>
                <tr>
                  <td><strong>scope-refinement</strong></td>
                  <td>2,759</td>
                  <td>14,806</td>
                  <td>793,672</td>
                  <td>$2.99</td>
                </tr>
                <tr>
                  <td><strong>project-memory</strong></td>
                  <td>13</td>
                  <td>4,684</td>
                  <td>240,743</td>
                  <td>$0.75</td>
                </tr>
                <tr>
                  <td><strong>the-grumpy-tech-lead</strong></td>
                  <td>57</td>
                  <td>3,372</td>
                  <td>287,236</td>
                  <td>$0.55</td>
                </tr>
                <tr>
                  <td><strong>adversarial-qa</strong></td>
                  <td>57</td>
                  <td>3,323</td>
                  <td>323,149</td>
                  <td>$0.37</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- VIEW 4: DIAGNOSTICS & META-HARNESS LOOP (UNIFIED) -->
        <section id="view-diagnose" class="view-section">
          <div class="view-card">
            <h2 class="view-title">🧬 Harness Diagnostics & Meta-Harness Loop</h2>
            <p class="view-subtitle">HarnessKit continuously evaluates and optimizes its own prompt harnesses based on real execution telemetry.</p>
            
            <!-- Meta-Harness Optimization Loop Flow -->
            <div style="margin: 20px 0; padding: 20px; background: #0d1117; border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="font-size: 14px; font-weight: 700; color: var(--itau-orange); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span>🧬 Meta-Harness Optimization Loop</span>
              </div>
              <pre style="margin: 0; font-family: monospace; font-size: 12px; color: #58a6ff; line-height: 1.6; white-space: pre; overflow-x: auto;">
Sessions (real work)
       ↓
 meta-harness-agent    ← runs harness-tracer (records execution traces to docs/harness-history/)
       ↓
 harness-evaluator     ← aggregates traces, calculates Pareto frontier scores
       ↓
 meta-harness          ← proposes targeted improvements to SKILL.md instructions
       ↓
 Human review & promotion
              </pre>
            </div>

            <!-- Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 20px 0;">
              <div style="padding: 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Sessões Pendentes</div>
                <div id="diagnosePendingCount" style="font-size: 28px; font-weight: 700; color: var(--itau-orange); margin-top: 4px;">0</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">diagnose-sessions.jsonl</div>
              </div>
              <div style="padding: 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Traces Gravados</div>
                <div id="diagnoseTracesCount" style="font-size: 28px; font-weight: 700; color: var(--status-connected); margin-top: 4px;">0</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">docs/harness-history/traces/</div>
              </div>
              <div style="padding: 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Candidatos Gerados</div>
                <div id="diagnoseCandidatesCount" style="font-size: 28px; font-weight: 700; color: #8b5cf6; margin-top: 4px;">0</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">docs/harness-history/candidates/</div>
              </div>
            </div>

            <!-- Action Controls -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
              <button class="btn btn-primary" id="btnRunDiagnosis">⚡ Executar Diagnóstico em Lote (Batch of 3)</button>
              <button class="btn btn-outline" id="btnEvaluatePareto">📊 Avaliar Pareto Frontier</button>
              <button class="btn btn-outline" id="btnProposeCandidate">💡 Propor Otimização (Meta-Harness)</button>
              <button class="btn btn-outline" id="btnRefreshDiagnose">🔄 Atualizar Status</button>
            </div>

            <!-- Dedicated Live Terminal -->
            <div style="margin-top: 16px;">
              <label class="form-label">Terminal de Diagnóstico & Tracing</label>
              <div id="diagnoseTerminal" style="background: #0d1117; color: #58a6ff; font-family: monospace; font-size: 12px; padding: 14px; border-radius: 8px; min-height: 140px; max-height: 240px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;">[DIAGNOSE] Pronto para executar análise retrospectiva de sessões.</div>
            </div>

            <!-- Traces Subsection -->
            <div style="margin-top: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label class="form-label" style="margin-bottom: 0;">📁 Traces de Sessões Gravados (docs/harness-history/traces/)</label>
                <span id="tracesFoundBadge" class="status-badge status-connected" style="font-size: 11px;">0 traces</span>
              </div>
              <div id="tracesListContainer" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                <span style="font-size: 12px; color: var(--text-secondary);">Carregando traces gravados...</span>
              </div>
            </div>

            <!-- Candidates Subsection -->
            <div style="margin-top: 32px; border-top: 1px solid var(--border-color); padding-top: 24px;">
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">💡 Meta-Harness Improvement Candidates</h3>
              <p class="view-subtitle" style="margin-bottom: 16px;">Otimizações de prompt e regras geradas autonomamente pelo meta-harness-agent para evolução contínua.</p>
              
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID do Candidato</th>
                    <th>Skill Alvo</th>
                    <th>Gatilho / Hipótese Causal</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody id="candidatesTableBody">
                  <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 16px;">Carregando candidatos a melhoria...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      
                <!-- VIEW 0: AUTONOMOUS AGENT MISSION CONTROL & HARNESS ONBOARDING -->
        <section id="view-onboarding" class="view-section">
          <!-- Cybernetic Hero Deck -->
          <div class="hud-panel" style="padding: 28px 32px; margin-bottom: 24px; border-top: 3px solid #38bdf8;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
              <div style="max-width: 840px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                  <span class="hud-pill hud-pill-cyan">● MISSION CONTROL</span>
                  <span class="hud-pill hud-pill-emerald">HARNESS INTEGRITY: 98.7%</span>
                  <span class="hud-pill hud-pill-amber">SANDBOX: GIT WORKTREE ISOLATION</span>
                  <span class="hud-pill hud-pill-rose">GATE: DUAL ADVERSARIAL AUDIT</span>
                </div>
                <h1 style="font-size: 28px; font-weight: 800; color: #f8fafc; margin: 0 0 10px; line-height: 1.25; font-family: 'Plus Jakarta Sans', sans-serif;">
                  HarnessKit: Scaffolding Determinístico para Agentes Autônomos
                </h1>
                <p style="font-size: 14.5px; color: #94a3b8; line-height: 1.6; margin: 0 0 16px;">
                  Modelos de IA são motores probabilísticos sujeitos a alucinações, drift de contexto e quebra de contratos. O <strong>HarnessKit</strong> atua como um arnês de precisão industrial: ele enclausura os LLMs em <strong>Git Worktrees efêmeros</strong>, <strong>Memória Viva em Grafo</strong>, <strong>Ciclo de Ferro TDD</strong> e <strong>Portões Adversariais de Decisão</strong>.
                </p>
                <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 12px 18px; display: inline-flex; align-items: center; gap: 14px;">
                  <span style="font-size: 18px;">📐</span>
                  <span style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; font-weight: 600; color: #38bdf8;">
                    Reliable Autonomous System = Probabilistic LLM + Deterministic Harness + Human Authority
                  </span>
                </div>
              </div>

              <!-- Quick Control Actions -->
              <div style="display: flex; flex-direction: column; gap: 10px; min-width: 220px;">
                <button type="button" class="btn btn-primary" onclick="simulateAgenticCycle()" style="padding: 12px 18px; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; background: #0284c7; border-color: #38bdf8;">
                  <span>▶ Disparar Simulação Swarm</span>
                </button>
                <button type="button" class="btn btn-outline" onclick="copyOnboardingCommand('npx harness-kit init')" style="padding: 10px 14px; font-size: 12px; font-family: 'JetBrains Mono', monospace; text-align: left;">
                  <span>$ npx harness-kit init 📋</span>
                </button>
                <button type="button" class="btn btn-outline" onclick="navigateTo('run')" style="padding: 10px 14px; font-size: 12px; text-align: left;">
                  <span>Ir para Orchestration Hub ➔</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Section: 3D Swarm Constellation + Technical Blueprint -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;" class="onboarding-grid-2col">
            
            <!-- Left: 3D Multi-Agent Swarm Topology (img2threejs) -->
            <div class="hud-panel" style="display: flex; flex-direction: column; min-height: 440px;">
              <div class="hud-panel-header">
                <div>
                  <div style="font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;">Topologia 3D (img2threejs)</div>
                  <div style="font-size: 15px; font-weight: 700; color: #f8fafc;">Constelação Multiagente em Tempo Real</div>
                </div>
                <span class="hud-pill hud-pill-cyan">6 Agentes Especialistas + CTO Hub</span>
              </div>
              
              <div style="padding: 12px 18px; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between;">
                <span>Arraste o mouse para orbitar a topologia e inspecionar os canais de telemetria.</span>
                <span id="onbSelectedAgentLabel" style="color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-weight: 700;">● Core: autonomous-orchestrator</span>
              </div>
              
              <div id="onboarding-canvas-container" style="flex: 1; width: 100%; min-height: 320px; position: relative; background: #040813;">
                <canvas id="onboarding-three-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
              </div>
            </div>

            <!-- Right: High-Precision Blueprint Schematic (Nano Banana) -->
            <div class="hud-panel" style="display: flex; flex-direction: column; min-height: 440px;">
              <div class="hud-panel-header">
                <div>
                  <div style="font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;">Esquema de Engenharia (Nano Banana)</div>
                  <div style="font-size: 15px; font-weight: 700; color: #f8fafc;">Fluxo Agêntico Orquestrado & Comunicação (3D)</div>
                </div>
                <span class="hud-pill hud-pill-amber">CAD Architectural View</span>
              </div>
              
              <div style="padding: 12px 18px; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                Protocolos de mensagens ativas: GIVEN_WHEN_THEN → RED_GREEN_TDD → ADVERSARIAL_PAYLOAD → TECH_LEAD_VERDICT.
              </div>

              <div style="flex: 1; width: 100%; min-height: 320px; position: relative; overflow: hidden; background: #060b17;">
                <img src="/assets/orchestrated-agent-flow.jpg" alt="Orchestrated Autonomous Agentic Workflow & Inter-Agent Communication" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" />
              </div>
            </div>

          </div>

          <!-- Section: The 8 Specialized Agents & Skills Matrix -->
          <div class="hud-panel" style="padding: 24px; margin-bottom: 24px;">
            <div style="margin-bottom: 18px;">
              <div style="font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;">Arquitetura Especializada</div>
              <h3 style="font-size: 20px; font-weight: 800; color: #f8fafc; margin: 2px 0 6px;">Matriz de Agentes & Skills do HarnessKit</h3>
              <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                O HarnessKit não utiliza um modelo genérico "faz-tudo". Cada agente possui escopo delimitado, ferramentas estritas e contratos invariantes.
              </p>
            </div>

            <div class="agent-matrix-grid">
              
              <!-- Agent 1: Orchestrator -->
              <div class="agent-card" onclick="highlightSwarmNode(0, 'autonomous-orchestrator')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-cyan">👑 CORE</span>
                  <span class="agent-tag">FSM & Concurrency</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">autonomous-orchestrator / cto</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Gerencia a máquina de estados finitos (FSM), isola o Git Worktree dedicado, coordena bloqueios atômicos de workspace e governa a transição de fases.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">Git Worktree JIT</span>
                  <span class="agent-tag">ProcessTreeManager</span>
                </div>
              </div>

              <!-- Agent 2: Living Memory -->
              <div class="agent-card" onclick="highlightSwarmNode(1, 'project-memory')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-cyan">🧠 MEMÓRIA</span>
                  <span class="agent-tag">Graph Indexer</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">project-memory</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Mantém a documentação viva em <code>docs/</code> com ADRs concisos (<8k caracteres) e mapas de dependência em grafo de 1 salto para busca contextual ultra-rápida.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">docs/.graph.json</span>
                  <span class="agent-tag">docs/.digest.md</span>
                </div>
              </div>

              <!-- Agent 3: DDD Refinement -->
              <div class="agent-card" onclick="highlightSwarmNode(2, 'scope-refinement')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-cyan">📐 ESPECIFICAÇÃO</span>
                  <span class="agent-tag">DDD Refiner</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">scope-refinement</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Decompõe a demanda de negócio em 4 etapas formais de Domain-Driven Design, culminando em especificações executáveis em formato <strong>Given-When-Then</strong>.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">Problem Space</span>
                  <span class="agent-tag">Given-When-Then</span>
                </div>
              </div>

              <!-- Agent 4: TDD Engine -->
              <div class="agent-card" onclick="highlightSwarmNode(3, 'tdd-orchestrator')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-emerald">⚙️ DESENVOLVIMENTO</span>
                  <span class="agent-tag">Iron TDD Loop</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">tdd-orchestrator / backend</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Aplica a <strong>Lei de Ferro do TDD</strong>: nenhum código é escrito sem teste prévio falhando. Converte Given-When-Then em testes automatizados e itera até a suíte ficar verde.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">RED ❌</span>
                  <span class="agent-tag">GREEN ✅</span>
                  <span class="agent-tag">REFACTOR ♻️</span>
                </div>
              </div>

              <!-- Agent 5: Debugging -->
              <div class="agent-card" onclick="highlightSwarmNode(4, 'developer-debugging')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-amber">🔍 FORENSE</span>
                  <span class="agent-tag">5 Whys Engine</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">developer-debugging</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Investigação orientada a evidências. Quando um teste falha inesperadamente, executa a análise de causa raiz por 5 Porquês antes de permitir qualquer modificação no código.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">Root Cause Analysis</span>
                  <span class="agent-tag">Evidence-Driven</span>
                </div>
              </div>

              <!-- Agent 6: Adversarial QA -->
              <div class="agent-card" onclick="highlightSwarmNode(5, 'adversarial-qa')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-rose">🛡️ RED TEAM</span>
                  <span class="agent-tag">Pen-Testing QA</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">adversarial-qa</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Tenta quebrar o código propositalmente com payloads extremos de limites, ataques de concorrência e injeções maliciosas não contempladas no escopo original.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">Boundary Payloads</span>
                  <span class="agent-tag">Stress Gates</span>
                </div>
              </div>

              <!-- Agent 7: Grumpy Tech Lead -->
              <div class="agent-card" onclick="highlightSwarmNode(6, 'the-grumpy-tech-lead')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-amber">🧐 AUDITORIA</span>
                  <span class="agent-tag">Architecture Gate</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">the-grumpy-tech-lead</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Arquiteto sênior implacável. Avalia riscos sistêmicos, violações de SOLID/DRY, dependências cíclicas, queries N+1 e vazamento de recursos antes da aprovação.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">Score >= 0.85</span>
                  <span class="agent-tag">Anti N+1 Queries</span>
                </div>
              </div>

              <!-- Agent 8: Meta-Harness Loop -->
              <div class="agent-card" onclick="highlightSwarmNode(0, 'meta-harness')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="hud-pill hud-pill-cyan">🧬 EVOLUÇÃO</span>
                  <span class="agent-tag">Self-Optimization</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 6px;">meta-harness + evaluator</h4>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px;">
                  Grava traces em <code>docs/harness-history/traces/</code>, calcula a Fronteira de Pareto (Custo vs Assertividade) e gera melhorias de prompt para as próprias skills.
                </p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="agent-tag">Pareto Frontier</span>
                  <span class="agent-tag">Candidate Prompts</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Section: Live Swarm Simulation Console -->
          <div class="hud-panel" style="padding: 24px; margin-bottom: 24px;" id="simulationBox">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">Console de Telemetria do Swarm em Tempo Real</h3>
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Dispare um ciclo multiagente simulado (Tarefa: "Processamento de Pagamento com Idempotência").</p>
              </div>
              <button type="button" class="btn btn-primary btn-sm" onclick="simulateAgenticCycle()" id="btnStartSimulation" style="background: #0284c7; border-color: #38bdf8;">
                ▶ Executar Pipeline Swarm Completo
              </button>
            </div>

            <!-- Simulation Progress Bar -->
            <div style="background: rgba(255,255,255,0.06); height: 6px; border-radius: 999px; overflow: hidden; margin-bottom: 14px;">
              <div id="simProgressBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #38bdf8, #10b981, #f59e0b); transition: width 0.5s ease;"></div>
            </div>

            <!-- Simulation Terminal Stream -->
            <div id="simTerminal" style="background: #050811; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 14px 18px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #38bdf8; min-height: 150px; max-height: 220px; overflow-y: auto; line-height: 1.65;">
              <span style="color: rgba(255,255,255,0.35);">// Sistema em prontidão. Clique em "Executar Pipeline Swarm Completo" para acionar os agentes...</span>
            </div>
          </div>

          <!-- Section: Practical Guide (CLI Commands) -->
          <div class="hud-panel" style="padding: 24px; margin-bottom: 20px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">Comandos Operacionais do HarnessKit</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
              
              <div style="background: #060a14; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; font-size: 12.5px; color: #38bdf8; margin-bottom: 6px;">1. Inicializar Workspace</div>
                <code style="display: block; background: rgba(0,0,0,0.6); padding: 8px 12px; border-radius: 6px; font-size: 11.5px; color: #7dd3fc; margin-bottom: 6px;">npx harness-kit init</code>
                <p style="font-size: 11.5px; color: #94a3b8; margin: 0;">Varre a base e cria os ADRs e o grafo em <code>docs/</code>.</p>
              </div>

              <div style="background: #060a14; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; font-size: 12.5px; color: #c084fc; margin-bottom: 6px;">2. Refinamento DDD</div>
                <code style="display: block; background: rgba(0,0,0,0.6); padding: 8px 12px; border-radius: 6px; font-size: 11.5px; color: #e9d5ff; margin-bottom: 6px;">hrns refine "pagamento-idempotente"</code>
                <p style="font-size: 11.5px; color: #94a3b8; margin: 0;">Gera cenários de teste Given-When-Then antes do código.</p>
              </div>

              <div style="background: #060a14; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
                <div style="font-weight: 700; font-size: 12.5px; color: #34d399; margin-bottom: 6px;">3. Execução do Swarm</div>
                <code style="display: block; background: rgba(0,0,0,0.6); padding: 8px 12px; border-radius: 6px; font-size: 11.5px; color: #a7f3d0; margin-bottom: 6px;">hrns run --agent antigravity-cli</code>
                <p style="font-size: 11.5px; color: #94a3b8; margin: 0;">Dispara o loop TDD com auditoria socrática e adversarial.</p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  </div>

  <!-- SOCRATIC REFINEMENT QUESTIONNAIRE MODAL -->
  <div id="socraticModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-size: 18px; font-weight: 700;">🧠 Questionário Socrático de Arquitetura</h3>
        <button type="button" id="btnCloseSocraticModal" class="btn-icon">✕</button>
      </div>
      <div class="modal-body" id="socraticModalBody">
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
          O <strong>Software Architect</strong> formulou as seguintes questões críticas para consolidar em <code>docs/product/REFINEMENT.md</code> antes de iniciar o planejamento e desenvolvimento.
        </p>
        <div id="questionsContainer">
          <!-- Dynamically populated question cards -->
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" id="btnAcceptAllRecs" class="btn btn-outline">
          ✅ Aceitar Recomendações
        </button>
        <button type="button" id="btnConfirmAndStart" class="btn btn-primary">
          🚀 Confirmar Respostas e Iniciar TDD
        </button>
      </div>
    </div>
  </div>

  <!-- IN-BROWSER INSTANT FOLDER PICKER MODAL -->
  <div id="folderPickerModal" class="modal-overlay">
    <div class="modal-card" style="max-width: 680px; width: 100%;">
      <div class="modal-header">
        <h3 style="font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span>📁 Selecionar Pasta do Workspace</span>
        </h3>
        <button type="button" id="btnCloseFolderPickerModal" class="btn-icon">✕</button>
      </div>
      <div class="modal-body" style="padding: 16px 20px;">
        <!-- Path Navigation Bar -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
          <button type="button" id="btnFolderUp" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" title="Subir um nível">
            ⬆ Subir
          </button>
          <input type="text" id="folderPickerCurrentPathInput" class="form-control" style="font-family: monospace; font-size: 13px; flex: 1;" placeholder="Caminho da pasta..." />
          <button type="button" id="btnFolderGo" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" title="Ir para o caminho">
            ➔ Ir
          </button>
        </div>

        <!-- Quick Shortcuts -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Atalhos:</span>
          <div id="folderPickerShortcuts" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
        </div>

        <!-- Directory List -->
        <div id="folderPickerList" style="border: 1px solid var(--border-default); border-radius: 6px; max-height: 280px; min-height: 180px; overflow-y: auto; background: var(--bg-surface-elevated); padding: 4px;">
          <!-- Populated dynamically with folders -->
        </div>
      </div>
      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" id="btnTryNativePicker" class="btn btn-outline" style="font-size: 12px;" title="Tentar abrir seletor nativo do Windows">
          🖥️ Diálogo do SO
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" id="btnCancelFolderPicker" class="btn btn-outline">
            Cancelar
          </button>
          <button type="button" id="btnConfirmFolderPicker" class="btn btn-primary">
            ✅ Selecionar Esta Pasta
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // SPA Navigation
    function navigateTo(route) {
      if (route === 'candidates') route = 'diagnose';
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

      const activeLink = document.querySelector(\`.nav-link[data-route="\${route}"]\`);
      if (activeLink) activeLink.classList.add('active');

      const targetSection = document.getElementById(\`view-\${route}\`);
      if (targetSection) targetSection.classList.add('active');

      if (route === 'onboarding') { setTimeout(initOnboardingThreeJs, 80); }
      if (route === 'diagnose') {
        refreshDiagnoseStatus();
      }
    }

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#/', '') || 'run';
      navigateTo(hash);
    });

    document.querySelectorAll('.nav-link[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        const route = link.getAttribute('data-route');
        if (route) navigateTo(route);
      });
    });

    // Auto-trigger navigation on initial load (defaults to onboarding if none set)
    const initialHash = window.location.hash.replace('#/', '') || 'onboarding';
    navigateTo(initialHash);

    // Theme Switcher
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlEl = document.documentElement;

    function applyTheme(theme) {
      htmlEl.setAttribute('data-theme', theme);
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('harness_theme', theme);
    }

    const savedTheme = localStorage.getItem('harness_theme') || 'light';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') || 'light';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });

    // Logging & Status Helper
    const logTerminal = document.getElementById('logTerminal');
    const activeJobLabel = document.getElementById('activeJobLabel');
    let autoscrollEnabled = true;

    const btnCopyTerminal = document.getElementById('btnCopyTerminal');
    if (btnCopyTerminal) {
      btnCopyTerminal.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(logTerminal.textContent);
          const orig = btnCopyTerminal.textContent;
          btnCopyTerminal.textContent = '✓ Copiado!';
          setTimeout(() => { btnCopyTerminal.textContent = orig; }, 2000);
        } catch (err) {
          alert('Não foi possível copiar os logs: ' + err.message);
        }
      });
    }

    const btnAutoscrollTerminal = document.getElementById('btnAutoscrollTerminal');
    if (btnAutoscrollTerminal) {
      btnAutoscrollTerminal.addEventListener('click', () => {
        autoscrollEnabled = !autoscrollEnabled;
        btnAutoscrollTerminal.style.opacity = autoscrollEnabled ? '1' : '0.6';
        btnAutoscrollTerminal.textContent = autoscrollEnabled ? '⬇️ Auto-scroll' : '⏸️ Pausado';
      });
    }

    const btnClearTerminal = document.getElementById('btnClearTerminal');
    if (btnClearTerminal) {
      btnClearTerminal.addEventListener('click', () => {
        logTerminal.textContent = '[HRNS Server] Console limpo.\\n';
      });
    }

    const agentSelectEl = document.getElementById('agentSelect');
    const heroActiveRunnerName = document.getElementById('heroActiveRunnerName');
    if (agentSelectEl && heroActiveRunnerName) {
      agentSelectEl.addEventListener('change', () => {
        heroActiveRunnerName.textContent = agentSelectEl.options[agentSelectEl.selectedIndex].text.split('(')[0].trim();
      });
    }

    function appendLog(msg) {
      const time = new Date().toLocaleTimeString('pt-BR');
      logTerminal.textContent += '\\n[' + time + '] ' + msg;
      if (autoscrollEnabled) {
        logTerminal.scrollTop = logTerminal.scrollHeight;
      }
    }

    // Timeline Updates with Loop Indicator
    function updateTimeline(phase) {
      const phaseOrder = ['BOOTSTRAP', 'REFINEMENT', 'PLANNING', 'DEVELOPMENT', 'REVIEW', 'MEMORY'];
      const currentUpper = phase ? phase.toUpperCase() : '';
      let currentIndex = phaseOrder.indexOf(currentUpper);
      if (currentIndex === -1 && currentUpper === 'DEPLOY') {
        currentIndex = phaseOrder.length; // all completed
      }
      if (currentIndex === -1) return;

      const trackFill = document.getElementById('timelineTrackFill');
      if (trackFill) {
        const percent = Math.min(100, Math.max(0, (currentIndex / (phaseOrder.length - 1)) * 100));
        trackFill.style.width = percent + '%';
      }

      const statusTag = document.getElementById('pipelineStatusTag');
      if (statusTag) {
        if (currentIndex >= phaseOrder.length) {
          statusTag.textContent = 'Status: CICLO CONCLUÍDO (100%)';
          statusTag.style.color = 'var(--status-connected)';
        } else {
          statusTag.textContent = 'Status: EXECUTANDO FASE ' + phaseOrder[currentIndex];
          statusTag.style.color = 'var(--itau-orange)';
        }
      }

      phaseOrder.forEach((p, idx) => {
        const el = document.getElementById('step-' + p);
        if (!el) return;
        const circleEl = el.querySelector('.step-circle');
        const badgeEl = el.querySelector('.step-badge-status');

        el.classList.remove('step-active', 'step-completed');
        if (idx < currentIndex) {
          el.classList.add('step-completed');
          if (circleEl) circleEl.innerHTML = '<span class="step-check">✓</span>';
          if (badgeEl) badgeEl.textContent = '✓ Concluído';
        } else if (idx === currentIndex) {
          el.classList.add('step-active');
          if (circleEl) circleEl.innerHTML = '<span class="spinning-icon">⟳</span>';
          if (badgeEl) badgeEl.innerHTML = '<span class="spinning-icon">⟳</span> Em Loop TDD';
        } else {
          if (circleEl) circleEl.innerHTML = '<span class="step-num">' + (idx + 1) + '</span>';
          if (badgeEl) badgeEl.textContent = 'Aguardando';
        }
      });
    }

    function resetTimeline() {
      const phaseOrder = ['BOOTSTRAP', 'REFINEMENT', 'PLANNING', 'DEVELOPMENT', 'REVIEW', 'MEMORY'];
      const trackFill = document.getElementById('timelineTrackFill');
      if (trackFill) trackFill.style.width = '0%';

      const statusTag = document.getElementById('pipelineStatusTag');
      if (statusTag) {
        statusTag.textContent = 'Status: AGUARDANDO JOB';
        statusTag.style.color = 'var(--text-secondary)';
      }

      phaseOrder.forEach((p, idx) => {
        const el = document.getElementById('step-' + p);
        if (!el) return;
        el.classList.remove('step-active', 'step-completed');
        const circleEl = el.querySelector('.step-circle');
        const badgeEl = el.querySelector('.step-badge-status');
        if (circleEl) circleEl.innerHTML = '<span class="step-num">' + (idx + 1) + '</span>';
        if (badgeEl) badgeEl.textContent = 'Aguardando';
      });
    }

    // Folder & Scope Persistence
    const projectInput = document.getElementById('projectInput');
    const scopeInput = document.getElementById('scopeInput');
    const btnBrowseFolder = document.getElementById('btnBrowseFolder');

    // Carregar pasta e escopo previamente salvos
    const savedFolderInit = localStorage.getItem('harness_last_project_path');
    if (savedFolderInit && !projectInput.value) {
      projectInput.value = savedFolderInit;
    }
    const savedScopeInit = localStorage.getItem('harness_last_scope');
    if (savedScopeInit && !scopeInput.value) {
      scopeInput.value = savedScopeInit;
    }

    projectInput.addEventListener('input', () => {
      localStorage.setItem('harness_last_project_path', projectInput.value.trim());
    });
    projectInput.addEventListener('change', () => {
      localStorage.setItem('harness_last_project_path', projectInput.value.trim());
    });
    scopeInput.addEventListener('input', () => {
      localStorage.setItem('harness_last_scope', scopeInput.value);
    });

    // In-Browser Instant Folder Picker Controller
    const folderPickerModal = document.getElementById('folderPickerModal');
    const btnCloseFolderPickerModal = document.getElementById('btnCloseFolderPickerModal');
    const btnCancelFolderPicker = document.getElementById('btnCancelFolderPicker');
    const btnConfirmFolderPicker = document.getElementById('btnConfirmFolderPicker');
    const btnFolderUp = document.getElementById('btnFolderUp');
    const btnFolderGo = document.getElementById('btnFolderGo');
    const btnTryNativePicker = document.getElementById('btnTryNativePicker');
    const folderPickerCurrentPathInput = document.getElementById('folderPickerCurrentPathInput');
    const folderPickerShortcuts = document.getElementById('folderPickerShortcuts');
    const folderPickerList = document.getElementById('folderPickerList');

    let pickerCurrentPath = '';
    let pickerParentPath = null;

    function openFolderPickerModal(startPath) {
      pickerCurrentPath = startPath || (projectInput ? projectInput.value.trim() : '') || '';
      folderPickerModal.classList.add('open');
      loadFolderDirectory(pickerCurrentPath);
    }

    function closeFolderPickerModal() {
      folderPickerModal.classList.remove('open');
    }

    if (btnCloseFolderPickerModal) btnCloseFolderPickerModal.onclick = closeFolderPickerModal;
    if (btnCancelFolderPicker) btnCancelFolderPicker.onclick = closeFolderPickerModal;

    folderPickerModal.addEventListener('click', (e) => {
      if (e.target === folderPickerModal) closeFolderPickerModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && folderPickerModal.classList.contains('open')) {
        closeFolderPickerModal();
      }
    });

    async function loadFolderDirectory(targetPath) {
      folderPickerList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">⏳ Carregando diretórios...</div>';

      try {
        const url = '/api/workspace/browse' + (targetPath ? '?path=' + encodeURIComponent(targetPath) : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Status ' + res.status);
        const data = await res.json();

        pickerCurrentPath = data.currentPath || targetPath;
        pickerParentPath = data.parentPath;
        folderPickerCurrentPathInput.value = pickerCurrentPath;

        if (btnFolderUp) {
          btnFolderUp.disabled = !pickerParentPath;
        }

        // Render Shortcuts
        const shortcuts = [];
        if (data.homePath) {
          shortcuts.push({ label: '🏠 Início', path: data.homePath });
        }
        const savedProject = localStorage.getItem('harness_last_project_path');
        if (savedProject && savedProject !== pickerCurrentPath) {
          shortcuts.push({ label: '⭐ Recente', path: savedProject });
        }
        if (data.drives && data.drives.length > 0) {
          data.drives.forEach(d => {
            shortcuts.push({ label: '💾 ' + d, path: d });
          });
        }

        folderPickerShortcuts.innerHTML = shortcuts.map(s => {
          return '<button type="button" class="btn btn-outline shortcut-pill" data-path="' + s.path + '" style="padding: 3px 8px; font-size: 11px; border-radius: 4px;">' + s.label + '</button>';
        }).join('');

        folderPickerShortcuts.querySelectorAll('.shortcut-pill').forEach(btn => {
          btn.onclick = () => loadFolderDirectory(btn.getAttribute('data-path'));
        });

        // Render Folder List
        if (!data.directories || data.directories.length === 0) {
          folderPickerList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">Nenhuma subpasta encontrada neste diretório.</div>';
          return;
        }

        folderPickerList.innerHTML = data.directories.map(name => {
          return '<div class="folder-row" data-name="' + name + '" style="display: flex; align-items: center; gap: 8px; padding: 7px 12px; cursor: pointer; border-radius: 4px; font-size: 13px; user-select: none; border-bottom: 1px solid var(--border-default);">' +
            '<span style="font-size: 15px;">📁</span>' +
            '<span style="font-weight: 500; flex: 1;">' + name + '</span>' +
            '<span style="color: var(--text-secondary); font-size: 11px;">➔ Abrir</span>' +
          '</div>';
        }).join('');

        folderPickerList.querySelectorAll('.folder-row').forEach(row => {
          row.addEventListener('mouseenter', () => {
            row.style.background = 'var(--bg-surface)';
          });
          row.addEventListener('mouseleave', () => {
            row.style.background = 'transparent';
          });
          row.addEventListener('click', () => {
            const folderName = row.getAttribute('data-name');
            const sep = pickerCurrentPath.endsWith('/') ? '' : '/';
            const nextPath = pickerCurrentPath + sep + folderName;
            loadFolderDirectory(nextPath);
          });
        });
      } catch (err) {
        folderPickerList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-danger); font-size: 13px;">Erro ao ler diretório: ' + err.message + '</div>';
      }
    }

    if (btnFolderUp) {
      btnFolderUp.onclick = () => {
        if (pickerParentPath) loadFolderDirectory(pickerParentPath);
      };
    }

    if (btnFolderGo) {
      btnFolderGo.onclick = () => {
        const val = folderPickerCurrentPathInput.value.trim();
        if (val) loadFolderDirectory(val);
      };
    }

    if (folderPickerCurrentPathInput) {
      folderPickerCurrentPathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = folderPickerCurrentPathInput.value.trim();
          if (val) loadFolderDirectory(val);
        }
      });
    }

    if (btnConfirmFolderPicker) {
      btnConfirmFolderPicker.onclick = () => {
        if (pickerCurrentPath) {
          projectInput.value = pickerCurrentPath;
          localStorage.setItem('harness_last_project_path', pickerCurrentPath);
          appendLog('[EXPLORER] ✅ Pasta selecionada e salva: ' + pickerCurrentPath);
        }
        closeFolderPickerModal();
      };
    }

    if (btnTryNativePicker) {
      btnTryNativePicker.onclick = async () => {
        btnTryNativePicker.disabled = true;
        btnTryNativePicker.textContent = '⏳ Abrindo SO...';
        try {
          const res = await fetch('/api/workspace/select-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPath: pickerCurrentPath })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.selectedPath) {
              pickerCurrentPath = data.selectedPath;
              folderPickerCurrentPathInput.value = data.selectedPath;
              loadFolderDirectory(data.selectedPath);
            }
          }
        } catch {}
        btnTryNativePicker.disabled = false;
        btnTryNativePicker.textContent = '🖥️ Diálogo do SO';
      };
    }

    async function handleBrowseFolder() {
      openFolderPickerModal(projectInput.value.trim());
    }

    if (btnBrowseFolder) btnBrowseFolder.addEventListener('click', handleBrowseFolder);

    // Mode Selector Handler
    const modeSelect = document.getElementById('modeSelect');
    const deepThinkingAlert = document.getElementById('deepThinkingAlert');
    modeSelect.addEventListener('change', () => {
      deepThinkingAlert.style.display = modeSelect.value === 'deep_thinking' ? 'block' : 'none';
    });

    // Socratic Modal Logic
    const socraticModal = document.getElementById('socraticModal');
    const btnCloseSocraticModal = document.getElementById('btnCloseSocraticModal');
    const questionsContainer = document.getElementById('questionsContainer');
    const btnAcceptAllRecs = document.getElementById('btnAcceptAllRecs');
    const btnConfirmAndStart = document.getElementById('btnConfirmAndStart');
    const btnViewSocraticQuestions = document.getElementById('btnViewSocraticQuestions');

    let currentQuestions = [];
    let activeRefinementJobId = null;
    const dismissedSocraticModals = new Set();

    function renderAndOpenSocraticModal(questions, jobId) {
      currentQuestions = questions || [];
      activeRefinementJobId = jobId || localStorage.getItem('harness_active_job_id');

      // Render Questions pre-filled with default recommendations
      questionsContainer.innerHTML = currentQuestions.map((q, idx) => \`
        <div class="question-card">
          <div class="question-title">❓ Questão \${idx + 1}/\${currentQuestions.length}: \${q.question}</div>
          \${q.context ? \`<div class="question-context">ℹ️ <strong>Impacto Sistêmico / Contexto:</strong> \${q.context}</div>\` : ''}
          <div class="question-rec">💡 <strong>Recomendação Padrão do Arquiteto:</strong> \${q.recommendation}</div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>Sua Decisão (Edite ou mantenha a recomendação padrão):</span>
              <button type="button" onclick="document.getElementById('ans-\${idx}').value = currentQuestions[\${idx}].recommendation" style="background: none; border: none; color: var(--itau-orange); cursor: pointer; font-size: 11px; text-decoration: underline;">Restaurar Padrão</button>
            </label>
            <input type="text" id="ans-\${idx}" class="form-control" value="\${(q.recommendation || '').replace(/"/g, '&quot;')}" />
          </div>
        </div>
      \`).join('') + \`
        <div class="question-card" style="border-left: 3px solid var(--itau-navy);">
          <div class="question-title">📝 Informações Adicionais / Requisitos Extras (Opcional)</div>
          <div class="form-group" style="margin-bottom: 0;">
            <input type="text" id="ans-additional" class="form-control" placeholder="Ex: Priorizar compatibilidade com Node 20+, sem bibliotecas externas..." />
          </div>
        </div>
      \`;

      socraticModal.classList.add('open');
      appendLog(\`[REFINEMENT] 📋 Modal com as \${currentQuestions.length} questões socráticas formuladas pelo Software Architect.\`);
    }

    async function handleViewSocraticQuestions() {
      const activeJobId = localStorage.getItem('harness_active_job_id');

      if (btnViewSocraticQuestions) {
        btnViewSocraticQuestions.disabled = true;
        btnViewSocraticQuestions.innerHTML = '<span>⏳ Carregando Questões...</span>';
      }

      try {
        let questionsToDisplay = null;
        let targetJobId = activeJobId;

        if (activeJobId) {
          const res = await fetch(\`/orchestrator/status/\${activeJobId}\`);
          if (res.ok) {
            const data = await res.json();
            if (data.pendingRefinement && data.pendingRefinement.length > 0) {
              questionsToDisplay = data.pendingRefinement;
            }
          }
        }

        if (!questionsToDisplay) {
          const latestRes = await fetch('/orchestrator/jobs/latest');
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            if (latestData && latestData.pendingRefinement && latestData.pendingRefinement.length > 0) {
              questionsToDisplay = latestData.pendingRefinement;
              targetJobId = latestData.jobId;
            }
          }
        }

        if (!questionsToDisplay && currentQuestions && currentQuestions.length > 0) {
          questionsToDisplay = currentQuestions;
        }

        // If no questions yet from running job, fetch questions preview for the scope
        if (!questionsToDisplay || questionsToDisplay.length === 0) {
          const project = document.getElementById('projectInput').value;
          const scope = document.getElementById('scopeInput').value;
          const agent = document.getElementById('agentSelect').value;
          if (scope.trim()) {
            const genRes = await fetch('/orchestrator/refine/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scope, agent, project })
            });
            if (genRes.ok) {
              const genData = await genRes.json();
              if (genData && genData.questions && genData.questions.length > 0) {
                questionsToDisplay = genData.questions;
              }
            }
          }
        }

        if (questionsToDisplay && questionsToDisplay.length > 0) {
          if (targetJobId) dismissedSocraticModals.delete(targetJobId);
          if (activeTaskId) dismissedSocraticModals.delete(activeTaskId);
          renderAndOpenSocraticModal(questionsToDisplay, targetJobId);
        } else {
          appendLog('[INFO] ⏳ Preencha o escopo para consultar as questões socráticas do Software Architect.');
        }
      } catch (err) {
        appendLog('[ERROR] Falha ao carregar questões socráticas: ' + err.message);
      } finally {
        if (btnViewSocraticQuestions) {
          btnViewSocraticQuestions.disabled = false;
          btnViewSocraticQuestions.innerHTML = '<span>🧠 Ver Questões Socráticas</span>';
        }
      }
    }

    if (btnViewSocraticQuestions) {
      btnViewSocraticQuestions.addEventListener('click', handleViewSocraticQuestions);
    }

    function dismissSocraticModal() {
      socraticModal.classList.remove('open');
      if (activeRefinementJobId) dismissedSocraticModals.add(activeRefinementJobId);
      if (activeTaskId) dismissedSocraticModals.add(activeTaskId);
    }

    btnCloseSocraticModal.addEventListener('click', dismissSocraticModal);

    socraticModal.addEventListener('click', (e) => {
      if (e.target === socraticModal) {
        dismissSocraticModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && socraticModal.classList.contains('open')) {
        dismissSocraticModal();
      }
    });

    btnAcceptAllRecs.addEventListener('click', () => {
      currentQuestions.forEach((q, idx) => {
        const ansInput = document.getElementById('ans-' + idx);
        if (ansInput) ansInput.value = q.recommendation;
      });
      const additionalInput = document.getElementById('ans-additional');
      if (additionalInput) additionalInput.value = '';
    });

    btnConfirmAndStart.addEventListener('click', async () => {
      const answers = currentQuestions.map((q, idx) => {
        const ansInput = document.getElementById('ans-' + idx);
        return {
          question: q.question,
          answer: (ansInput ? ansInput.value.trim() : '') || q.recommendation
        };
      });

      const additionalInput = document.getElementById('ans-additional');
      if (additionalInput && additionalInput.value.trim()) {
        answers.push({
          question: 'Any additional information?',
          answer: additionalInput.value.trim()
        });
      }

      socraticModal.classList.remove('open');
      const jobId = activeRefinementJobId || localStorage.getItem('harness_active_job_id');
      if (jobId) dismissedSocraticModals.delete(jobId);
      if (activeTaskId) dismissedSocraticModals.delete(activeTaskId);

      if (jobId) {
        appendLog('[REFINEMENT] 🚀 Enviando ' + answers.length + ' respostas socráticas para o Job ' + jobId + '...');
        try {
          await fetch('/orchestrator/jobs/' + jobId + '/refine-answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, answers })
          });
        } catch (err) {
          console.warn('Erro ao submeter respostas socráticas:', err);
        }
      }
    });

    // Multi-Task Autonomous Orchestration Hub State
    let hubTasks = [];
    let activeTaskId = null; // null => "+ Nova Tarefa" mode

    function renderHubTasksTabBar() {
      const tabBar = document.getElementById('hubActiveTasksPills');
      const btnNew = document.getElementById('btnHubNewTaskTab');
      if (!tabBar) return;

      if (btnNew) {
        if (activeTaskId === null) {
          btnNew.classList.remove('btn-outline');
          btnNew.classList.add('btn-primary');
        } else {
          btnNew.classList.remove('btn-primary');
          btnNew.classList.add('btn-outline');
        }
      }

      tabBar.innerHTML = hubTasks.map((t, idx) => {
        const isActive = t.cycleId === activeTaskId;
        const shortScope = (t.scope || 'Tarefa ' + (idx + 1)).slice(0, 20) + '...';
        const isWaitingSpec = t.status === 'WAITING_SPEC_APPROVAL';
        const badgeColor = isWaitingSpec ? 'var(--itau-orange)' : (t.status === 'RUNNING' ? 'var(--itau-navy)' : 'var(--border-default)');
        const statusText = isWaitingSpec ? 'APROVAR SPEC' : (t.status || 'RUNNING');
        const bg = isActive ? 'var(--itau-navy)' : 'var(--bg-surface-elevated)';
        const textCol = isActive ? '#ffffff' : 'var(--text-primary)';
        const borderCol = isActive ? 'var(--itau-orange)' : 'var(--border-default)';

        return '<div class="hub-task-pill" data-cycle-id="' + t.cycleId + '" style="cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid ' + borderCol + '; background: ' + bg + '; color: ' + textCol + '; font-size: 12px; font-weight: 600; white-space: nowrap;">' +
          '<span>⚡ ' + shortScope + '</span>' +
          '<span style="background: ' + badgeColor + '; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 10px;">' + statusText + '</span>' +
          '<span class="btn-abort-task" data-cycle-id="' + t.cycleId + '" title="Cancelar ciclo" style="cursor: pointer; opacity: 0.7; font-size: 14px; margin-left: 4px;">✕</span>' +
        '</div>';
      }).join('');

      tabBar.querySelectorAll('.hub-task-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          selectHubTask(pill.getAttribute('data-cycle-id'));
        });
      });

      tabBar.querySelectorAll('.btn-abort-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          abortHubTask(btn.getAttribute('data-cycle-id'));
        });
      });
    }

    function saveHubTasksToStorage() {
      try {
        localStorage.setItem('harness_hub_tasks', JSON.stringify(hubTasks));
      } catch {}
    }

    window.selectHubTask = function(cycleId) {
      activeTaskId = cycleId;
      try {
        localStorage.setItem('harness_hub_active_task_id', cycleId || '');
      } catch {}
      renderHubTasksTabBar();

      const metaBar = document.getElementById('activeTaskMetaBar');
      const specBanner = document.getElementById('specApprovalBanner');
      const formTitle = document.getElementById('hubFormTitle');
      const btnStartRun = document.getElementById('btnStartRun');

      if (!cycleId) {
        // "+ Nova Tarefa" mode
        if (metaBar) metaBar.style.display = 'none';
        if (specBanner) specBanner.style.display = 'none';
        if (formTitle) formTitle.textContent = '🚀 Autonomous Orchestration Hub (Nova Tarefa)';
        resetTimeline();
        logTerminal.textContent = '[HRNS Server] Pronto para configurar e iniciar uma nova tarefa autônoma em paralelo.';
        activeJobLabel.textContent = 'Modo: Nova Tarefa';
        if (btnStartRun) {
          btnStartRun.disabled = false;
          btnStartRun.innerHTML = '<span>▶ Iniciar Ciclo Autônomo</span>';
        }
        return;
      }

      const task = hubTasks.find(t => t.cycleId === cycleId);
      if (!task) return;

      if (formTitle) formTitle.textContent = '🚀 Tarefa: ' + (task.scope || task.cycleId);

      if (metaBar) {
        metaBar.style.display = 'flex';
        document.getElementById('lblActiveSessionId').textContent = task.sessionId || 'sess-none';
        document.getElementById('lblActiveCycleId').textContent = task.cycleId;
        document.getElementById('lblActiveWorktree').textContent = task.worktreePath || 'isolado';
        const badge = document.getElementById('lblActiveTaskBadge');
        if (badge) {
          badge.textContent = task.status;
          badge.className = 'status-badge ' + (task.status === 'RUNNING' ? 'status-connected' : 'status-reconnecting');
        }
      }

      if (scopeInput) scopeInput.value = task.scope || '';
      if (agentSelect) agentSelect.value = task.agent || 'antigravity-cli';
      if (modeSelect) modeSelect.value = task.mode || 'thinking';

      updateTimeline(task.currentPhase || 'BOOTSTRAP');

      if (specBanner) {
        if (task.status === 'WAITING_SPEC_APPROVAL') {
          specBanner.style.display = 'block';
          const specBox = document.getElementById('specSummaryBox');
          if (specBox) specBox.textContent = task.specSummary || 'Especificação e decisões arquiteturais prontas para validação.';
        } else {
          specBanner.style.display = 'none';
        }
      }

      logTerminal.textContent = task.logs && task.logs.length > 0 ? task.logs.join(String.fromCharCode(10)) : '> Aguardando saída do agente...';
      logTerminal.scrollTop = logTerminal.scrollHeight;
      activeJobLabel.textContent = 'Ciclo: ' + task.cycleId + ' (' + task.status + ')';
    };

    window.abortHubTask = async function(cycleId) {
      if (!confirm('Deseja realmente cancelar este ciclo?')) return;
      try {
        await fetch('/orchestrator/jobs/' + cycleId + '/abort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        await fetch('/api/cycles/' + cycleId + '/abort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Cancelado pelo usuário no Hub' })
        });
      } catch {}

      const interval = jobPollIntervals.get(cycleId);
      if (interval) {
        clearInterval(interval);
        jobPollIntervals.delete(cycleId);
      }
      const es = jobEventSources.get(cycleId);
      if (es) {
        es.close();
        jobEventSources.delete(cycleId);
      }

      hubTasks = hubTasks.filter(t => t.cycleId !== cycleId);
      saveHubTasksToStorage();
      renderHubTasksTabBar();
      if (activeTaskId === cycleId) {
        selectHubTask(hubTasks.length > 0 ? hubTasks[0].cycleId : null);
      }
    };

    const btnHubNewTaskTab = document.getElementById('btnHubNewTaskTab');
    if (btnHubNewTaskTab) {
      btnHubNewTaskTab.onclick = () => selectHubTask(null);
    }

    // Spec Approval Actions
    const btnApproveSpecAndDev = document.getElementById('btnApproveSpecAndDev');
    const btnRejectSpec = document.getElementById('btnRejectSpec');
    const btnInspectFullSpec = document.getElementById('btnInspectFullSpec');

    if (btnApproveSpecAndDev) {
      btnApproveSpecAndDev.onclick = async () => {
        if (!activeTaskId) return;
        btnApproveSpecAndDev.disabled = true;
        btnApproveSpecAndDev.textContent = '⏳ Aprovando...';
        try {
          const res = await fetch('/api/cycles/' + activeTaskId + '/approve-spec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            const task = hubTasks.find(t => t.cycleId === activeTaskId);
            if (task) {
              task.status = 'RUNNING';
              task.currentPhase = 'DEVELOPMENT';
              task.logs.push('[GATE] ✅ Especificação APROVADA pelo operador humano! Iniciando Desenvolvimento TDD.');
            }
            selectHubTask(activeTaskId);
          } else {
            alert('Falha ao aprovar spec.');
          }
        } catch (err) {
          alert('Erro: ' + err.message);
        } finally {
          btnApproveSpecAndDev.disabled = false;
          btnApproveSpecAndDev.textContent = '✅ Aprovar Spec e Iniciar Desenvolvimento';
        }
      };
    }

    if (btnRejectSpec) {
      btnRejectSpec.onclick = async () => {
        if (!activeTaskId) return;
        const feedback = prompt('Descreva os ajustes necessários na especificação/arquitetura:');
        if (feedback === null) return;
        try {
          const res = await fetch('/api/cycles/' + activeTaskId + '/reject-spec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback })
          });
          if (res.ok) {
            const task = hubTasks.find(t => t.cycleId === activeTaskId);
            if (task) {
              task.status = 'RUNNING';
              task.currentPhase = 'REFINEMENT';
              task.logs.push('[GATE] ✏️ Ajuste de spec solicitado: ' + feedback + '. Retornando para Refinamento.');
            }
            selectHubTask(activeTaskId);
          }
        } catch (err) {
          alert('Erro: ' + err.message);
        }
      };
    }

    if (btnInspectFullSpec) {
      btnInspectFullSpec.onclick = () => {
        if (activeTaskId) dismissedSocraticModals.delete(activeTaskId);
        if (activeRefinementJobId) dismissedSocraticModals.delete(activeRefinementJobId);
        handleViewSocraticQuestions();
      };
    }

    // Multi-Job EventSources and Polling Registry
    const jobEventSources = new Map();
    const jobPollIntervals = new Map();

    // Run Job Dispatcher (Multi-Task Hub with Real CLI Agent Execution)
    async function dispatchRunJob(payload) {
      currentQuestions = [];
      const btnStartRun = document.getElementById('btnStartRun');
      if (btnStartRun) {
        btnStartRun.disabled = true;
        btnStartRun.innerHTML = '<span>⏳ Enfileirando Job...</span>';
      }

      try {
        const res = await fetch('/orchestrator/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const jobId = data.jobId;

          const newTask = {
            cycleId: jobId,
            sessionId: 'sess-' + jobId.slice(0, 8),
            scope: payload.scope,
            category: 'backend',
            agent: payload.agent,
            mode: payload.mode,
            status: 'RUNNING',
            currentPhase: 'BOOTSTRAP',
            worktreePath: (payload.project && payload.project[0] ? payload.project[0] + '/.worktrees/' + jobId : '.worktrees/' + jobId),
            specSummary: '',
            logs: [
              '[SERVER] ✅ Job enfileirado com sucesso! ID: ' + jobId,
              '[AGENT] Inicializando runner CLI: ' + payload.agent + ' (modo: ' + payload.mode + ')...',
              '[WORKTREE] Sandbox isolado em: .worktrees/' + jobId,
              '[PIPELINE] Fase 1: BOOTSTRAP iniciada.'
            ]
          };

          hubTasks.push(newTask);
          saveHubTasksToStorage();
          renderHubTasksTabBar();
          selectHubTask(jobId);

          connectSseStream(jobId);
          startStatusPolling(jobId);
        } else {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          alert('Falha ao iniciar job (' + res.status + '): ' + (err.message || err.error));
        }
      } catch (err) {
        alert('Falha de conexão: ' + err.message);
      } finally {
        if (btnStartRun) {
          btnStartRun.disabled = false;
          btnStartRun.innerHTML = '<span>▶ Iniciar Ciclo Autônomo</span>';
        }
      }
    }

    function connectSseStream(jobId) {
      if (jobEventSources.has(jobId)) return;

      if (window.EventSource) {
        const es = new EventSource('/orchestrator/stream?jobId=' + jobId);
        jobEventSources.set(jobId, es);
        es.onmessage = (event) => {
          try {
            const item = JSON.parse(event.data);
            const task = hubTasks.find(t => t.cycleId === jobId);

            if (item.type === 'log_chunk' && item.text) {
              if (task) {
                task.logs.push(item.text);
                saveHubTasksToStorage();
              }
              if (activeTaskId === jobId) appendLog(item.text);
            } else if (item.type === 'phase_change') {
              if (task) {
                task.currentPhase = item.phase;
                task.logs.push('[PIPELINE] ➔ Transição de fase: ' + item.phase);
                saveHubTasksToStorage();
              }
              if (activeTaskId === jobId) {
                appendLog('[PIPELINE] ➔ Transição de fase: ' + item.phase);
                updateTimeline(item.phase);
              }
              renderHubTasksTabBar();
            } else if (item.type === 'interactive_refinement' && item.questions) {
              if (task) {
                task.status = 'WAITING_SPEC_APPROVAL';
                task.specSummary = 'Software Architect formulou ' + item.questions.length + ' questões socráticas de refinamento.';
                task.logs.push('[REFINEMENT] 🧠 ' + item.questions.length + ' questões prontas para validação.');
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId && !dismissedSocraticModals.has(jobId)) {
                renderAndOpenSocraticModal(item.questions, jobId);
              }
            } else if (item.type === 'status_change') {
              if (task) {
                task.status = item.status.toUpperCase();
                task.logs.push('[STATUS] Job ' + jobId + ': ' + item.status);
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId) {
                appendLog('[STATUS] Job ' + jobId + ': ' + item.status);
              }
            }
          } catch {
            if (activeTaskId === jobId) appendLog('[SSE] ' + event.data);
          }
        };
        es.onerror = () => {
          // SSE reconnects automatically
        };
      }
    }

    function startStatusPolling(jobId) {
      if (jobPollIntervals.has(jobId)) return;

      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch('/orchestrator/status/' + jobId);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const task = hubTasks.find(t => t.cycleId === jobId);
            if (task && statusData.phase) {
              task.currentPhase = statusData.phase;
              if (activeTaskId === jobId) updateTimeline(statusData.phase);
            }
            if (statusData.pendingRefinement && statusData.pendingRefinement.length > 0) {
              if (task) {
                task.status = 'WAITING_SPEC_APPROVAL';
                task.specSummary = statusData.pendingRefinement.length + ' questões de arquitetura aguardando validação.';
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId && !dismissedSocraticModals.has(jobId) && !socraticModal.classList.contains('open')) {
                renderAndOpenSocraticModal(statusData.pendingRefinement, jobId);
              }
            }
            if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'aborted') {
              if (task) {
                task.status = statusData.status.toUpperCase();
                task.logs.push('[SERVER] Job finalizado com status: ' + statusData.status.toUpperCase());
                saveHubTasksToStorage();
              }
              renderHubTasksTabBar();
              if (activeTaskId === jobId) {
                appendLog('[SERVER] Job finalizado com status: ' + statusData.status.toUpperCase());
                activeJobLabel.textContent = 'Job: ' + jobId + ' (' + statusData.status.toUpperCase() + ')';
              }
              clearInterval(interval);
              jobPollIntervals.delete(jobId);
              const es = jobEventSources.get(jobId);
              if (es) {
                es.close();
                jobEventSources.delete(jobId);
              }
            }
          }
        } catch {}
      }, 2500);
      jobPollIntervals.set(jobId, interval);
    }

    // Auto-Restore State on Page Load (Instant Cache + Dynamic Server Sync)
    async function restoreActiveJobOnLoad() {
      const savedFolder = localStorage.getItem('harness_last_project_path');
      if (savedFolder && projectInput) {
        projectInput.value = savedFolder;
      }
      const savedScope = localStorage.getItem('harness_last_scope');
      if (savedScope && scopeInput) {
        scopeInput.value = savedScope;
      }

      // 1. Instant hydration from client localStorage cache
      try {
        const cached = localStorage.getItem('harness_hub_tasks');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            hubTasks = parsed;
            renderHubTasksTabBar();
            const savedActiveId = localStorage.getItem('harness_hub_active_task_id');
            if (savedActiveId && hubTasks.some(t => t.cycleId === savedActiveId)) {
              selectHubTask(savedActiveId);
            } else if (hubTasks.length > 0) {
              selectHubTask(hubTasks[0].cycleId);
            }
          }
        }
      } catch {}

      // 2. Dynamic server synchronization: query active jobs and reconcile state
      try {
        const res = await fetch('/orchestrator/jobs/active');
        if (res.ok) {
          const data = await res.json();
          const serverActiveJobs = data.activeJobs || [];

          for (const sJob of serverActiveJobs) {
            const jId = sJob.jobId;
            let task = hubTasks.find(t => t.cycleId === jId);

            try {
              const statusRes = await fetch('/orchestrator/status/' + jId);
              if (statusRes.ok) {
                const sData = await statusRes.json();
                const taskScope = sData.scope || (sJob.request && sJob.request.scope) || ('Tarefa ' + jId.slice(0, 8));
                const taskAgent = (sJob.request && sJob.request.agent) || 'antigravity-cli';
                const taskMode = (sJob.request && sJob.request.mode) || 'thinking';
                const taskStatus = sData.pendingRefinement ? 'WAITING_SPEC_APPROVAL' : (sData.status ? sData.status.toUpperCase() : 'RUNNING');
                const taskPhase = sData.phase || 'BOOTSTRAP';

                let logs = [];
                if (sData.historyLogs && Array.isArray(sData.historyLogs) && sData.historyLogs.length > 0) {
                  logs = sData.historyLogs.map(item => {
                    if (typeof item === 'string') return item;
                    if (item.text) return item.text;
                    if (item.type === 'phase_change') return '[PIPELINE] ➔ Transição de fase: ' + item.phase;
                    return JSON.stringify(item);
                  });
                } else if (task && task.logs && task.logs.length > 0) {
                  logs = task.logs;
                } else {
                  logs = [
                    '[RESTORE] ✅ Sessão recuperada dinamicamente: ' + jId,
                    '[STATUS] ' + taskStatus + ' | Fase: ' + taskPhase
                  ];
                }

                if (!task) {
                  task = {
                    cycleId: jId,
                    sessionId: 'sess-' + jId.slice(0, 8),
                    scope: taskScope,
                    category: 'backend',
                    agent: taskAgent,
                    mode: taskMode,
                    status: taskStatus,
                    currentPhase: taskPhase,
                    worktreePath: sJob.workspacePath ? sJob.workspacePath + '/.worktrees/' + jId : '.worktrees/' + jId,
                    specSummary: sData.pendingRefinement ? (sData.pendingRefinement.length + ' questões de arquitetura aguardando validação.') : '',
                    logs: logs
                  };
                  hubTasks.push(task);
                } else {
                  task.status = taskStatus;
                  task.currentPhase = taskPhase;
                  if (logs.length >= task.logs.length) {
                    task.logs = logs;
                  }
                  if (sData.pendingRefinement) {
                    task.status = 'WAITING_SPEC_APPROVAL';
                    task.specSummary = sData.pendingRefinement.length + ' questões de arquitetura aguardando validação.';
                  }
                }

                // Reconnect SSE streaming and polling for ongoing jobs
                if (taskStatus === 'RUNNING' || taskStatus === 'QUEUED' || taskStatus === 'WAITING_SPEC_APPROVAL' || taskStatus === 'WAITING_FOR_INPUT') {
                  connectSseStream(jId);
                  startStatusPolling(jId);
                }
              }
            } catch {}
          }
        }
      } catch {}

      // 3. Reconcile any cached tasks that were RUNNING to check if they completed
      for (const t of hubTasks) {
        if (!jobPollIntervals.has(t.cycleId) && (t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'WAITING_SPEC_APPROVAL')) {
          try {
            const sRes = await fetch('/orchestrator/status/' + t.cycleId);
            if (sRes.ok) {
              const sData = await sRes.json();
              t.status = sData.pendingRefinement ? 'WAITING_SPEC_APPROVAL' : (sData.status ? sData.status.toUpperCase() : t.status);
              t.currentPhase = sData.phase || t.currentPhase;
              if (sData.historyLogs && Array.isArray(sData.historyLogs) && sData.historyLogs.length > t.logs.length) {
                t.logs = sData.historyLogs.map(item => typeof item === 'string' ? item : (item.text || JSON.stringify(item)));
              }
              if (t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'WAITING_SPEC_APPROVAL') {
                connectSseStream(t.cycleId);
                startStatusPolling(t.cycleId);
              }
            }
          } catch {}
        }
      }

      renderHubTasksTabBar();
      saveHubTasksToStorage();

      const lastActiveId = localStorage.getItem('harness_hub_active_task_id');
      if (lastActiveId && hubTasks.some(t => t.cycleId === lastActiveId)) {
        selectHubTask(lastActiveId);
      } else if (hubTasks.length > 0 && activeTaskId === null) {
        selectHubTask(hubTasks[0].cycleId);
      }
    }

    restoreActiveJobOnLoad();

    // Run Form Submit (Parallel Task Dispatch with Real CLI Execution)
    const runForm = document.getElementById('runForm');
    runForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const scope = document.getElementById('scopeInput').value.trim();
      const agent = document.getElementById('agentSelect').value;
      const mode = document.getElementById('modeSelect').value;
      const project = document.getElementById('projectInput').value.trim();

      if (!scope) {
        alert('Por favor, informe o escopo da tarefa.');
        return;
      }

      await dispatchRunJob({
        scope,
        agent,
        mode,
        project: [project],
        idempotencyKey: 'job-' + Date.now(),
        action: 'reset',
        parallel: true
      });
    });

    // Abort and Clean Current Job Execution
    async function handleAbortJob() {
      if (activeTaskId) {
        await abortHubTask(activeTaskId);
        return;
      }
      const activeJobId = localStorage.getItem('harness_active_job_id');

      if (!confirm('Deseja realmente cancelar e excluir a execução atual para reiniciar?')) {
        return;
      }

      appendLog('[USER] 🛑 Solicitando cancelamento e exclusão da execução atual...');
      btnAbortJob.disabled = true;
      btnAbortJob.innerHTML = '<span>⏳ Cancelando...</span>';

      try {
        if (activeJobId) {
          await fetch('/orchestrator/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: activeJobId })
          });
        }
        await fetch('/orchestrator/jobs/clean', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxAgeMs: 0 })
        });
      } catch (err) {
        console.warn('Erro ao cancelar job no servidor:', err);
      }

      // Limpar chave de job ativo
      localStorage.removeItem('harness_active_job_id');

      // Fechar SSE e parar polling
      if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
      }
      if (activePollInterval) {
        clearInterval(activePollInterval);
        activePollInterval = null;
      }

      // Resetar UI
      const btnStartRun = document.getElementById('btnStartRun');
      btnStartRun.disabled = false;
      btnStartRun.innerHTML = '<span>▶ Iniciar Ciclo Autônomo</span>';

      activeJobLabel.textContent = 'Job: IDLE';
      const statusTag = document.getElementById('pipelineStatusTag');
      if (statusTag) {
        statusTag.textContent = 'Status: CANCELADO / PRONTO PARA NOVO CICLO';
        statusTag.style.color = 'var(--status-disconnected)';
      }

      resetTimeline();

      appendLog('[SERVER] 🛑 Execução cancelada e limpa. Pronto para iniciar um novo ciclo.');
      btnAbortJob.disabled = false;
      btnAbortJob.innerHTML = '<span>🛑 Cancelar / Excluir Execução</span>';
    }

    if (btnAbortJob) {
      btnAbortJob.addEventListener('click', handleAbortJob);
    }

    // Diagnose Batch Execution & Status Handler
    const btnRunDiagnosis = document.getElementById('btnRunDiagnosis');
    const btnRefreshDiagnose = document.getElementById('btnRefreshDiagnose');
    const diagnosePendingCount = document.getElementById('diagnosePendingCount');
    const diagnoseTracesCount = document.getElementById('diagnoseTracesCount');
    const diagnoseCandidatesCount = document.getElementById('diagnoseCandidatesCount');
    const candidatesTableBody = document.getElementById('candidatesTableBody');
    const diagnoseTerminal = document.getElementById('diagnoseTerminal');

    function appendDiagnoseLog(msg) {
      if (diagnoseTerminal) {
        const time = new Date().toLocaleTimeString('pt-BR');
        diagnoseTerminal.textContent += '\\n[' + time + '] ' + msg;
        diagnoseTerminal.scrollTop = diagnoseTerminal.scrollHeight;
      }
      appendLog(msg);
    }

    async function refreshDiagnoseStatus() {
      const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
      try {
        const res = await fetch('/api/diagnose/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath: project })
        });
        if (res.ok) {
          const data = await res.json();
          if (diagnosePendingCount && data.pendingCount !== undefined) {
            diagnosePendingCount.textContent = data.pendingCount;
          }
          if (diagnoseTracesCount && data.tracesCount !== undefined) {
            diagnoseTracesCount.textContent = data.tracesCount;
          }
          if (diagnoseCandidatesCount && data.candidatesCount !== undefined) {
            diagnoseCandidatesCount.textContent = data.candidatesCount;
          }
          const tracesListContainer = document.getElementById('tracesListContainer');
          const tracesFoundBadge = document.getElementById('tracesFoundBadge');
          if (tracesFoundBadge && data.tracesCount !== undefined) {
            tracesFoundBadge.textContent = (data.tracesCount || 0) + ' traces';
          }
          if (tracesListContainer) {
            if (data.traces && data.traces.length > 0) {
              tracesListContainer.innerHTML = data.traces.map(t => \`
                <div style="padding: 6px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-family: monospace; display: flex; align-items: center; gap: 6px;">
                  <span>📄</span>
                  <strong>\${t.id}</strong>
                  <span style="color: var(--text-secondary);">(\${t.skill})</span>
                </div>
              \`).join('');
            } else {
              tracesListContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-secondary);">Nenhum trace gravado ainda. Clique em "Executar Diagnóstico em Lote".</span>';
            }
          }
          if (candidatesTableBody) {
            if (data.candidates && data.candidates.length > 0) {
              candidatesTableBody.innerHTML = data.candidates.map(c => \`
                <tr>
                  <td><code>\${c.id}</code></td>
                  <td><strong>\${c.skill}</strong></td>
                  <td>\${c.rationale}</td>
                  <td>
                    \${c.status === 'PROMOTED' ? '<span class="status-badge status-connected">PROMOTED</span>' : (c.status === 'APPLIED' ? '<span class="status-badge" style="background: rgba(236,112,0,0.15); color: var(--itau-orange);">APPLIED</span>' : '<span class="status-badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">PROPOSED</span>')}
                  </td>
                  <td>
                    \${c.status === 'PROMOTED' ? '<span style="font-size: 11px; color: var(--status-connected); font-weight: 600;">✅ Ativo</span>' : \`<button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="handlePromoteCandidate('\${c.id}')">🚀 Promover</button>\`}
                  </td>
                </tr>
              \`).join('');
            } else {
              candidatesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 16px;">Nenhum candidato a melhoria gerado ainda. Clique em "Propor Otimização (Meta-Harness)".</td></tr>';
            }
          }
        }
      } catch {}
    }

    if (btnRefreshDiagnose) {
      btnRefreshDiagnose.addEventListener('click', async () => {
        await refreshDiagnoseStatus();
        appendDiagnoseLog('🔄 Status das sessões atualizado com sucesso.');
      });
    }

    if (btnRunDiagnosis) {
      btnRunDiagnosis.addEventListener('click', async () => {
        const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
        btnRunDiagnosis.disabled = true;
        btnRunDiagnosis.innerHTML = '<span>⏳ Processando Lote de Diagnóstico...</span>';
        appendDiagnoseLog('🧬 Iniciando processamento do lote de sessões pendentes...');

        try {
          const res = await fetch('/api/diagnose/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath: project, batchSize: 3 })
          });
          const data = await res.json();
          if (data.success) {
            appendDiagnoseLog(\`✅ Processamento concluído! Sessões processadas: \${data.processed ?? 0}, Restantes: \${data.remaining ?? 0}\`);
            if (data.traceIds && data.traceIds.length > 0) {
              appendDiagnoseLog(\`📁 Traces gravados: \${data.traceIds.join(', ')} (verifique em docs/harness-history/traces/)\`);
            }
            if (data.candidateCreated) {
              appendDiagnoseLog(\`💡 Novo candidato gerado: \${data.candidateCreated.id} para skill \${data.candidateCreated.skill}\`);
            }
            await refreshDiagnoseStatus();
          } else {
            appendDiagnoseLog(\`⚠️ Aviso no diagnóstico: \${data.error || data.message || 'Falha ao processar sessões'}\`);
          }
        } catch (err) {
          appendDiagnoseLog(\`❌ Erro ao disparar diagnóstico: \${err.message}\`);
        } finally {
          btnRunDiagnosis.disabled = false;
          btnRunDiagnosis.innerHTML = '<span>⚡ Executar Diagnóstico em Lote (Batch of 3)</span>';
        }
      });
    }

    const btnEvaluatePareto = document.getElementById('btnEvaluatePareto');
    if (btnEvaluatePareto) {
      btnEvaluatePareto.addEventListener('click', async () => {
        const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
        btnEvaluatePareto.disabled = true;
        btnEvaluatePareto.innerHTML = '<span>⏳ Avaliando Pareto Frontier...</span>';
        appendDiagnoseLog('📊 [EVALUATOR] Iniciando cálculo da Fronteira de Pareto e scores compostos...');

        try {
          const res = await fetch('/api/diagnose/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath: project })
          });
          const data = await res.json();
          if (data.success) {
            appendDiagnoseLog(\`✅ Avaliação concluída! Sessões avaliadas: \${data.totalEvaluated}, Melhor Score: \${data.bestScore}\`);
            appendDiagnoseLog(\`🏆 Configuração Ótima: \${data.optimalChain}\`);
            appendDiagnoseLog(\`📝 docs/harness-history/pareto-frontier.md e score.md atualizados com sucesso!\`);
            await refreshDiagnoseStatus();
          } else {
            appendDiagnoseLog(\`⚠️ Aviso na avaliação: \${data.error || 'Falha ao avaliar traces'}\`);
          }
        } catch (err) {
          appendDiagnoseLog(\`❌ Erro ao avaliar Pareto: \${err.message}\`);
        } finally {
          btnEvaluatePareto.disabled = false;
          btnEvaluatePareto.innerHTML = '<span>📊 Avaliar Pareto Frontier</span>';
        }
      });
    }

    const btnProposeCandidate = document.getElementById('btnProposeCandidate');
    if (btnProposeCandidate) {
      btnProposeCandidate.addEventListener('click', async () => {
        const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
        btnProposeCandidate.disabled = true;
        btnProposeCandidate.innerHTML = '<span>⏳ Propondo Otimização...</span>';
        appendDiagnoseLog('💡 [META-HARNESS] Analisando histórico e propondo candidato de melhoria direcionada...');

        try {
          const res = await fetch('/api/diagnose/propose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath: project })
          });
          const data = await res.json();
          if (data.success) {
            appendDiagnoseLog(\`✅ Novo Candidato gerado: \${data.candidateId} para a skill \${data.targetSkill}\`);
            appendDiagnoseLog(\`📁 Arquivos salvos em \${data.path}/ (rationale.md, SKILL.md, diff.md, score.md)\`);
            await refreshDiagnoseStatus();
          } else {
            appendDiagnoseLog(\`⚠️ Aviso na proposição: \${data.error || 'Falha ao propor candidato'}\`);
          }
        } catch (err) {
          appendDiagnoseLog(\`❌ Erro ao propor melhoria: \${err.message}\`);
        } finally {
          btnProposeCandidate.disabled = false;
          btnProposeCandidate.innerHTML = '<span>💡 Propor Otimização (Meta-Harness)</span>';
        }
      });
    }

    window.handlePromoteCandidate = async function(candidateId) {
      if (!confirm(\`Deseja promover o candidato \${candidateId} para ser a regra ativa oficial em skills/?\`)) {
        return;
      }
      const project = document.getElementById('projectInput') ? document.getElementById('projectInput').value : '';
      appendDiagnoseLog(\`🚀 [PROMOTION] Promovendo candidato \${candidateId} para produção...\`);

      try {
        const res = await fetch('/api/diagnose/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath: project, candidateId })
        });
        const data = await res.json();
        if (data.success) {
          appendDiagnoseLog(\`✅ \${data.message || 'Candidato promovido com sucesso!'}\`);
          await refreshDiagnoseStatus();
        } else {
          appendDiagnoseLog(\`❌ Erro na promoção: \${data.error || 'Falha ao promover candidato'}\`);
        }
      } catch (err) {
        appendDiagnoseLog(\`❌ Erro de conexão na promoção: \${err.message}\`);
      }
    };

    // Carregar status do diagnóstico na inicialização
    refreshDiagnoseStatus();

    // Health Polling
    async function checkHealth() {
      try {
        const res = await fetch('/health');
        const badge = document.getElementById('connBadge');
        const text = document.getElementById('connText');
        if (res.ok) {
          badge.className = 'status-badge status-connected';
          text.textContent = 'Connected (127.0.0.1:3000)';
        } else {
          badge.className = 'status-badge status-disconnected';
          text.textContent = 'Degraded';
        }
      } catch {
        const badge = document.getElementById('connBadge');
        const text = document.getElementById('connText');
        badge.className = 'status-badge status-disconnected';
        text.textContent = 'Disconnected';
      }
    }

    setInterval(checkHealth, 10000);
  
            // --- CYBERNETIC MULTI-AGENT ORCHESTRATION & COMMUNICATION (img2threejs + Three.js) ---
    var onbScene, onbCamera, onbRenderer, onbOrchestratorMesh, onbAgentNodes = [], onbPackets = [];
    var onbTargetRotX = 0, onbTargetRotY = 0;
    var onbInitialized = false;

    var swarmStations = [
      { name: 'Cartographer (Memory)', agent: 'project-memory', color: 0x38bdf8, pos: [-3.0, 1.5, 0], protocol: 'AST_GRAPH_INDEX' },
      { name: 'Architect (DDD)', agent: 'scope-refinement', color: 0xc084fc, pos: [-3.0, -1.5, 0], protocol: 'GIVEN_WHEN_THEN_SPEC' },
      { name: 'Builder (TDD Loop)', agent: 'tdd-orchestrator', color: 0x10b981, pos: [0, -2.6, 0.4], protocol: 'RED_GREEN_TDD_CYCLE' },
      { name: 'Auditor (Tech Lead & QA)', agent: 'the-grumpy-tech-lead', color: 0xf59e0b, pos: [3.0, -1.5, 0], protocol: 'TECH_LEAD_VERDICT_0.98' },
      { name: 'Genetic Optimizer', agent: 'meta-harness', color: 0x0ea5e9, pos: [3.0, 1.5, 0], protocol: 'PARETO_OPTIMIZATION' }
    ];

    function initOnboardingThreeJs() {
      if (onbInitialized) return;
      var container = document.getElementById('onboarding-canvas-container');
      var canvas = document.getElementById('onboarding-three-canvas');
      if (!container || !canvas || typeof THREE === 'undefined') return;

      var w = container.clientWidth || 400;
      var h = container.clientHeight || 320;

      onbScene = new THREE.Scene();
      onbCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      onbCamera.position.set(0, 0, 7.5);

      onbRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      onbRenderer.setSize(w, h);
      onbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      var ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      onbScene.add(ambientLight);

      // Central Hub: Orchestrator Core (FSM Engine)
      var hubGroup = new THREE.Group();
      
      // Outer Cylindrical Station Base
      var baseGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.4, 32);
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      var baseMesh = new THREE.Mesh(baseGeo, baseMat);
      hubGroup.add(baseMesh);

      // Core Hologram Crystal
      var cryGeo = new THREE.OctahedronGeometry(0.5, 0);
      var cryMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, wireframe: true, metalness: 0.9 });
      var cryMesh = new THREE.Mesh(cryGeo, cryMat);
      cryMesh.position.y = 0.5;
      hubGroup.add(cryMesh);

      // Rotating FSM Energy Rings
      var r1Geo = new THREE.RingGeometry(1.1, 1.15, 32);
      var r1Mat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      var r1 = new THREE.Mesh(r1Geo, r1Mat);
      r1.rotation.x = Math.PI / 2;
      hubGroup.add(r1);

      onbScene.add(hubGroup);
      onbOrchestratorMesh = hubGroup;

      // Create Agent Workstations and Laser Data Highways
      onbAgentNodes = [];
      onbPackets = [];

      for (var i = 0; i < swarmStations.length; i++) {
        var st = swarmStations[i];
        var sGroup = new THREE.Group();

        // Terminal Stand
        var tBaseGeo = new THREE.BoxGeometry(0.7, 0.1, 0.5);
        var tBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        var tBase = new THREE.Mesh(tBaseGeo, tBaseMat);
        sGroup.add(tBase);

        // Holographic Monitor Screen
        var scrGeo = new THREE.BoxGeometry(0.6, 0.4, 0.04);
        var scrMat = new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.1, metalness: 0.9 });
        var scr = new THREE.Mesh(scrGeo, scrMat);
        scr.position.set(0, 0.3, 0);
        sGroup.add(scr);

        // Halo Beacon
        var bGeo = new THREE.SphereGeometry(0.12, 16, 16);
        var bMat = new THREE.MeshBasicMaterial({ color: st.color });
        var beacon = new THREE.Mesh(bGeo, bMat);
        beacon.position.set(0, 0.65, 0);
        sGroup.add(beacon);

        sGroup.position.set(st.pos[0], st.pos[1], st.pos[2]);
        sGroup.userData = { station: st };
        onbScene.add(sGroup);
        onbAgentNodes.push(sGroup);

        // Laser Data Highway (Connecting Track to Central Orchestrator Hub)
        var highwayCurve = new THREE.LineCurve3(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(st.pos[0], st.pos[1], st.pos[2])
        );
        var tubeGeo = new THREE.TubeGeometry(highwayCurve, 20, 0.025, 8, false);
        var tubeMat = new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.35 });
        var tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        onbScene.add(tubeMesh);

        // Active Moving Message Packet
        var pktGeo = new THREE.BoxGeometry(0.18, 0.12, 0.08);
        var pktMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        var pktMesh = new THREE.Mesh(pktGeo, pktMat);
        onbScene.add(pktMesh);

        onbPackets.push({
          mesh: pktMesh,
          start: new THREE.Vector3(0, 0.2, 0),
          end: new THREE.Vector3(st.pos[0], st.pos[1] + 0.3, st.pos[2]),
          progress: i * 0.2,
          speed: 0.008 + (i * 0.002),
          color: st.color
        });
      }

      // Background Cybernetic Grid Particles
      var pCount = 140;
      var pGeo = new THREE.BufferGeometry();
      var pPos = new Float32Array(pCount * 3);
      for (var p = 0; p < pCount * 3; p += 3) {
        pPos[p] = (Math.random() - 0.5) * 14;
        pPos[p + 1] = (Math.random() - 0.5) * 12;
        pPos[p + 2] = (Math.random() - 0.5) * 6 - 2;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      var pMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.035, transparent: true, opacity: 0.4 });
      onbScene.add(new THREE.Points(pGeo, pMat));

      container.addEventListener('mousemove', function(e) {
        var rect = container.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        onbTargetRotY = x * 0.45;
        onbTargetRotX = y * 0.35;
      });

      function animate() {
        requestAnimationFrame(animate);

        // Rotate Orchestrator Crystal and Rings
        if (onbOrchestratorMesh) {
          onbOrchestratorMesh.rotation.y += 0.012;
          if (onbOrchestratorMesh.children[1]) {
            onbOrchestratorMesh.children[1].rotation.x += 0.02;
            onbOrchestratorMesh.children[1].rotation.z += 0.015;
          }
        }

        // Animate Traveling Message Packets between Orchestrator and Agent Workstations
        for (var k = 0; k < onbPackets.length; k++) {
          var pkt = onbPackets[k];
          pkt.progress += pkt.speed;
          if (pkt.progress > 1) pkt.progress = 0;

          // Ping pong or unidirectional pulse
          var alpha = pkt.progress;
          pkt.mesh.position.lerpVectors(pkt.start, pkt.end, alpha);
          pkt.mesh.rotation.y += 0.04;
        }

        // Subtle Mouse Parallax
        onbScene.rotation.y += (onbTargetRotY - onbScene.rotation.y) * 0.05;
        onbScene.rotation.x += (onbTargetRotX - onbScene.rotation.x) * 0.05;

        onbRenderer.render(onbScene, onbCamera);
      }
      animate();
      onbInitialized = true;
    }

    function highlightSwarmNode(idx, agentName) {
      var label = document.getElementById('onbSelectedAgentLabel');
      if (label) {
        label.textContent = '● Inspecionando: ' + agentName;
      }
      document.querySelectorAll('.agent-card').forEach(function(c) { c.classList.remove('active'); });
      if (typeof event !== 'undefined' && event && event.currentTarget) {
        event.currentTarget.classList.add('active');
      }
      if (onbAgentNodes && onbAgentNodes[idx]) {
        var targetNode = onbAgentNodes[idx];
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(targetNode.scale, { x: 1.5, y: 1.5, z: 1.5 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out(2)' });
        }
      }
    }

    // --- CYBERNETIC MULTI-AGENT SWARM SIMULATOR (gsap + motion) ---
    var isSimulating = false;
    async function simulateAgenticCycle() {
      if (isSimulating) return;
      isSimulating = true;
      var term = document.getElementById('simTerminal');
      var bar = document.getElementById('simProgressBar');
      var btn = document.getElementById('btnStartSimulation');
      if (btn) btn.disabled = true;

      term.innerHTML = '';
      function log(agent, msg, color) {
        if (!color) color = '#38bdf8';
        var time = new Date().toLocaleTimeString();
        term.innerHTML += '<div style="margin-bottom: 4px; color: #f1f5f9;"><span style="color: rgba(255,255,255,0.3); font-size: 11px;">[' + time + ']</span> <strong style="color: ' + color + ';">[' + agent + ']</strong> ' + msg + '</div>';
        term.scrollTop = term.scrollHeight;
      }

      var steps = [
        { agent: 'ORCHESTRATOR', pct: 15, color: '#38bdf8', msg: 'Isolando workspace em Git Worktree efêmero: .worktrees/job-pix-8821. Mutex garantido.' },
        { agent: 'PROJECT-MEMORY', pct: 30, color: '#38bdf8', msg: 'Varrendo docs/.graph.json. Contexto carregado: ADR-004 (Política de Idempotência de Pagamentos).' },
        { agent: 'SCOPE-REFINEMENT', pct: 45, color: '#c084fc', msg: 'DDD Refinement concluído. 3 cenários executáveis Given-When-Then gerados para chave de idempotência.' },
        { agent: 'TDD-ENGINE', pct: 65, color: '#10b981', msg: 'Ciclo TDD executado: tests/PaymentIdempotency.test.ts. RED ❌ (falha esperada) -> GREEN ✅ (lógica mínima) -> REFACTOR ♻️.' },
        { agent: 'ADVERSARIAL-QA', pct: 80, color: '#f43f5e', msg: 'Disparando 20 requisições simultâneas em 5ms. Teste de Race Condition: 0 pagamentos duplicados detectados.' },
        { agent: 'GRUMPY-TECH-LEAD', pct: 92, color: '#f59e0b', msg: 'Auditoria de Arquitetura: Zero queries N+1, isolamento de transação ACID verificado. Veredito: APROVADO (Score: 0.98 / 1.00).' },
        { agent: 'META-HARNESS', pct: 100, color: '#38bdf8', msg: 'Trace gravado em docs/harness-history/traces/. Consumo: 1.2k tokens ($0.0024). Pareto Frontier atualizado. Pipeline concluído!' }
      ];

      for (var j = 0; j < steps.length; j++) {
        var s = steps[j];
        if (bar) bar.style.width = s.pct + '%';
        log(s.agent, s.msg, s.color);
        await new Promise(function(r) { setTimeout(r, 1000); });
      }

      if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔄 Disparar Nova Simulação';
      }
      isSimulating = false;
    }

    function copyOnboardingCommand(cmd) {
      navigator.clipboard.writeText(cmd);
      alert('Comando copiado para a área de transferência: ' + cmd);
    }

  </script>
</body>
</html>`;
    }
}
exports.WebUiRenderer = WebUiRenderer;
//# sourceMappingURL=WebUiRenderer.js.map