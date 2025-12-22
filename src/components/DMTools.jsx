import React, { useCallback, useRef, useState } from 'react';
import { Trash2, List, Book, RotateCcw, AlertCircle, ExternalLink, Dices, Settings, Upload, Plus, Pencil, Sword, X, ShieldX, Shield } from 'lucide-react';
import ColorPicker from './ColorPicker';
import TokenCard from './TokenCard';



import { NotesPanel } from './HUD';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';

import { getTokenBorderColor } from '../utils/tokenUtils';
import { DMToolsDictionary } from './DMToolsDictionary';
import { DMToolsDice } from './DMToolsDice';
import { DMToolsSettings } from './DMToolsSettings';
import Tooltip from './Tooltip';

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
  diceNotation,
  setDiceNotation,
  notationError,
  rollDice,
  addOrIncrementDie,
  clearNotation,
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
  gridColor,
  setGridColor,
  gridOpacity,
  setGridOpacity,
  gridType,
  setGridType,
  gridStrokeWidth,
  setGridStrokeWidth,
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
  handleAppBackgroundUpload,
  handleBackgroundUrlSubmit,
  handleAppBackgroundUrlSubmit,
  showAddToken,
  setShowAddToken,
  showEditToken,
  setShowEditToken,
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
  // Local state for editing token
  const [editTokenData, setEditTokenData] = useState(null);

  // Sync editTokenData when showEditToken becomes true
  React.useEffect(() => {
    if (showEditToken && selectedToken && tokens) {
      const token = tokens.find(t => t.id === selectedToken);
      if (token) {
        setEditTokenData({ ...token });
      }
    }
  }, [showEditToken, selectedToken, tokens]);

  const handleEditTokenImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditTokenData({ ...editTokenData, image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToken = () => {
    if (editTokenData && selectedToken) {
      if (tokenManager) {
        tokenManager.updateTokenData(selectedToken, {
          name: editTokenData.name,
          type: editTokenData.type,
          armor: editTokenData.armor,
          resources: editTokenData.resources || [],
          image: editTokenData.image
        });
      } else if (onAction) {
        onAction(createMessage(MESSAGE_TYPES.UPDATE_TOKEN_DATA, {
          tokenId: selectedToken,
          updates: {
            name: editTokenData.name,
            type: editTokenData.type,
            armor: editTokenData.armor,
            resources: editTokenData.resources || [],
            image: editTokenData.image
          }
        }));
      }
      if (setShowEditToken) setShowEditToken(false);
    }
  };

  // Drag and Drop (Reordering) - using native HTML5 DnD for simplicity and performance
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
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
      <div className="bg-surface-highlight border-b border-border px-3 pt-3 pb-0 flex items-end justify-between flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setSidebarView('turnOrder')}
            className={`px-4 py-2 rounded-t-lg flex items-center justify-center transition-all ${sidebarView === 'turnOrder' ? 'bg-surface text-primary -mb-px border-t-2 border-primary pb-2.5' : 'text-text-muted hover:text-text hover:bg-surface/20'
              }`}
            title="Turn Order"
          >
            <List size={20} />
          </button >
          <button
            onClick={() => setSidebarView('dictionary')}
            className={`px-4 py-2 rounded-t-lg flex items-center justify-center transition-all ${sidebarView === 'dictionary' ? 'bg-surface text-primary -mb-px border-t-2 border-primary pb-2.5' : 'text-text-muted hover:text-text hover:bg-surface/20'
              }`}
            title="Nimble Dictionary"
          >
            <Book size={20} />
          </button>
          <button
            onClick={() => setSidebarView('dice')}
            className={`px-4 py-2 rounded-t-lg flex items-center justify-center transition-all ${sidebarView === 'dice' ? 'bg-surface text-primary -mb-px border-t-2 border-primary pb-2.5' : 'text-text-muted hover:text-text hover:bg-surface/20'
              }`}
            title="Dice Roller"
          >
            <Dices size={20} />
          </button>
          <button
            onClick={() => setSidebarView('settings')}
            className={`px-4 py-2 rounded-t-lg flex items-center justify-center transition-all ${sidebarView === 'settings' ? 'bg-surface text-primary -mb-px border-t-2 border-primary pb-2.5' : 'text-text-muted hover:text-text hover:bg-surface/20'
              }`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div >

        {/* Action buttons */}
        < div className="flex gap-2 pb-2" >
          {/* Pop-out button - only in main window */}
          {
            !isPopoutWindow && onPopout && (
              <button
                onClick={onPopout}
                className="p-2 rounded bg-tertiary hover:bg-tertiary-hover text-text-muted hover:text-text"
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
                  {/* TEMPORARY: Add Shadow Button - Easy to remove later */}
                  <button
                    onClick={() => {
                      // Count existing shadow tokens
                      const shadowCount = tokens.filter(t => t.type === 'shadow').length;
                      if (shadowCount >= 3) {
                        alert('Maximum 3 shadow tokens allowed');
                        return;
                      }

                      // Add shadow token (if tokenManager exists - not in popout)
                      if (tokenManager) {
                        // Find hero with lowest max health
                        const heroes = tokens.filter(t => t.type === 'hero');
                        let spawnX = 100;
                        let spawnY = 100;

                        if (heroes.length > 0) {
                          const weakestHero = heroes.reduce((min, hero) =>
                            hero.maxHealth < min.maxHealth ? hero : min
                          );
                          // Spawn to the right of the weakest hero
                          spawnX = weakestHero.x + (tokenSize || 64) + 10;
                          spawnY = weakestHero.y;
                        }

                        tokenManager.addToken({
                          name: `Shadow ${shadowCount + 1}`,
                          type: 'shadow',
                          image: null,
                          x: spawnX,
                          y: spawnY
                        });
                        // Don't add to turn order - shadows are managed separately
                      } else if (onAction) {
                        // In popout mode, send message to main window
                        onAction(createMessage(MESSAGE_TYPES.ADD_SHADOW_TOKEN, {}));
                      }
                    }}
                    className={`p-2 rounded flex items-center justify-center bg-purple-900 hover:bg-purple-800`}
                    title="Add Shadow (max 3)"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (setShowAddToken) {
                        setShowAddToken(!showAddToken);
                        if (showEditToken) setShowEditToken(false);
                      }
                    }}
                    className={`p-2 rounded flex items-center justify-center bg-secondary hover:bg-secondary-hover`}
                    title="Add Token"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedToken && setShowEditToken) {
                        setShowEditToken(!showEditToken);
                        if (showAddToken) setShowAddToken(false);
                      }
                    }}
                    disabled={!selectedToken}
                    className={`p-2 rounded flex items-center justify-center ${!selectedToken
                      ? 'bg-button-muted text-text-muted cursor-not-allowed'
                      : 'bg-secondary hover:bg-secondary-hover'
                      }`}
                    title={!selectedToken ? "Select token to edit" : "Edit Token"}
                  >
                    <Pencil size={16} />
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
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-text-muted">
                  {deleteMode ? 'Click tokens to remove them' : 'Drag to reorder'}
                </div>
                <button
                  onClick={() => {
                    handleAction(
                      MESSAGE_TYPES.RESET_NON_HERO_ACTIONS,
                      {},
                      () => tokenManager.resetNonHeroActions()
                    );
                  }}
                  className="bg-secondary hover:bg-secondary-hover p-1 rounded flex items-center justify-center"
                  style={{ width: '24px', height: '24px' }}
                  title="Reset all non-hero actions"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              {/* Add Token Form - Inline */}
              {showAddToken && (
                <div className="bg-surface-highlight border border-border rounded-lg p-4 mb-4 space-y-3">
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

                  {/* Armor Option - Only for Enemy or Legendary */}
                  {(newToken.type === 'enemy' || newToken.type === 'legendary') && (
                    <div>
                      <label className="block text-xs mb-1">Armor</label>
                      <select
                        value={newToken.armor || 'none'}
                        onChange={(e) => setNewToken({ ...newToken, armor: e.target.value })}
                        className="w-full bg-surface px-3 py-2 rounded text-sm"
                      >
                        <option value="none">None</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold">Resources</label>
                      <button
                        onClick={() => {
                          const currentResources = newToken.resources || [];
                          if (currentResources.length < 3) {
                            setNewToken({
                              ...newToken,
                              resources: [...currentResources, { name: 'Resource', color: '#3b82f6', current: 5, max: 5 }]
                            });
                          }
                        }}
                        disabled={(newToken.resources || []).length >= 3}
                        className={`px-2 py-1 rounded text-xs ${(newToken.resources || []).length >= 3
                          ? 'bg-button-muted text-text-muted cursor-not-allowed'
                          : 'bg-secondary hover:bg-secondary-hover'
                          }`}
                      >
                        <Plus size={12} className="inline mr-1" />
                        Add Resource
                      </button>
                    </div>

                    {(newToken.resources || []).map((resource, idx) => (
                      <div key={idx} className="bg-surface rounded p-2 mb-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">Resource {idx + 1}</span>
                          <button
                            onClick={() => {
                              const currentResources = [...(newToken.resources || [])];
                              currentResources.splice(idx, 1);
                              setNewToken({ ...newToken, resources: currentResources });
                            }}
                            className="text-destructive hover:text-destructive-hover"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs mb-1">Name</label>
                            <input
                              type="text"
                              value={resource.name}
                              onChange={(e) => {
                                const currentResources = [...(newToken.resources || [])];
                                currentResources[idx] = { ...currentResources[idx], name: e.target.value };
                                setNewToken({ ...newToken, resources: currentResources });
                              }}
                              className="w-full bg-surface-highlight px-2 py-1 rounded text-sm"
                              placeholder="e.g., Mana, Focus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Color</label>
                            <ColorPicker
                              color={resource.color}
                              onChange={(color) => {
                                const currentResources = [...(newToken.resources || [])];
                                currentResources[idx] = { ...currentResources[idx], color };
                                setNewToken({ ...newToken, resources: currentResources });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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

              {/* Edit Token Form - Inline */}
              {showEditToken && editTokenData && (
                <div className="bg-surface-highlight border border-border rounded-lg p-4 mb-4 space-y-3">
                  <h3 className="text-sm font-bold mb-2">Edit Token</h3>

                  <div>
                    <label className="block text-xs mb-1">Name</label>
                    <input
                      type="text"
                      value={editTokenData.name}
                      onChange={(e) => setEditTokenData({ ...editTokenData, name: e.target.value })}
                      className="w-full bg-surface px-3 py-2 rounded text-sm"
                      placeholder="Token name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Type</label>
                    <select
                      value={editTokenData.type}
                      onChange={(e) => setEditTokenData({ ...editTokenData, type: e.target.value })}
                      className="w-full bg-surface px-3 py-2 rounded text-sm"
                    >
                      <option value="hero">Hero</option>
                      <option value="companion">Companion</option>
                      <option value="enemy">Enemy</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>

                  {/* Armor Option - Only for Enemy or Legendary */}
                  {(editTokenData.type === 'enemy' || editTokenData.type === 'legendary') && (
                    <div>
                      <label className="block text-xs mb-1">Armor</label>
                      <select
                        value={editTokenData.armor || 'none'}
                        onChange={(e) => setEditTokenData({ ...editTokenData, armor: e.target.value })}
                        className="w-full bg-surface px-3 py-2 rounded text-sm"
                      >
                        <option value="none">None</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold">Resources</label>
                      <button
                        onClick={() => {
                          const currentResources = editTokenData.resources || [];
                          if (currentResources.length < 3) {
                            setEditTokenData({
                              ...editTokenData,
                              resources: [...currentResources, { name: 'Resource', color: '#3b82f6', current: 5, max: 5 }]
                            });
                          }
                        }}
                        disabled={(editTokenData.resources || []).length >= 3}
                        className={`px-2 py-1 rounded text-xs ${(editTokenData.resources || []).length >= 3
                          ? 'bg-button-muted text-text-muted cursor-not-allowed'
                          : 'bg-secondary hover:bg-secondary-hover'
                          }`}
                      >
                        <Plus size={12} className="inline mr-1" />
                        Add Resource
                      </button>
                    </div>

                    {(editTokenData.resources || []).map((resource, idx) => (
                      <div key={idx} className="bg-surface rounded p-2 mb-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">Resource {idx + 1}</span>
                          <button
                            onClick={() => {
                              const currentResources = [...(editTokenData.resources || [])];
                              currentResources.splice(idx, 1);
                              setEditTokenData({ ...editTokenData, resources: currentResources });
                            }}
                            className="text-destructive hover:text-destructive-hover"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs mb-1">Name</label>
                            <input
                              type="text"
                              value={resource.name}
                              onChange={(e) => {
                                const currentResources = [...(editTokenData.resources || [])];
                                currentResources[idx] = { ...currentResources[idx], name: e.target.value };
                                setEditTokenData({ ...editTokenData, resources: currentResources });
                              }}
                              className="w-full bg-surface-highlight px-2 py-1 rounded text-sm"
                              placeholder="e.g., Mana, Focus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Color</label>
                            <ColorPicker
                              color={resource.color}
                              onChange={(color) => {
                                const currentResources = [...(editTokenData.resources || [])];
                                currentResources[idx] = { ...currentResources[idx], color };
                                setEditTokenData({ ...editTokenData, resources: currentResources });
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs mb-1">Current</label>
                            <input
                              type="number"
                              value={resource.current || 0}
                              onChange={(e) => {
                                const currentResources = [...(editTokenData.resources || [])];
                                const newCurrent = Math.max(0, Math.min(parseInt(e.target.value) || 0, resource.max || 0));
                                currentResources[idx] = { ...currentResources[idx], current: newCurrent };
                                setEditTokenData({ ...editTokenData, resources: currentResources });
                              }}
                              className="w-full bg-surface-highlight px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs mb-1">Max</label>
                            <input
                              type="number"
                              value={resource.max || 0}
                              onChange={(e) => {
                                const currentResources = [...(editTokenData.resources || [])];
                                const newMax = Math.max(0, parseInt(e.target.value) || 0);
                                currentResources[idx] = {
                                  ...currentResources[idx],
                                  max: newMax,
                                  current: Math.min(currentResources[idx].current || 0, newMax)
                                };
                                setEditTokenData({ ...editTokenData, resources: currentResources });
                              }}
                              className="w-full bg-surface-highlight px-2 py-1 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Image (Optional)</label>
                    <label className="w-full bg-primary hover:bg-primary-hover px-3 py-2 rounded cursor-pointer text-sm flex items-center justify-center gap-2">
                      <Upload size={16} />
                      {editTokenData.image ? 'Change Image' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleEditTokenImageUpload} className="hidden" />
                    </label>
                    {editTokenData.image && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={editTokenData.image} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-xs text-text-muted">Image uploaded</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveToken}
                    className="w-full bg-secondary hover:bg-secondary-hover px-3 py-2 rounded text-sm font-bold mt-2"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {/* Token Cards */}
              <div className="space-y-2">
                {/* TEMPORARY: Shadow Tokens Card - Easy to remove later */}
                {(() => {
                  const shadowTokens = tokens.filter(t => t.type === 'shadow');
                  if (shadowTokens.length === 0) return null;

                  return (
                    <div className="bg-purple-950 p-2 rounded border-2 border-purple-900">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-purple-300">Shadows</div>
                        <div className="flex gap-1">
                          {shadowTokens.map((shadow, idx) => (
                            <button
                              key={shadow.id}
                              onClick={() => {
                                if (tokenManager) {
                                  handleRemoveToken(shadow.id);
                                } else if (onAction) {
                                  onAction(createMessage(MESSAGE_TYPES.REMOVE_SHADOW_TOKEN, { tokenId: shadow.id }));
                                }
                              }}
                              className="w-6 h-6 bg-red-900 hover:bg-red-800 rounded text-xs flex items-center justify-center"
                              title={`Remove Shadow ${idx + 1}`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {displayTurnOrder && tokens && turnOrder && displayTurnOrder.map((item, index) => {
                  const token = tokens.find(t => t.id === item.id);
                  if (!token) return null;

                  const isLegendaryEcho = item.isLegendaryEcho;
                  const isMainLegendary = item.isMainLegendary;
                  const actualIndex = turnOrder.indexOf(item.id);
                  const conditionKey = `${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`;

                  return (
                    <TokenCard
                      key={isLegendaryEcho ? `${item.id}-echo-${index}` : isMainLegendary ? `${item.id}-main` : item.id}
                      token={token}
                      itemId={item.id}
                      index={index}
                      actualIndex={actualIndex}
                      isLegendaryEcho={isLegendaryEcho}
                      isMainLegendary={isMainLegendary}
                      isSelected={selectedToken === item.id}
                      isExpanded={expandedConditions[conditionKey]}
                      deleteMode={deleteMode}
                      lastActionUserId={lastActionUserId}
                      tokenSize={tokenSize}
                      onSelect={setSelectedToken}
                      onRemove={handleRemoveToken}
                      onToggleConditions={() => {
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
                      onAction={onAction}
                      onDragStart={activeTurnOrderManager ? () => !isLegendaryEcho && activeTurnOrderManager.handleTurnDragStart(actualIndex) : undefined}
                      onDragOver={activeTurnOrderManager ? (e) => !isLegendaryEcho && activeTurnOrderManager.handleTurnDragOver(e, actualIndex) : undefined}
                      onDrop={activeTurnOrderManager ? (e) => { e.preventDefault(); } : undefined}
                      onDragEnd={activeTurnOrderManager ? activeTurnOrderManager.handleTurnDragEnd : undefined}
                      setCardRef={(el, tokenId, isEcho, idx) => {
                        if (el) {
                          // Store refs for all cards (including echo cards for legendary actions)
                          // For legendary echo cards, store with a composite key including the echo index
                          if (isEcho) {
                            const legendaryTurnIndex = displayTurnOrder
                              .slice(0, idx)
                              .filter(i => i.id === tokenId && i.isLegendaryEcho).length;
                            tokenCardRefs.current[`${tokenId}-echo-${legendaryTurnIndex}`] = el;
                          } else if (!isMainLegendary) {
                            // Regular tokens (not main legendary card)
                            tokenCardRefs.current[tokenId] = el;
                          }
                        }
                      }}
                      setHoveredTurnButton={setHoveredTurnButton}
                      hoveredTurnButton={hoveredTurnButton}
                      doomedConditions={doomedConditions}
                      majorConditions={majorConditions}
                      minorConditions={minorConditions}
                      reactionStates={reactionStates}
                      getTokenBorderColor={getTokenBorderColor}
                      getTokenBgColor={getTokenBgColor}
                      getTokenIcon={getTokenIcon}
                      tokenManager={tokenManager}
                      displayTurnOrder={displayTurnOrder}
                      isPopoutWindow={isPopoutWindow}
                      setLastActionUserId={setLastActionUserId}
                      draggable={!deleteMode && !isLegendaryEcho && !expandedConditions[conditionKey] && !!activeTurnOrderManager}
                    />
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
            diceNotation={diceNotation}
            setDiceNotation={setDiceNotation}
            notationError={notationError}
            rollDice={rollDice}
            addOrIncrementDie={addOrIncrementDie}
            clearNotation={clearNotation}
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
            gridColor={gridColor}
            setGridColor={setGridColor}
            gridOpacity={gridOpacity}
            setGridOpacity={setGridOpacity}
            gridType={gridType}
            setGridType={setGridType}
            gridStrokeWidth={gridStrokeWidth}
            setGridStrokeWidth={setGridStrokeWidth}
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
            handleAppBackgroundUpload={handleAppBackgroundUpload}
            handleBackgroundUrlSubmit={handleBackgroundUrlSubmit}
            handleAppBackgroundUrlSubmit={handleAppBackgroundUrlSubmit}
            selectedTokenId={selectedToken}
            tokens={tokens}
            updateTokenData={tokenManager ? tokenManager.updateTokenData : null}
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
