// customer-frontend/src/app/theme/theme.service.ts
import { Injectable } from '@angular/core';

export type ThemeColour = 'Green' | 'Blue' | 'Red' | 'Purple' | 'Pink' | 'Brown' | 'Gray';
export type ThemeMode   = 'Light' | 'Dark';

interface ColourTokens {
  primary:       string;
  primaryDark:   string;
  primaryLight:  string;
  primaryMuted:  string;
  accent:        string;
  bgPage:        string;
  bgCard:        string;
  bgBanner:      string;
  textPrimary:   string;
  textSecondary: string;
  textOnPrimary: string;
  border:        string;
  navBg:         string;
  navText:       string;
  navTextActive: string;
  badgeBg:       string;
}

const COLOUR_PALETTES: Record<ThemeColour, { light: ColourTokens; dark: ColourTokens }> = {
  Green: {
    light: {
      primary: '#4a7c3f', primaryDark: '#2f5227', primaryLight: '#c8dfc4',
      primaryMuted: '#e8f3e6', accent: '#f0a500',
      bgPage: '#f2f8f0', bgCard: '#ffffff', bgBanner: '#4a7c3f',
      textPrimary: '#1a2e18', textSecondary: '#4a7c3f', textOnPrimary: '#ffffff',
      border: '#c8dfc4', navBg: '#ffffff', navText: '#4a7c3f',
      navTextActive: '#2f5227', badgeBg: '#4a7c3f'
    },
    dark: {
      primary: '#6aad5e', primaryDark: '#4a7c3f', primaryLight: '#2a3d28',
      primaryMuted: '#1e2e1c', accent: '#f0a500',
      bgPage: '#131f12', bgCard: '#1e2e1c', bgBanner: '#2a3d28',
      textPrimary: '#d4ecd1', textSecondary: '#6aad5e', textOnPrimary: '#0d1a0c',
      border: '#2a3d28', navBg: '#1a2e18', navText: '#6aad5e',
      navTextActive: '#a0d49a', badgeBg: '#6aad5e'
    }
  },

  Blue: {
    light: {
      primary: '#2563eb', primaryDark: '#1e40af', primaryLight: '#bfdbfe',
      primaryMuted: '#eff6ff', accent: '#f59e0b',
      bgPage: '#f0f6ff', bgCard: '#ffffff', bgBanner: '#2563eb',
      textPrimary: '#1e3a5f', textSecondary: '#2563eb', textOnPrimary: '#ffffff',
      border: '#bfdbfe', navBg: '#ffffff', navText: '#2563eb',
      navTextActive: '#1e40af', badgeBg: '#2563eb'
    },
    dark: {
      primary: '#60a5fa', primaryDark: '#2563eb', primaryLight: '#1e3a5f',
      primaryMuted: '#0f1f36', accent: '#f59e0b',
      bgPage: '#0a1628', bgCard: '#0f1f36', bgBanner: '#1e3a5f',
      textPrimary: '#bfdbfe', textSecondary: '#60a5fa', textOnPrimary: '#0a1628',
      border: '#1e3a5f', navBg: '#0f1f36', navText: '#60a5fa',
      navTextActive: '#93c5fd', badgeBg: '#60a5fa'
    }
  },

  Red: {
    light: {
      primary: '#dc2626', primaryDark: '#991b1b', primaryLight: '#fecaca',
      primaryMuted: '#fff5f5', accent: '#f59e0b',
      bgPage: '#fff5f5', bgCard: '#ffffff', bgBanner: '#dc2626',
      textPrimary: '#450a0a', textSecondary: '#dc2626', textOnPrimary: '#ffffff',
      border: '#fecaca', navBg: '#ffffff', navText: '#dc2626',
      navTextActive: '#991b1b', badgeBg: '#dc2626'
    },
    dark: {
      primary: '#f87171', primaryDark: '#dc2626', primaryLight: '#450a0a',
      primaryMuted: '#2d0808', accent: '#f59e0b',
      bgPage: '#1a0404', bgCard: '#2d0808', bgBanner: '#450a0a',
      textPrimary: '#fecaca', textSecondary: '#f87171', textOnPrimary: '#1a0404',
      border: '#450a0a', navBg: '#2d0808', navText: '#f87171',
      navTextActive: '#fca5a5', badgeBg: '#f87171'
    }
  },

  Purple: {
    light: {
      primary: '#7c3aed', primaryDark: '#5b21b6', primaryLight: '#ddd6fe',
      primaryMuted: '#f5f3ff', accent: '#f59e0b',
      bgPage: '#f5f3ff', bgCard: '#ffffff', bgBanner: '#7c3aed',
      textPrimary: '#2e1065', textSecondary: '#7c3aed', textOnPrimary: '#ffffff',
      border: '#ddd6fe', navBg: '#ffffff', navText: '#7c3aed',
      navTextActive: '#5b21b6', badgeBg: '#7c3aed'
    },
    dark: {
      primary: '#a78bfa', primaryDark: '#7c3aed', primaryLight: '#2e1065',
      primaryMuted: '#1a0a40', accent: '#f59e0b',
      bgPage: '#0f0720', bgCard: '#1a0a40', bgBanner: '#2e1065',
      textPrimary: '#ddd6fe', textSecondary: '#a78bfa', textOnPrimary: '#0f0720',
      border: '#2e1065', navBg: '#1a0a40', navText: '#a78bfa',
      navTextActive: '#c4b5fd', badgeBg: '#a78bfa'
    }
  },

  Pink: {
    light: {
      primary: '#db2777', primaryDark: '#9d174d', primaryLight: '#fbcfe8',
      primaryMuted: '#fdf2f8', accent: '#f59e0b',
      bgPage: '#fdf2f8', bgCard: '#ffffff', bgBanner: '#db2777',
      textPrimary: '#500724', textSecondary: '#db2777', textOnPrimary: '#ffffff',
      border: '#fbcfe8', navBg: '#ffffff', navText: '#db2777',
      navTextActive: '#9d174d', badgeBg: '#db2777'
    },
    dark: {
      primary: '#f472b6', primaryDark: '#db2777', primaryLight: '#500724',
      primaryMuted: '#2d0318', accent: '#fbbf24',
      bgPage: '#180210', bgCard: '#2d0318', bgBanner: '#500724',
      textPrimary: '#fbcfe8', textSecondary: '#f472b6', textOnPrimary: '#180210',
      border: '#500724', navBg: '#2d0318', navText: '#f472b6',
      navTextActive: '#f9a8d4', badgeBg: '#f472b6'
    }
  },

  Brown: {
    light: {
      primary: '#92400e', primaryDark: '#6b2d0a', primaryLight: '#fde68a',
      primaryMuted: '#fffbeb', accent: '#d97706',
      bgPage: '#fffbeb', bgCard: '#ffffff', bgBanner: '#92400e',
      textPrimary: '#3d1a00', textSecondary: '#92400e', textOnPrimary: '#ffffff',
      border: '#fde68a', navBg: '#ffffff', navText: '#92400e',
      navTextActive: '#6b2d0a', badgeBg: '#92400e'
    },
    dark: {
      primary: '#d97706', primaryDark: '#92400e', primaryLight: '#3d1a00',
      primaryMuted: '#1e0d00', accent: '#fbbf24',
      bgPage: '#120800', bgCard: '#1e0d00', bgBanner: '#3d1a00',
      textPrimary: '#fde68a', textSecondary: '#d97706', textOnPrimary: '#120800',
      border: '#3d1a00', navBg: '#1e0d00', navText: '#d97706',
      navTextActive: '#fbbf24', badgeBg: '#d97706'
    }
  },

  Gray: {
    light: {
      primary: '#374151', primaryDark: '#1f2937', primaryLight: '#d1d5db',
      primaryMuted: '#f9fafb', accent: '#6b7280',
      bgPage: '#f9fafb', bgCard: '#ffffff', bgBanner: '#374151',
      textPrimary: '#111827', textSecondary: '#374151', textOnPrimary: '#ffffff',
      border: '#d1d5db', navBg: '#ffffff', navText: '#374151',
      navTextActive: '#1f2937', badgeBg: '#374151'
    },
    dark: {
      primary: '#9ca3af', primaryDark: '#374151', primaryLight: '#1f2937',
      primaryMuted: '#111827', accent: '#6b7280',
      bgPage: '#030712', bgCard: '#111827', bgBanner: '#1f2937',
      textPrimary: '#f3f4f6', textSecondary: '#9ca3af', textOnPrimary: '#030712',
      border: '#1f2937', navBg: '#111827', navText: '#9ca3af',
      navTextActive: '#e5e7eb', badgeBg: '#9ca3af'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class ThemeService {

  applyTheme(theme: string, colour: string): void {
    const mode   = (theme === 'Dark' ? 'Dark' : 'Light') as ThemeMode;
    const col    = this.resolveColour(colour);
    const tokens = COLOUR_PALETTES[col][mode === 'Dark' ? 'dark' : 'light'];
    const root   = document.documentElement;

    root.setAttribute('data-theme', mode.toLowerCase());
    root.setAttribute('data-colour', col.toLowerCase());

    root.style.setProperty('--c-primary',        tokens.primary);
    root.style.setProperty('--c-primary-dark',   tokens.primaryDark);
    root.style.setProperty('--c-primary-light',  tokens.primaryLight);
    root.style.setProperty('--c-primary-muted',  tokens.primaryMuted);
    root.style.setProperty('--c-accent',         tokens.accent);
    root.style.setProperty('--c-bg-page',        tokens.bgPage);
    root.style.setProperty('--c-bg-card',        tokens.bgCard);
    root.style.setProperty('--c-bg-banner',      tokens.bgBanner);
    root.style.setProperty('--c-text-primary',   tokens.textPrimary);
    root.style.setProperty('--c-text-secondary', tokens.textSecondary);
    root.style.setProperty('--c-text-on-primary',tokens.textOnPrimary);
    root.style.setProperty('--c-border',         tokens.border);
    root.style.setProperty('--c-nav-bg',         tokens.navBg);
    root.style.setProperty('--c-nav-text',       tokens.navText);
    root.style.setProperty('--c-nav-text-active',tokens.navTextActive);
    root.style.setProperty('--c-badge-bg',       tokens.badgeBg);
  }

  private resolveColour(colour: string): ThemeColour {
    const valid: ThemeColour[] = ['Green','Blue','Red','Purple','Pink','Brown','Gray'];
    return valid.find(c => c.toLowerCase() === colour.toLowerCase()) ?? 'Green';
  }
}
