import React from 'react';
import { Settings, Download, FileUp } from 'lucide-react';

/**
 * SettingsPanel Component
 *
 * Provides a settings dropdown with display settings, grid controls, darkness mode, and battle import/export.
 *
 * @param {Object} props
 * @param {boolean} props.showSettings - Whether the settings panel is visible
 * @param {Function} props.setShowSettings - Function to toggle settings panel visibility
 * @param {number} props.tokenSize - Current token size
 * @param {Function} props.setTokenSize - Function to set token size
 * @param {number} props.backgroundSize - Current background size (percentage)
 * @param {Function} props.setBackgroundSize - Function to set background size
 * @param {boolean} props.showGrid - Whether grid is visible
 * @param {Function} props.setShowGrid - Function to toggle grid visibility
 * @param {number} props.gridSize - Current grid size
 * @param {Function} props.setGridSize - Function to set grid size
 * @param {boolean} props.darknessMode - Whether darkness mode is enabled
 * @param {Function} props.setDarknessMode - Function to toggle darkness mode
 * @param {number} props.heroLightRadius - Hero light radius multiplier
 * @param {Function} props.setHeroLightRadius - Function to set hero light radius
 * @param {number} props.companionLightRadius - Companion light radius multiplier
 * @param {Function} props.setCompanionLightRadius - Function to set companion light radius
 * @param {number} props.darknessIntensity - Darkness intensity (0-1)
 * @param {Function} props.setDarknessIntensity - Function to set darkness intensity
 * @param {Function} props.exportBattle - Function to export battle state
 * @param {Function} props.importBattle - Function to import battle state (event handler)
 */
export default function SettingsPanel({
  showSettings,
  setShowSettings,
  tokenSize,
  setTokenSize,
  backgroundSize,
  setBackgroundSize,
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
  showPartyOverview,
  setShowPartyOverview,
  exportBattle,
  importBattle,
  currentTheme,
  setCurrentTheme
}) {
  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="bg-surface-highlight hover:bg-button-muted p-2 rounded flex items-center justify-center"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {/* Settings Dropdown Panel */}
      {showSettings && (
        <div className="absolute right-0 top-12 bg-surface border border-border rounded-lg p-4 shadow-lg z-50 w-64">
          <h3 className="text-sm font-bold mb-3">Display Settings</h3>

          <div className="space-y-4">
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
                  className={`px-3 py-1 rounded text-sm ${showPartyOverview ? 'bg-secondary hover:bg-secondary-hover' : 'bg-button-muted hover:bg-button-muted-hover'
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
                  className={`px-3 py-1 rounded text-sm ${showGrid ? 'bg-secondary hover:bg-secondary-hover' : 'bg-button-muted hover:bg-button-muted-hover'
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
                  className={`px-3 py-1 rounded text-sm ${darknessMode ? 'bg-secondary hover:bg-secondary-hover' : 'bg-button-muted hover:bg-button-muted-hover'
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
                  className="bg-button-muted text-text text-sm rounded px-2 py-1 border border-gray-500"
                >
                  <option value="default">Default</option>
                  <option value="dracula">Dracula</option>
                </select>
              </div>
            </div>

            {/* Export/Import Battle */}
            <div className="border-t border-border pt-4 space-y-2">
              <h3 className="text-sm font-bold mb-2">Save/Load</h3>
              <button
                onClick={exportBattle}
                className="w-full bg-secondary hover:bg-secondary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                Export Battle
              </button>
              <label className="w-full bg-primary hover:bg-primary-hover px-3 py-2 rounded flex items-center justify-center gap-2 text-sm cursor-pointer">
                <FileUp size={16} />
                Import Battle
                <input type="file" accept=".json" onChange={importBattle} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
