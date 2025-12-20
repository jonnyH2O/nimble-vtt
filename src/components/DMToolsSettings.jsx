import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Link, X, Pencil } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ImageInputForm = ({ label, onUpload, onUrlSubmit }) => {
    const [inputType, setInputType] = useState('upload'); // 'upload' or 'url'
    const [tempUrl, setTempUrl] = useState('');

    return (
        <div className="bg-surface-highlight border border-border rounded-lg p-4 space-y-3 mb-4">
            <h3 className="text-sm font-bold mb-2">Set {label}</h3>

            <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        checked={inputType === 'upload'}
                        onChange={() => setInputType('upload')}
                        className="bg-primary"
                    />
                    <span className="text-sm">Upload</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        checked={inputType === 'url'}
                        onChange={() => setInputType('url')}
                        className="bg-primary"
                    />
                    <span className="text-sm">URL</span>
                </label>
            </div>

            {inputType === 'upload' ? (
                <label className="w-full bg-primary hover:bg-primary-hover px-3 py-2 rounded cursor-pointer text-sm flex items-center justify-center gap-2">
                    <Upload size={16} />
                    Upload Image
                    <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                </label>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 bg-surface px-3 py-2 rounded text-sm min-w-0"
                    />
                    <button
                        onClick={() => onUrlSubmit(tempUrl)}
                        disabled={!tempUrl}
                        className="bg-primary hover:bg-primary-hover px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Set
                    </button>
                </div>
            )}
        </div>
    );
};

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
    handleBackgroundUpload,
    handleAppBackgroundUpload,
    handleBackgroundUrlSubmit,
    handleAppBackgroundUrlSubmit,
    selectedTokenId,
    tokens,
    updateTokenData
}) {
    const fileInputRef = useRef(null);
    const [activeSettingsForm, setActiveSettingsForm] = useState('none'); // 'none', 'wallpaper', 'map', 'token', 'editToken'
    const [editTokenData, setEditTokenData] = useState(null);

    // Sync external showAddToken prop with internal state
    React.useEffect(() => {
        if (showAddToken) {
            setActiveSettingsForm('token');
        } else if (activeSettingsForm === 'token') {
            setActiveSettingsForm('none');
        }
    }, [showAddToken]);

    // Handle initial edit token data population
    React.useEffect(() => {
        if (activeSettingsForm === 'editToken' && selectedTokenId && tokens) {
            const token = tokens.find(t => t.id === selectedTokenId);
            if (token) {
                setEditTokenData({ ...token });
            }
        }
    }, [activeSettingsForm, selectedTokenId, tokens]);

    const handleFormToggle = (formName) => {
        if (activeSettingsForm === formName) {
            setActiveSettingsForm('none');
            if (formName === 'token') setShowAddToken(false);
        } else {
            // Pre-populate if switching to edit mode
            if (formName === 'editToken') {
                if (!selectedTokenId) return; // Should be disabled anyway
                const token = tokens.find(t => t.id === selectedTokenId);
                if (token) {
                    setEditTokenData({ ...token });
                }
            }
            setActiveSettingsForm(formName);
            if (formName === 'token') {
                setShowAddToken(true);
            } else {
                setShowAddToken(false);
            }
        }
    };

    const handleEditTokenImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEditTokenData({ ...editTokenData, image: event.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveToken = () => {
        if (editTokenData && selectedTokenId) {
            updateTokenData(selectedTokenId, {
                name: editTokenData.name,
                type: editTokenData.type,
                armor: editTokenData.armor,
                hasResource: editTokenData.hasResource,
                resourceName: editTokenData.resourceName,
                resourceColor: editTokenData.resourceColor,
                image: editTokenData.image,
                // Only update max/current if they changed, need to be careful not to overwrite current values if not editing them directly?
                // Actually the form edits state directly, so we pass back what we have.
                // However, things like health/wounds aren't in this form, so we use the spread updates.
                // But wait, the reducer does a shallow merge of updates.
                // So we only need to send the fields that can change in this form.
                maxResource: editTokenData.maxResource,
                currentResource: editTokenData.currentResource
            });
            setActiveSettingsForm('none');
        }
    };

    return (
        <div className="p-4">
            {/* Settings View */}
            <h2 className="text-xl font-bold mb-4">Settings</h2>

            <div className="space-y-4">
                {/* Background and Map Buttons */}
                <div className="flex gap-2">
                    <button
                        className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                            ? 'bg-button-muted text-text-muted cursor-not-allowed'
                            : activeSettingsForm === 'wallpaper'
                                ? 'bg-tertiary hover:bg-tertiary-hover'
                                : 'bg-secondary hover:bg-secondary-hover'
                            }`}
                        onClick={() => !isPopoutWindow && handleFormToggle('wallpaper')}
                        disabled={isPopoutWindow}
                    >
                        <Upload size={16} />
                        Wallpaper
                    </button>
                    <button
                        className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                            ? 'bg-button-muted text-text-muted cursor-not-allowed'
                            : activeSettingsForm === 'map'
                                ? 'bg-tertiary hover:bg-tertiary-hover'
                                : 'bg-secondary hover:bg-secondary-hover'
                            }`}
                        onClick={() => !isPopoutWindow && handleFormToggle('map')}
                        disabled={isPopoutWindow}
                    >
                        <Upload size={16} />
                        Map
                    </button>
                </div>

                {/* Token Buttons (Add & Edit) */}
                <div className="flex gap-2">
                    <button
                        onClick={() => !isPopoutWindow && handleFormToggle('token')}
                        disabled={isPopoutWindow}
                        className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow
                            ? 'bg-button-muted text-text-muted cursor-not-allowed'
                            : activeSettingsForm === 'token'
                                ? 'bg-tertiary hover:bg-tertiary-hover'
                                : 'bg-primary hover:bg-primary-hover'
                            }`}
                    >
                        <Plus size={16} />
                        {activeSettingsForm === 'token' ? 'Cancel' : 'Add Token'}
                    </button>
                    <button
                        onClick={() => !isPopoutWindow && selectedTokenId && handleFormToggle('editToken')}
                        disabled={isPopoutWindow || !selectedTokenId}
                        className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm ${isPopoutWindow || !selectedTokenId
                            ? 'bg-button-muted text-text-muted cursor-not-allowed opacity-50'
                            : activeSettingsForm === 'editToken'
                                ? 'bg-tertiary hover:bg-tertiary-hover'
                                : 'bg-secondary hover:bg-secondary-hover'
                            }`}
                        title={!selectedTokenId ? "Select a token to edit" : "Edit Token"}
                    >
                        <Pencil size={16} />
                        {activeSettingsForm === 'editToken' ? 'Cancel' : 'Edit Token'}
                    </button>
                </div>

                {/* Inline Forms */}
                {activeSettingsForm === 'wallpaper' && (
                    <ImageInputForm
                        label="Wallpaper"
                        onUpload={(e) => {
                            handleAppBackgroundUpload(e);
                            setActiveSettingsForm('none');
                        }}
                        onUrlSubmit={(url) => {
                            handleAppBackgroundUrlSubmit(url);
                            setActiveSettingsForm('none');
                        }}
                    />
                )}

                {activeSettingsForm === 'map' && (
                    <ImageInputForm
                        label="Battle Map"
                        onUpload={(e) => {
                            handleBackgroundUpload(e);
                            setActiveSettingsForm('none');
                        }}
                        onUrlSubmit={(url) => {
                            handleBackgroundUrlSubmit(url);
                            setActiveSettingsForm('none');
                        }}
                    />
                )}

                {/* Add Token Form - Inline */}
                {activeSettingsForm === 'token' && (
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

                        {/* Armor Option - Only for Enemy or Legendary */}
                        {(newToken.type === 'enemy' || newToken.type === 'legendary') && (
                            <div>
                                <label className="block text-xs mb-1">Armor</label>
                                <select
                                    value={newToken.armor || 'none'}
                                    onChange={(e) => setNewToken({ ...newToken, armor: e.target.value })}
                                    className="w-full bg-surface px-3 py-2 rounded text-sm"
                                >
                                    <option value="none">None</option>
                                    <option value="medium">Medium</option>
                                    <option value="heavy">Heavy</option>
                                </select>
                            </div>
                        )}

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
                                setActiveSettingsForm('none');
                                setShowAddToken(false);
                            }}
                            className="w-full bg-secondary hover:bg-secondary-hover px-3 py-2 rounded text-sm font-bold mt-2"
                        >
                            Add Token
                        </button>
                    </div>
                )}

                {/* Edit Token Form - Inline */}
                {activeSettingsForm === 'editToken' && editTokenData && (
                    <div className="bg-surface-highlight border border-border rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-bold mb-2">Edit Token</h3>

                        <div>
                            <label className="block text-xs mb-1">Name</label>
                            <input
                                type="text"
                                value={editTokenData.name}
                                onChange={(e) => setEditTokenData({ ...editTokenData, name: e.target.value })}
                                className="w-full bg-surface px-3 py-2 rounded text-sm"
                                placeholder="Token name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs mb-1">Type</label>
                            <select
                                value={editTokenData.type}
                                onChange={(e) => setEditTokenData({ ...editTokenData, type: e.target.value })}
                                className="w-full bg-surface px-3 py-2 rounded text-sm"
                            >
                                <option value="hero">Hero</option>
                                <option value="companion">Companion</option>
                                <option value="enemy">Enemy</option>
                                <option value="legendary">Legendary</option>
                            </select>
                        </div>

                        {/* Armor Option - Only for Enemy or Legendary */}
                        {(editTokenData.type === 'enemy' || editTokenData.type === 'legendary') && (
                            <div>
                                <label className="block text-xs mb-1">Armor</label>
                                <select
                                    value={editTokenData.armor || 'none'}
                                    onChange={(e) => setEditTokenData({ ...editTokenData, armor: e.target.value })}
                                    className="w-full bg-surface px-3 py-2 rounded text-sm"
                                >
                                    <option value="none">None</option>
                                    <option value="medium">Medium</option>
                                    <option value="heavy">Heavy</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editTokenData.hasResource}
                                    onChange={(e) => setEditTokenData({ ...editTokenData, hasResource: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-xs font-bold">Has Resource?</span>
                            </label>

                            {editTokenData.hasResource && (
                                <div className="mt-2 space-y-2 pl-6">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs mb-1">Resource Name</label>
                                            <input
                                                type="text"
                                                value={editTokenData.resourceName}
                                                onChange={(e) => setEditTokenData({ ...editTokenData, resourceName: e.target.value })}
                                                className="w-full bg-surface px-3 py-2 rounded text-sm"
                                                placeholder="e.g., Mana, Focus, Rage"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1">Color</label>
                                            <ColorPicker
                                                color={editTokenData.resourceColor}
                                                onChange={(color) => setEditTokenData({ ...editTokenData, resourceColor: color })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs mb-1">Max Resource</label>
                                            <input
                                                type="number"
                                                value={editTokenData.maxResource || 0}
                                                onChange={(e) => setEditTokenData({ ...editTokenData, maxResource: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-surface px-3 py-2 rounded text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs mb-1">Current Resource</label>
                                            <input
                                                type="number"
                                                value={editTokenData.currentResource || 0}
                                                onChange={(e) => setEditTokenData({ ...editTokenData, currentResource: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-surface px-3 py-2 rounded text-sm"
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
                                {editTokenData.image ? 'Change Image' : 'Upload Image'}
                                <input type="file" accept="image/*" onChange={handleEditTokenImageUpload} className="hidden" />
                            </label>
                            {editTokenData.image && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img src={editTokenData.image} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                                    <span className="text-xs text-text-muted">Image uploaded</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSaveToken}
                            className="w-full bg-secondary hover:bg-secondary-hover px-3 py-2 rounded text-sm font-bold mt-2"
                        >
                            Save Changes
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

                {/* Strategy Mode Toggle */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold">Strategy Mode (TAB)</label>
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
