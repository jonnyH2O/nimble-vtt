import React from 'react';
import { Dices } from 'lucide-react';

/**
 * DiceRoller Component
 *
 * Renders a dice rolling menu and displays dice roll results with animations.
 *
 * @param {Object} props
 * @param {boolean} props.showDiceMenu - Controls visibility of the dice menu popup
 * @param {Function} props.setShowDiceMenu - Toggles the dice menu visibility
 * @param {number} props.diceCount - Number of dice to roll (1-20)
 * @param {Function} props.setDiceCount - Sets the number of dice to roll
 * @param {Function} props.rollDice - Function to roll dice, takes dice type (4, 6, 8, 10, 12, 20)
 * @param {Array} props.rollingDice - Array of currently rolling dice animations
 * @param {Array} props.diceRolls - Array of dice roll results to display
 */
export default function DiceRoller({
  showDiceMenu,
  setShowDiceMenu,
  diceCount,
  setDiceCount,
  rollDice,
  rollingDice,
  diceRolls,
  hideButton = false // New prop to hide the toggle button
}) {
  return (
    <>
      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes spinSlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(13320deg);
          }
        }
        .dice-spin {
          animation: spinSlow 2.5s cubic-bezier(0.17, 0.67, 0.35, 0.98) forwards;
        }
        .dice-pop {
          animation: pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .dice-fade {
          animation: fadeOut 3s ease-out forwards;
        }
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>

      {/* Dice Menu Toggle Button - Hidden when hideButton is true */}
      {!hideButton && (
        <button
          onClick={() => setShowDiceMenu(!showDiceMenu)}
          className="bg-purple-600 hover:bg-purple-700 p-2 rounded flex items-center justify-center relative"
        >
          <Dices size={20} />
        </button>
      )}

      {/* Dice Menu Popup */}
      {showDiceMenu && (
        <div className="absolute right-80 top-12 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-[100] w-64">
          <h3 className="text-sm font-bold mb-3">Roll Dice</h3>

          <div className="mb-4">
            <label className="text-sm block mb-2">Number of Dice</label>
            <input
              type="number"
              min="1"
              max="20"
              value={diceCount}
              onChange={(e) => setDiceCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full bg-gray-700 px-3 py-2 rounded text-center"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => rollDice(4)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
            >
              d4
            </button>
            <button
              onClick={() => rollDice(6)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
            >
              d6
            </button>
            <button
              onClick={() => rollDice(8)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
            >
              d8
            </button>
            <button
              onClick={() => rollDice(10)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
            >
              d10
            </button>
            <button
              onClick={() => rollDice(12)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
            >
              d12
            </button>
            <button
              onClick={() => rollDice(20)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
            >
              d20
            </button>
          </div>
        </div>
      )}

      {/* Dice Results Display - Floating Animations */}
      {(rollingDice.length > 0 || diceRolls.length > 0) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
          {[...rollingDice.map(r => ({ ...r, type: 'rolling' })), ...diceRolls.map(r => ({ ...r, type: 'result' }))]
            .sort((a, b) => b.id - a.id)
            .map((item) =>
              item.type === 'rolling' ? (
                <div
                  key={`rolling-${item.id}`}
                  className="bg-purple-600 text-white px-8 py-6 rounded-lg shadow-2xl border-4 border-purple-400 transition-all duration-300"
                >
                  <div key={item.id} className="text-center dice-spin">
                    <div className="text-6xl">🎲</div>
                  </div>
                </div>
              ) : (
                <div
                  key={`result-${item.id}`}
                  className={`bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl border-4 border-green-400 transition-all duration-300 ${
                    item.fading ? 'dice-fade' : 'dice-pop'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold mb-1">{item.dice}</div>
                    <div className="text-3xl font-bold">{item.total}</div>
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
    </>
  );
}
