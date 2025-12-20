import { Dices, X } from 'lucide-react';

/**
 * DiceRoller Component
 *
 * Renders a dice rolling menu and displays dice roll results with animations.
 *
 * @param {Object} props
 * @param {boolean} props.showDiceMenu - Controls visibility of the dice menu popup
 * @param {Function} props.setShowDiceMenu - Toggles the dice menu visibility
 * @param {string} props.diceNotation - Dice notation string (e.g., "1d6, 2d8")
 * @param {Function} props.setDiceNotation - Sets the dice notation
 * @param {string} props.notationError - Error message for invalid notation
 * @param {Function} props.rollDice - Function to roll dice based on notation
 * @param {Function} props.addOrIncrementDie - Function to add/increment dice in notation
 * @param {Function} props.clearNotation - Function to clear the notation field
 * @param {Array} props.rollingDice - Array of currently rolling dice animations
 * @param {Array} props.diceRolls - Array of dice roll results to display
 */
export default function DiceRoller({
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
  hideButton = false // New prop to hide the toggle button
}) {
  const handleDiceButtonClick = (sides, event) => {
    event.preventDefault();

    if (event.button === 0) {
      // Left click - increment
      addOrIncrementDie(sides, 1);
    } else if (event.button === 2) {
      // Right click - decrement
      addOrIncrementDie(sides, -1);
    }
  };

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
          className="bg-primary hover:bg-primary-hover p-2 rounded flex items-center justify-center relative"
        >
          <Dices size={20} />
        </button>
      )}

      {/* Dice Menu Popup */}
      {showDiceMenu && (
        <div className="dice-roller-container absolute right-80 top-12 bg-surface border border-border rounded-lg p-4 shadow-lg z-[100] w-64">
          <h3 className="text-sm font-bold mb-3">Roll Dice</h3>

          <div className="mb-4">
            <label className="text-sm block mb-2">Dice Notation</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={diceNotation}
                onChange={(e) => setDiceNotation(e.target.value)}
                placeholder="Ex: 1d6, 2d8, 1d20"
                className="flex-1 bg-surface-highlight px-3 py-2 rounded text-sm"
              />
              <button
                onClick={clearNotation}
                className="bg-button-muted hover:bg-button-muted-hover px-2 rounded"
                title="Clear notation"
              >
                <X size={14} />
              </button>
            </div>
            {notationError && (
              <div className="text-xs text-destructive mt-1">{notationError}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={(e) => handleDiceButtonClick(4, e)}
              onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(4, { button: 2, preventDefault: () => {} }); }}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded font-bold border-2 border-primary-hover"
            >
              d4
            </button>
            <button
              onClick={(e) => handleDiceButtonClick(6, e)}
              onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(6, { button: 2, preventDefault: () => {} }); }}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded font-bold border-2 border-primary-hover"
            >
              d6
            </button>
            <button
              onClick={(e) => handleDiceButtonClick(8, e)}
              onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(8, { button: 2, preventDefault: () => {} }); }}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded font-bold border-2 border-primary-hover"
            >
              d8
            </button>
            <button
              onClick={(e) => handleDiceButtonClick(10, e)}
              onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(10, { button: 2, preventDefault: () => {} }); }}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded font-bold border-2 border-primary-hover"
            >
              d10
            </button>
            <button
              onClick={(e) => handleDiceButtonClick(12, e)}
              onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(12, { button: 2, preventDefault: () => {} }); }}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded font-bold border-2 border-primary-hover"
            >
              d12
            </button>
            <button
              onClick={(e) => handleDiceButtonClick(20, e)}
              onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(20, { button: 2, preventDefault: () => {} }); }}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded font-bold border-2 border-primary-hover"
            >
              d20
            </button>
          </div>

          <button
            onClick={(e) => handleDiceButtonClick(100, e)}
            onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(100, { button: 2, preventDefault: () => {} }); }}
            className="w-full bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold text-lg border-2 border-primary-hover mb-2"
          >
            d100
          </button>

          <button
            onClick={rollDice}
            disabled={!diceNotation.trim()}
            className="w-full bg-secondary hover:bg-secondary-hover px-4 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Roll Dice
          </button>
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
                  className="bg-primary text-text px-8 py-6 rounded-lg shadow-2xl border-4 border-primary-hover transition-all duration-300"
                >
                  <div key={item.id} className="text-center dice-spin">
                    <div className="text-6xl">🎲</div>
                  </div>
                </div>
              ) : (
                <div
                  key={`result-${item.id}`}
                  className={`bg-secondary text-text px-6 py-4 rounded-lg shadow-2xl border-4 border-secondary-hover transition-all duration-300 ${item.fading ? 'dice-fade' : 'dice-pop'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold mb-1">{item.dice}</div>
                    <div className="text-3xl font-bold">{item.total}</div>
                    {item.rollResults && item.rollResults.length > 0 && (
                      <div className="text-xs mt-2 space-y-1">
                        {item.rollResults.map((result, idx) => (
                          <div key={idx} className="opacity-80">
                            {result.notation}: {result.subtotal} [{result.rolls.join(', ')}]
                          </div>
                        ))}
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
