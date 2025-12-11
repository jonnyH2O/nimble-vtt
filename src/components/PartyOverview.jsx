import React from 'react';
import { CONDITION_EMOJIS } from '../effects/conditionEffects';
import { getHealthColor, getHealthPercent, getResourcePercent, getTokenBorderColor } from '../utils/tokenUtils';


/**
 * PartyOverview Component
 *
 * Modern, minimalist party status UI with slanted bars and circular portraits.
 * Shows all hero/companion status when no token is selected in DM View.
 *
 * @param {Object} props
 * @param {Array} props.tokens - Array of hero/companion tokens to display
 */
export function PartyOverview({ tokens }) {
  // Separate and sort tokens: companions first, then heroes
  const sortedTokens = [...tokens].sort((a, b) => {
    if (a.type === 'companion' && b.type !== 'companion') return -1;
    if (a.type !== 'companion' && b.type === 'companion') return 1;
    return 0;
  });

  return (
    <div
      className="absolute left-4 bottom-4"
      style={{ zIndex: 50 }}
    >
      {/* Vertical stack of character cards */}
      <div className="flex flex-col gap-2">
        {sortedTokens.map(token => {
          const healthPercent = getHealthPercent(token.health, token.maxHealth);
          const resourcePercent = token.hasResource
            ? getResourcePercent(token.currentResource, token.maxResource)
            : 0;

          // Get health color classes
          const healthColorClass = getHealthColor(healthPercent);

          // Limit conditions to 6 max
          const conditions = (token.conditions || []).slice(0, 6);

          // Scale factor: companions are 70% size of heroes
          const isCompanion = token.type === 'companion';
          const scale = isCompanion ? 0.5 : 0.75;

          return (
            <div
              key={token.id}
              className="relative flex items-center"
              style={{
                height: `${150 * scale}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'left center',
                width: `${100 / scale}%`,
              }}
            >
              {/* Character Portrait - Large circle on the LEFT */}
              <div className="relative flex-shrink-0" style={{ zIndex: 2 }}>
                <div
                  className={`rounded-full overflow-hidden border-4 ${getTokenBorderColor(token.type)}`}
                  style={{
                    width: '140px',
                    height: '140px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {token.image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={token.image}
                        alt={token.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Glossy overlay effect */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(ellipse at 40% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl font-bold"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      {token.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Bars and Stats Container - Everything to the RIGHT of portrait */}
              <div className="relative ml-[-60px] mt-[70px]" style={{ zIndex: 1, minWidth: '280px' }}>
                {/* HP BAR with slant */}
                <div className="relative mb-1" style={{ zIndex: 2 }}>
                  {/* HP Number - LARGE, to the left of bar */}
                  <div
                    className="absolute font-bold"
                    style={{
                      fontSize: '46px',
                      color: 'var(--color-text)',
                      textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)',
                      left: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 3,
                    }}
                  >
                    {token.health}
                  </div>

                  {/* HP Bar Container - Slanted */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: '240px',
                      height: '36px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transform: 'skewY(8deg)',
                      marginLeft: '50px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                      zIndex: 2,
                      borderRadius: '0 50px 50px 0',
                    }}
                  >
                    {/* HP Fill */}
                    <div
                      className={`h-full transition-all duration-300 ${healthColorClass}`}
                      style={{
                        width: `${healthPercent}%`,
                        borderRadius: '0 50px 50px 0',
                        boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                  </div>
                </div>

                {/* RESOURCE BAR (if token has resource) */}
                {token.hasResource && (
                  <div className="relative" style={{ marginTop: '-10px' }}>
                    {/* Resource Number - Smaller, to the left of bar */}
                    <div
                      className="absolute font-bold"
                      style={{
                        fontSize: '24px',
                        color: 'var(--color-text)',
                        textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 0,
                      }}
                    >
                      {token.currentResource}
                    </div>

                    {/* Resource Bar Container - Slanted, thinner, shorter */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: '200px',
                        height: '15px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        transform: 'skewY(8deg)',
                        marginLeft: '50px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                        borderRadius: '0 50px 50px 0',
                      }}
                    >
                      {/* Resource Fill */}
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${resourcePercent}%`,
                          backgroundColor: token.resourceColor || '#3b82f6',
                          borderRadius: '0 50px 50px 0',
                          boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STATUS CONDITIONS - Yellow circles to the RIGHT and UP */}
                {conditions.length > 0 && (
                  <div
                    className="absolute flex gap-1.5"
                    style={{
                      right: '0px',
                      top: '-10px',
                      transform: 'skewY(8deg)',
                    }}
                  >
                    {conditions.map((condition, index) => (
                      <div
                        key={`${condition}-${index}`}
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: '25px',
                          height: '25px',
                          backgroundColor: '#fbbf24',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                          fontSize: '11px',
                        }}
                        title={condition}
                      >
                        {CONDITION_EMOJIS[condition] || '❓'}
                      </div>
                    ))}
                  </div>
                )}

                {/* WOUNDS - Dots BELOW resource bar */}
                <div
                  className="flex gap-1"
                  style={{
                    marginLeft: '50px',
                    marginTop: '8px',
                    transform: 'skewY(8deg)',
                    minHeight: '14px',
                  }}
                >
                  {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                    const hasWound = (token.wounds || 0) >= woundNum;
                    return (
                      <div
                        key={woundNum}
                        className="rounded-full transition-all duration-200"
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px dotted rgba(255, 255, 255, 0.5)',
                          backgroundColor: hasWound ? '#ef4444' : 'transparent',
                          boxShadow: hasWound ? '0 0 4px rgba(239, 68, 68, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)' : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
