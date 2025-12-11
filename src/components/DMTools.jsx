import React, { useCallback, useRef, useState } from 'react';
import { Trash2, List, Book, RotateCcw, AlertCircle, ExternalLink, Dices, Settings, Upload, Plus, Sword, X, ShieldX } from 'lucide-react';



import { NotesPanel } from './HUD';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';

import { getTokenBorderColor } from '../utils/tokenUtils';
import { DMToolsDictionary } from './DMToolsDictionary';
import { DMToolsDice } from './DMToolsDice';
import { DMToolsSettings } from './DMToolsSettings';

/**
 * BloodiedVignette - Reusable component for bloodied condition visual effect
 */
const BloodiedVignette = ({ hasCondition }) => {
  if (!hasCondition) return null;
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 15px 5px rgba(220, 38, 38, 0.42)',
      }}
    />
  );
};

/**
 * DMTools Component
 *
 * The entire sidebar component that includes:
 * - Tab navigation (Turn Order / Dictionary / future tabs)
 * - Turn Order view with token cards
 * - Dictionary view with game rules reference
 * - Delete mode toggle
 * - Notes panel at the bottom for selected tokens
 *
 * @param {Object} props
 * @param {string} props.sidebarView - Current view ('turnOrder' or 'dictionary')
 * @param {Function} props.setSidebarView - Function to change sidebar view
 * @param {boolean} props.deleteMode - Whether delete mode is active
 * @param {Function} props.setDeleteMode - Function to toggle delete mode
 * @param {Array} props.displayTurnOrder - Ordered array of turn items with legendary logic
 * @param {Array} props.tokens - Array of all tokens
 * @param {Array} props.turnOrder - Base turn order array (IDs)
 * @param {string} props.selectedToken - ID of selected token
 * @param {Function} props.setSelectedToken - Function to set selected token
 * @param {Object} props.expandedConditions - Object tracking which token conditions are expanded
 * @param {Function} props.setExpandedConditions - Function to update expanded conditions
 * @param {Object} props.expandedNotes - Object tracking which dictionary sections are expanded
 * @param {Function} props.setExpandedNotes - Function to update expanded notes
 * @param {number} props.tokenSize - Global token size
 * @param {Function} props.handleRemoveToken - Function to remove a token
 * @param {Function} props.getTokenBorderColor - Function to get token border color class
 * @param {Function} props.getTokenBgColor - Function to get token background color class
 * @param {Function} props.getTokenIcon - Function to get token icon component
 * @param {Object} props.tokenManager - Token manager with all token operations
 * @param {Object} props.turnOrderManager - Turn order manager with drag/drop handlers
 * @param {Array} props.doomedConditions - Array of doomed condition names
 * @param {Array} props.majorConditions - Array of major condition names
 * @param {Array} props.minorConditions - Array of minor condition names
 * @param {number} props.SIDEBAR_WIDTH - Width of the sidebar
 * @param {Function} props.updateNotes - Function to update token notes
 */
export default function DMTools({
  sidebarView,
  setSidebarView,
  deleteMode,
  setDeleteMode,
  displayTurnOrder,
  tokens,
  turnOrder,
  selectedToken,
  setSelectedToken,
  expandedConditions,
  setExpandedConditions,
  expandedNotes,
  setExpandedNotes,
  tokenSize,
  handleRemoveToken,
  getTokenBorderColor,
  getTokenBgColor,
  getTokenIcon,
  tokenManager,
  turnOrderManager,
  doomedConditions,
  majorConditions,
  minorConditions,
  SIDEBAR_WIDTH,
  updateNotes,
  onPopout = null,         // NEW: Callback to trigger pop-out
  isPopoutWindow = false,  // NEW: Are we rendering in pop-out?
  onAction = null,         // NEW: Send actions from pop-out to main
  lastActionUserId = null, // NEW: ID of token that last used an action
  setLastActionUserId = null, // NEW: Function to set last action user
  // Dice Roller props
  showDiceMenu,
  setShowDiceMenu,
  diceCount,
  setDiceCount,
  rollDice,
  rollingDice,
  diceRolls,
  showDiceInViewport,
  setShowDiceInViewport,
  // Settings props
  setTokenSize,
  backgroundSize,
  setBackgroundSize,
  showGrid,
  setShowGrid,
  gridSize,
  setGridSize,
  darknessMode,
  setDarknessMode,
  heroLightRadius,
  setHeroLightRadius,
  companionLightRadius,
  setCompanionLightRadius,
  darknessIntensity,
  setDarknessIntensity,
  showPartyOverview,
  setShowPartyOverview,
  handleBackgroundUpload,
  showAddToken,
  setShowAddToken,
  newToken,
  setNewToken,
  handleAddToken,
  handleTokenImageUpload,
  exportBattle,
  importBattle,
  currentTheme,
  setCurrentTheme,
  reactionStates,
  isOverlay = false, // NEW: Whether panel is displayed as an overlay
}) { // Add reactionStates to props

  const { updateWounds, toggleTempHP } = tokenManager || {};
  const fileInputRef = useRef(null);
  const [popoutDragIndex, setPopoutDragIndex] = React.useState(null);
  const [hoveredTurnButton, setHoveredTurnButton] = useState(null);
  // Refs to track token card positions for the action indicator
  const tokenCardRefs = useRef({});
  const [indicatorPosition, setIndicatorPosition] = useState(null);

  // Effect to update indicator position when lastActionUserId changes
  React.useEffect(() => {
    if (!lastActionUserId || !tokenCardRefs.current[lastActionUserId]) {
      setIndicatorPosition(null);
      return;
    }

    const updatePosition = () => {
      const cardElement = tokenCardRefs.current[lastActionUserId];
      if (cardElement) {
        const container = cardElement.closest('.overflow-auto');
        if (container) {
          // Calculate position by walking up the DOM tree to get accurate offset
          let cardTop = 0;
          let element = cardElement;

          // Walk up the tree until we reach the container
          while (element && element !== container) {
            cardTop += element.offsetTop;
            element = element.offsetParent;
            // Stop if we've gone past the container
            if (element && !container.contains(element)) {
              break;
            }
          }

          const cardHeight = cardElement.offsetHeight;

          // Position the arrow at the card's absolute position in the scrollable content
          // Don't subtract scrollTop - the arrow will scroll naturally with the content
          setIndicatorPosition({
            top: cardTop + cardHeight / 2,
          });
        }
      }
    };

    updatePosition();
    // Update on scroll or resize
    const container = tokenCardRefs.current[lastActionUserId]?.closest('.overflow-auto');
    container?.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    // Use ResizeObserver to detect when the container's content changes size
    // (e.g., when info panels expand/collapse)
    let resizeObserver;
    if (container) {
      resizeObserver = new ResizeObserver(() => {
        // Debounce to avoid too many updates during animations
        requestAnimationFrame(updatePosition);
      });
      resizeObserver.observe(container);
    }

    return () => {
      container?.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [lastActionUserId]);


  // Helper function to handle actions - sends to main window if in pop-out, otherwise calls directly
  const handleAction = useCallback((type, payload, directFn) => {
    if (isPopoutWindow && onAction) {
      // We're in pop-out: send action to main window
      onAction(createMessage(type, payload));
    } else if (directFn) {
      // We're in main window: call function directly
      directFn();
    }
  }, [isPopoutWindow, onAction]);

  // Helper to toggle dictionary section expansion
  const toggleDictionarySection = useCallback((sectionKey) => {
    const newExpanded = {
      ...expandedNotes,
      [sectionKey]: !expandedNotes[sectionKey]
    };
    handleAction(
      MESSAGE_TYPES.EXPANDED_NOTES_UPDATE,
      { expanded: newExpanded },
      () => setExpandedNotes(newExpanded)
    );
  }, [expandedNotes, handleAction, setExpandedNotes]);

  // Mock turnOrderManager for pop-out window drag operations
  const popoutTurnOrderManager = React.useMemo(() => {
    if (!isPopoutWindow || !onAction) return null;

    return {
      handleTurnDragStart: (index) => {
        setPopoutDragIndex(index);
      },
      handleTurnDragOver: (e, index) => {
        e.preventDefault();
        if (popoutDragIndex !== null && popoutDragIndex !== index) {
          const newOrder = [...turnOrder];
          const draggedId = newOrder[popoutDragIndex];
          newOrder.splice(popoutDragIndex, 1);
          newOrder.splice(index, 0, draggedId);
          onAction(createMessage(MESSAGE_TYPES.TURN_ORDER_UPDATE, { turnOrder: newOrder }));
          setPopoutDragIndex(index);
        }
      },
      handleTurnDragEnd: () => {
        setPopoutDragIndex(null);
      }
    };
  }, [isPopoutWindow, onAction, popoutDragIndex, turnOrder]);

  // Use either the real turnOrderManager or the popout mock
  const activeTurnOrderManager = turnOrderManager || popoutTurnOrderManager;

  return (
    <div className={`bg-surface flex flex-col h-full ${isPopoutWindow || isOverlay ? 'w-full' : 'border-l border-border'}`} style={isPopoutWindow || isOverlay ? {} : { width: `${SIDEBAR_WIDTH}px` }}>
      {/* Tab Navigation */}
      <div className="bg-surface-highlight border-b border-border p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setSidebarView('turnOrder')}
            className={`p-2 rounded flex items-center justify-center ${sidebarView === 'turnOrder' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
              }`}
            title="Turn Order"
          >
            <List size={20} />
          </button >
          <button
            onClick={() => setSidebarView('dictionary')}
            className={`p-2 rounded flex items-center justify-center ${sidebarView === 'dictionary' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
              }`}
            title="Nimble Dictionary"
          >
            <Book size={20} />
          </button>
          <button
            onClick={() => setSidebarView('dice')}
            className={`p-2 rounded flex items-center justify-center ${sidebarView === 'dice' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
              }`}
            title="Dice Roller"
          >
            <Dices size={20} />
          </button>
          <button
            onClick={() => setSidebarView('settings')}
            className={`p-2 rounded flex items-center justify-center ${sidebarView === 'settings' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
              }`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div >

        {/* Action buttons */}
        < div className="flex gap-2" >
          {/* Pop-out button - only in main window */}
          {
            !isPopoutWindow && onPopout && (
              <button
                onClick={onPopout}
                className="p-2 rounded bg-tertiary hover:bg-tertiary-hover"
                title="Pop Out Sidebar"
              >
                <ExternalLink size={16} />
              </button>
            )
          }
        </div >
      </div >

      {/* Content Area */}
      < div className="flex-1 overflow-auto relative" >
        {sidebarView === 'turnOrder' ? (
          <>
            {/* Action Indicator Triangle - positioned at far left of panel */}
            {indicatorPosition && (
              <div
                className="absolute left-0 transition-all duration-300 ease-in-out pointer-events-none z-10"
                style={{
                  top: `${indicatorPosition.top}px`,
                  transform: 'translateY(-50%)',
                }}
              >
                <div
                  className="border-l-8 border-y-6 border-r-0 border-y-transparent"
                  style={{
                    borderLeftColor: 'var(--color-primary)',
                    width: 0,
                    height: 0,
                    borderTopWidth: '6px',
                    borderBottomWidth: '6px',
                    borderLeftWidth: '10px',
                  }}
                />
              </div>
            )}

            <div className="p-4">
              {/* Turn Order Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Turn Order</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleAction(
                        MESSAGE_TYPES.RESET_NON_HERO_ACTIONS,
                        {},
                        () => tokenManager.resetNonHeroActions()
                      );
                    }}
                    className="bg-primary hover:bg-primary-hover p-2 rounded flex items-center justify-center"
                    title="Reset all non-hero actions"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteMode(!deleteMode)}
                    className={`p-2 rounded flex items-center justify-center ${deleteMode ? 'bg-destructive hover:bg-destructive-hover' : 'bg-button-muted hover:bg-button-muted-hover'
                      }`}
                    title={deleteMode ? 'Done deleting' : 'Delete mode'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-text-muted mb-3">
                {deleteMode ? 'Click tokens to remove them' : 'Drag to reorder'}
              </div>

              {/* Token Cards */}
              <div className="space-y-2">
                {displayTurnOrder && tokens && turnOrder && displayTurnOrder.map((item, index) => {
                  const token = tokens.find(t => t.id === item.id);
                  if (!token) return null;

                  const isLegendaryEcho = item.isLegendaryEcho;
                  const isMainLegendary = item.isMainLegendary;
                  const actualIndex = turnOrder.indexOf(item.id);

                  return (
                    <div key={isLegendaryEcho ? `${item.id}-echo-${index}` : isMainLegendary ? `${item.id}-main` : item.id}>

                      <div
                        ref={(el) => {
                          if (el) {
                            // Store refs for all cards (including echo cards for legendary actions)
                            // For legendary echo cards, store with a composite key including the echo index
                            if (isLegendaryEcho) {
                              const legendaryTurnIndex = displayTurnOrder
                                .slice(0, index)
                                .filter(i => i.id === item.id && i.isLegendaryEcho).length;
                              tokenCardRefs.current[`${item.id}-echo-${legendaryTurnIndex}`] = el;
                            } else if (!isMainLegendary) {
                              // Regular tokens (not main legendary card)
                              tokenCardRefs.current[item.id] = el;
                            }
                          }
                        }}
                        draggable={!deleteMode && !isLegendaryEcho && !expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] && !!activeTurnOrderManager}
                        onDragStart={activeTurnOrderManager ? () => !isLegendaryEcho && activeTurnOrderManager.handleTurnDragStart(actualIndex) : undefined}
                        onDragOver={activeTurnOrderManager ? (e) => !isLegendaryEcho && activeTurnOrderManager.handleTurnDragOver(e, actualIndex) : undefined}
                        onDrop={activeTurnOrderManager ? (e) => { e.preventDefault(); } : undefined}
                        onDragEnd={activeTurnOrderManager ? activeTurnOrderManager.handleTurnDragEnd : undefined}
                        onClick={() => {
                          if (deleteMode && !isLegendaryEcho) {
                            handleRemoveToken(item.id);
                          } else if (!isLegendaryEcho) {
                            setSelectedToken(item.id);
                          }
                        }}
                        className={`bg-surface-highlight p-3 rounded ${!deleteMode && !isLegendaryEcho && !expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] && activeTurnOrderManager ? 'select-none' : ''
                          } ${deleteMode && !isLegendaryEcho ? 'cursor-pointer hover:bg-destructive' :
                            !isLegendaryEcho && !expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] && activeTurnOrderManager ? 'cursor-move' : ''
                          } ${selectedToken === item.id && !isLegendaryEcho ? 'ring-2 ring-token-selected' : ''} ${isLegendaryEcho ? 'opacity-75 ml-4' : ''
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            {isMainLegendary && (
                              <div className="text-sm font-bold text-legendary-highlight w-2">L</div>
                            )}
                            {!isLegendaryEcho && !isMainLegendary && (
                              <div className="text-sm font-bold text-text-muted w-2">{actualIndex + 1}</div>
                            )}
                            {isLegendaryEcho && (
                              <div className="text-sm font-bold text-legendary-highlight w-2">→</div>
                            )}
                            {token.image ? (
                              <div className="relative w-10 h-10">
                                <div className={`w-10 h-10 rounded-full border-2 ${getTokenBorderColor(token.type)} relative`}>
                                  <img
                                    src={token.image}
                                    alt={token.name}
                                    className="w-full h-full rounded-full object-cover"
                                    style={{
                                      filter: token.conditions && token.conditions.includes('Dying') ? 'saturate(0.2)' : 'none'
                                    }}
                                  />
                                  <BloodiedVignette hasCondition={token.conditions && token.conditions.includes('Bloodied')} />
                                </div>
                              </div>
                            ) : (
                              <div className="relative w-10 h-10">
                                <div className={`w-10 h-10 rounded-full border-2 ${getTokenBorderColor(token.type)} relative`}>
                                  <div
                                    className={`w-full h-full rounded-full flex items-center justify-center ${getTokenBgColor(token.type)}`}
                                    style={{
                                      filter: token.conditions && token.conditions.includes('Dying') ? 'saturate(0.2)' : 'none'
                                    }}
                                  >
                                    {getTokenIcon(token.type)}
                                  </div>
                                  <BloodiedVignette hasCondition={token.conditions && token.conditions.includes('Bloodied')} />
                                </div>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-bold text-sm">{token.name}</div>
                              <div className="text-xs text-text-muted capitalize">{token.type}</div>

                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(token.type !== 'legendary' || isMainLegendary) && (
                              <div className="text-right">
                                <div className="text-xs text-text-muted">HP</div>
                                {token.showTempHP && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <input
                                      type="number"
                                      value={token.tempHP || 0}
                                      onChange={(e) => {
                                        const tempHP = parseInt(e.target.value) || 0;
                                        handleAction(
                                          MESSAGE_TYPES.TEMP_HP_UPDATE,
                                          { tokenId: item.id, tempHP },
                                          () => tokenManager.updateTempHP(item.id, tempHP)
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-12 bg-cyan-600 text-center rounded px-1 py-0.5 text-sm"
                                      style={{ backgroundColor: '#06b6d4' }}
                                    />
                                    <span className="text-sm">🛡️</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={token.health}
                                    onChange={(e) => {
                                      const newHealth = parseInt(e.target.value) || 0;
                                      handleAction(
                                        MESSAGE_TYPES.HEALTH_UPDATE,
                                        { tokenId: item.id, newHealth },
                                        () => tokenManager.updateHealth(item.id, newHealth)
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 bg-button-muted text-center rounded px-1 py-0.5 text-sm"
                                  />
                                  <span className="text-xs text-text-muted">/</span>
                                  <input
                                    type="number"
                                    value={token.maxHealth}
                                    onChange={(e) => {
                                      const newMaxHealth = parseInt(e.target.value) || 1;
                                      handleAction(
                                        MESSAGE_TYPES.TOKEN_UPDATE,
                                        { tokenId: item.id, newMaxHealth },
                                        () => tokenManager.updateMaxHealth(item.id, newMaxHealth)
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 bg-button-muted text-center rounded px-1 py-0.5 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                            {isLegendaryEcho && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use the index within the display order to track which legendary turn this is
                                  const legendaryTurnIndex = displayTurnOrder
                                    .slice(0, index)
                                    .filter(i => i.id === item.id && i.isLegendaryEcho).length;

                                  // Track last action user when NOT in popout mode
                                  if (!isPopoutWindow && setLastActionUserId) {
                                    const willBeUsed = !token.actions[legendaryTurnIndex];
                                    if (willBeUsed) {
                                      // For legendary, store with echo index so we point to the right echo card
                                      setLastActionUserId(`${item.id}-echo-${legendaryTurnIndex}`);
                                    }
                                  }

                                  handleAction(
                                    MESSAGE_TYPES.ACTION_TOGGLE,
                                    { tokenId: item.id, actionIndex: legendaryTurnIndex },
                                    () => tokenManager.toggleAction(item.id, legendaryTurnIndex)
                                  );
                                }}
                                className={`w-12 sm:w-20 h-8 rounded transition-colors flex items-center justify-center ${token.actions[displayTurnOrder
                                  .slice(0, index)
                                  .filter(i => i.id === item.id && i.isLegendaryEcho).length]
                                  ? 'bg-button-muted-hover'
                                  : 'bg-secondary hover:bg-secondary-hover'
                                  }`}
                                title="Complete Legendary Action"
                              >

                                {token.actions[displayTurnOrder
                                  .slice(0, index)
                                  .filter(i => i.id === item.id && i.isLegendaryEcho).length]
                                  ? <X size={14} className="mx-auto" />
                                  : <Sword size={14} className="mx-auto" />
                                }
                              </button>


                            )}
                            {!isLegendaryEcho && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const conditionKey = `${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`;
                                  const newExpanded = {
                                    ...expandedConditions,
                                    [conditionKey]: !expandedConditions[conditionKey]
                                  };
                                  handleAction(
                                    MESSAGE_TYPES.EXPANDED_CONDITIONS_UPDATE,
                                    { expanded: newExpanded },
                                    () => setExpandedConditions(newExpanded)
                                  );
                                }}
                                className={`${token.conditions && token.conditions.length > 0
                                  ? 'text-yellow-400 hover:text-yellow-300'
                                  : 'text-text-muted hover:text-gray-300'
                                  }`}
                              >
                                <AlertCircle size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Wounds - only show when at 0 HP and for heroes/companions */}
                        {token.health === 0 && (token.type === 'hero' || token.type === 'companion') && (
                          <div className="mt-2 mb-2 flex items-center justify-center gap-1 px-2 flex-wrap">
                            <span className="text-xs text-text-muted mr-1">Wounds:</span>
                            {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                              const maxWounds = token.maxWounds || 6;
                              const circleSize = maxWounds <= 6 ? 5 : Math.max(4, Math.floor(24 / maxWounds));
                              return (
                                <button
                                  key={woundNum}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newWounds = token.wounds === woundNum ? woundNum - 1 : woundNum;
                                    handleAction(
                                      MESSAGE_TYPES.WOUNDS_UPDATE,
                                      { tokenId: item.id, newWounds },
                                      () => tokenManager.updateWounds(item.id, newWounds)
                                    );
                                  }}
                                  className={`rounded-full border transition-all flex items-center justify-center ${(token.wounds || 0) >= woundNum
                                    ? 'bg-destructive border-red-400'
                                    : 'bg-surface-highlight border-text-muted hover:border-gray-400'
                                    }`}
                                  style={{
                                    width: `${circleSize * 4}px`,
                                    height: `${circleSize * 4}px`,
                                    fontSize: `${circleSize * 3}px`
                                  }}
                                  title={`${woundNum} wound${woundNum > 1 ? 's' : ''}`}
                                >
                                  {(token.wounds || 0) >= woundNum && (
                                    <span className="text-text leading-none">✕</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] && (
                          <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                            {/* Wounds - only for heroes and companions */}
                            {(token.type === 'hero' || token.type === 'companion') && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs text-text-muted">Wounds</label>
                                  <button
                                    onClick={() => {
                                      handleAction(
                                        MESSAGE_TYPES.TEMP_HP_TOGGLE,
                                        { tokenId: item.id },
                                        () => tokenManager.toggleTempHP(item.id)
                                      );
                                    }}
                                    className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${token.showTempHP
                                      ? 'bg-tertiary hover:bg-tertiary-hover'
                                      : 'bg-button-muted hover:bg-button-muted-hover'
                                      }`}
                                  >
                                    Temp HP 🛡️
                                  </button>
                                </div>
                                <div className="flex gap-1 justify-center items-center flex-wrap">
                                  {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                                    const maxWounds = token.maxWounds || 6;
                                    const circleSize = maxWounds <= 6 ? 6 : Math.max(4, Math.floor(24 / maxWounds));
                                    return (
                                      <button
                                        key={woundNum}
                                        onClick={() => {
                                          const newWounds = token.wounds === woundNum ? woundNum - 1 : woundNum;
                                          handleAction(
                                            MESSAGE_TYPES.WOUNDS_UPDATE,
                                            { tokenId: item.id, newWounds },
                                            () => updateWounds(item.id, newWounds)
                                          );
                                        }}
                                        className={`rounded-full border transition-all flex items-center justify-center ${(token.wounds || 0) >= woundNum
                                          ? 'bg-destructive border-red-400'
                                          : 'bg-surface-highlight border-text-muted hover:border-gray-400'
                                          }`}
                                        style={{
                                          width: `${circleSize * 4}px`,
                                          height: `${circleSize * 4}px`,
                                          fontSize: `${circleSize * 3}px`
                                        }}
                                        title={`${woundNum} wound${woundNum > 1 ? 's' : ''}`}
                                      >
                                        {(token.wounds || 0) >= woundNum && (
                                          <span className="text-text leading-none">✕</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                  <span className="text-xs text-text-muted mx-1">=</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={token.maxWounds || 6}
                                    onChange={(e) => {
                                      const newMax = Math.max(1, Math.min(20, parseInt(e.target.value) || 6));
                                      const currentToken = tokens.find(t => t.id === item.id);
                                      const updates = {
                                        maxWounds: newMax,
                                        wounds: Math.min(currentToken?.wounds || 0, newMax)
                                      };
                                      handleAction(
                                        MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE,
                                        { tokenId: item.id, updates },
                                        () => tokenManager.updateTokenResource(item.id, updates)
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 bg-button-muted text-center rounded px-1 py-0.5 text-xs"
                                    title="Maximum wounds"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Resource - for any token with resources */}
                            {token.hasResource && (
                              <div className="mb-3">
                                <label className="text-xs text-text-muted block mb-2">{token.resourceName || 'Resource'}</label>
                                <div className="flex gap-2 justify-center items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={token.maxResource || 0}
                                    value={token.currentResource || 0}
                                    onChange={(e) => {
                                      const newCurrent = Math.max(0, Math.min(parseInt(e.target.value) || 0, token.maxResource || 0));
                                      const updates = { currentResource: newCurrent };
                                      handleAction(
                                        MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE,
                                        { tokenId: item.id, updates },
                                        () => tokenManager.updateTokenResource(item.id, updates)
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 bg-button-muted text-center rounded px-2 py-1 text-sm"
                                    style={{ borderColor: token.resourceColor, borderWidth: '2px' }}
                                  />
                                  <span className="text-xs text-text-muted">/</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={token.maxResource || 0}
                                    onChange={(e) => {
                                      const newMax = Math.max(0, parseInt(e.target.value) || 0);
                                      const currentToken = tokens.find(t => t.id === item.id);
                                      const updates = {
                                        maxResource: newMax,
                                        currentResource: Math.min(currentToken?.currentResource || 0, newMax)
                                      };
                                      handleAction(
                                        MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE,
                                        { tokenId: item.id, updates },
                                        () => tokenManager.updateTokenResource(item.id, updates)
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 bg-button-muted text-center rounded px-2 py-1 text-sm"
                                    style={{ borderColor: token.resourceColor, borderWidth: '2px' }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Temp HP toggle and Health Viewport toggle for non-hero/companion tokens (and main legendary) */}
                            {((token.type !== 'legendary' || isMainLegendary) && token.type !== 'hero' && token.type !== 'companion') && (
                              <div className="flex items-center justify-between mb-2 gap-2">
                                {/* Show Health In Viewport toggle for enemy/legendary */}
                                {(token.type === 'enemy' || (token.type === 'legendary' && isMainLegendary)) && (
                                  <button
                                    onClick={() => {
                                      handleAction(
                                        MESSAGE_TYPES.HEALTH_IN_VIEWPORT_TOGGLE,
                                        { tokenId: item.id },
                                        () => tokenManager.toggleHealthInViewport(item.id)
                                      );
                                    }}
                                    className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${token.showHealthInViewport
                                      ? 'bg-secondary hover:bg-secondary-hover'
                                      : 'bg-button-muted hover:bg-button-muted-hover'
                                      }`}
                                    title={token.showHealthInViewport ? 'Health visible in viewport' : 'Health hidden in viewport'}
                                  >
                                    Show Health 👁️
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleAction(
                                      MESSAGE_TYPES.TEMP_HP_TOGGLE,
                                      { tokenId: item.id },
                                      () => toggleTempHP(item.id)
                                    );
                                  }}
                                  className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${token.showTempHP
                                    ? 'bg-tertiary hover:bg-tertiary-hover'
                                    : 'bg-button-muted hover:bg-button-muted-hover'
                                    }`}
                                >
                                  Temp HP 🛡️
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-text-muted">Conditions</label>
                            </div>

                            {/* Doomed Conditions */}
                            <div className="mb-3">
                              <div className="text-xs font-bold text-red-400 mb-1">Doomed</div>
                              <div className="flex flex-wrap gap-1">
                                {doomedConditions.map(condition => (
                                  <button
                                    key={condition}
                                    onClick={() => {
                                      handleAction(
                                        MESSAGE_TYPES.CONDITION_TOGGLE,
                                        { tokenId: item.id, condition },
                                        () => tokenManager.toggleCondition(item.id, condition)
                                      );
                                    }}
                                    className={`text-xs px-2 py-1 rounded ${token.conditions && token.conditions.includes(condition)
                                      ? 'bg-doomed-buttons hover:bg-doomed-buttons-hover'
                                      : 'bg-button-muted hover:bg-button-muted-hover'
                                      }`}
                                  >
                                    {condition}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Major Conditions */}
                            <div className="mb-3">
                              <div className="text-xs font-bold text-orange-400 mb-1">Major</div>
                              <div className="flex flex-wrap gap-1">
                                {majorConditions.map(condition => (
                                  <button
                                    key={condition}
                                    onClick={() => {
                                      handleAction(
                                        MESSAGE_TYPES.CONDITION_TOGGLE,
                                        { tokenId: item.id, condition },
                                        () => tokenManager.toggleCondition(item.id, condition)
                                      );
                                    }}
                                    className={`text-xs px-2 py-1 rounded ${token.conditions && token.conditions.includes(condition)
                                      ? 'bg-major-buttons hover:bg-major-buttons-hover'
                                      : 'bg-button-muted hover:bg-button-muted-hover'
                                      }`}
                                  >
                                    {condition}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Minor Conditions */}
                            <div className="mb-3">
                              <div className="text-xs font-bold text-yellow-400 mb-1">Minor</div>
                              <div className="flex flex-wrap gap-1">
                                {minorConditions.map(condition => (
                                  <button
                                    key={condition}
                                    onClick={() => {
                                      handleAction(
                                        MESSAGE_TYPES.CONDITION_TOGGLE,
                                        { tokenId: item.id, condition },
                                        () => tokenManager.toggleCondition(item.id, condition)
                                      );
                                    }}
                                    className={`text-xs px-2 py-1 rounded ${token.conditions && token.conditions.includes(condition)
                                      ? 'bg-minor-buttons hover:bg-minor-buttons-hover'
                                      : 'bg-button-muted hover:bg-button-muted-hover'
                                      }`}
                                  >
                                    {condition}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Token Size Slider */}
                            <div className="border-t border-border pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-gray-300">Token Size</label>
                                {token.customSize !== null && (
                                  <button
                                    onClick={() => {
                                      handleAction(
                                        MESSAGE_TYPES.TOKEN_SIZE_UPDATE,
                                        { tokenId: item.id, size: null },
                                        () => tokenManager.updateTokenSize(item.id, null)
                                      );
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                    title="Reset to global size"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="32"
                                  max="192"
                                  step="4"
                                  value={token.customSize || tokenSize}
                                  onChange={(e) => {
                                    const size = parseInt(e.target.value);
                                    handleAction(
                                      MESSAGE_TYPES.TOKEN_SIZE_UPDATE,
                                      { tokenId: item.id, size },
                                      () => tokenManager.updateTokenSize(item.id, size)
                                    );
                                  }}
                                  className="flex-1"
                                />
                                <span className="text-xs w-12 text-right">
                                  {token.customSize || tokenSize}px
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {token.actions && (
                          <div>
                            {token.type === 'hero' && (
                              <div className="mb-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (token.isActiveTurn) {
                                      handleAction(
                                        MESSAGE_TYPES.END_TURN,
                                        { tokenId: item.id },
                                        () => tokenManager.endTurn(item.id)
                                      );
                                    } else {
                                      handleAction(
                                        MESSAGE_TYPES.START_TURN,
                                        { tokenId: item.id },
                                        () => tokenManager.startTurn(item.id)
                                      );
                                    }
                                  }}
                                  onMouseEnter={() => setHoveredTurnButton(item.id)}
                                  onMouseLeave={() => setHoveredTurnButton(null)}
                                  className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${token.isActiveTurn
                                    ? 'bg-primary hover:bg-primary-hover text-white'
                                    : 'bg-button-muted hover:bg-button-muted-hover'
                                    }`}
                                >
                                  {token.isActiveTurn ? (hoveredTurnButton === item.id ? 'End Turn' : '★ Active Turn ★') : 'Start Turn'}
                                </button>
                              </div>
                            )}
                            {!isLegendaryEcho && !isMainLegendary && (
                              <div className="flex gap-1">
                                {token.actions.map((used, actionIndex) => (
                                  <button
                                    key={actionIndex}
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      // Track last action user (excluding hero reactions) when NOT in popout mode
                                      if (!isPopoutWindow && setLastActionUserId) {
                                        const isHeroReaction = token.type === 'hero' && !token.isActiveTurn;
                                        const willBeUsed = !used; // Toggling to true

                                        if (willBeUsed && !isHeroReaction) {
                                          setLastActionUserId(item.id);
                                        }
                                      }

                                      handleAction(
                                        MESSAGE_TYPES.ACTION_TOGGLE,
                                        { tokenId: item.id, actionIndex },
                                        () => tokenManager.toggleAction(item.id, actionIndex)
                                      );
                                    }}
                                    className={`flex-1 h-8 rounded transition-colors ${used
                                      ? 'bg-button-muted-hover'
                                      : token.isActiveTurn
                                        ? 'bg-secondary hover:bg-secondary-hover'
                                        : token.type === 'enemy'
                                          ? 'bg-secondary hover:bg-secondary-hover'
                                          : 'bg-secondary hover:bg-secondary-hover'
                                      }`}
                                  >
                                    {used ? (
                                      (reactionStates[`${item.id}-${actionIndex}`] || (token.type === 'hero' && !token.isActiveTurn)) ? (
                                        <ShieldX size={14} className="mx-auto" />
                                      ) : (
                                        <X size={14} className="mx-auto" />
                                      )
                                    ) : (
                                      <Sword size={14} className="mx-auto" />
                                    )}
                                  </button>




                                ))}
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(!turnOrder || turnOrder.length === 0) && (
                  <div className="text-text-muted text-center py-8 text-sm">
                    No tokens added yet. Click "Add Token" to get started.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : sidebarView === 'dictionary' ? (
          <DMToolsDictionary
            expandedNotes={expandedNotes}
            toggleDictionarySection={toggleDictionarySection}
          />
        ) : sidebarView === 'dice' ? (
          <DMToolsDice
            diceCount={diceCount}
            setDiceCount={setDiceCount}
            rollDice={rollDice}
            rollingDice={rollingDice}
            diceRolls={diceRolls}
            showDiceInViewport={showDiceInViewport}
            setShowDiceInViewport={setShowDiceInViewport}
            isPopoutWindow={isPopoutWindow}
            onAction={onAction}
          />
        ) : sidebarView === 'settings' ? (
          <DMToolsSettings
            isPopoutWindow={isPopoutWindow}
            showAddToken={showAddToken}
            setShowAddToken={setShowAddToken}
            newToken={newToken}
            setNewToken={setNewToken}
            handleAddToken={handleAddToken}
            handleTokenImageUpload={handleTokenImageUpload}
            tokenSize={tokenSize}
            setTokenSize={setTokenSize}
            backgroundSize={backgroundSize}
            setBackgroundSize={setBackgroundSize}
            showPartyOverview={showPartyOverview}
            setShowPartyOverview={setShowPartyOverview}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            gridSize={gridSize}
            setGridSize={setGridSize}
            darknessMode={darknessMode}
            setDarknessMode={setDarknessMode}
            heroLightRadius={heroLightRadius}
            setHeroLightRadius={setHeroLightRadius}
            companionLightRadius={companionLightRadius}
            setCompanionLightRadius={setCompanionLightRadius}
            darknessIntensity={darknessIntensity}
            setDarknessIntensity={setDarknessIntensity}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            importBattle={importBattle}
            exportBattle={exportBattle}
            handleBackgroundUpload={handleBackgroundUpload}
          />
        ) : null
        }
      </div >

      {/* NotesPanel - anchored at bottom for all views */}
      <div className="mt-auto border-t border-border flex-shrink-0">
        <NotesPanel
          selectedToken={selectedToken}
          tokens={tokens}
          updateNotes={updateNotes}
        />
      </div>
    </div >
  );
}
