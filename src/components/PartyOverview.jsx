import React, { useState, useEffect } from 'react';
import { CONDITION_EMOJIS } from '../effects/conditionEffects';
import { getHealthColor, getHealthPercent, getResourcePercent, getTokenBorderColor } from '../utils/tokenUtils';
import Tooltip from './Tooltip';


/**
 * PartyOverview Component
 *
 * Vertical stack of character status boxes on center-left side.
 * Shows all hero/companion status in Strategy Mode.
 *
 * @param {Object} props
 * @param {Array} props.tokens - Array of hero/companion tokens to display
 */
export function PartyOverview({ tokens }) {
  const [conditionIndexes, setConditionIndexes] = useState({});

  // Rotate through conditions every second and reset invalid indexes
  useEffect(() => {
    const interval = setInterval(() => {
      setConditionIndexes(prev => {
        const next = { ...prev };
        tokens.forEach(token => {
          if (token.conditions && token.conditions.length > 0) {
            const currentIndex = prev[token.id] || 0;
            // Reset index if it's out of bounds
            const validIndex = currentIndex >= token.conditions.length ? 0 : currentIndex;

            if (token.conditions.length > 1) {
              next[token.id] = (validIndex + 1) % token.conditions.length;
            } else {
              next[token.id] = 0;
            }
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tokens]);
  // Separate and sort tokens: companions first, then heroes
  const sortedTokens = [...tokens].sort((a, b) => {
    if (a.type === 'companion' && b.type !== 'companion') return -1;
    if (a.type !== 'companion' && b.type === 'companion') return 1;
    return 0;
  });

  return (
    <div
      className="absolute left-4 top-1/2 transform -translate-y-1/2"
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

          // Scale factor: companions are smaller than heroes
          const isCompanion = token.type === 'companion';
          const scale = isCompanion ? 1 : 1;

          // Build tooltip text
          const tooltipLines = [];
          tooltipLines.push(`${token.name}`);
          tooltipLines.push(`Health: ${token.health}/${token.maxHealth}`);
          if (token.hasResource) {
            const resourceName = token.resourceName || 'Resource';
            tooltipLines.push(`${resourceName}: ${token.currentResource}/${token.maxResource}`);
          }
          tooltipLines.push(`Wounds: ${token.wounds || 0}/${token.maxWounds || 6}`);
          if (conditions.length > 0) {
            tooltipLines.push(`Conditions: ${conditions.join(', ')}`);
          }
          const tooltipText = tooltipLines.join('\n');

          return (
            <Tooltip key={token.id} text={tooltipText} position="right" wrap={true} maxWidth="250px">
              <div
                className="bg-surface border-2 border-border rounded-lg flex flex-col items-center gap-1.5"
                style={{
                  width: '70px',
                  padding: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  transform: `scale(${scale})`,
                  transformOrigin: 'left center',
                }}
              >
              {/* Circular Portrait */}
              <div className="relative flex-shrink-0">
                <div
                  className={`rounded-full overflow-hidden border-2 ${getTokenBorderColor(token.type)}`}
                  style={{
                    width: '50px',
                    height: '50px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
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
                      className="w-full h-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      {token.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Status Conditions - Single rotating circle at top-right of portrait */}
                {conditions.length > 0 && (() => {
                  const currentIndex = conditionIndexes[token.id] || 0;
                  const validIndex = currentIndex >= conditions.length ? 0 : currentIndex;
                  const currentCondition = conditions[validIndex];

                  return (
                    <div
                      className="absolute flex items-center justify-center rounded-full transition-opacity duration-300"
                      style={{
                        right: '-2px',
                        top: '0px',
                        width: '16px',
                        height: '16px',
                        backgroundColor: '#fbbf24',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                        fontSize: '9px',
                      }}
                      title={conditions.join(', ')}
                    >
                      {CONDITION_EMOJIS[currentCondition] || '❓'}
                    </div>
                  );
                })()}
              </div>

              {/* Health Bar */}
              <div className="flex flex-col gap-0.5" style={{ width: '50px' }}>
                <div
                  className="w-full relative overflow-hidden rounded-full"
                  style={{
                    height: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div
                    className={`h-full transition-all duration-300 ${healthColorClass}`}
                    style={{
                      width: `${healthPercent}%`,
                      borderRadius: '9999px',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    }}
                  />
                </div>

                {/* Resource Bar (if token has resource) */}
                {token.hasResource && (
                  <div
                    className="w-full relative overflow-hidden rounded-full"
                    style={{
                      height: '5px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${resourcePercent}%`,
                        backgroundColor: token.resourceColor || '#3b82f6',
                        borderRadius: '9999px',
                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Wounds - Small circles */}
              <div className="flex gap-0.5 justify-center flex-wrap" style={{ minHeight: '8px', maxWidth: '50px' }}>
                {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                  const hasWound = (token.wounds || 0) >= woundNum;
                  return (
                    <div
                      key={woundNum}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: '6px',
                        height: '6px',
                        border: '1px dotted rgba(255, 255, 255, 0.5)',
                        backgroundColor: hasWound ? '#ef4444' : 'transparent',
                        boxShadow: hasWound ? '0 0 2px rgba(239, 68, 68, 0.6)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
