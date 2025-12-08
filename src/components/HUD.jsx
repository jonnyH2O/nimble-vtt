import React from 'react';
import { Users, Heart, Swords, Crown } from 'lucide-react';
import { CONDITION_EMOJIS } from '../effects/conditionEffects';
import { getHealthColor, getHealthPercent, getResourcePercent, getTokenBorderColor, getTokenBgColor } from '../utils/tokenUtils';

/**
 * HUD Component - Heads-Up Display for selected token
 *
 * Displays character status including portrait, health bar, resource bar, and wounds.
 *
 * @param {Object} props
 * @param {string|null} props.selectedToken - ID of the currently selected token
 * @param {Array} props.tokens - Array of all tokens
 * @param {number} props.HUD_Z_INDEX - Z-index for the HUD positioning
 */
export function HUDDisplay({ selectedToken, tokens, HUD_Z_INDEX }) {
  if (!selectedToken) return null;

  const token = tokens.find(t => t.id === selectedToken);
  if (!token) return null;

  const healthPercent = getHealthPercent(token.health, token.maxHealth);
  const resourcePercent = getResourcePercent(token.currentResource, token.maxResource);

  const portraitSize = 80;
  const barHeight = 20;
  const barWidth = 300;
  const resourceBarWidth = token.hasResource ? 250 : 0;

  return (
    <div className="absolute top-4 left-4 pointer-events-none" style={{ width: `${portraitSize + barWidth + 20}px`, zIndex: HUD_Z_INDEX }}>
      <div className="relative flex items-start gap-3">
        {/* Circular Portrait Frame */}
        <div
          className={`relative rounded-full border-4 ${getTokenBorderColor(token.type)} ${getTokenBgColor(token.type)} overflow-hidden flex-shrink-0`}
          style={{
            width: `${portraitSize}px`,
            height: `${portraitSize}px`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          {token.image ? (
            <img src={token.image} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${getTokenBgColor(token.type)}`}>
              {token.type === 'hero' && <Users size={40} />}
              {token.type === 'companion' && <Heart size={40} />}
              {token.type === 'enemy' && <Swords size={40} />}
              {token.type === 'legendary' && <Crown size={40} />}
            </div>
          )}
        </div>

        {/* Bars and Info */}
        <div className="flex-1" style={{ paddingTop: '2px' }}>
          {/* Player Name and Conditions */}
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white font-bold text-base drop-shadow-lg">{token.name}</div>
            {token.conditions && token.conditions.length > 0 && (
              <div className="flex gap-1">
                {token.conditions.map((condition, idx) => (
                  <span key={idx} className="text-base drop-shadow-lg" title={condition}>
                    {CONDITION_EMOJIS[condition] || ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Health Bar - always show for heroes/companions, conditional for enemies/legendary */}
          {(token.type === 'hero' || token.type === 'companion' || token.showHealthInViewport) && (
            <div className="mb-1 relative">
              {/* Temp HP "bubble" highlight */}
              {token.tempHP > 0 && (
                <div
                  className="absolute rounded-full animate-pulse"
                  style={{
                    top: '-4px',
                    left: '-4px',
                    width: `${barWidth + 8}px`,
                    height: `${barHeight + 8}px`,
                    border: '3px solid #06b6d4',
                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.6), inset 0 0 8px rgba(6, 182, 212, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                />
              )}
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: `${barWidth}px`,
                  height: `${barHeight}px`,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  zIndex: 2
                }}
              >
                {/* Health fill with smooth transition */}
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${getHealthColor(healthPercent)}`}
                  style={{
                    width: `${healthPercent}%`,
                    // backgroundColor: 'green',
                    boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`
                  }}
                />
                {/* HP Text */}
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  {token.tempHP > 0 && (
                    <span className="text-primary text-xs font-bold drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      {token.tempHP} THP
                    </span>
                  )}
                  <span className="text-white text-xs font-bold drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {token.health} / {token.maxHealth} HP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resource Bar - always show for heroes/companions, conditional for enemies/legendary */}
          {(token.type === 'hero' || token.type === 'companion' || token.showHealthInViewport) && token.hasResource && (
            <div className="mb-1">
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: `${resourceBarWidth}px`,
                  height: `${barHeight - 4}px`,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}
              >
                {/* Resource fill with smooth transition */}
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${resourcePercent}%`,
                    backgroundColor: token.resourceColor || '#3b82f6',
                    boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`
                  }}
                />
                {/* Resource Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {token.currentResource} / {token.maxResource} {token.resourceName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Wounds Display - only for heroes/companions at 0 HP or always show if has wounds */}
          {(token.type === 'hero' || token.type === 'companion') && (
            <div className="flex gap-1 mt-1">
              {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                const hasWound = (token.wounds || 0) >= woundNum;
                return (
                  <div
                    key={woundNum}
                    className="relative rounded-full transition-all duration-200"
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px dotted rgba(255,255,255,0.5)',
                      backgroundColor: hasWound ? '#ef4444' : 'transparent',
                      boxShadow: hasWound ? '0 0 4px rgba(239, 68, 68, 0.6), inset 0 1px 2px rgba(255,255,255,0.3)' : 'none'
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * NotesPanel Component - Editable notes for selected token
 *
 * Displays a textarea for editing notes associated with the selected token.
 *
 * @param {Object} props
 * @param {string|null} props.selectedToken - ID of the currently selected token
 * @param {Array} props.tokens - Array of all tokens
 * @param {Function} props.updateNotes - Callback to update token notes (tokenId, newNotes)
 */
export function NotesPanel({ selectedToken, tokens, updateNotes }) {
  if (!selectedToken) return null;

  const token = tokens.find(t => t.id === selectedToken);
  if (!token) return null;

  return (
    <div className="border-t border-border bg-surface p-4">
      <h3 className="text-sm font-bold mb-2">
        {token.name} - Notes
      </h3>
      <textarea
        value={token.notes}
        onChange={(e) => updateNotes(selectedToken, e.target.value)}
        placeholder="Track resources, conditions, etc..."
        className="w-full bg-surface-highlight rounded px-3 py-2 text-sm resize-none"
        rows={4}
      />
    </div>
  );
}
