import React, { useState, useEffect } from 'react';
import { Users, Heart, Swords, Crown } from 'lucide-react';
import TurnOrderPanel from './TurnOrderPanel';
import { useWindowSync } from '../hooks/useWindowSync';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';
import { SIDEBAR_WIDTH, getTokenBorderColor, getTokenBgColor, getTokenIconName } from '../constants';

/**
 * PopoutWindow Component
 *
 * Renders the sidebar (Turn Order Panel + Notes Panel) in a separate browser window.
 * Communicates with main window via BroadcastChannel for state synchronization.
 */
export default function PopoutWindow() {
  const [syncedState, setSyncedState] = useState(null);
  const windowSync = useWindowSync(false); // false = pop-out window

  useEffect(() => {
    if (!windowSync.channel) {
      console.log('[PopoutWindow] No channel available yet');
      return;
    }

    console.log('[PopoutWindow] Setting up message listener');

    // Listen for state updates from main window
    const handleMessage = (event) => {
      console.log('[PopoutWindow] Received message:', event.data.type);
      const { type, payload } = event.data;

      if (type === MESSAGE_TYPES.STATE_UPDATE) {
        console.log('[PopoutWindow] Received STATE_UPDATE with payload:', payload);
        setSyncedState(payload);
      }
    };

    windowSync.channel.onmessage = handleMessage;

    // Signal we're ready
    console.log('[PopoutWindow] Broadcasting WINDOW_READY');
    windowSync.broadcast(createMessage(MESSAGE_TYPES.WINDOW_READY));

    // Signal before closing
    const handleBeforeUnload = () => {
      windowSync.broadcast(createMessage(MESSAGE_TYPES.WINDOW_CLOSING));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (windowSync.channel) {
        windowSync.channel.onmessage = null;
      }
    };
  }, [windowSync.channel, windowSync.broadcast]);

  // Loading state
  if (!syncedState) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Connecting to main window...</div>
          <div className="text-sm text-gray-400">
            If this persists, ensure the main window is still open
          </div>
        </div>
      </div>
    );
  }

  // Helper to send actions back to main window
  const sendAction = (message) => {
    windowSync.broadcast(message);
  };

  // Helper to get token icon component
  const getTokenIcon = (type) => {
    const iconName = getTokenIconName(type);
    switch (iconName) {
      case 'Users': return <Users size={20} />;
      case 'Swords': return <Swords size={20} />;
      case 'Heart': return <Heart size={20} />;
      case 'Crown': return <Crown size={20} />;
      default: return <Users size={20} />;
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <TurnOrderPanel
        isPopoutWindow={true}
        onAction={sendAction}
        sidebarView={syncedState.sidebarView}
        setSidebarView={(view) => sendAction(createMessage(MESSAGE_TYPES.SIDEBAR_VIEW_UPDATE, { view }))}
        deleteMode={syncedState.deleteMode}
        setDeleteMode={(mode) => sendAction(createMessage(MESSAGE_TYPES.DELETE_MODE_UPDATE, { mode }))}
        displayTurnOrder={syncedState.displayTurnOrder}
        tokens={syncedState.tokens}
        turnOrder={syncedState.turnOrder}
        selectedToken={syncedState.selectedToken}
        setSelectedToken={(id) => sendAction(createMessage(MESSAGE_TYPES.SELECT_TOKEN, { tokenId: id }))}
        expandedConditions={syncedState.expandedConditions}
        setExpandedConditions={(expanded) => sendAction(createMessage(MESSAGE_TYPES.EXPANDED_CONDITIONS_UPDATE, { expanded }))}
        expandedNotes={syncedState.expandedNotes}
        setExpandedNotes={(expanded) => sendAction(createMessage(MESSAGE_TYPES.EXPANDED_NOTES_UPDATE, { expanded }))}
        tokenSize={syncedState.tokenSize}
        handleRemoveToken={(id) => sendAction(createMessage(MESSAGE_TYPES.REMOVE_TOKEN, { tokenId: id }))}
        doomedConditions={syncedState.doomedConditions}
        majorConditions={syncedState.majorConditions}
        minorConditions={syncedState.minorConditions}
        SIDEBAR_WIDTH={SIDEBAR_WIDTH}
        updateNotes={(tokenId, notes) => sendAction(createMessage(MESSAGE_TYPES.NOTES_UPDATE, { tokenId, notes }))}
        getTokenBorderColor={getTokenBorderColor}
        getTokenBgColor={getTokenBgColor}
        getTokenIcon={getTokenIcon}
        tokenManager={null} // NOT passed - mutations go through onAction
        turnOrderManager={null} // NOT passed - mutations go through onAction
        // Dice Roller props - send to main window
        showDiceMenu={false}
        setShowDiceMenu={() => {}}
        diceCount={syncedState.diceCount || 1}
        setDiceCount={(count) => sendAction(createMessage(MESSAGE_TYPES.DICE_COUNT_UPDATE, { count }))}
        rollDice={(diceType) => sendAction(createMessage(MESSAGE_TYPES.DICE_ROLL, { diceType }))}
        rollingDice={syncedState.rollingDice || []}
        diceRolls={syncedState.diceRolls || []}
        showDiceInViewport={syncedState.showDiceInViewport !== undefined ? syncedState.showDiceInViewport : true}
        setShowDiceInViewport={(showDiceInViewport) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { showDiceInViewport }))}
        // Settings props - send to main window
        showSettings={false}
        setShowSettings={() => {}}
        setTokenSize={(tokenSize) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { tokenSize }))}
        backgroundSize={syncedState.backgroundSize || 100}
        setBackgroundSize={(backgroundSize) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { backgroundSize }))}
        showGrid={syncedState.showGrid || false}
        setShowGrid={(showGrid) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { showGrid }))}
        gridSize={syncedState.gridSize || 50}
        setGridSize={(gridSize) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { gridSize }))}
        darknessMode={syncedState.darknessMode || false}
        setDarknessMode={(darknessMode) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { darknessMode }))}
        heroLightRadius={syncedState.heroLightRadius || 3}
        setHeroLightRadius={(heroLightRadius) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { heroLightRadius }))}
        companionLightRadius={syncedState.companionLightRadius || 2}
        setCompanionLightRadius={(companionLightRadius) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { companionLightRadius }))}
        darknessIntensity={syncedState.darknessIntensity || 0.95}
        setDarknessIntensity={(darknessIntensity) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { darknessIntensity }))}
        showPartyOverview={syncedState.showPartyOverview !== undefined ? syncedState.showPartyOverview : true}
        setShowPartyOverview={(showPartyOverview) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { showPartyOverview }))}
        exportBattle={() => sendAction(createMessage(MESSAGE_TYPES.EXPORT_BATTLE))}
        importBattle={() => sendAction(createMessage(MESSAGE_TYPES.IMPORT_BATTLE))}
      />
    </div>
  );
}
