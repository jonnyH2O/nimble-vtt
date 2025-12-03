/**
 * Message Types for BroadcastChannel Communication
 *
 * Defines all message types used for cross-window synchronization
 * between main window and pop-out window.
 */

export const MESSAGE_TYPES = {
  // Main → Pop-out: Full state broadcast
  STATE_UPDATE: 'STATE_UPDATE',

  // Pop-out → Main: Token mutations
  HEALTH_UPDATE: 'HEALTH_UPDATE',
  TOKEN_UPDATE: 'TOKEN_UPDATE',
  CONDITION_TOGGLE: 'CONDITION_TOGGLE',
  WOUNDS_UPDATE: 'WOUNDS_UPDATE',
  TEMP_HP_UPDATE: 'TEMP_HP_UPDATE',
  TEMP_HP_TOGGLE: 'TEMP_HP_TOGGLE',
  TOKEN_SIZE_UPDATE: 'TOKEN_SIZE_UPDATE',
  TOKEN_RESOURCE_UPDATE: 'TOKEN_RESOURCE_UPDATE',
  REMOVE_TOKEN: 'REMOVE_TOKEN',

  // Pop-out → Main: Turn order mutations
  TURN_ORDER_UPDATE: 'TURN_ORDER_UPDATE',
  ACTION_TOGGLE: 'ACTION_TOGGLE',
  START_TURN: 'START_TURN',
  END_TURN: 'END_TURN',
  RESET_NON_HERO_ACTIONS: 'RESET_NON_HERO_ACTIONS',

  // Pop-out → Main: UI state mutations
  NOTES_UPDATE: 'NOTES_UPDATE',
  SIDEBAR_VIEW_UPDATE: 'SIDEBAR_VIEW_UPDATE',
  DELETE_MODE_UPDATE: 'DELETE_MODE_UPDATE',
  SELECT_TOKEN: 'SELECT_TOKEN',
  EXPANDED_CONDITIONS_UPDATE: 'EXPANDED_CONDITIONS_UPDATE',
  EXPANDED_NOTES_UPDATE: 'EXPANDED_NOTES_UPDATE',

  // Handshake messages
  WINDOW_READY: 'WINDOW_READY',
  WINDOW_CLOSING: 'WINDOW_CLOSING',
};

/**
 * Creates a standardized message object for BroadcastChannel
 *
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {*} payload - Message payload (any data)
 * @returns {Object} Standardized message object with timestamp
 */
export function createMessage(type, payload) {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}
