import React from 'react';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';
import { X } from 'lucide-react';

export function DMToolsDice({
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
    isPopoutWindow,
    onAction
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
        <div className="p-4">
            {/* Dice Roller View */}
            <h2 className="text-xl font-bold mb-4">Dice Roller</h2>

            <div className="text-xs text-text-muted mb-4 italic">
                Roll dice using standard notation.
            </div>

            <div className="mb-4">
                <label className="text-sm block mb-2">Dice Notation</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={diceNotation}
                        onChange={(e) => setDiceNotation(e.target.value)}
                        placeholder="Ex: 1d6, 2d8, 1d20"
                        className="flex-1 bg-surface-highlight px-3 py-2 rounded"
                    />
                    <button
                        onClick={clearNotation}
                        className="bg-button-muted hover:bg-button-muted-hover px-3 py-2 rounded"
                        title="Clear notation"
                    >
                        <X size={16} />
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
                    className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold border-2 border-primary-hover"
                >
                    d4
                </button>
                <button
                    onClick={(e) => handleDiceButtonClick(6, e)}
                    onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(6, { button: 2, preventDefault: () => {} }); }}
                    className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold border-2 border-primary-hover"
                >
                    d6
                </button>
                <button
                    onClick={(e) => handleDiceButtonClick(8, e)}
                    onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(8, { button: 2, preventDefault: () => {} }); }}
                    className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold border-2 border-primary-hover"
                >
                    d8
                </button>
                <button
                    onClick={(e) => handleDiceButtonClick(10, e)}
                    onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(10, { button: 2, preventDefault: () => {} }); }}
                    className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold border-2 border-primary-hover"
                >
                    d10
                </button>
                <button
                    onClick={(e) => handleDiceButtonClick(12, e)}
                    onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(12, { button: 2, preventDefault: () => {} }); }}
                    className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold border-2 border-primary-hover"
                >
                    d12
                </button>
                <button
                    onClick={(e) => handleDiceButtonClick(20, e)}
                    onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(20, { button: 2, preventDefault: () => {} }); }}
                    className="bg-primary hover:bg-primary-hover px-4 py-3 rounded font-bold border-2 border-primary-hover"
                >
                    d20
                </button>
            </div>

            <button
                onClick={(e) => handleDiceButtonClick(100, e)}
                onContextMenu={(e) => { e.preventDefault(); handleDiceButtonClick(100, { button: 2, preventDefault: () => {} }); }}
                className="w-full bg-primary hover:bg-primary-hover px-4 py-4 rounded font-bold text-lg mb-4 border-2 border-primary-hover"
            >
                d100
            </button>

            <button
                onClick={rollDice}
                disabled={!diceNotation.trim()}
                className="w-full bg-secondary hover:bg-secondary-hover px-4 py-3 rounded font-bold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Roll Dice
            </button>

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
                                        className="bg-primary text-text px-4 py-3 rounded shadow border-2 border-primary-hover"
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl">🎲</div>
                                            <div className="text-xs mt-1">Rolling...</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        key={`result-${item.id}`}
                                        className="bg-secondary text-text px-4 py-3 rounded shadow border-2 border-secondary-hover"
                                    >
                                        <div className="text-center">
                                            <div className="text-xs font-bold mb-1">{item.dice}</div>
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
            </div>
        </div>
    );
}
