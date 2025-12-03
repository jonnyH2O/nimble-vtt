/**
 * Application Constants
 *
 * Shared constants used throughout the Nimble Combat Tracker application.
 */

export const VIRTUAL_CANVAS_SIZE = 2000;
export const SIDEBAR_WIDTH = 352;
export const DRAWING_HISTORY_LIMIT = 10;
export const STROKE_HISTORY_LIMIT = 200;
export const DEFAULT_TOKEN_POSITION = { x: 100, y: 100 };
export const HUD_Z_INDEX = 50;
export const MODAL_Z_INDEX = 100;

/**
 * Token Type Styling Configuration
 */
export const TOKEN_STYLES = {
  hero: {
    border: 'border-blue-500',
    bg: 'bg-blue-600',
    icon: 'Users'
  },
  enemy: {
    border: 'border-red-500',
    bg: 'bg-red-600',
    icon: 'Swords'
  },
  companion: {
    border: 'border-green-500',
    bg: 'bg-green-600',
    icon: 'Heart'
  },
  legendary: {
    border: 'border-purple-500',
    bg: 'bg-purple-600',
    icon: 'Crown'
  }
};

/**
 * Helper function to get token border color class
 */
export function getTokenBorderColor(type) {
  return TOKEN_STYLES[type]?.border || 'border-gray-500';
}

/**
 * Helper function to get token background color class
 */
export function getTokenBgColor(type) {
  return TOKEN_STYLES[type]?.bg || 'bg-gray-600';
}

/**
 * Helper function to get token icon name
 */
export function getTokenIconName(type) {
  return TOKEN_STYLES[type]?.icon || 'Users';
}
