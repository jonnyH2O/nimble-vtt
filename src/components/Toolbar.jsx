import React from 'react';
import { MousePointer, Pencil, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react';
import Tooltip from './Tooltip';
import ColorPicker from './ColorPicker';

/**
 * Toolbar Component
 *
 * Provides drawing tools, mode selection, and zoom controls for the combat tracker.
 *
 * @param {Object} props
 * @param {string} props.drawMode - Current drawing mode ('select', 'draw', 'erase')
 * @param {Function} props.setDrawMode - Function to set drawing mode
 * @param {string} props.drawColor - Current drawing color
 * @param {Function} props.setDrawColor - Function to set drawing color
 * @param {number} props.drawSize - Current drawing brush size
 * @param {Function} props.setDrawSize - Function to set drawing brush size
 * @param {number} props.eraseSize - Current eraser size
 * @param {Function} props.setEraseSize - Function to set eraser size
 * @param {number} props.historyStep - Current position in drawing history
 * @param {Array} props.drawingHistory - Array of drawing history states
 * @param {Function} props.undo - Function to undo last drawing action
 * @param {Function} props.redo - Function to redo drawing action
 * @param {Function} props.clearDrawings - Function to clear all drawings
 * @param {number} props.zoomLevel - Current zoom level (for select mode)
 * @param {Function} props.setZoomLevel - Function to set zoom level
 * @param {Object} props.viewOffset - Current view offset {x, y}
 * @param {Function} props.setViewOffset - Function to set view offset
 */
export default function Toolbar({
  drawMode,
  setDrawMode,
  drawColor,
  setDrawColor,
  drawSize,
  setDrawSize,
  eraseSize,
  setEraseSize,
  historyStep,
  drawingHistory,
  undo,
  redo,
  clearDrawings,
  zoomLevel,
  setZoomLevel,
  viewOffset,
  setViewOffset
}) {
  return (
    <div className="flex items-center gap-2 flex-1">


      {/* Mode Selection Buttons */}
      <Tooltip text="Select Tool" shortcut="V">
        <button
          onClick={() => setDrawMode('select')}
          className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm ${drawMode === 'select' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
            }`}
        >
          <MousePointer size={16} />
        </button>
      </Tooltip>

      <Tooltip text="Draw Tool" shortcut="D">
        <button
          onClick={() => setDrawMode('draw')}
          className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm ${drawMode === 'draw' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
            }`}
        >
          <Pencil size={16} />
        </button>
      </Tooltip>

      <Tooltip text="Erase Tool" shortcut="E">
        <button
          onClick={() => setDrawMode('erase')}
          className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm ${drawMode === 'erase' ? 'bg-primary' : 'bg-tertiary hover:bg-tertiary-hover'
            }`}
        >
          <Eraser size={16} />
        </button>
      </Tooltip>

      {/* Separator for draw/erase controls */}
      {drawMode !== 'select' && <div className="h-8 w-px bg-button-muted"></div>}

      {/* Color Picker (draw mode only) */}
      {drawMode === 'draw' && (
        <ColorPicker
          color={drawColor}
          onChange={setDrawColor}
        />
      )}

      {/* Size Controls (draw/erase modes) */}
      {(drawMode === 'draw' || drawMode === 'erase') && (
        <>
          <input
            type="range"
            min="1"
            max="20"
            value={drawMode === 'erase' ? eraseSize : drawSize}
            onChange={(e) => drawMode === 'erase' ? setEraseSize(parseInt(e.target.value)) : setDrawSize(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm">{(drawMode === 'erase' ? eraseSize : drawSize) + 'px'}</span>

          <div className="h-8 w-px bg-button-muted"></div>

          {/* Undo Button */}
          <Tooltip text="Undo" shortcut="Ctrl+Z">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className={`px-2 py-1.5 rounded flex items-center gap-1 text-sm ${historyStep <= 0
                ? 'bg-button-muted text-text-muted cursor-not-allowed'
                : 'bg-tertiary hover:bg-tertiary-hover'
                }`}
            >
              <Undo2 size={16} />
            </button>
          </Tooltip>

          {/* Redo Button */}
          <Tooltip text="Redo" shortcut="Ctrl+Shift+Z">
            <button
              onClick={redo}
              disabled={historyStep >= drawingHistory.length - 1}
              className={`px-2 py-1.5 rounded flex items-center gap-1 text-sm ${historyStep >= drawingHistory.length - 1
                ? 'bg-button-muted text-text-muted cursor-not-allowed'
                : 'bg-tertiary hover:bg-tertiary-hover'
                }`}
            >
              <Redo2 size={16} />
            </button>
          </Tooltip>

          {/* Clear All Button */}
          <button
            onClick={clearDrawings}
            className="bg-destructive hover:bg-destructive-hover px-3 py-1.5 rounded flex items-center gap-2 text-sm"
          >
            <Trash2 size={16} />
          </button>
        </>
      )}

      {/* Zoom Controls (select mode only) */}
      {drawMode === 'select' && (
        <>
          <div className="h-8 w-px bg-button-muted"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Zoom:</span>
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              className="bg-tertiary hover:bg-tertiary-hover px-2 py-1 rounded text-sm"
            >
              -
            </button>
            <span className="text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
              className="bg-tertiary hover:bg-tertiary-hover px-2 py-1 rounded text-sm"
            >
              +
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setViewOffset({ x: 0, y: 0 });
              }}
              className="bg-tertiary hover:bg-tertiary-hover px-2 py-1 rounded text-sm"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
