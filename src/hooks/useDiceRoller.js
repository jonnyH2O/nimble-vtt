import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom Hook: Dice Rolling
 *
 * Manages dice rolling with animations and timeouts.
 * Handles automatic cleanup of timeouts on unmount.
 *
 * @returns {Object} Dice rolling state and management functions
 */
export function useDiceRoller() {
  const [showDiceMenu, setShowDiceMenu] = useState(false);
  const [diceCount, setDiceCount] = useState(1);
  const [diceRolls, setDiceRolls] = useState([]);
  const [rollingDice, setRollingDice] = useState([]);
  const diceTimeoutsRef = useRef([]);

  const rollDice = useCallback((sides) => {
    const rolls = [];
    let total = 0;

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    const rollId = crypto.randomUUID();

    // Show "rolling" animation first
    const rollingRoll = {
      id: rollId,
      dice: `${diceCount}d${sides}`,
      rolling: true
    };

    setRollingDice(prev => [rollingRoll, ...prev]);
    setShowDiceMenu(false);

    // After 2.5 seconds, show the actual result
    const timeout1 = setTimeout(() => {
      setRollingDice(prev => prev.filter(r => r.id !== rollId));

      const newRoll = {
        id: rollId,
        dice: `${diceCount}d${sides}`,
        rolls: rolls,
        total: total,
        fading: false
      };

      setDiceRolls(prev => [newRoll, ...prev]);

      // Start fading after 5 seconds
      const timeout2 = setTimeout(() => {
        setDiceRolls(prev => prev.map(r =>
          r.id === rollId ? { ...r, fading: true } : r
        ));

        // Remove completely after fade (3 more seconds)
        const timeout3 = setTimeout(() => {
          setDiceRolls(prev => prev.filter(r => r.id !== rollId));
        }, 3000);

        diceTimeoutsRef.current.push(timeout3);
      }, 5000);

      diceTimeoutsRef.current.push(timeout2);
    }, 2500);

    diceTimeoutsRef.current.push(timeout1);
  }, [diceCount]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      diceTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      diceTimeoutsRef.current = [];
    };
  }, []);

  return {
    showDiceMenu,
    setShowDiceMenu,
    diceCount,
    setDiceCount,
    diceRolls,
    rollingDice,
    rollDice
  };
}
