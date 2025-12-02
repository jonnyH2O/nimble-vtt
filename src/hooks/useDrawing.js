import { useState, useRef, useEffect, useCallback } from 'react';

const DRAWING_HISTORY_LIMIT = 10;

/**
 * Custom Hook: Drawing Canvas Operations
 *
 * Manages canvas drawing state, history (undo/redo), and cursor position.
 *
 * @param {React.RefObject} boardRef - Reference to the board container element
 * @param {Object} viewOffset - Current view offset {x, y}
 * @param {number} zoomLevel - Current zoom level
 * @returns {Object} Drawing state and management functions
 */
export function useDrawing(boardRef, viewOffset, zoomLevel) {
  const [drawing, setDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('select');
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawSize, setDrawSize] = useState(3);
  const [eraseSize, setEraseSize] = useState(10);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [cursorPos, setCursorPos] = useState(null);

  const drawCanvasRef = useRef(null);
  const drawingRef = useRef([]);

  // Initialize history with blank canvas
  useEffect(() => {
    if (drawCanvasRef.current && drawingHistory.length === 0) {
      const blankCanvas = drawCanvasRef.current.toDataURL();
      setDrawingHistory([blankCanvas]);
      setHistoryStep(0);
    }
  }, [drawingHistory.length]);

  const saveToHistory = useCallback(() => {
    if (!drawCanvasRef.current) return;

    const canvas = drawCanvasRef.current;
    const imageData = canvas.toDataURL();

    // Remove any future history if we're not at the end
    const newHistory = drawingHistory.slice(0, historyStep + 1);
    newHistory.push(imageData);

    // Limit history to reduce memory usage
    if (newHistory.length > DRAWING_HISTORY_LIMIT) {
      newHistory.shift();
      setDrawingHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    } else {
      setDrawingHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  }, [drawingHistory, historyStep]);

  const restoreFromHistory = useCallback((step) => {
    if (!drawCanvasRef.current || step < 0 || step >= drawingHistory.length) return;

    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    img.src = drawingHistory[step];
  }, [drawingHistory]);

  const handleDrawStart = useCallback((e) => {
    if (e.target === drawCanvasRef.current && drawMode !== 'select') {
      setDrawing(true);
      const rect = boardRef.current.getBoundingClientRect();
      // Adjust for zoom and pan
      const x = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - viewOffset.y) / zoomLevel;
      drawingRef.current = [{ x, y }];
    }
  }, [drawMode, boardRef, viewOffset, zoomLevel]);

  const handleDrawMove = useCallback((e) => {
    if (drawing) {
      const canvas = drawCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = boardRef.current.getBoundingClientRect();

      // Calculate position relative to the transformed canvas
      const x = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - viewOffset.y) / zoomLevel;

      const currentSize = drawMode === 'erase' ? eraseSize : drawSize;

      if (drawMode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
      }

      if (drawingRef.current.length > 0) {
        const lastPoint = drawingRef.current[drawingRef.current.length - 1];
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      drawingRef.current.push({ x, y });
    }
  }, [drawing, drawMode, drawColor, drawSize, eraseSize, boardRef, viewOffset, zoomLevel]);

  const handleDrawEnd = useCallback(() => {
    if (drawing) {
      saveToHistory();
    }
    setDrawing(false);
    drawingRef.current = [];
  }, [drawing, saveToHistory]);

  const clearDrawings = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }, [saveToHistory]);

  const undo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep);
    }
  }, [historyStep, restoreFromHistory]);

  const redo = useCallback(() => {
    if (historyStep < drawingHistory.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep);
    }
  }, [historyStep, drawingHistory.length, restoreFromHistory]);

  const updateCursorPos = useCallback((e) => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCursorPos({ x, y });
    }
  }, [boardRef]);

  const clearCursorPos = useCallback(() => {
    setCursorPos(null);
  }, []);

  const getDrawingData = useCallback(() => {
    return drawCanvasRef.current ? drawCanvasRef.current.toDataURL() : null;
  }, []);

  const loadDrawing = useCallback((imageData) => {
    if (!drawCanvasRef.current || !imageData) return;

    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveToHistory();
    };

    img.src = imageData;
  }, [saveToHistory]);

  return {
    // State
    drawing,
    drawMode,
    setDrawMode,
    drawColor,
    setDrawColor,
    drawSize,
    setDrawSize,
    eraseSize,
    setEraseSize,
    cursorPos,
    drawCanvasRef,
    drawingHistory,
    historyStep,

    // Actions
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
    clearDrawings,
    undo,
    redo,
    updateCursorPos,
    clearCursorPos,
    getDrawingData,
    loadDrawing
  };
}
