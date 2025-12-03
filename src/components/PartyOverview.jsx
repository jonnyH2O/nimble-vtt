import React from 'react';
import { CONDITION_EMOJIS } from '../effects/conditionEffects';


/**
 * PartyOverview Component
 *
 * Shows all hero/companion status when no token is selected in DM View.
 * Displays health bars, wounds, and conditions for the party.
 *
 * @param {Object} props
 * @param {Array} props.tokens - Array of hero/companion tokens to display
 */
export function PartyOverview({ tokens }) {
  return (
    <div
      className="absolute left-4 top-1/4 bg-gray-800/95 border-2 border-gray-600 rounded-lg p-4 shadow-2xl"
      style={{ zIndex: 50, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
    >
      <h2 className="text-lg font-bold mb-3 text-center">Party Status</h2>


      <div className="space-y-3">
        {tokens.map(token => {
          const healthPercent = token.maxHealth > 0 ? (token.health / token.maxHealth) * 100 : 0;
          const healthColor = healthPercent <= 10 ? '#ef4444' : healthPercent <= 30 ? '#eab308' : '#22c55e';


          return (
            <div key={token.id} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
              {/* Token Name & Type Icon */}
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm">{token.name}</div>
                <div className={token.type === 'hero' ? 'text-blue-400' : 'text-green-400'}>
                  {token.type === 'hero' ? '⚔️' : '🐾'}
                </div>
              </div>


              {/* Health Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>HP</span>
                  <span>{token.health}/{token.maxHealth}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${healthPercent}%`, backgroundColor: healthColor }}
                  />
                </div>
              </div>


              {/* Temp HP */}
              {token.tempHP > 0 && (
                <div className="text-xs text-cyan-400 mb-2">
                  🛡️ Temp HP: {token.tempHP}
                </div>
              )}


              {/* Wounds - only show when at 0 HP */}
              {token.health === 0 && token.wounds > 0 && (
                <div className="text-xs text-red-400 mb-2">
                  🩹 Wounds: {token.wounds}/{token.maxWounds || 6}
                </div>
              )}


              {/* Conditions */}
              {token.conditions && token.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {token.conditions.map(condition => (
                    <span
                      key={condition}
                      className="text-lg"
                      title={condition}
                    >
                      {CONDITION_EMOJIS[condition] || '❓'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
