import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom Hook: Dice Rolling
 *
 * Manages dice rolling with dice notation (e.g., "1d6, 2d8, 1d20").
 * Handles automatic cleanup of timeouts on unmount.
 *
 * @returns {Object} Dice rolling state and management functions
 */
export function useDiceRoller() {
  const [showDiceMenu, setShowDiceMenu] = useState(false);
  const [diceNotation, setDiceNotation] = useState('');
  const [diceRolls, setDiceRolls] = useState([]);
  const [rollingDice, setRollingDice] = useState([]);
  const [notationError, setNotationError] = useState('');
  const diceTimeoutsRef = useRef([]);
  const viewportTimeoutsRef = useRef([]);

  /**
   * Parse dice notation string into array of dice specifications
   * @param {string} notation - e.g., "1d6, 2d8, 1d20"
   * @returns {Array|null} Array of {count, sides} objects or null if invalid
   */
  const parseDiceNotation = useCallback((notation) => {
    if (!notation.trim()) {
      return null;
    }

    const parts = notation.split(',').map(s => s.trim()).filter(s => s);
    const diceSpecs = [];

    for (const part of parts) {
      const match = part.match(/^(\d+)d(\d+)$/i);
      if (!match) {
        return null; // Invalid format
      }

      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);

      if (count < 1 || count > 100 || sides < 1 || sides > 1000) {
        return null; // Invalid ranges
      }

      diceSpecs.push({ count, sides, notation: part });
    }

    return diceSpecs.length > 0 ? diceSpecs : null;
  }, []);

  /**
   * Add or increment a die type in the notation
   * @param {number} sides - The die type (4, 6, 8, 10, 12, 20, 100)
   * @param {number} delta - 1 to increment, -1 to decrement
   */
  const addOrIncrementDie = useCallback((sides, delta = 1) => {
    const parts = diceNotation.split(',').map(s => s.trim()).filter(s => s);
    const diceMap = new Map();

    // Parse existing notation
    for (const part of parts) {
      const match = part.match(/^(\d+)d(\d+)$/i);
      if (match) {
        const count = parseInt(match[1]);
        const dieSides = parseInt(match[2]);
        diceMap.set(dieSides, count);
      }
    }

    // Add or update the die
    const currentCount = diceMap.get(sides) || 0;
    const newCount = Math.max(0, currentCount + delta);

    if (newCount > 0) {
      diceMap.set(sides, newCount);
    } else {
      diceMap.delete(sides);
    }

    // Sort by die size and rebuild notation
    const sortedDice = Array.from(diceMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([s, c]) => `${c}d${s}`);

    setDiceNotation(sortedDice.join(', '));
    setNotationError('');
  }, [diceNotation]);

  /**
   * Roll dice based on current notation
   */
  const rollDice = useCallback(() => {
    const diceSpecs = parseDiceNotation(diceNotation);

    if (!diceSpecs) {
      setNotationError('Invalid dice notation');
      return;
    }

    setNotationError('');

    const rollId = crypto.randomUUID();
    let grandTotal = 0;
    const rollResults = [];

    // Roll each dice group
    for (const spec of diceSpecs) {
      const rolls = [];
      let subtotal = 0;

      for (let i = 0; i < spec.count; i++) {
        const roll = Math.floor(Math.random() * spec.sides) + 1;
        rolls.push(roll);
        subtotal += roll;
      }

      grandTotal += subtotal;
      rollResults.push({
        notation: spec.notation,
        rolls,
        subtotal
      });
    }

    // Show "rolling" animation first
    const rollingRoll = {
      id: rollId,
      dice: diceNotation,
      rolling: true
    };

    setRollingDice(prev => [rollingRoll, ...prev]);
    setShowDiceMenu(false);

    // After 2.5 seconds, show the actual result
    const timeout1 = setTimeout(() => {
      setRollingDice(prev => prev.filter(r => r.id !== rollId));

      const newRoll = {
        id: rollId,
        dice: diceNotation,
        rollResults,
        total: grandTotal,
        fading: false,
        timestamp: Date.now()
      };

      setDiceRolls(prev => {
        const updated = [newRoll, ...prev];
        // Keep only last 5 rolls in sidebar (no fading there)
        return updated.slice(0, 5);
      });

      // For viewport display only: start fading after 5 seconds
      const timeout2 = setTimeout(() => {
        // Note: This fading is only used in viewport, not in sidebar
        setDiceRolls(prev => prev.map(r =>
          r.id === rollId ? { ...r, fading: true } : r
        ));

        // Remove completely after fade (3 more seconds) - viewport only
        const timeout3 = setTimeout(() => {
          // This won't affect sidebar since we already limited to 5 items
          setDiceRolls(prev => prev.filter(r => r.id !== rollId));
        }, 3000);

        viewportTimeoutsRef.current.push(timeout3);
      }, 5000);

      viewportTimeoutsRef.current.push(timeout2);
    }, 2500);

    diceTimeoutsRef.current.push(timeout1);
  }, [diceNotation, parseDiceNotation]);

  /**
   * Clear the dice notation field
   */
  const clearNotation = useCallback(() => {
    setDiceNotation('');
    setNotationError('');
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      diceTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      viewportTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      diceTimeoutsRef.current = [];
      viewportTimeoutsRef.current = [];
    };
  }, []);

  return {
    showDiceMenu,
    setShowDiceMenu,
    diceNotation,
    setDiceNotation,
    notationError,
    diceRolls,
    rollingDice,
    rollDice,
    addOrIncrementDie,
    clearNotation
  };
}
