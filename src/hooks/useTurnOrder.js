import { useState, useMemo, useCallback } from 'react';

/**
 * Custom Hook: Turn Order Management
 *
 * Manages turn order logic including legendary token display.
 * Legendary tokens appear at the top and after each hero in the turn order.
 *
 * @param {Array} tokens - Array of all tokens
 * @returns {Object} Turn order state and management functions
 */
export function useTurnOrder(tokens) {
  const [turnOrder, setTurnOrder] = useState([]);
  const [draggedTurnIndex, setDraggedTurnIndex] = useState(null);

  // Memoized display turn order with legendary token logic
  const displayTurnOrder = useMemo(() => {
    const displayOrder = [];
    const legendaryTokens = tokens.filter(t => t.type === 'legendary');

    // Add legendary tokens at the very top (their main bodies)
    legendaryTokens.forEach(legendary => {
      displayOrder.push({ id: legendary.id, isLegendaryEcho: false, isMainLegendary: true });
    });

    // Then add regular turn order with legendary echoes after heroes
    turnOrder.forEach((tokenId) => {
      const token = tokens.find(t => t.id === tokenId);
      if (!token || token.type === 'legendary') return; // Skip legendary tokens in normal order

      // Add the regular token
      displayOrder.push({ id: tokenId, isLegendaryEcho: false, isMainLegendary: false });

      // If it's a hero, add all legendary tokens after it
      if (token.type === 'hero') {
        legendaryTokens.forEach(legendary => {
          displayOrder.push({ id: legendary.id, isLegendaryEcho: true, isMainLegendary: false });
        });
      }
    });

    return displayOrder;
  }, [tokens, turnOrder]);

  const addToTurnOrder = useCallback((tokenId) => {
    setTurnOrder(prev => [...prev, tokenId]);
  }, []);

  const removeFromTurnOrder = useCallback((tokenId) => {
    setTurnOrder(prev => prev.filter(tid => tid !== tokenId));
  }, []);

  const handleTurnDragStart = useCallback((index) => {
    setDraggedTurnIndex(index);
  }, []);

  const handleTurnDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedTurnIndex !== null && draggedTurnIndex !== index) {
      const newOrder = [...turnOrder];
      const draggedId = newOrder[draggedTurnIndex];
      newOrder.splice(draggedTurnIndex, 1);
      newOrder.splice(index, 0, draggedId);
      setTurnOrder(newOrder);
      setDraggedTurnIndex(index);
    }
  }, [draggedTurnIndex, turnOrder]);

  const handleTurnDragEnd = useCallback(() => {
    setDraggedTurnIndex(null);
  }, []);

  const setAllTurnOrder = useCallback((newTurnOrder) => {
    setTurnOrder(newTurnOrder);
  }, []);

  return {
    turnOrder,
    displayTurnOrder,
    draggedTurnIndex,
    addToTurnOrder,
    removeFromTurnOrder,
    handleTurnDragStart,
    handleTurnDragOver,
    handleTurnDragEnd,
    setAllTurnOrder
  };
}
