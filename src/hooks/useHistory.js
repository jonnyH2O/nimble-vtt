import { useState, useCallback, useMemo } from 'react';

const HISTORY_LIMIT = 50;

/**
 * Custom Hook: History Management (Undo/Redo)
 *
 * Manages a stack of history states and provides undo/redo functionality.
 *
 * @param {any} initialState - Initial state to start the history with
 * @returns {Object} History state and management functions
 */
export function useHistory(initialState) {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Add a new entry to history
    const addToHistory = useCallback((entry) => {
        setHistory(prev => {
            // Remove any future history if we're not at the end
            const newHistory = prev.slice(0, currentIndex + 1);
            newHistory.push(entry);

            // Limit history size
            if (newHistory.length > HISTORY_LIMIT) {
                newHistory.shift();
            }
            return newHistory;
        });

        // Update index to point to the new latest entry
        // Calculate the new index based on whether we'll exceed the limit
        setCurrentIndex(prev => {
            const potentialLength = prev + 2; // current items + new item
            // If we exceed the limit, we shift, so index stays at limit - 1
            // Otherwise, index advances by 1
            return potentialLength > HISTORY_LIMIT ? HISTORY_LIMIT - 1 : prev + 1;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            const itemToUndo = history[currentIndex];
            setCurrentIndex(prev => prev - 1);
            return itemToUndo;
        }
        return null;
    }, [history, currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
            return history[currentIndex + 1];
        }
        return null;
    }, [history, currentIndex]);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    const currentHistoryItem = history[currentIndex];

    return {
        history,
        currentIndex,
        addToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        currentHistoryItem
    };
}
