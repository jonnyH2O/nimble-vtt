import React, { useRef } from 'react';
import { Upload, Plus } from 'lucide-react';
import ColorPicker from './ColorPicker';

export function DMToolsSettings({
    isPopoutWindow,
    shouldShowAddToken, // Renamed to avoid confusion with internal state if needed, but keeping simple for now
    setShowAddToken,
    showAddToken,       // Passing current boolean state
    newToken,
    setNewToken,
    handleAddToken,
    handleTokenImageUpload,
    tokenSize,
    setTokenSize,
    backgroundSize,
    setBackgroundSize,
    showPartyOverview,
    setShowPartyOverview,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    darknessMode,
    setDarknessMode,
    heroLightRadius,
    setHeroLightRadius,
    companionLightRadius,
    setCompanionLightRadius,
    darknessIntensity,
    setDarknessIntensity,
    currentTheme,
    setCurrentTheme,
    importBattle,
    exportBattle,
    handleBackgroundUpload
}) {
    const fileInputRef = useRef(null);

    return (
        <div className="p-4">
            {/* Settings View */}
            <h2 className="text-xl font-bold mb-4">Settings</h2>

            <div className="space-y-4">
                {/* Background and Add Token Buttons */}
                <div className="flex gap-2">
                    <label className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                        ? 'bg-button-muted text-text-muted cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-hover cursor-pointer'
                        }`}>
                        <Upload size={16} />
                        Background
                        {!isPopoutWindow && <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />}
                    </label>
                    <button
                        onClick={() => !isPopoutWindow && setShowAddToken(!showAddToken)}
                        disabled={isPopoutWindow}
                        className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                            ? 'bg-button-muted text-text-muted cursor-not-allowed'
                            : showAddToken
                                ? 'bg-tertiary hover:bg-tertiary-hover'
                                : 'bg-secondary hover:bg-secondary-hover'
                            }`}
                    >
                        <Plus size={16} />
                        {showAddToken ? 'Cancel' : 'Add Token'}
                    </button>
                </div>

                {/* Add Token Form - Inline */}
                {showAddToken && (
                    <div className="bg-surface-highlight border border-border rounded-lg p-4 space-y-3">
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

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newToken.hasResource}
                                    onChange={(e) => setNewToken({ ...newToken, hasResource: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-xs font-bold">Has Resource?</span>
                            </label>

                            {newToken.hasResource && (
                                <div className="mt-2 space-y-2 pl-6">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs mb-1">Resource Name</label>
                                            <input
                                                type="text"
                                                value={newToken.resourceName}
                                                onChange={(e) => setNewToken({ ...newToken, resourceName: e.target.value })}
                                                className="w-full bg-surface px-3 py-2 rounded text-sm"
                                                placeholder="e.g., Mana, Focus, Rage"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1">Color</label>
                                            <ColorPicker
                                                color={newToken.resourceColor}
                                                onChange={(color) => setNewToken({ ...newToken, resourceColor: color })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
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

                {/* Token Size */}
                <div>
                    <label className="text-sm block mb-2">Token Size</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="32"
                            max="128"
                            step="4"
                            value={tokenSize}
                            onChange={(e) => setTokenSize(parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm w-12 text-right">{tokenSize}px</span>
                    </div>
                </div>

                {/* Background Size */}
                <div>
                    <label className="text-sm block mb-2">Background Size</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="50"
                            max="200"
                            step="5"
                            value={backgroundSize}
                            onChange={(e) => setBackgroundSize(parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm w-12 text-right">{backgroundSize}%</span>
                    </div>
                </div>

                {/* Party Overview Toggle */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold">Show Party Overview</label>
                        <button
                            onClick={() => setShowPartyOverview(!showPartyOverview)}
                            className={`px-3 py-1 rounded text-sm ${showPartyOverview ? 'bg-secondary hover:bg-secondary-hover' : 'bg-tertiary hover:bg-tertiary-hover'
                                }`}
                        >
                            {showPartyOverview ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {/* Grid Settings */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold">Show Grid</label>
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={`px-3 py-1 rounded text-sm ${showGrid ? 'bg-secondary hover:bg-secondary-hover' : 'bg-tertiary hover:bg-tertiary-hover'
                                }`}
                        >
                            {showGrid ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    {showGrid && (
                        <div>
                            <label className="text-sm block mb-2">Grid Size</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="20"
                                    max="150"
                                    step="5"
                                    value={gridSize}
                                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-sm w-12 text-right">{gridSize}px</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Darkness Mode Settings */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold">Darkness Mode</label>
                        <button
                            onClick={() => setDarknessMode(!darknessMode)}
                            className={`px-3 py-1 rounded text-sm ${darknessMode ? 'bg-secondary hover:bg-secondary-hover' : 'bg-tertiary hover:bg-tertiary-hover'
                                }`}
                        >
                            {darknessMode ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    {darknessMode && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm block mb-2">Hero Light Radius</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        step="0.5"
                                        value={heroLightRadius}
                                        onChange={(e) => setHeroLightRadius(parseFloat(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm w-12 text-right">{heroLightRadius}x</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm block mb-2">Companion Light Radius</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        step="0.5"
                                        value={companionLightRadius}
                                        onChange={(e) => setCompanionLightRadius(parseFloat(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm w-12 text-right">{companionLightRadius}x</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm block mb-2">Darkness Intensity</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={darknessIntensity}
                                        onChange={(e) => setDarknessIntensity(parseFloat(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm w-16 text-right">{Math.round(darknessIntensity * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Selector */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold">Theme</label>
                        <select
                            value={currentTheme}
                            onChange={(e) => setCurrentTheme(e.target.value)}
                            className="bg-tertiary text-text text-sm rounded px-2 py-1 border border-gray-500"
                        >
                            <option value="default">Default</option>
                            <option value="dracula">Dracula</option>
                            <option value="retro">Retro</option>
                            <option value="hero">Hero</option>
                            <option value="aethus">Aethus</option>
                            <option value="bricklin">Bricklin</option>
                        </select>
                    </div>
                </div>

                {/* Export/Import Battle */}
                <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-bold mb-2">Import & Export</h3>
                    <div className="flex gap-2">
                        {isPopoutWindow ? (
                            <button
                                onClick={importBattle}
                                className="flex-1 bg-primary hover:bg-primary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                            >
                                Import Battle
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 bg-primary hover:bg-primary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                                >
                                    Import Battle
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={importBattle}
                                    className="hidden"
                                />
                            </>
                        )}
                        <button
                            onClick={exportBattle}
                            className="flex-1 bg-secondary hover:bg-secondary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                        >
                            Export Battle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
