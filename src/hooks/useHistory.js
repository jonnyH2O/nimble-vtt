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
        /*
        console.log('📜 History Update:', {
            type: entry.type,
            details: entry,
            timestamp: new Date().toISOString()
        });
        */

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
        // We can't rely on the history length here because state update is async,
        // so we calculate what the new index will be.
        // If we sliced (currentIndex + 1) and added 1, the new index is currentIndex + 1.
        // But if we shifted, it might stay same or shift.
        // simpler: rely on the fact that we're pushing to the end.
        // Actually, safer to update index in a useEffect or just calculate it.
        // Let's do functional update for setCurrentIndex to ensure sync?
        // No, standard way:
        setHistory(prev => {
            const newHistory = prev.slice(0, currentIndex + 1);
            newHistory.push(entry);
            if (newHistory.length > HISTORY_LIMIT) {
                newHistory.shift();
            }
            return newHistory;
        });

        setCurrentIndex(prev => {
            const nextIndex = prev + 1;
            // If we hit limit, the index effectively stays at max-1 (since we shifted 0 out)
            // If history length > limit, we shifted, so index becomes length-1.
            // Wait, if we are at index 5, max 50. We add one. Index becomes 6.
            // If we are at index 50 (length 51), we shift. Index becomes 50.
            // Let's simplify: Set index to newHistory.length - 1 inside the setHistory logic? No, separation of concerns.
            // We can just set it to min(prev + 1, HISTORY_LIMIT - 1) but that assumes we started at 0 correctly.

            // Let's use a ref or just calculation?
            // Actually, if we slice, the length is currentIndex + 2 (current + 1 + new).
            // If that > limit, we shift. Index is limit - 1.
            // Else, Index is currentIndex + 1.

            const potentialLength = currentIndex + 2;
            return potentialLength > HISTORY_LIMIT ? HISTORY_LIMIT - 1 : currentIndex + 1;
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
