import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook: Window Synchronization via BroadcastChannel
 *
 * Manages BroadcastChannel lifecycle for cross-window communication.
 * Enables real-time state synchronization between main window and pop-out window.
 *
 * @param {boolean} isMainWindow - Whether this is the main window (true) or pop-out (false)
 * @returns {Object} { channel, isConnected, broadcast }
 */
export function useWindowSync(isMainWindow) {
  const [channel, setChannel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create BroadcastChannel for cross-window communication
    const bc = new BroadcastChannel('nimble-vtt-sync');

    setChannel(bc);
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      bc.close();
      setIsConnected(false);
    };
  }, []);

  const broadcast = useCallback((message) => {
    // Don't rely on state variables in the callback - they might be stale
    // Instead, we'll return the channel directly and let the caller use it
    if (channel) {
      channel.postMessage(message);
    }
  }, [channel]);

  return { channel, isConnected, broadcast };
}
