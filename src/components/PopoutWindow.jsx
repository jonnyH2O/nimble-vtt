import React, { useState, useEffect, useRef } from 'react';
import { Users, Heart, Swords, Crown } from 'lucide-react';
import TurnOrderPanel from './TurnOrderPanel';
import { useWindowSync } from '../hooks/useWindowSync';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';
import { SIDEBAR_WIDTH } from '../constants';
import { getTokenBorderColor, getTokenBgColor, getTokenIconName } from '../utils/tokenUtils';

/**
 * PopoutWindow Component
 *
 * Renders the sidebar (Turn Order Panel + Notes Panel) in a separate browser window.
 * Communicates with main window via BroadcastChannel for state synchronization.
 */
export default function PopoutWindow() {
  const [syncedState, setSyncedState] = useState(null);
  const windowSync = useWindowSync(false); // false = pop-out window
  const fileInputRef = useRef(null);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const battleState = JSON.parse(event.target.result);
        windowSync.broadcast(createMessage(MESSAGE_TYPES.IMPORT_BATTLE_DATA, battleState));
      } catch (error) {
        console.error('Error parsing battle file:', error);
        alert('Error importing battle file. Please make sure it\'s a valid battle export.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

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

  // Apply theme to popout window's document
  // MUST be before early return to maintain hooks order
  useEffect(() => {
    if (!syncedState) return;

    const theme = syncedState.currentTheme || 'default';
    if (theme === 'dracula') {
      document.documentElement.setAttribute('data-theme', 'dracula');
    } else if (theme === 'retro') {
      document.documentElement.setAttribute('data-theme', 'retro');
    } else if (theme === 'hero') {
      document.documentElement.setAttribute('data-theme', 'hero');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [syncedState]);

  // Loading state
  if (!syncedState) {
    return (
      <div className="h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Connecting to main window...</div>
          <div className="text-sm text-text-muted">
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
    <div className="h-screen bg-background text-white flex flex-col">
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
        lastActionUserId={syncedState.lastActionUserId}
        // Dice Roller props - send to main window
        showDiceMenu={false}
        setShowDiceMenu={() => { }}
        diceCount={syncedState.diceCount || 1}
        setDiceCount={(count) => sendAction(createMessage(MESSAGE_TYPES.DICE_COUNT_UPDATE, { count }))}
        rollDice={(diceType) => sendAction(createMessage(MESSAGE_TYPES.DICE_ROLL, { diceType }))}
        rollingDice={syncedState.rollingDice || []}
        diceRolls={syncedState.diceRolls || []}
        showDiceInViewport={syncedState.showDiceInViewport !== undefined ? syncedState.showDiceInViewport : true}
        setShowDiceInViewport={(showDiceInViewport) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { showDiceInViewport }))}
        // Settings props - send to main window
        showSettings={false}
        setShowSettings={() => { }}
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
        // Add Token props - buttons are disabled in popout window mode
        handleBackgroundUpload={() => { }} // No-op - button disabled
        showAddToken={false}
        setShowAddToken={() => { }} // No-op - button disabled
        newToken={{}} // Stub
        setNewToken={() => { }} // Stub
        handleAddToken={() => { }} // Stub
        handleTokenImageUpload={() => { }} // Stub
        currentTheme={syncedState.currentTheme || 'default'}
        setCurrentTheme={(theme) => sendAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { currentTheme: theme }))}
        exportBattle={() => sendAction(createMessage(MESSAGE_TYPES.EXPORT_BATTLE))}
        importBattle={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  );
}
