import React from 'react';
import { AlertCircle, X, Sword, ShieldX, Shield } from 'lucide-react';
import { MESSAGE_TYPES } from '../utils/windowMessages';
import Tooltip from './Tooltip';

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
 * TokenCard Component
 *
 * Renders a single token card in the turn order with all its UI (health, actions, conditions, etc.)
 * Extracted from DMTools for performance optimization with React.memo
 *
 * @param {Object} props
 * @param {Object} props.token - The token object
 * @param {string} props.itemId - The ID from displayTurnOrder (can be token.id or composite for legendary)
 * @param {number} props.index - Index in displayTurnOrder
 * @param {number} props.actualIndex - Actual index in turnOrder array
 * @param {boolean} props.isLegendaryEcho - Is this a legendary echo card
 * @param {boolean} props.isMainLegendary - Is this the main legendary card
 * @param {boolean} props.isSelected - Is this token selected
 * @param {boolean} props.isExpanded - Are conditions expanded for this card
 * @param {boolean} props.deleteMode - Is delete mode active
 * @param {string} props.lastActionUserId - ID of last action user (for indicator arrow)
 * @param {number} props.tokenSize - Global token size
 * @param {Function} props.onSelect - Callback when token is selected
 * @param {Function} props.onRemove - Callback when token is removed
 * @param {Function} props.onToggleConditions - Callback when conditions are toggled
 * @param {Function} props.onAction - Callback for actions (health update, condition toggle, etc.)
 * @param {Function} props.onDragStart - Turn order drag start
 * @param {Function} props.onDragOver - Turn order drag over
 * @param {Function} props.onDrop - Turn order drop
 * @param {Function} props.onDragEnd - Turn order drag end
 * @param {Function} props.setCardRef - Callback to store ref for this card
 * @param {Function} props.setHoveredTurnButton - Callback for turn button hover
 * @param {string} props.hoveredTurnButton - ID of hovered turn button
 * @param {Array} props.doomedConditions - Array of doomed conditions
 * @param {Array} props.majorConditions - Array of major conditions
 * @param {Array} props.minorConditions - Array of minor conditions
 * @param {Object} props.reactionStates - Object tracking reaction states
 * @param {Function} props.getTokenBorderColor - Get border color for token type
 * @param {Function} props.getTokenBgColor - Get background color for token type
 * @param {Function} props.getTokenIcon - Get icon for token type
 * @param {Object} props.tokenManager - Token manager with update methods
 * @param {Object} props.displayTurnOrder - Full display turn order (for legendary calculations)
 * @param {boolean} props.isPopoutWindow - Is rendering in popout window
 * @param {Function} props.setLastActionUserId - Set last action user ID
 * @param {boolean} props.draggable - Is card draggable
 */
const TokenCard = ({
  token,
  itemId,
  index,
  actualIndex,
  isLegendaryEcho,
  isMainLegendary,
  isSelected,
  isExpanded,
  deleteMode,
  lastActionUserId,
  tokenSize,
  onSelect,
  onRemove,
  onToggleConditions,
  onAction,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  setCardRef,
  setHoveredTurnButton,
  hoveredTurnButton,
  doomedConditions,
  majorConditions,
  minorConditions,
  reactionStates,
  getTokenBorderColor,
  getTokenBgColor,
  getTokenIcon,
  tokenManager,
  displayTurnOrder,
  isPopoutWindow,
  setLastActionUserId,
  draggable
}) => {
  // Helper to handle actions with optional popout sync
  const handleAction = (messageType, payload, localAction) => {
    if (onAction) {
      // In popout mode - send message to main window
      onAction({ type: messageType, payload });
    } else {
      // In main window - execute action directly
      localAction();
    }
  };

  return (
    <div key={isLegendaryEcho ? `${itemId}-echo-${index}` : isMainLegendary ? `${itemId}-main` : itemId}>
      <div
        ref={(el) => {
          if (el && setCardRef) {
            setCardRef(el, itemId, isLegendaryEcho, index);
          }
        }}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={() => {
          if (deleteMode && !isLegendaryEcho) {
            onRemove(itemId);
          } else if (!isLegendaryEcho) {
            onSelect(itemId);
          }
        }}
        className={`bg-surface-highlight p-3 rounded ${
          !deleteMode && !isLegendaryEcho && !isExpanded && draggable ? 'select-none' : ''
        } ${
          deleteMode && !isLegendaryEcho
            ? 'cursor-pointer hover:bg-destructive'
            : !isLegendaryEcho && !isExpanded && draggable
            ? 'cursor-move'
            : ''
        } ${isSelected && !isLegendaryEcho ? 'ring-2 ring-token-selected' : ''} ${
          isLegendaryEcho ? 'opacity-75 ml-4' : ''
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
              <div className="flex items-center gap-1.5">
                <div className="font-bold text-sm">{token.name}</div>
                {/* Armor Icon */}
                {token.armor && token.armor !== 'none' && (
                  <Tooltip
                    text={
                      token.armor === 'medium'
                        ? 'Medium Armor: ignore all damage modifiers from stats and other effects, taking damage from the sum of the dice only.'
                        : 'Heavy Armor: ignore damage modifiers and take half the sum of the dice (rounding up).'
                    }
                    position="top"
                    wrap={true}
                    maxWidth="220px"
                  >
                    <div className="relative flex items-center justify-center">
                      <Shield size={16} className="text-text-muted" />
                      <span className="absolute text-[10px] font-bold" style={{ marginTop: '1px' }}>
                        {token.armor === 'medium' ? 'M' : 'H'}
                      </span>
                    </div>
                  </Tooltip>
                )}
              </div>
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
                          { tokenId: itemId, tempHP },
                          () => tokenManager.updateTempHP(itemId, tempHP)
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
                        { tokenId: itemId, newHealth },
                        () => tokenManager.updateHealth(itemId, newHealth)
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
                        { tokenId: itemId, newMaxHealth },
                        () => tokenManager.updateMaxHealth(itemId, newMaxHealth)
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
                    .filter(i => i.id === itemId && i.isLegendaryEcho).length;

                  // Track last action user when NOT in popout mode
                  if (!isPopoutWindow && setLastActionUserId) {
                    const willBeUsed = !token.actions[legendaryTurnIndex];
                    if (willBeUsed) {
                      // For legendary, store with echo index so we point to the right echo card
                      setLastActionUserId(`${itemId}-echo-${legendaryTurnIndex}`);
                    }
                  }

                  handleAction(
                    MESSAGE_TYPES.ACTION_TOGGLE,
                    { tokenId: itemId, actionIndex: legendaryTurnIndex },
                    () => tokenManager.toggleAction(itemId, legendaryTurnIndex)
                  );
                }}
                className={`w-12 sm:w-20 h-8 rounded transition-colors flex items-center justify-center ${
                  token.actions[
                    displayTurnOrder
                      .slice(0, index)
                      .filter(i => i.id === itemId && i.isLegendaryEcho).length
                  ]
                    ? 'bg-button-muted-hover'
                    : 'bg-secondary hover:bg-secondary-hover'
                }`}
                title="Complete Legendary Action"
              >
                {token.actions[
                  displayTurnOrder
                    .slice(0, index)
                    .filter(i => i.id === itemId && i.isLegendaryEcho).length
                ] ? (
                  <X size={14} className="mx-auto" />
                ) : (
                  <Sword size={14} className="mx-auto" />
                )}
              </button>
            )}
            {!isLegendaryEcho && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleConditions();
                }}
                className={`${
                  token.conditions && token.conditions.length > 0
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
                      { tokenId: itemId, newWounds },
                      () => tokenManager.updateWounds(itemId, newWounds)
                    );
                  }}
                  className={`rounded-full border transition-all flex items-center justify-center ${
                    (token.wounds || 0) >= woundNum
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

        {/* Expanded Conditions Panel */}
        {isExpanded && (
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
                        { tokenId: itemId },
                        () => tokenManager.toggleTempHP(itemId)
                      );
                    }}
                    className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${
                      token.showTempHP
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
                            { tokenId: itemId, newWounds },
                            () => tokenManager.updateWounds(itemId, newWounds)
                          );
                        }}
                        className={`rounded-full border transition-all flex items-center justify-center ${
                          (token.wounds || 0) >= woundNum
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
                      const updates = {
                        maxWounds: newMax,
                        wounds: Math.min(token.wounds || 0, newMax)
                      };
                      handleAction(
                        MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE,
                        { tokenId: itemId, updates },
                        () => tokenManager.updateTokenResource(itemId, updates)
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-12 bg-button-muted text-center rounded px-1 py-0.5 text-xs"
                    title="Maximum wounds"
                  />
                </div>
              </div>
            )}

            {/* Resources - for any token with resources */}
            {(token.resources || []).length > 0 && (
              <div className="mb-3">
                <label className="text-xs text-text-muted block mb-2">Resources</label>
                {(token.resources || []).map((resource, resIdx) => (
                  <div key={resIdx} className="flex gap-2 justify-center items-center mb-2">
                    <span className="text-xs text-text-muted w-16 truncate">{resource.name}</span>
                    <input
                      type="number"
                      min="0"
                      max={resource.max || 0}
                      value={resource.current || 0}
                      onChange={(e) => {
                        const newCurrent = Math.max(0, Math.min(parseInt(e.target.value) || 0, resource.max || 0));
                        const newResources = [...(token.resources || [])];
                        newResources[resIdx] = { ...newResources[resIdx], current: newCurrent };
                        const updates = { resources: newResources };
                        handleAction(
                          MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE,
                          { tokenId: itemId, updates },
                          () => tokenManager.updateTokenResource(itemId, updates)
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 bg-button-muted text-center rounded px-2 py-1 text-sm"
                      style={{ borderColor: resource.color, borderWidth: '2px' }}
                    />
                    <span className="text-xs text-text-muted">/</span>
                    <input
                      type="number"
                      min="0"
                      value={resource.max || 0}
                      onChange={(e) => {
                        const newMax = Math.max(0, parseInt(e.target.value) || 0);
                        const newResources = [...(token.resources || [])];
                        newResources[resIdx] = {
                          ...newResources[resIdx],
                          max: newMax,
                          current: Math.min(newResources[resIdx].current || 0, newMax)
                        };
                        const updates = { resources: newResources };
                        handleAction(
                          MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE,
                          { tokenId: itemId, updates },
                          () => tokenManager.updateTokenResource(itemId, updates)
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 bg-button-muted text-center rounded px-2 py-1 text-sm"
                      style={{ borderColor: resource.color, borderWidth: '2px' }}
                    />
                  </div>
                ))}
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
                        { tokenId: itemId },
                        () => tokenManager.toggleHealthInViewport(itemId)
                      );
                    }}
                    className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${
                      token.showHealthInViewport
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
                      { tokenId: itemId },
                      () => tokenManager.toggleTempHP(itemId)
                    );
                  }}
                  className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${
                    token.showTempHP
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
                        { tokenId: itemId, condition },
                        () => tokenManager.toggleCondition(itemId, condition)
                      );
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      token.conditions && token.conditions.includes(condition)
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
                        { tokenId: itemId, condition },
                        () => tokenManager.toggleCondition(itemId, condition)
                      );
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      token.conditions && token.conditions.includes(condition)
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
                        { tokenId: itemId, condition },
                        () => tokenManager.toggleCondition(itemId, condition)
                      );
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      token.conditions && token.conditions.includes(condition)
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
                        { tokenId: itemId, size: null },
                        () => tokenManager.updateTokenSize(itemId, null)
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
                      { tokenId: itemId, size },
                      () => tokenManager.updateTokenSize(itemId, size)
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

        {/* Actions */}
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
                        { tokenId: itemId },
                        () => tokenManager.endTurn(itemId)
                      );
                    } else {
                      handleAction(
                        MESSAGE_TYPES.START_TURN,
                        { tokenId: itemId },
                        () => tokenManager.startTurn(itemId)
                      );
                    }
                  }}
                  onMouseEnter={() => setHoveredTurnButton && setHoveredTurnButton(itemId)}
                  onMouseLeave={() => setHoveredTurnButton && setHoveredTurnButton(null)}
                  className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${
                    token.isActiveTurn
                      ? 'bg-primary hover:bg-primary-hover text-white'
                      : 'bg-button-muted hover:bg-button-muted-hover'
                  }`}
                >
                  {token.isActiveTurn ? (hoveredTurnButton === itemId ? 'End Turn' : '★ Active Turn ★') : 'Start Turn'}
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
                          setLastActionUserId(itemId);
                        }
                      }

                      handleAction(
                        MESSAGE_TYPES.ACTION_TOGGLE,
                        { tokenId: itemId, actionIndex },
                        () => tokenManager.toggleAction(itemId, actionIndex)
                      );
                    }}
                    className={`flex-1 h-8 rounded transition-colors ${
                      used
                        ? 'bg-button-muted-hover'
                        : token.isActiveTurn
                        ? 'bg-secondary hover:bg-secondary-hover'
                        : token.type === 'enemy'
                        ? 'bg-secondary hover:bg-secondary-hover'
                        : 'bg-secondary hover:bg-secondary-hover'
                    }`}
                  >
                    {used ? (
                      (reactionStates[`${itemId}-${actionIndex}`] || (token.type === 'hero' && !token.isActiveTurn)) ? (
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
};

// Memoize with custom comparison to prevent unnecessary re-renders
export default React.memo(TokenCard, (prevProps, nextProps) => {
  // Re-render if any of these props change
  return (
    prevProps.token === nextProps.token &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.deleteMode === nextProps.deleteMode &&
    prevProps.lastActionUserId === nextProps.lastActionUserId &&
    prevProps.tokenSize === nextProps.tokenSize &&
    prevProps.hoveredTurnButton === nextProps.hoveredTurnButton &&
    prevProps.reactionStates === nextProps.reactionStates &&
    prevProps.draggable === nextProps.draggable
  );
});
