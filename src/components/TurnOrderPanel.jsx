import React, { useCallback, useRef, useState } from 'react';
import { Trash2, List, Book, RotateCcw, AlertCircle, ExternalLink, Dices, Settings, Upload, Plus } from 'lucide-react';
import { NotesPanel } from './HUD';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';
import ColorPicker from './ColorPicker';

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
 * TurnOrderPanel Component
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
export default function TurnOrderPanel({
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
}) {

  const { updateWounds, toggleTempHP } = tokenManager || {};
  const fileInputRef = useRef(null);
  const [popoutDragIndex, setPopoutDragIndex] = React.useState(null);
  const [hoveredTurnButton, setHoveredTurnButton] = useState(null);

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
    <div className={`bg-surface border-l border-border flex flex-col ${isPopoutWindow ? 'w-full h-full' : ''}`} style={isPopoutWindow ? {} : { width: `${SIDEBAR_WIDTH}px` }}>
      {/* Tab Navigation */}
      <div className="bg-surface-highlight border-b border-border p-3 flex items-center justify-between">
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
      < div className="flex-1 overflow-auto p-4" >
        {sidebarView === 'turnOrder' ? (
          <>
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
              {displayTurnOrder.map((item, index) => {
                const token = tokens.find(t => t.id === item.id);
                if (!token) return null;

                const isLegendaryEcho = item.isLegendaryEcho;
                const isMainLegendary = item.isMainLegendary;
                const actualIndex = turnOrder.indexOf(item.id);

                return (
                  <div key={isLegendaryEcho ? `${item.id}-echo-${index}` : isMainLegendary ? `${item.id}-main` : item.id}>
                    {isLegendaryEcho && (
                      <div className="flex items-center gap-2 py-1 pl-8">
                        <div className="text-purple-400 text-xs">→ Legendary Turn</div>
                      </div>
                    )}
                    <div
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
                        } ${isMainLegendary ? 'border-2 border-legendary-highlight' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {isMainLegendary && (
                            <div className="text-sm font-bold text-legendary-highlight w-6">L</div>
                          )}
                          {!isLegendaryEcho && !isMainLegendary && (
                            <div className="text-sm font-bold text-text-muted w-6">{actualIndex + 1}</div>
                          )}
                          {isLegendaryEcho && (
                            <div className="text-sm font-bold text-legendary-highlight w-6">→</div>
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
                                  {token.type === 'hero' ? actionIndex + 1 : '✓'}
                                </button>
                              ))}
                            </div>
                          )}
                          {isLegendaryEcho && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use the index within the display order to track which legendary turn this is
                                  const legendaryTurnIndex = displayTurnOrder
                                    .slice(0, index)
                                    .filter(i => i.id === item.id && i.isLegendaryEcho).length;
                                  handleAction(
                                    MESSAGE_TYPES.ACTION_TOGGLE,
                                    { tokenId: item.id, actionIndex: legendaryTurnIndex },
                                    () => tokenManager.toggleAction(item.id, legendaryTurnIndex)
                                  );
                                }}
                                className={`flex-1 h-8 rounded transition-colors ${token.actions[displayTurnOrder
                                  .slice(0, index)
                                  .filter(i => i.id === item.id && i.isLegendaryEcho).length]
                                  ? 'bg-button-muted-hover'
                                  : 'bg-secondary hover:bg-secondary-hover'
                                  }`}
                              >
                                ✓
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {turnOrder.length === 0 && (
                <div className="text-text-muted text-center py-8 text-sm">
                  No tokens added yet. Click "Add Token" to get started.
                </div>
              )}
            </div>
          </>
        ) : sidebarView === 'dictionary' ? (
          <>
            {/* Dictionary View */}
            <h2 className="text-xl font-bold mb-4">Nimble Dictionary</h2>

            <div className="text-xs text-text-muted mb-4 italic">
              Reference for rules and conditions during gameplay.
            </div>

            {/* VTT Features Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('vttFeatures')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">VTT Features</span>
                <span className="text-text-muted">{expandedNotes['vttFeatures'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['vttFeatures'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Complete guide to all features available in Nimble VTT for managing combat encounters.
                  </div>

                  {/* Combat Management */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">Combat Management</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-blue-300">Turn & Action Tracking</div>
                        <div className="text-xs text-gray-300">Track turn order, and actions for heros, companions, enemies, and legendary monsters. Reset non-hero actions using the reset button in the top right of the turn order.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Quick Combat Controls</div>
                        <div className="text-xs text-gray-300">Start combat, track turns, and track health & conditions quickly using the info button on each token in the turn order. </div>
                      </div>
                    </div>
                  </div>

                  {/* Token Management */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Token Management</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">Add Combatants</div>
                        <div className="text-xs text-gray-300">Create heroes, companions, enemies, or legendary creatures with a custom name and picture. Set their HP in the turn order.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">HP Management</div>
                        <div className="text-xs text-gray-300">Apply damage or healing with quick buttons. Visual HP bars show current health status. [COMING SOON]Automatically tracks bloodied (half HP) states.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Wounds & Death</div>
                        <div className="text-xs text-gray-300">[COMING SOON]Track wound counters for heroes. Automatically marks tokens as dying at 0 HP. Visual indicators for wounded and dying states.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Token Types</div>
                        <div className="text-xs text-gray-300">Color-coded token types: Heroes (blue), Companions (green), Enemies (red), Legendary (purple) for easy identification.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Delete & Remove</div>
                        <div className="text-xs text-gray-300">Remove individual tokens from combat with the trash icon.</div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Tracking */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">Notes & Tracking</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-purple-300">Per-Token Notes</div>
                        <div className="text-xs text-gray-300">Click any token to access its notes panel. Track exttra resources, special abilities, or any other important information.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Condition Reference</div>
                        <div className="text-xs text-gray-300">Quick access to all Nimble RPG conditions within the info section of a token. Organized by severity: Doomed, Major, and Minor conditions.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Persistent Storage</div>
                        <div className="text-xs text-gray-300">[COMING SOON] All combat data automatically saves to your browser. Your encounter persists between sessions until you reset it.</div>
                      </div>
                    </div>
                  </div>

                  {/* File Management */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">File Management</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Save Battles</div>
                        <div className="text-xs text-gray-300">Export your current encounter as a JSON file. Saves all tokens, HP, actions, notes, and combat state.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Load Battles</div>
                        <div className="text-xs text-gray-300">Import previously saved encounters. Perfect for recurring enemies, pre-planned battles, or portable games.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Battle Templates</div>
                        <div className="text-xs text-gray-300">[COMING SOON] Create reusable encounter templates with pre-configured enemies, HP, and initiatives for quick combat setup.</div>
                      </div>
                    </div>
                  </div>

                  {/* Interface Features */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Interface Features</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Sidebar Toggle</div>
                        <div className="text-xs text-gray-300">Switch between Turn Order and Dictionary views using the tabs at the top of the sidebar.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Visual Indicators</div>
                        <div className="text-xs text-gray-300">Condition indicators and token highlighting for quick status recognition.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Add Background</div>
                        <div className="text-xs text-gray-300">Quickly upload and use different battlemaps for your games.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Responsive Design</div>
                        <div className="text-xs text-gray-300">Clean, dark-themed interface optimized for readability during game sessions.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Drawing</div>
                        <div className="text-xs text-gray-300">Simple drawing and erasing mechanics to add to levels or point things out.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Keyboard Shortcuts</div>
                        <div className="text-xs text-gray-300"> SHIFT on a token to quickly read conditions and notes. CTRL + Z and CTRL + SHIFT + Z to undo and redo drawings.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Conditions Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('conditions')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Conditions</span>
                <span className="text-text-muted">{expandedNotes['conditions'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['conditions'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Some attacks, traps, spells, or other effects can inflict conditions—usually negative effects other than damage. Some conditions are temporary, lasting as little as a single round; others may last until cured in some way, and some can be ended by using an action to make an appropriate save.
                  </div>

                  {/* Doomed Conditions */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-red-400 mb-2">Doomed Conditions</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-red-300">Bloodied</div>
                        <div className="text-xs text-gray-300">At half HP or less.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Dying</div>
                        <div className="text-xs text-gray-300">At 0 HP. Taking damage while dying causes 2 Wounds, a crit causes 3 instead.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Wounded</div>
                        <div className="text-xs text-gray-300">Has any Wounds (typically 6 Wounds and a hero is dead).</div>
                      </div>
                    </div>
                  </div>

                  {/* Major Conditions */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-orange-400 mb-2">Major Conditions</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-orange-300">Blinded</div>
                        <div className="text-xs text-gray-300">Can't see. Attacks against you have advantage, and your attacks have disadvantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Invisible</div>
                        <div className="text-xs text-gray-300">Cannot be seen. Your attacks have advantage, and attacks against you have disadvantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Dazed</div>
                        <div className="text-xs text-gray-300">Heroes: lose 1 action; monsters: can perform one less action on their next turn.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Charmed</div>
                        <div className="text-xs text-gray-300">Sees the charmer as an ally. Charmer has advantage on social interactions with you.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Taunted</div>
                        <div className="text-xs text-gray-300">Disadvantage on attacks except against the most recent taunter.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Frightened</div>
                        <div className="text-xs text-gray-300">Disadvantage on rolls when source of fear is nearby; speed halved when moving closer to it.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Grappled</div>
                        <div className="text-xs text-gray-300">Cannot move. Attacks against you have advantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Riding</div>
                        <div className="text-xs text-gray-300">You move with the creature you are riding. Any attacks that miss you, strike them.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Petrified</div>
                        <div className="text-xs text-gray-300">Incapacitated. You have all the benefits and drawbacks of being a rock! Immune to most damage except from large explosions, picks, or similar tools.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Restrained</div>
                        <div className="text-xs text-gray-300">Cannot move. Attacks against you have advantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Incapacitated</div>
                        <div className="text-xs text-gray-300">Can't do anything. Attacks against you have advantage, and melee attacks that hit, crit.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Poisoned</div>
                        <div className="text-xs text-gray-300">Disadvantage on rolls.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Slowed</div>
                        <div className="text-xs text-gray-300">Speed halved during your next turn.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Prone</div>
                        <div className="text-xs text-gray-300">Movement costs twice as much, and disadvantage on attacks. Melee attacks against you have advantage; Ranged have disadvantage. Spend 3 spaces of your Speed to stand up.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Hampered</div>
                        <div className="text-xs text-gray-300">Any creature with their actions or movement reduced (e.g., Dazed, Grappled, Prone, Difficult Terrain).</div>
                      </div>
                    </div>
                  </div>

                  {/* Minor Conditions */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">Minor Conditions</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Smoldering</div>
                        <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Charged</div>
                        <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Distracted</div>
                        <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VTT Features Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Skill Checks & Saves')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Skill Checks & Saves</span>
                <span className="text-text-muted">{expandedNotes['Skill Checks & Saves'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Skill Checks & Saves'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    When you want to affect the world (convince an NPC, spot a trap, pick a lock, etc.), the GM may call for a skill check. Roll 1d20 and add your skill (the max bonus a skill can ever have is +12). If the total meets or exceeds the Difficulty Challenge (DC), you succeed; otherwise, you fail.
                  </div>

                  {/* Core Mechanics */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">Core Mechanics</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-blue-300">Critical Success & Failure</div>
                        <div className="text-xs text-gray-300">A roll of 1 always fails regardless of any other bonuses, while a roll of 20 always succeeds.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Skill Check Formula</div>
                        <div className="text-xs text-gray-300">Roll 1d20 + skill bonus (max +12). If total ≥ DC, you succeed.</div>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Challenges */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Difficulty Challenges (DC)</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">Easy (DC 8)</div>
                        <div className="text-xs text-gray-300">Spotting a large Ogre crouched behind a small bush might be a DC 8 Perception check.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Medium (DC 12)</div>
                        <div className="text-xs text-gray-300">A hidden doorway behind a bookcase might be a DC 12 Examination check.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Challenging (DC 15)</div>
                        <div className="text-xs text-gray-300">Calming an injured Owlbear stuck in a trap may be a DC 15 Naturecraft check.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Very Difficult (DC 18)</div>
                        <div className="text-xs text-gray-300">Intuiting the true intentions of a trained Spy may be a DC 18 Insight check.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Extremely Difficult (DC 20+)</div>
                        <div className="text-xs text-gray-300">Disarming an ancient legendary trap may be a DC 20+ Finesse check.</div>
                      </div>
                    </div>
                  </div>

                  {/* Saves */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">Saves</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-purple-300">What Are Saves?</div>
                        <div className="text-xs text-gray-300">When the world affects you, roll a save instead of a skill check. Roll 1d20 and add the relevant stat. A roll of 1 always fails, 20 always saves. You can choose to fail any save instead of rolling.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">STR Save</div>
                        <div className="text-xs text-gray-300">When your overall fitness and physicality is tested. STR helps resist forced movement, restraint, poison, and extreme temperatures.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">DEX Save</div>
                        <div className="text-xs text-gray-300">When your agility or speed is tested. DEX helps you dive for cover in an explosion or stay on your feet while running across icy terrain.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">INT Save</div>
                        <div className="text-xs text-gray-300">When your intelligence is tested. INT helps you see through tricks and illusions.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">WIL Save</div>
                        <div className="text-xs text-gray-300">When your courage or personality is tested. WIL helps you resist charm or fear effects.</div>
                      </div>
                    </div>
                  </div>

                  {/* Heroes and Saves */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">Heroes and Saves</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Effect DC</div>
                        <div className="text-xs text-gray-300">Unless otherwise noted, the DC for effects a hero causes is 10+KEY.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Save Modifiers</div>
                        <div className="text-xs text-gray-300">Each hero has 1 advantaged save (+), 1 disadvantaged save (–), and 2 neutral saves.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Example</div>
                        <div className="text-xs text-gray-300">A Berserker (STR+, INT–) would roll all of his STR saves with advantage and all of his INT saves with disadvantage.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Size Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Size')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Size</span>
                <span className="text-text-muted">{expandedNotes['Size'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Size'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Some spells and abilities affect differently sized objects or creatures. Use the following guidelines for size:
                  </div>

                  {/* Size Categories */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">Size Categories</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-blue-300">Tiny</div>
                        <div className="text-xs text-gray-300">Can be carried in a typical pocket (many can comfortably fit in 1 space).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Small</div>
                        <div className="text-xs text-gray-300">Can be carried in a backpack (2 can comfortably fit in 1 space).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Medium</div>
                        <div className="text-xs text-gray-300">The average human size (1 can comfortably fit in 1 space).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Large</div>
                        <div className="text-xs text-gray-300">Roughly the size of a bear (1 can comfortably fit in a 2x2 area).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Huge</div>
                        <div className="text-xs text-gray-300">Roughly the size of a small house (1 can comfortably fit in a 3x3 area).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Gargantuan</div>
                        <div className="text-xs text-gray-300">Can be as large as a castle keep (1 can fill a 4x4 area or greater).</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hit Points & Dying Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Hit Points & Dying')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Hit Points & Dying</span>
                <span className="text-text-muted">{expandedNotes['Hit Points & Dying'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Hit Points & Dying'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Hit Points (HP) represent your ability to endure damage. Damage reduces your HP (which can't go below 0). When reduced to 0 HP, gain 1 Wound; you also gain the Dying condition until you regain HP.
                  </div>

                  {/* Dying Condition */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-red-400 mb-2">Dying Condition</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-red-300">While Dying</div>
                        <div className="text-xs text-gray-300">Actions are limited to 1, Concentration is broken, and you are at risk of further serious harm.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Attacking/Casting While Dying</div>
                        <div className="text-xs text-gray-300">Causes 1 Wound unless you make a DC 10 STR save.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Taking Damage While Dying</div>
                        <div className="text-xs text-gray-300">Causes 2 Wounds; a critical hit causes 3 instead.</div>
                      </div>
                    </div>
                  </div>

                  {/* Wounds */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-orange-400 mb-2">Wounds</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-orange-300">What Are Wounds?</div>
                        <div className="text-xs text-gray-300">Wounds are serious injuries you've taken; they are a long term gauge of how close you are to death. HP can usually be recovered quickly, but Wounds may take many days of resting to fully recover from (usually 1/Safe Rest).</div>
                      </div>
                    </div>
                  </div>

                  {/* Death */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">Death</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-purple-300">Death at 6 Wounds</div>
                        <div className="text-xs text-gray-300">You die when you have taken 6 Wounds (unless you have an ability that changes this number). There are ways to revive a hero who has died, but they are rare and often come at a very steep cost.</div>
                      </div>
                    </div>
                  </div>

                  {/* Temporary HP */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Temporary HP</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-cyan-300">How Temp HP Works</div>
                        <div className="text-xs text-gray-300">Some abilities or effects may grant temporary HP (temp HP); these are reduced first when taking damage. Temp HP do not combine: If a hero has temp HP and would gain more, they instead choose which amount to keep. They expire after a Safe Rest.</div>
                      </div>
                    </div>
                  </div>

                  {/* Hit Dice */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Hit Dice</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">What Are Hit Dice?</div>
                        <div className="text-xs text-gray-300">Hit Dice (HD) represent your ability to quickly recuperate from minor injuries and are spent to regain HP. Heroes start with a max of 1 Hit Die at level 1, and this limit increases by 1 each time they level up.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Recovery</div>
                        <div className="text-xs text-gray-300">Hit Dice are recovered during a Safe Rest.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Speed & Range Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Speed & Range')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Speed & Range</span>
                <span className="text-text-muted">{expandedNotes['Speed & Range'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Speed & Range'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    A character's Speed is how fast they can move, which, unless otherwise noted, is 6. Often play is done on a grid with 1 inch squares or hexagons representing roughly 5 ft. or 1 meter each.
                  </div>

                  {/* Movement */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">Movement</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-blue-300">Standard Speed</div>
                        <div className="text-xs text-gray-300">A hero with a speed of 6 can travel up to 6 spaces horizontally or diagonally.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Moving Through Spaces</div>
                        <div className="text-xs text-gray-300">You can move through spaces occupied by allies (or enemies as difficult terrain: half speed), as long as you don't end movement in an occupied space.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Alternate Options</div>
                        <div className="text-xs text-gray-300">For a quicker, more loose game, you can forego counting spaces and measure typical movement roughly from pinkie to thumb. Slightly less for players with large hands (or slower characters), a bit more for our tiny-handed friends (or faster characters).</div>
                      </div>
                    </div>
                  </div>

                  {/* Range & Reach */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Range & Reach</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">Default Reach</div>
                        <div className="text-xs text-gray-300">Certain abilities, weapons, and spells have a specified Range or Reach, which determines how far away your target can be affected. If none is specified, default to Reach 1.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">In Melee</div>
                        <div className="text-xs text-gray-300">If any enemy is adjacent to you, your Ranged attacks are made with disadvantage (Reach attacks are not so affected).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Long Range</div>
                        <div className="text-xs text-gray-300">You can gain disadvantage 1 to gain +2 Range on any Ranged attack (max +6).</div>
                      </div>
                    </div>
                  </div>

                  {/* Falling & Forced Movement */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-red-400 mb-2">Falling & Forced Movement</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-red-300">Forced Movement Damage</div>
                        <div className="text-xs text-gray-300">When a character is forcibly moved but stopped by an obstacle, they take 1d6 bludgeoning damage for every space this movement is shortened. If they hit another creature, both creatures split this damage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Falling Damage</div>
                        <div className="text-xs text-gray-300">Falling inflicts 1d6 bludgeoning damage for every 10 ft. fallen (2 spaces).</div>
                      </div>
                    </div>
                  </div>

                  {/* Abstracted Distances */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">Abstracted Distances</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-purple-300">Close, Midrange, and Far</div>
                        <div className="text-xs text-gray-300">If preferred, you can use a more abstracted system of distance. Use Close, Midrange, and Far. A move from Midrange can traverse to Close or Far.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Distance Rules</div>
                        <div className="text-xs text-gray-300">Close creatures can be affected Reach/Range 4; Midrange, up to 6; beyond that is Far. As always, the GM will adjudicate unclear situations and which creatures are affected by abilities with an area of effect.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Concentration Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Concentration')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Concentration</span>
                <span className="text-text-muted">{expandedNotes['Concentration'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Concentration'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Some activities require Concentration to maintain. A character can only concentrate on one activity at a time.
                  </div>

                  {/* Concentration Rules */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">Concentration Rules</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Breaking Concentration (Critical Hit)</div>
                        <div className="text-xs text-gray-300">Whenever a character is crit while concentrating, they must make a DC 10 STR save. Failing this means Concentration is broken and the activity fails.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Automatic Break</div>
                        <div className="text-xs text-gray-300">Concentration is automatically broken whenever a character drops to 0 HP or is incapacitated.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cover & Hiding Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Cover & Hiding')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Cover & Hiding</span>
                <span className="text-text-muted">{expandedNotes['Cover & Hiding'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Cover & Hiding'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Cover provides protection from attacks by obscuring line of sight.
                  </div>

                  {/* Cover */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Cover</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Cover</div>
                        <div className="text-xs text-gray-300">A creature mostly obscured from line of sight (standing behind a tree, a larger ally, a knocked over table, in poor lighting, etc.) has Cover and imposes disadvantage on attacks against them.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Full Cover</div>
                        <div className="text-xs text-gray-300">A creature completely obscured from view has Full Cover and cannot typically be targeted by an attack.</div>
                      </div>
                    </div>
                  </div>

                  {/* Hiding */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Hiding</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">How to Hide</div>
                        <div className="text-xs text-gray-300">To hide in combat, you must have Cover from the creatures you are attempting to hide from and use an action to make a DC 15 Stealth check (if you have Full Cover, you succeed automatically).</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Hidden Attack</div>
                        <div className="text-xs text-gray-300">The first attack you make while hidden is made with advantage, then you are no longer hidden. If this attack kills the enemy and no other enemy can see you, you may remain hidden instead.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">GM Reminder</div>
                        <div className="text-xs text-gray-300">Monsters are smart! They may catch on to heroes using the same tactics over and over again!</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Grappling Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Grappling')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Grappling</span>
                <span className="text-text-muted">{expandedNotes['Grappling'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Grappling'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    You can attempt to grab another creature provided you are within Reach and have at least 1 arm free (or some other way to grab them).
                  </div>

                  {/* Grapple Effects */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-orange-400 mb-2">Grappling</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-orange-300">Initiating a Grapple</div>
                        <div className="text-xs text-gray-300">On a failed STR or DEX save (DC 10+STR or DEX), the target is affected based on their size.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Target Your Size or Smaller</div>
                        <div className="text-xs text-gray-300">The target is Grappled.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Target Larger Than You</div>
                        <div className="text-xs text-gray-300">You gain the Riding condition.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Ending a Grapple</div>
                        <div className="text-xs text-gray-300">Forced movement (pushing a grappler away), incapacitation, or spending an action and succeeding on a STR or DEX save can end it.</div>
                      </div>
                    </div>
                  </div>

                  {/* Restrained */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-red-400 mb-2">Restrained</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-red-300">What is Restrained?</div>
                        <div className="text-xs text-gray-300">Functions like Grappled, but is caused by objects (e.g., chains, rope, roots) and ignores size restrictions.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Ending Restrained</div>
                        <div className="text-xs text-gray-300">It can be ended through any logical means, such as picking a lock or cutting/burning rope.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resting & Downtime Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleDictionarySection('Resting & Downtime')}
                className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Resting & Downtime</span>
                <span className="text-text-muted">{expandedNotes['Resting & Downtime'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['Resting & Downtime'] && (
                <div className="bg-surface-highlight p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Rest to recover from injuries and spend downtime on various activities to prepare for your next adventure.
                  </div>

                  {/* Field Rests */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">Field Rests</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-blue-300">Catch Breath</div>
                        <div className="text-xs text-gray-300">Requires at least 10 minutes to tend to your injuries. Expend any number of Hit Dice one at a time (roll them and add your STR to each), and regain that many HP.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Make Camp</div>
                        <div className="text-xs text-gray-300">If you rest for at least 8 hours with food and sleep, take the maximum value for each Hit Die you expend instead of rolling. Add your STR to each Hit Die as usual.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Negative STR</div>
                        <div className="text-xs text-gray-300">Your frail body doesn't recover as quickly as others. Subtract your STR from each HD you expend.</div>
                      </div>
                    </div>
                  </div>

                  {/* Safe Rests */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Safe Rests</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">Safe Rest Requirements</div>
                        <div className="text-xs text-gray-300">Safe Rests take place in a safe location designated by your GM, typically lodging at an inn overnight—but could also be at a secret oasis, a well-stocked cabin in the woods, near a sacred shrine, or the like. Camping in the open wilderness or in a dungeon is not sufficient.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Safe Rest Benefits</div>
                        <div className="text-xs text-gray-300">After a Safe Rest, heroes recover all of their HP, Hit Dice, mana (and other class-specific resources), and heal 1 Wound. Safe Rests are a great opportunity for downtime activities as well.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Alternative: Extended Rest</div>
                        <div className="text-xs text-gray-300">If your table prefers to largely skip downtime activities and narrate past a week of resting, that's okay too! For a more realistic convalescence time, 1 week per wound recovered may make more sense.</div>
                      </div>
                    </div>
                  </div>

                  {/* Lodging */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">Lodging</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Lodging Quality</div>
                        <div className="text-xs text-gray-300">The cheapest rooms at an inn save you money but may lead to complications. On the other hand, some inns may allow you to pay a premium for a nicer room and amenities, giving you a Temporary Boon.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Poor (5 sp/person/day)</div>
                        <div className="text-xs text-gray-300">Basic, cheap accommodations. May lead to complications.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Comfortable (2 gp/person/day)</div>
                        <div className="text-xs text-gray-300">Standard lodging with decent amenities.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Lavish (10 gp/person/day)</div>
                        <div className="text-xs text-gray-300">Luxurious accommodations. Allows players to gain one Temporary Boon the following day.</div>
                      </div>
                    </div>
                  </div>

                  {/* Downtime */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">Downtime Activities</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-purple-300">What is Downtime?</div>
                        <div className="text-xs text-gray-300">The time you aren't out adventuring is called Downtime. You can spend Downtime to recuperate from your adventures and partake in Downtime Activities. Not every moment of Downtime needs to be narrated or roleplayed.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Retrain</div>
                        <div className="text-xs text-gray-300">Spend time doing activities to retrain any of your chosen abilities, features, or if it makes sense in the story, possibly even your subclass.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Gather Information</div>
                        <div className="text-xs text-gray-300">Meet NPCs, pick up news, or collect rumors and job leads.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Personal Goals</div>
                        <div className="text-xs text-gray-300">Pursue goals from your backstory or other smaller quests you've chosen.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Buy & Sell</div>
                        <div className="text-xs text-gray-300">Get new equipment, and sell treasures you've collected while out adventuring.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Perform</div>
                        <div className="text-xs text-gray-300">Play music, tell stories, compete, or perform in public to earn gold or fame.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Craft</div>
                        <div className="text-xs text-gray-300">Create weapons, armor, or simple items using materials you've acquired.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Socialize</div>
                        <div className="text-xs text-gray-300">Build alliances, make new friends, or make new enemies.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Invest</div>
                        <div className="text-xs text-gray-300">Use your gold to invest in businesses or trade ventures for future profit.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Mentor</div>
                        <div className="text-xs text-gray-300">Teach a skill or ability to another character or NPC.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Research</div>
                        <div className="text-xs text-gray-300">Investigate a mystery, study ancient texts, or uncover hidden knowledge.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Serve</div>
                        <div className="text-xs text-gray-300">Aid a patron or a deity in exchange for a favor, or perform charity for townsfolk.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Build</div>
                        <div className="text-xs text-gray-300">Establish a home base, start a business, craft siege weapons, or build anything else you can imagine (GM and setting-permitting, of course).</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : sidebarView === 'dice' ? (
          <>
            {/* Dice Roller View */}
            <h2 className="text-xl font-bold mb-4">Dice Roller</h2>

            <div className="text-xs text-text-muted mb-4 italic">
              Roll dice for your tabletop game.
            </div>

            <div className="mb-4">
              <label className="text-sm block mb-2">Number of Dice</label>
              <input
                type="number"
                min="1"
                max="20"
                value={diceCount}
                onChange={(e) => setDiceCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full bg-surface-highlight px-3 py-2 rounded text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => rollDice(4)}
                className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold"
              >
                d4
              </button>
              <button
                onClick={() => rollDice(6)}
                className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold"
              >
                d6
              </button>
              <button
                onClick={() => rollDice(8)}
                className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold"
              >
                d8
              </button>
              <button
                onClick={() => rollDice(10)}
                className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold"
              >
                d10
              </button>
              <button
                onClick={() => rollDice(12)}
                className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold"
              >
                d12
              </button>
              <button
                onClick={() => rollDice(20)}
                className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold"
              >
                d20
              </button>
            </div>

            {/* Show in Viewport Toggle */}
            <div className="mb-4 flex items-center gap-2 p-3 bg-surface rounded">
              <input
                type="checkbox"
                id="showDiceInViewport"
                checked={showDiceInViewport}
                onChange={(e) => {
                  if (isPopoutWindow) {
                    onAction(createMessage(MESSAGE_TYPES.SETTINGS_UPDATE, { showDiceInViewport: e.target.checked }));
                  } else {
                    setShowDiceInViewport(e.target.checked);
                  }
                }}
                className="w-4 h-4"
              />
              <label htmlFor="showDiceInViewport" className="text-sm cursor-pointer">
                Show in Viewport
              </label>
            </div>

            {/* Dice Roll Results */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Recent Rolls</h3>
              {rollingDice.length === 0 && diceRolls.length === 0 ? (
                <div className="text-xs text-text-muted italic p-4 text-center">
                  No recent rolls
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...rollingDice.map(r => ({ ...r, type: 'rolling' })), ...diceRolls.map(r => ({ ...r, type: 'result' }))]
                    .sort((a, b) => b.id - a.id)
                    .map((item) =>
                      item.type === 'rolling' ? (
                        <div
                          key={`rolling-${item.id}`}
                          className="bg-primary text-text px-4 py-3 rounded shadow border-2 border-purple-400"
                        >
                          <div className="text-center">
                            <div className="text-2xl">🎲</div>
                            <div className="text-xs mt-1">Rolling...</div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={`result-${item.id}`}
                          className="bg-secondary text-text px-4 py-3 rounded shadow border-2 border-green-400"
                        >
                          <div className="text-center">
                            <div className="text-xs font-bold mb-1">{item.dice}</div>
                            <div className="text-2xl font-bold">{item.total}</div>
                            {item.rolls.length > 1 && (
                              <div className="text-xs mt-1 opacity-80">
                                [{item.rolls.join(', ')}]
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>
          </>
        ) : sidebarView === 'settings' ? (
          <>
            {/* Settings View */}
            <h2 className="text-xl font-bold mb-4">Settings</h2>

            <div className="space-y-4">
              {/* Background and Add Token Buttons */}
              <div className="flex gap-2">
                <label className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                  ? 'bg-button-muted text-text-muted cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover cursor-pointer'
                  }`}>
                  <Upload size={16} />
                  Background
                  {!isPopoutWindow && <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />}
                </label>
                <button
                  onClick={() => !isPopoutWindow && setShowAddToken(!showAddToken)}
                  disabled={isPopoutWindow}
                  className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                    ? 'bg-button-muted text-text-muted cursor-not-allowed'
                    : showAddToken
                      ? 'bg-tertiary hover:bg-tertiary-hover'
                      : 'bg-secondary hover:bg-secondary-hover'
                    }`}
                >
                  <Plus size={16} />
                  {showAddToken ? 'Cancel' : 'Add Token'}
                </button>
              </div>

              {/* Add Token Form - Inline */}
              {showAddToken && (
                <div className="bg-surface-highlight border border-border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-bold mb-2">Add New Token</h3>

                  <div>
                    <label className="block text-xs mb-1">Name</label>
                    <input
                      type="text"
                      value={newToken.name}
                      onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                      className="w-full bg-surface px-3 py-2 rounded text-sm"
                      placeholder="Token name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Type</label>
                    <select
                      value={newToken.type}
                      onChange={(e) => setNewToken({ ...newToken, type: e.target.value })}
                      className="w-full bg-surface px-3 py-2 rounded text-sm"
                    >
                      <option value="hero">Hero</option>
                      <option value="companion">Companion</option>
                      <option value="enemy">Enemy</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newToken.hasResource}
                        onChange={(e) => setNewToken({ ...newToken, hasResource: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-bold">Has Resource?</span>
                    </label>

                    {newToken.hasResource && (
                      <div className="mt-2 space-y-2 pl-6">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs mb-1">Resource Name</label>
                            <input
                              type="text"
                              value={newToken.resourceName}
                              onChange={(e) => setNewToken({ ...newToken, resourceName: e.target.value })}
                              className="w-full bg-surface px-3 py-2 rounded text-sm"
                              placeholder="e.g., Mana, Focus, Rage"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Color</label>
                            <ColorPicker
                              color={newToken.resourceColor}
                              onChange={(color) => setNewToken({ ...newToken, resourceColor: color })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Image (Optional)</label>
                    <label className="w-full bg-primary hover:bg-primary-hover px-3 py-2 rounded cursor-pointer text-sm flex items-center justify-center gap-2">
                      <Upload size={16} />
                      {newToken.image ? 'Change Image' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleTokenImageUpload} className="hidden" />
                    </label>
                    {newToken.image && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={newToken.image} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-xs text-text-muted">Image uploaded</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      handleAddToken();
                      setShowAddToken(false);
                    }}
                    className="w-full bg-secondary hover:bg-secondary-hover px-3 py-2 rounded text-sm font-bold mt-2"
                  >
                    Add Token
                  </button>
                </div>
              )}

              {/* Token Size */}
              <div>
                <label className="text-sm block mb-2">Token Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="32"
                    max="128"
                    step="4"
                    value={tokenSize}
                    onChange={(e) => setTokenSize(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{tokenSize}px</span>
                </div>
              </div>

              {/* Background Size */}
              <div>
                <label className="text-sm block mb-2">Background Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={backgroundSize}
                    onChange={(e) => setBackgroundSize(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{backgroundSize}%</span>
                </div>
              </div>

              {/* Party Overview Toggle */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold">Show Party Overview</label>
                  <button
                    onClick={() => setShowPartyOverview(!showPartyOverview)}
                    className={`px-3 py-1 rounded text-sm ${showPartyOverview ? 'bg-secondary hover:bg-secondary-hover' : 'bg-tertiary hover:bg-tertiary-hover'
                      }`}
                  >
                    {showPartyOverview ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Grid Settings */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold">Show Grid</label>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-3 py-1 rounded text-sm ${showGrid ? 'bg-secondary hover:bg-secondary-hover' : 'bg-tertiary hover:bg-tertiary-hover'
                      }`}
                  >
                    {showGrid ? 'ON' : 'OFF'}
                  </button>
                </div>
                {showGrid && (
                  <div>
                    <label className="text-sm block mb-2">Grid Size</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="20"
                        max="150"
                        step="5"
                        value={gridSize}
                        onChange={(e) => setGridSize(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">{gridSize}px</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Darkness Mode Settings */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold">Darkness Mode</label>
                  <button
                    onClick={() => setDarknessMode(!darknessMode)}
                    className={`px-3 py-1 rounded text-sm ${darknessMode ? 'bg-secondary hover:bg-secondary-hover' : 'bg-tertiary hover:bg-tertiary-hover'
                      }`}
                  >
                    {darknessMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                {darknessMode && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm block mb-2">Hero Light Radius</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="6"
                          step="0.5"
                          value={heroLightRadius}
                          onChange={(e) => setHeroLightRadius(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-right">{heroLightRadius}x</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm block mb-2">Companion Light Radius</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="6"
                          step="0.5"
                          value={companionLightRadius}
                          onChange={(e) => setCompanionLightRadius(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-right">{companionLightRadius}x</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm block mb-2">Darkness Intensity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={darknessIntensity}
                          onChange={(e) => setDarknessIntensity(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm w-16 text-right">{Math.round(darknessIntensity * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold">Theme</label>
                  <select
                    value={currentTheme}
                    onChange={(e) => setCurrentTheme(e.target.value)}
                    className="bg-tertiary text-text text-sm rounded px-2 py-1 border border-gray-500"
                  >
                    <option value="default">Default</option>
                    <option value="dracula">Dracula</option>
                  </select>
                </div>
              </div>

              {/* Export/Import Battle */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-bold mb-2">Import & Export</h3>
                <div className="flex gap-2">
                  {isPopoutWindow ? (
                    <button
                      onClick={importBattle}
                      className="flex-1 bg-primary hover:bg-primary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                    >
                      Import Battle
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-primary hover:bg-primary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                      >
                        Import Battle
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={importBattle}
                        className="hidden"
                      />
                    </>
                  )}
                  <button
                    onClick={exportBattle}
                    className="flex-1 bg-secondary hover:bg-secondary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                  >
                    Export Battle
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null
        }
      </div >

      <div className={isPopoutWindow ? 'mt-auto border-t border-border flex-shrink-0' : ''}>
        <NotesPanel
          selectedToken={selectedToken}
          tokens={tokens}
          updateNotes={updateNotes}
        />
      </div>
    </div >
  );
}
