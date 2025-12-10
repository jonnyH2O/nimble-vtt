import React from 'react';
import { MESSAGE_TYPES, createMessage } from '../utils/windowMessages';

export function DMToolsDice({
    diceCount,
    setDiceCount,
    rollDice,
    rollingDice,
    diceRolls,
    showDiceInViewport,
    setShowDiceInViewport,
    isPopoutWindow,
    onAction
}) {
    return (
        <div className="p-4">
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
        </div>
    );
}
