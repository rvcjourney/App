/**
 * Centralized color constants for the app
 * Single source of truth for all theming
 */

export const COLORS = {
  // Primary app theme (used in auth, teacher, student screens)
  BG: '#0f1b3f',           // Main dark background
  CARD: 'rgba(255, 255, 255, 0.08)',  // Glassmorphic card background
  PRIMARY: '#ff006e',      // Primary accent (neon pink)
  SECONDARY: '#00d4ff',    // Secondary accent (cyan)
  TEXT: '#ffffff',         // Primary text
  TEXT_MUTED: '#b0b0b0',   // Secondary text
  BORDER: 'rgba(255, 0, 110, 0.3)',    // Input/card border
  INPUT_BG: 'rgba(255, 255, 255, 0.05)', // Input field background

  // Admin/Meeting theme (used in admin screens)
  ADMIN_BG: '#0B0D2A',
  ADMIN_CARD: '#1C1F4A',
  ADMIN_ACCENT: '#5568FE',
  ADMIN_TEXT: '#FFFFFF',
  ADMIN_INDICATOR: '#2ECC71', // Green success indicator

  // Status colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
};

export default COLORS;
