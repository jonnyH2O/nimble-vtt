import { useReducer, useState, useCallback } from 'react';

const DEFAULT_TOKEN_POSITION = { x: 100, y: 100 };

// Token reducer for efficient state updates
function tokensReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOKEN':
      return [...state, action.payload];

    case 'REMOVE_TOKEN':
      return state.filter(t => t.id !== action.payload);

    case 'UPDATE_TOKEN':
      // Surgical update - only the specified token is replaced
      return state.map(t =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
      );

    case 'UPDATE_HEALTH': {
      const { tokenId, newHealth } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const wasAlive = t.health > 0;
        const clampedHealth = Math.max(0, Math.min(t.maxHealth, newHealth));
        const conditions = t.conditions || [];
        let newConditions = [...conditions];
        let wounds = t.wounds || 0;

        // Auto-manage Dying condition (at 0 HP)
        if (clampedHealth === 0) {
          if (wasAlive && (t.type === 'hero' || t.type === 'companion')) {
            wounds = wounds + 1;
          }
          if (!newConditions.includes('Dying')) {
            newConditions.push('Dying');
          }
          newConditions = newConditions.filter(c => c !== 'Bloodied');
        } else {
          newConditions = newConditions.filter(c => c !== 'Dying');
          const isBloodied = clampedHealth <= t.maxHealth / 2;
          if (isBloodied && !newConditions.includes('Bloodied')) {
            newConditions.push('Bloodied');
          } else if (!isBloodied && newConditions.includes('Bloodied')) {
            newConditions = newConditions.filter(c => c !== 'Bloodied');
          }
        }

        // Auto-manage Wounded condition
        if (t.type === 'hero' || t.type === 'companion') {
          if (wounds > 0 && !newConditions.includes('Wounded')) {
            newConditions.push('Wounded');
          } else if (wounds === 0) {
            newConditions = newConditions.filter(c => c !== 'Wounded');
          }
        }

        return { ...t, health: clampedHealth, conditions: newConditions, wounds };
      });
    }

    case 'UPDATE_MAX_HEALTH': {
      const { tokenId, newMaxHealth } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const maxHP = Math.max(1, newMaxHealth);
        const clampedHealth = Math.min(t.health, maxHP);
        const conditions = t.conditions || [];
        let newConditions = [...conditions];

        if (clampedHealth === 0) {
          if (!newConditions.includes('Dying')) {
            newConditions.push('Dying');
          }
          newConditions = newConditions.filter(c => c !== 'Bloodied');
        } else {
          newConditions = newConditions.filter(c => c !== 'Dying');
          const isBloodied = clampedHealth <= maxHP / 2;
          if (isBloodied && !newConditions.includes('Bloodied')) {
            newConditions.push('Bloodied');
          } else if (!isBloodied && newConditions.includes('Bloodied')) {
            newConditions = newConditions.filter(c => c !== 'Bloodied');
          }
        }

        return { ...t, maxHealth: maxHP, health: clampedHealth, conditions: newConditions };
      });
    }

    case 'TOGGLE_CONDITION': {
      const { tokenId, condition } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const conditions = t.conditions || [];
        const hasCondition = conditions.includes(condition);
        return {
          ...t,
          conditions: hasCondition
            ? conditions.filter(c => c !== condition)
            : [...conditions, condition]
        };
      });
    }

    case 'UPDATE_WOUNDS': {
      const { tokenId, newWounds } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const wounds = Math.max(0, newWounds);
        const conditions = t.conditions || [];
        let newConditions = [...conditions];

        if (wounds > 0 && !newConditions.includes('Wounded')) {
          newConditions.push('Wounded');
        } else if (wounds === 0) {
          newConditions = newConditions.filter(c => c !== 'Wounded');
        }

        return { ...t, wounds, conditions: newConditions };
      });
    }

    case 'TOGGLE_ACTION': {
      const { tokenId, actionIndex } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const newActions = [...t.actions];
        newActions[actionIndex] = !newActions[actionIndex];
        return { ...t, actions: newActions };
      });
    }

    case 'START_TURN': {
      const { tokenId } = action.payload;
      return state.map(t => ({
        ...t,
        isActiveTurn: t.id === tokenId
      }));
    }

    case 'END_TURN': {
      const { tokenId } = action.payload;
      return state.map(t =>
        t.id === tokenId ? { ...t, isActiveTurn: false, actions: t.actions.map(() => false) } : t
      );
    }

    case 'RESET_NON_HERO_ACTIONS':
      return state.map(t =>
        t.type !== 'hero' ? { ...t, actions: t.actions.map(() => false) } : t
      );

    case 'CLEAR_CONDITIONS': {
      const { tokenId } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const doomedConditions = ['Bloodied', 'Dying', 'Wounded'];
        return {
          ...t,
          conditions: (t.conditions || []).filter(c => doomedConditions.includes(c))
        };
      });
    }

    case 'TOGGLE_TEMP_HP': {
      const { tokenId } = action.payload;
      return state.map(t =>
        t.id === tokenId ? { ...t, showTempHP: !t.showTempHP } : t
      );
    }

    case 'TOGGLE_HEALTH_IN_VIEWPORT': {
      const { tokenId } = action.payload;
      return state.map(t =>
        t.id === tokenId ? { ...t, showHealthInViewport: !t.showHealthInViewport } : t
      );
    }

    case 'SET_ALL_TOKENS':
      return action.payload;

    default:
      return state;
  }
}

/**
 * Custom Hook: Token Management
 *
 * Manages all token CRUD operations and state using a reducer pattern.
 *
 * @param {number} tokenSize - Default size for tokens (not currently used in hook)
 * @returns {Object} Token state and management functions
 */
export function useTokens(tokenSize) {
  const [tokens, dispatchTokens] = useReducer(tokensReducer, []);
  const [selectedToken, setSelectedToken] = useState(null);

  const addToken = useCallback((tokenData) => {
    const token = {
      id: crypto.randomUUID(),
      name: tokenData.name,
      type: tokenData.type,
      image: tokenData.image,
      x: DEFAULT_TOKEN_POSITION.x,
      y: DEFAULT_TOKEN_POSITION.y,
      actions: tokenData.type === 'hero' ? [false, false, false] :
               tokenData.type === 'legendary' ? [false, false, false, false, false, false] :
               [false],
      isActiveTurn: false,
      health: 10,
      maxHealth: 10,
      tempHP: 0,
      showTempHP: false,
      notes: '',
      conditions: [],
      wounds: 0,
      maxWounds: 6,
      customSize: null,
      hasResource: tokenData.hasResource || false,
      resourceName: tokenData.resourceName || '',
      resourceColor: tokenData.resourceColor || '#3b82f6',
      currentResource: tokenData.currentResource || 0,
      maxResource: tokenData.maxResource || 0,
      showHealthInViewport: tokenData.type === 'hero' || tokenData.type === 'companion' // Off by default for enemy/legendary
    };
    dispatchTokens({ type: 'ADD_TOKEN', payload: token });
    return token.id;
  }, []);

  const removeToken = useCallback((id) => {
    dispatchTokens({ type: 'REMOVE_TOKEN', payload: id });
    if (selectedToken === id) setSelectedToken(null);
  }, [selectedToken]);

  const updateHealth = useCallback((tokenId, newHealth) => {
    dispatchTokens({ type: 'UPDATE_HEALTH', payload: { tokenId, newHealth } });
  }, []);

  const updateMaxHealth = useCallback((tokenId, newMaxHealth) => {
    dispatchTokens({ type: 'UPDATE_MAX_HEALTH', payload: { tokenId, newMaxHealth } });
  }, []);

  const updateNotes = useCallback((tokenId, notes) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { notes } } });
  }, []);

  const updateTokenSize = useCallback((tokenId, size) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { customSize: size } } });
  }, []);

  const updateTempHP = useCallback((tokenId, tempHP) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { tempHP: Math.max(0, tempHP) } } });
  }, []);

  const toggleTempHP = useCallback((tokenId) => {
    dispatchTokens({ type: 'TOGGLE_TEMP_HP', payload: { tokenId } });
  }, []);

  const toggleCondition = useCallback((tokenId, condition) => {
    dispatchTokens({ type: 'TOGGLE_CONDITION', payload: { tokenId, condition } });
  }, []);

  const updateWounds = useCallback((tokenId, newWounds) => {
    dispatchTokens({ type: 'UPDATE_WOUNDS', payload: { tokenId, newWounds } });
  }, []);

  const clearConditions = useCallback((tokenId) => {
    dispatchTokens({ type: 'CLEAR_CONDITIONS', payload: { tokenId } });
  }, []);

  const toggleAction = useCallback((tokenId, actionIndex) => {
    dispatchTokens({ type: 'TOGGLE_ACTION', payload: { tokenId, actionIndex } });
  }, []);

  const startTurn = useCallback((tokenId) => {
    dispatchTokens({ type: 'START_TURN', payload: { tokenId } });
  }, []);

  const endTurn = useCallback((tokenId) => {
    dispatchTokens({ type: 'END_TURN', payload: { tokenId } });
  }, []);

  const resetNonHeroActions = useCallback(() => {
    dispatchTokens({ type: 'RESET_NON_HERO_ACTIONS' });
  }, []);

  const updateTokenPosition = useCallback((tokenId, x, y) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { x, y } } });
  }, []);

  const updateTokenResource = useCallback((tokenId, updates) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates } });
  }, []);

  const setAllTokens = useCallback((newTokens) => {
    dispatchTokens({ type: 'SET_ALL_TOKENS', payload: newTokens });
  }, []);

  const toggleHealthInViewport = useCallback((tokenId) => {
    dispatchTokens({ type: 'TOGGLE_HEALTH_IN_VIEWPORT', payload: { tokenId } });
  }, []);

  return {
    tokens,
    selectedToken,
    setSelectedToken,
    addToken,
    removeToken,
    updateHealth,
    updateMaxHealth,
    updateNotes,
    updateTokenSize,
    updateTempHP,
    toggleTempHP,
    toggleCondition,
    updateWounds,
    clearConditions,
    toggleAction,
    startTurn,
    endTurn,
    resetNonHeroActions,
    updateTokenPosition,
    updateTokenResource,
    setAllTokens,
    toggleHealthInViewport
  };
}
