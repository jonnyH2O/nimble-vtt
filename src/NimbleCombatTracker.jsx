import React, { useState, useRef, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Upload, Trash2, Plus, Users, Swords, Heart, Info, AlertCircle, Book, List, Crown, RotateCcw } from 'lucide-react';
import DiceRoller from './components/DiceRoller';
import { HUDDisplay, NotesPanel } from './components/HUD';
import Toolbar from './components/Toolbar';
import SettingsPanel from './components/SettingsPanel';

// Token reducer for efficient state updates
function tokensReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOKEN':
      return [...state, action.payload];

    case 'REMOVE_TOKEN':
      return state.filter(t => t.id !== action.payload);

    case 'UPDATE_TOKEN':
      // Surgical update - only the specified token is replaced
      return state.map(t =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
      );

    case 'UPDATE_HEALTH': {
      const { tokenId, newHealth } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const wasAlive = t.health > 0;
        const clampedHealth = Math.max(0, Math.min(t.maxHealth, newHealth));
        const conditions = t.conditions || [];
        let newConditions = [...conditions];
        let wounds = t.wounds || 0;

        // Auto-manage Dying condition (at 0 HP)
        if (clampedHealth === 0) {
          if (wasAlive && (t.type === 'hero' || t.type === 'companion')) {
            wounds = wounds + 1;
          }
          if (!newConditions.includes('Dying')) {
            newConditions.push('Dying');
          }
          newConditions = newConditions.filter(c => c !== 'Bloodied');
        } else {
          newConditions = newConditions.filter(c => c !== 'Dying');
          const isBloodied = clampedHealth <= t.maxHealth / 2;
          if (isBloodied && !newConditions.includes('Bloodied')) {
            newConditions.push('Bloodied');
          } else if (!isBloodied && newConditions.includes('Bloodied')) {
            newConditions = newConditions.filter(c => c !== 'Bloodied');
          }
        }

        // Auto-manage Wounded condition
        if (t.type === 'hero' || t.type === 'companion') {
          if (wounds > 0 && !newConditions.includes('Wounded')) {
            newConditions.push('Wounded');
          } else if (wounds === 0) {
            newConditions = newConditions.filter(c => c !== 'Wounded');
          }
        }

        return { ...t, health: clampedHealth, conditions: newConditions, wounds };
      });
    }

    case 'UPDATE_MAX_HEALTH': {
      const { tokenId, newMaxHealth } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const maxHP = Math.max(1, newMaxHealth);
        const clampedHealth = Math.min(t.health, maxHP);
        const conditions = t.conditions || [];
        let newConditions = [...conditions];

        if (clampedHealth === 0) {
          if (!newConditions.includes('Dying')) {
            newConditions.push('Dying');
          }
          newConditions = newConditions.filter(c => c !== 'Bloodied');
        } else {
          newConditions = newConditions.filter(c => c !== 'Dying');
          const isBloodied = clampedHealth <= maxHP / 2;
          if (isBloodied && !newConditions.includes('Bloodied')) {
            newConditions.push('Bloodied');
          } else if (!isBloodied && newConditions.includes('Bloodied')) {
            newConditions = newConditions.filter(c => c !== 'Bloodied');
          }
        }

        return { ...t, maxHealth: maxHP, health: clampedHealth, conditions: newConditions };
      });
    }

    case 'TOGGLE_CONDITION': {
      const { tokenId, condition } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const conditions = t.conditions || [];
        const hasCondition = conditions.includes(condition);
        return {
          ...t,
          conditions: hasCondition
            ? conditions.filter(c => c !== condition)
            : [...conditions, condition]
        };
      });
    }

    case 'UPDATE_WOUNDS': {
      const { tokenId, newWounds } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const wounds = Math.max(0, newWounds);
        const conditions = t.conditions || [];
        let newConditions = [...conditions];

        if (wounds > 0 && !newConditions.includes('Wounded')) {
          newConditions.push('Wounded');
        } else if (wounds === 0) {
          newConditions = newConditions.filter(c => c !== 'Wounded');
        }

        return { ...t, wounds, conditions: newConditions };
      });
    }

    case 'TOGGLE_ACTION': {
      const { tokenId, actionIndex } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const newActions = [...t.actions];
        newActions[actionIndex] = !newActions[actionIndex];
        return { ...t, actions: newActions };
      });
    }

    case 'START_TURN': {
      const { tokenId } = action.payload;
      return state.map(t => ({
        ...t,
        isActiveTurn: t.id === tokenId
      }));
    }

    case 'END_TURN': {
      const { tokenId } = action.payload;
      return state.map(t =>
        t.id === tokenId ? { ...t, isActiveTurn: false, actions: t.actions.map(() => false) } : t
      );
    }

    case 'RESET_NON_HERO_ACTIONS':
      return state.map(t =>
        t.type !== 'hero' ? { ...t, actions: t.actions.map(() => false) } : t
      );

    case 'CLEAR_CONDITIONS': {
      const { tokenId } = action.payload;
      return state.map(t => {
        if (t.id !== tokenId) return t;

        const doomedConditions = ['Bloodied', 'Dying', 'Wounded'];
        return {
          ...t,
          conditions: (t.conditions || []).filter(c => doomedConditions.includes(c))
        };
      });
    }

    case 'SET_ALL_TOKENS':
      return action.payload;

    default:
      return state;
  }
}

// Constants
const VIRTUAL_CANVAS_SIZE = 2000;
const SIDEBAR_WIDTH = 352;
const DRAWING_HISTORY_LIMIT = 10;
const STROKE_HISTORY_LIMIT = 200;
const DEFAULT_TOKEN_POSITION = { x: 100, y: 100 };
const HUD_Z_INDEX = 50;
const MODAL_Z_INDEX = 100;

// Custom Hook: Token Management
function useTokens(tokenSize) {
  const [tokens, dispatchTokens] = useReducer(tokensReducer, []);
  const [selectedToken, setSelectedToken] = useState(null);

  const addToken = useCallback((tokenData) => {
    const token = {
      id: crypto.randomUUID(),
      name: tokenData.name,
      type: tokenData.type,
      image: tokenData.image,
      x: DEFAULT_TOKEN_POSITION.x,
      y: DEFAULT_TOKEN_POSITION.y,
      actions: tokenData.type === 'hero' ? [false, false, false] :
               tokenData.type === 'legendary' ? [false, false, false, false, false, false] :
               [false],
      isActiveTurn: false,
      health: 10,
      maxHealth: 10,
      tempHP: 0,
      showTempHP: false,
      notes: '',
      conditions: [],
      wounds: 0,
      maxWounds: 6,
      customSize: null,
      hasResource: tokenData.hasResource || false,
      resourceName: tokenData.resourceName || '',
      resourceColor: tokenData.resourceColor || '#3b82f6',
      currentResource: tokenData.currentResource || 0,
      maxResource: tokenData.maxResource || 0
    };
    dispatchTokens({ type: 'ADD_TOKEN', payload: token });
    return token.id;
  }, []);

  const removeToken = useCallback((id) => {
    dispatchTokens({ type: 'REMOVE_TOKEN', payload: id });
    if (selectedToken === id) setSelectedToken(null);
  }, [selectedToken]);

  const updateHealth = useCallback((tokenId, newHealth) => {
    dispatchTokens({ type: 'UPDATE_HEALTH', payload: { tokenId, newHealth } });
  }, []);

  const updateMaxHealth = useCallback((tokenId, newMaxHealth) => {
    dispatchTokens({ type: 'UPDATE_MAX_HEALTH', payload: { tokenId, newMaxHealth } });
  }, []);

  const updateNotes = useCallback((tokenId, notes) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { notes } } });
  }, []);

  const updateTokenSize = useCallback((tokenId, size) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { customSize: size } } });
  }, []);

  const updateTempHP = useCallback((tokenId, tempHP) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { tempHP: Math.max(0, tempHP) } } });
  }, []);

  const toggleTempHP = useCallback((tokenId) => {
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { showTempHP: !token.showTempHP } } });
    }
  }, [tokens]);

  const toggleCondition = useCallback((tokenId, condition) => {
    dispatchTokens({ type: 'TOGGLE_CONDITION', payload: { tokenId, condition } });
  }, []);

  const updateWounds = useCallback((tokenId, newWounds) => {
    dispatchTokens({ type: 'UPDATE_WOUNDS', payload: { tokenId, newWounds } });
  }, []);

  const clearConditions = useCallback((tokenId) => {
    dispatchTokens({ type: 'CLEAR_CONDITIONS', payload: { tokenId } });
  }, []);

  const toggleAction = useCallback((tokenId, actionIndex) => {
    dispatchTokens({ type: 'TOGGLE_ACTION', payload: { tokenId, actionIndex } });
  }, []);

  const startTurn = useCallback((tokenId) => {
    dispatchTokens({ type: 'START_TURN', payload: { tokenId } });
  }, []);

  const endTurn = useCallback((tokenId) => {
    dispatchTokens({ type: 'END_TURN', payload: { tokenId } });
  }, []);

  const resetNonHeroActions = useCallback(() => {
    dispatchTokens({ type: 'RESET_NON_HERO_ACTIONS' });
  }, []);

  const updateTokenPosition = useCallback((tokenId, x, y) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates: { x, y } } });
  }, []);

  const updateTokenResource = useCallback((tokenId, updates) => {
    dispatchTokens({ type: 'UPDATE_TOKEN', payload: { id: tokenId, updates } });
  }, []);

  const setAllTokens = useCallback((newTokens) => {
    dispatchTokens({ type: 'SET_ALL_TOKENS', payload: newTokens });
  }, []);

  return {
    tokens,
    selectedToken,
    setSelectedToken,
    addToken,
    removeToken,
    updateHealth,
    updateMaxHealth,
    updateNotes,
    updateTokenSize,
    updateTempHP,
    toggleTempHP,
    toggleCondition,
    updateWounds,
    clearConditions,
    toggleAction,
    startTurn,
    endTurn,
    resetNonHeroActions,
    updateTokenPosition,
    updateTokenResource,
    setAllTokens
  };
}

// Custom hook for drawing canvas operations
function useDrawing(boardRef, viewOffset, zoomLevel) {
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

// Custom hook for turn order management
function useTurnOrder(tokens) {
  const [turnOrder, setTurnOrder] = useState([]);
  const [draggedTurnIndex, setDraggedTurnIndex] = useState(null);

  // Memoized display turn order with legendary token logic
  const displayTurnOrder = useMemo(() => {
    const displayOrder = [];
    const legendaryTokens = tokens.filter(t => t.type === 'legendary');

    // Add legendary tokens at the very top (their main bodies)
    legendaryTokens.forEach(legendary => {
      displayOrder.push({ id: legendary.id, isLegendaryEcho: false, isMainLegendary: true });
    });

    // Then add regular turn order with legendary echoes after heroes
    turnOrder.forEach((tokenId) => {
      const token = tokens.find(t => t.id === tokenId);
      if (!token || token.type === 'legendary') return; // Skip legendary tokens in normal order

      // Add the regular token
      displayOrder.push({ id: tokenId, isLegendaryEcho: false, isMainLegendary: false });

      // If it's a hero, add all legendary tokens after it
      if (token.type === 'hero') {
        legendaryTokens.forEach(legendary => {
          displayOrder.push({ id: legendary.id, isLegendaryEcho: true, isMainLegendary: false });
        });
      }
    });

    return displayOrder;
  }, [tokens, turnOrder]);

  const addToTurnOrder = useCallback((tokenId) => {
    setTurnOrder(prev => [...prev, tokenId]);
  }, []);

  const removeFromTurnOrder = useCallback((tokenId) => {
    setTurnOrder(prev => prev.filter(tid => tid !== tokenId));
  }, []);

  const handleTurnDragStart = useCallback((index) => {
    setDraggedTurnIndex(index);
  }, []);

  const handleTurnDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedTurnIndex !== null && draggedTurnIndex !== index) {
      const newOrder = [...turnOrder];
      const draggedId = newOrder[draggedTurnIndex];
      newOrder.splice(draggedTurnIndex, 1);
      newOrder.splice(index, 0, draggedId);
      setTurnOrder(newOrder);
      setDraggedTurnIndex(index);
    }
  }, [draggedTurnIndex, turnOrder]);

  const handleTurnDragEnd = useCallback(() => {
    setDraggedTurnIndex(null);
  }, []);

  const setAllTurnOrder = useCallback((newTurnOrder) => {
    setTurnOrder(newTurnOrder);
  }, []);

  return {
    turnOrder,
    displayTurnOrder,
    draggedTurnIndex,
    addToTurnOrder,
    removeFromTurnOrder,
    handleTurnDragStart,
    handleTurnDragOver,
    handleTurnDragEnd,
    setAllTurnOrder
  };
}

// Custom hook for dice rolling
function useDiceRoller() {
  const [showDiceMenu, setShowDiceMenu] = useState(false);
  const [diceCount, setDiceCount] = useState(1);
  const [diceRolls, setDiceRolls] = useState([]);
  const [rollingDice, setRollingDice] = useState([]);
  const diceTimeoutsRef = useRef([]);

  const rollDice = useCallback((sides) => {
    const rolls = [];
    let total = 0;

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    const rollId = crypto.randomUUID();

    // Show "rolling" animation first
    const rollingRoll = {
      id: rollId,
      dice: `${diceCount}d${sides}`,
      rolling: true
    };

    setRollingDice(prev => [rollingRoll, ...prev]);
    setShowDiceMenu(false);

    // After 2.5 seconds, show the actual result
    const timeout1 = setTimeout(() => {
      setRollingDice(prev => prev.filter(r => r.id !== rollId));

      const newRoll = {
        id: rollId,
        dice: `${diceCount}d${sides}`,
        rolls: rolls,
        total: total,
        fading: false
      };

      setDiceRolls(prev => [newRoll, ...prev]);

      // Start fading after 5 seconds
      const timeout2 = setTimeout(() => {
        setDiceRolls(prev => prev.map(r =>
          r.id === rollId ? { ...r, fading: true } : r
        ));

        // Remove completely after fade (3 more seconds)
        const timeout3 = setTimeout(() => {
          setDiceRolls(prev => prev.filter(r => r.id !== rollId));
        }, 3000);

        diceTimeoutsRef.current.push(timeout3);
      }, 5000);

      diceTimeoutsRef.current.push(timeout2);
    }, 2500);

    diceTimeoutsRef.current.push(timeout1);
  }, [diceCount]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      diceTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      diceTimeoutsRef.current = [];
    };
  }, []);

  return {
    showDiceMenu,
    setShowDiceMenu,
    diceCount,
    setDiceCount,
    diceRolls,
    rollingDice,
    rollDice
  };
}

export default function NimbleCombatTracker() {
  // UI State
  const [background, setBackground] = useState(null);
  const [backgroundSize, setBackgroundSize] = useState(100);
  const [tokenSize, setTokenSize] = useState(64);

  // Refs
  const boardRef = useRef(null);

  // View State (needed for drawing hook)
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Token Management (custom hook)
  const tokenManager = useTokens(tokenSize);
  const { tokens, selectedToken, setSelectedToken } = tokenManager;

  // Drawing Management (custom hook)
  const drawingManager = useDrawing(boardRef, viewOffset, zoomLevel);
  const {
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
    historyStep
  } = drawingManager;

  // Turn Order Management (custom hook)
  const turnOrderManager = useTurnOrder(tokens);
  const {
    turnOrder,
    displayTurnOrder,
    draggedTurnIndex
  } = turnOrderManager;

  // Dice Roller Management (custom hook)
  const diceRollerManager = useDiceRoller();
  const {
    showDiceMenu,
    setShowDiceMenu,
    diceCount,
    setDiceCount,
    diceRolls,
    rollingDice,
    rollDice
  } = diceRollerManager;

  // Other State
  const [deleteMode, setDeleteMode] = useState(false);

  // Token Dragging State
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Add Token Dialog State
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({ name: '', type: 'hero', image: null, hasResource: false, resourceName: '', resourceColor: '#3b82f6', currentResource: 5, maxResource: 5 });

  // UI Panels
  const [expandedNotes, setExpandedNotes] = useState({});
  const [panningView, setPanningView] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [expandedConditions, setExpandedConditions] = useState({});
  const [shiftHeld, setShiftHeld] = useState(false);
  const [sidebarView, setSidebarView] = useState('turnOrder'); // 'turnOrder' or 'dictionary'
  const [darknessMode, setDarknessMode] = useState(false);
  const [heroLightRadius, setHeroLightRadius] = useState(3); // Multiplier of token size
  const [companionLightRadius, setCompanionLightRadius] = useState(2); // Multiplier of token size
  const [darknessIntensity, setDarknessIntensity] = useState(0.95); // 0-1, how dark the shadows are

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackground(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTokenImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewToken({ ...newToken, image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToken = () => {
    if (newToken.name) {
      const tokenId = tokenManager.addToken(newToken);
      turnOrderManager.addToTurnOrder(tokenId);
      setNewToken({ name: '', type: 'hero', image: null, hasResource: false, resourceName: '', resourceColor: '#3b82f6', currentResource: 5, maxResource: 5 });
      setShowAddToken(false);
    }
  };

  const handleRemoveToken = (id) => {
    tokenManager.removeToken(id);
    turnOrderManager.removeFromTurnOrder(id);
  };

  // Memoize light sources to avoid repeated filtering
  const lightSources = useMemo(() => {
    return tokens.filter(t => t.type === 'hero' || t.type === 'companion');
  }, [tokens]);

  // Memoize light source data for darkness mode calculations
  const lightSourceData = useMemo(() => {
    if (!darknessMode) return [];

    return lightSources.map(source => {
      const sourceSize = source.customSize || tokenSize;
      const lightRadius = source.type === 'hero'
        ? sourceSize * heroLightRadius
        : sourceSize * companionLightRadius;
      const centerX = source.x + sourceSize / 2;
      const centerY = source.y + sourceSize / 2;

      return {
        id: source.id,
        type: source.type,
        centerX,
        centerY,
        lightRadius,
        sourceSize
      };
    });
  }, [lightSources, darknessMode, tokenSize, heroLightRadius, companionLightRadius]);

  // Memoize token visibility calculations for darkness mode
  const tokenVisibility = useMemo(() => {
    if (!darknessMode) return {};

    const visibility = {};
    tokens.forEach(token => {
      const isInDarkness = token.type === 'enemy' || token.type === 'legendary';
      if (!isInDarkness) {
        visibility[token.id] = true;
        return;
      }

      // Check if token is within light radius of any hero or companion
      const currentTokenSize = token.customSize || tokenSize;
      const tokenCenterX = token.x + currentTokenSize / 2;
      const tokenCenterY = token.y + currentTokenSize / 2;

      let isLit = false;
      for (const source of lightSourceData) {
        const distance = Math.sqrt(
          Math.pow(tokenCenterX - source.centerX, 2) +
          Math.pow(tokenCenterY - source.centerY, 2)
        );

        if (distance <= source.lightRadius) {
          isLit = true;
          break;
        }
      }

      visibility[token.id] = isLit;
    });

    return visibility;
  }, [tokens, darknessMode, lightSourceData, tokenSize]);

  const toggleNotes = (tokenId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const toggleConditions = (tokenId) => {
    setExpandedConditions(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const doomedConditions = ['Bloodied', 'Dying', 'Wounded'];

  const majorConditions = [
    'Blinded', 'Invisible', 'Dazed',
    'Charmed', 'Taunted', 'Frightened',
    'Grappled', 'Riding', 'Petrified',
    'Restrained', 'Incapacitated', 'Poisoned',
    'Slowed', 'Prone', 'Hampered'
  ];

  const minorConditions = ['Smoldering', 'Charged', 'Distracted'];

  const handleMouseDown = useCallback((e, tokenId) => {
    if (drawMode !== 'select') return;
    e.preventDefault();
    e.stopPropagation();

    // If shift is held, just select for viewing conditions/notes
    if (e.shiftKey) {
      setSelectedToken(tokenId);
      return;
    }

    // Calculate the offset from cursor to token's top-left corner
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      const rect = boardRef.current.getBoundingClientRect();
      const cursorX = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
      const cursorY = (e.clientY - rect.top - viewOffset.y) / zoomLevel;
      setDragOffset({
        x: cursorX - token.x,
        y: cursorY - token.y
      });
    }

    setDragging(tokenId);
    setSelectedToken(tokenId);
  }, [drawMode, tokens, viewOffset, zoomLevel]);

  const handleWheel = useCallback((e) => {
    if (drawMode === 'select') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(0.5, zoomLevel + delta), 3);

      const rect = boardRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleChange = newZoom / zoomLevel;
      setViewOffset({
        x: mouseX - (mouseX - viewOffset.x) * scaleChange,
        y: mouseY - (mouseY - viewOffset.y) * scaleChange
      });

      setZoomLevel(newZoom);
    }
  }, [drawMode, zoomLevel, viewOffset]);

  const handleBoardMouseDown = (e) => {
    if (drawMode === 'select') {
      e.preventDefault();
      setPanningView(true);
      setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });

      // Only deselect token on right-click (button 2) when clicking on background
      // Left-click (button 0) keeps the token selected while panning
      const isTokenClick = e.target.closest('.absolute.cursor-move');
      if (!isTokenClick && e.button === 2) {
        setSelectedToken(null);
      }
    }
  };

  const handleMouseMove = (e) => {
    // Update cursor position
    drawingManager.updateCursorPos(e);

    if (panningView) {
      setViewOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (dragging) {
      const rect = boardRef.current.getBoundingClientRect();
      const cursorX = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
      const cursorY = (e.clientY - rect.top - viewOffset.y) / zoomLevel;
      const x = cursorX - dragOffset.x;
      const y = cursorY - dragOffset.y;
      tokenManager.updateTokenPosition(dragging, x, y);
    }

    // Handle drawing
    drawingManager.handleDrawMove(e);
  };

  const handleMouseUp = () => {
    drawingManager.handleDrawEnd();
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    setPanningView(false);
  };

  const handleMouseLeave = () => {
    drawingManager.handleDrawEnd();
    drawingManager.clearCursorPos();
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    setPanningView(false);
  };

  const exportBattle = () => {
    const drawingData = drawingManager.getDrawingData();
    
    const battleState = {
      version: '1.2',
      tokens: tokens, // This already includes conditions as they're part of token objects
      turnOrder: turnOrder,
      background: background,
      backgroundSize: backgroundSize,
      tokenSize: tokenSize,
      drawings: drawingData,
      zoomLevel: zoomLevel,
      viewOffset: viewOffset,
      gridSize: gridSize,
      showGrid: showGrid,
      darknessMode: darknessMode,
      heroLightRadius: heroLightRadius,
      companionLightRadius: companionLightRadius,
      darknessIntensity: darknessIntensity,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(battleState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `battle-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  const importBattle = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const battleState = JSON.parse(event.target.result);
        
        // Restore all state (conditions are included in tokens)
        if (battleState.tokens) tokenManager.setAllTokens(battleState.tokens);
        if (battleState.turnOrder) turnOrderManager.setAllTurnOrder(battleState.turnOrder);
        if (battleState.background) setBackground(battleState.background);
        if (battleState.backgroundSize) setBackgroundSize(battleState.backgroundSize);
        if (battleState.tokenSize) setTokenSize(battleState.tokenSize);

        // Reset view to default to ensure consistent positioning across machines
        setZoomLevel(1);
        setViewOffset({ x: 0, y: 0 });

        if (battleState.gridSize !== undefined) setGridSize(battleState.gridSize);
        if (battleState.showGrid !== undefined) setShowGrid(battleState.showGrid);
        if (battleState.darknessMode !== undefined) setDarknessMode(battleState.darknessMode);
        if (battleState.heroLightRadius !== undefined) setHeroLightRadius(battleState.heroLightRadius);
        if (battleState.companionLightRadius !== undefined) setCompanionLightRadius(battleState.companionLightRadius);
        if (battleState.darknessIntensity !== undefined) setDarknessIntensity(battleState.darknessIntensity);
        
        // Restore drawings
        if (battleState.drawings) {
          drawingManager.loadDrawing(battleState.drawings);
        }
        
        setShowSettings(false);
      } catch (error) {
        console.error('Error importing battle:', error);
        alert('Error importing battle file. Please make sure it\'s a valid battle export.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const updateCanvasSize = () => {
      if (drawCanvasRef.current) {
        const canvas = drawCanvasRef.current;
        const ctx = canvas.getContext('2d');

        // Save current canvas content before resizing
        const imageData = canvas.toDataURL();

        // Use fixed virtual canvas size
        canvas.width = VIRTUAL_CANVAS_SIZE;
        canvas.height = VIRTUAL_CANVAS_SIZE;

        // Restore canvas content after resize
        if (imageData && imageData !== 'data:,') {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = imageData;
        }
      }
    };
    updateCanvasSize();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setShiftHeld(true);
      }

      // Clear conditions: Shift+C when a token is selected
      if (e.shiftKey && (e.key === 'c' || e.key === 'C') && selectedToken) {
        e.preventDefault();
        tokenManager.clearConditions(selectedToken);
        return;
      }

      // Redo: Ctrl+Shift+Z (or Cmd+Shift+Z on Mac) - check this first
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        drawingManager.redo();
        return;
      }

      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        drawingManager.undo();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setShiftHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [historyStep, drawingHistory, selectedToken]);

  const getTokenBorderColor = (type) => {
    switch(type) {
      case 'hero': return 'border-blue-500';
      case 'enemy': return 'border-red-500';
      case 'companion': return 'border-green-500';
      case 'legendary': return 'border-purple-500';
      default: return 'border-gray-500';
    }
  };

  const getTokenBgColor = (type) => {
    switch(type) {
      case 'hero': return 'bg-blue-600';
      case 'enemy': return 'bg-red-600';
      case 'companion': return 'bg-green-600';
      case 'legendary': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getTokenIcon = (type) => {
    switch(type) {
      case 'hero': return <Users size={20} />;
      case 'enemy': return <Swords size={20} />;
      case 'companion': return <Heart size={20} />;
      case 'legendary': return <Crown size={20} />;
      default: return <Users size={20} />;
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex gap-3 items-center flex-wrap justify-between">
          <div className="flex gap-3 items-center flex-wrap">
            <h1 className="text-xl font-bold">Nimble Combat Tracker</h1>
            
            <div className="h-8 w-px bg-gray-600"></div>
            
            <label className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded cursor-pointer flex items-center gap-2 text-sm">
              <Upload size={16} />
              Background
              <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
            </label>
            
            <button
              onClick={() => setShowAddToken(!showAddToken)}
              className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add Token
            </button>
            
            {showAddToken && (
              <div className="absolute left-0 top-12 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-[100] w-80">
                <h3 className="text-sm font-bold mb-3">Add New Token</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1">Name</label>
                    <input
                      type="text"
                      value={newToken.name}
                      onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                      className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      placeholder="Token name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs mb-1">Type</label>
                    <select
                      value={newToken.type}
                      onChange={(e) => setNewToken({ ...newToken, type: e.target.value })}
                      className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                    >
                      <option value="hero">Hero</option>
                      <option value="companion">Companion</option>
                      <option value="enemy">Enemy</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs mb-1">Image (Optional)</label>
                    <label className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded cursor-pointer text-sm flex items-center justify-center gap-2">
                      <Upload size={16} />
                      {newToken.image ? 'Change Image' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleTokenImageUpload} className="hidden" />
                    </label>
                    {newToken.image && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={newToken.image} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-xs text-gray-400">Image uploaded</span>
                      </div>
                    )}
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
                              className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                              placeholder="e.g., Mana, Focus, Rage"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Color</label>
                            <input
                              type="color"
                              value={newToken.resourceColor}
                              onChange={(e) => setNewToken({ ...newToken, resourceColor: e.target.value })}
                              className="w-12 h-10 bg-gray-700 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddToken}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-bold"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddToken(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Toolbar
              drawMode={drawMode}
              setDrawMode={setDrawMode}
              drawColor={drawColor}
              setDrawColor={setDrawColor}
              drawSize={drawSize}
              setDrawSize={setDrawSize}
              eraseSize={eraseSize}
              setEraseSize={setEraseSize}
              historyStep={historyStep}
              drawingHistory={drawingHistory}
              undo={drawingManager.undo}
              redo={drawingManager.redo}
              clearDrawings={drawingManager.clearDrawings}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              viewOffset={viewOffset}
              setViewOffset={setViewOffset}
            />
          </div>

          <DiceRoller
            showDiceMenu={showDiceMenu}
            setShowDiceMenu={setShowDiceMenu}
            diceCount={diceCount}
            setDiceCount={setDiceCount}
            rollDice={rollDice}
            rollingDice={rollingDice}
            diceRolls={diceRolls}
          />

          <SettingsPanel
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            tokenSize={tokenSize}
            setTokenSize={setTokenSize}
            backgroundSize={backgroundSize}
            setBackgroundSize={setBackgroundSize}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            gridSize={gridSize}
            setGridSize={setGridSize}
            darknessMode={darknessMode}
            setDarknessMode={setDarknessMode}
            heroLightRadius={heroLightRadius}
            setHeroLightRadius={setHeroLightRadius}
            companionLightRadius={companionLightRadius}
            setCompanionLightRadius={setCompanionLightRadius}
            darknessIntensity={darknessIntensity}
            setDarknessIntensity={setDarknessIntensity}
            exportBattle={exportBattle}
            importBattle={importBattle}
          />
        </div>
      </div>


      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden">
          <div
            ref={boardRef}
            className={`relative bg-gray-700 rounded w-full h-full min-h-[600px] overflow-hidden ${
              drawMode === 'select' ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleBoardMouseDown}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheel}
          >
            <div
              className="absolute"
              style={{
                width: '2000px',
                height: '2000px',
                transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: '0 0',
                transition: panningView ? 'none' : 'transform 0.1s'
              }}
            >
              {background && (
                <img
                  src={background}
                  alt="Background"
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: `${backgroundSize}%`,
                    height: `${backgroundSize}%`,
                    objectFit: 'contain'
                  }}
                />
              )}
              
              <canvas
                ref={drawCanvasRef}
                className={`absolute ${drawMode === 'select' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                style={{ width: '2000px', height: '2000px', top: 0, left: 0 }}
                onMouseDown={drawingManager.handleDrawStart}
              />

              {/* Grid overlay */}
              {showGrid && (
                <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                      <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}

              {/* Darkness overlay with light sources */}
              {darknessMode && (
                <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 10 }}>
                  <defs>
                    {/* Create radial gradients for each light source */}
                    {lightSources.map((token) => {
                      return (
                        <radialGradient key={`gradient-${token.id}`} id={`gradient-${token.id}`}>
                          <stop offset="0%" stopColor="black" stopOpacity="1" />
                          <stop offset="70%" stopColor="black" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="black" stopOpacity="0" />
                        </radialGradient>
                      );
                    })}

                    {/* Mask: white = show darkness, black = hide darkness (light) */}
                    <mask id="darkness-mask">
                      {/* Start with white (show darkness everywhere) */}
                      <rect width="100%" height="100%" fill="white" />

                      {/* Add black circles for light areas - gradients blend smoothly */}
                      {lightSourceData.map((source) => {
                        return (
                          <circle
                            key={`light-${source.id}`}
                            cx={source.centerX}
                            cy={source.centerY}
                            r={source.lightRadius}
                            fill={`url(#gradient-${source.id})`}
                          />
                        );
                      })}
                    </mask>
                  </defs>

                  {/* Black overlay - visible where mask is white (dark areas) */}
                  <rect
                    width="100%"
                    height="100%"
                    fill="black"
                    opacity={darknessIntensity}
                    mask="url(#darkness-mask)"
                  />
                </svg>
              )}

              {/* Selection rings overlay - only for hidden tokens in darkness */}
              {selectedToken && darknessMode && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 11 }}>
                  {tokens.filter(t => {
                    if (t.id !== selectedToken) return false;
                    // Only show ring if token is enemy/legendary AND hidden in darkness
                    const isInDarkness = t.type === 'enemy' || t.type === 'legendary';
                    if (!isInDarkness) return false;

                    // Check if token is visible (use memoized visibility)
                    return !tokenVisibility[t.id]; // Show ring only if NOT visible
                  }).map((token) => {
                    const currentTokenSize = token.customSize || tokenSize;
                    return (
                      <div
                        key={`selection-${token.id}`}
                        className="absolute"
                        style={{
                          left: token.x - 2,
                          top: token.y - 2,
                          width: `${currentTokenSize + 4}px`,
                          height: `${currentTokenSize + 4}px`,
                          borderRadius: '50%',
                          boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.9)',
                        }}
                      />
                    );
                  })}
                </div>
              )}
              
              {tokens.map((token) => {
                const currentTokenSize = token.customSize || tokenSize;

                // Use memoized visibility calculation
                const isInDarkness = darknessMode && (token.type === 'enemy' || token.type === 'legendary');
                const shouldShowToken = !isInDarkness || (tokenVisibility[token.id] ?? true);
                
                return (
                <div
                  key={token.id}
                  className={`absolute ${drawMode === 'select' ? 'cursor-move' : 'pointer-events-none'}`}
                  style={{ left: token.x, top: token.y }}
                  onMouseDown={(e) => handleMouseDown(e, token.id)}
                >
                  <div className="relative">
                    {token.image ? (
                      <div className="relative">
                        <div
                          className={`rounded-full ${getTokenBorderColor(token.type)} relative`}
                          style={{
                            width: `${currentTokenSize}px`,
                            height: `${currentTokenSize}px`,
                            borderWidth: `${Math.max(2, Math.round(currentTokenSize / 16))}px`,
                            borderStyle: 'solid',
                            opacity: !shouldShowToken ? 0 : 1,
                            ...(selectedToken === token.id ? {
                              boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.7)'
                            } : {})
                          }}
                        >
                          <img
                            src={token.image}
                            alt={token.name}
                            className="rounded-full object-cover w-full h-full"
                            style={{
                              opacity: token.conditions && token.conditions.includes('Invisible') ? 0.3 : 1,
                              filter: token.conditions && token.conditions.includes('Dying') ? 'saturate(0.2)' : 'none',
                            }}
                          />
                          {/* Red vignette for Bloodied */}
                          {token.conditions && token.conditions.includes('Bloodied') && shouldShowToken && (
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{
                                boxShadow: 'inset 0 0 30px 10px rgba(220, 38, 38, 0.42)',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          className={`rounded-full ${getTokenBorderColor(token.type)} relative`}
                          style={{
                            width: `${currentTokenSize}px`,
                            height: `${currentTokenSize}px`,
                            borderWidth: `${Math.max(2, Math.round(currentTokenSize / 16))}px`,
                            borderStyle: 'solid',
                            opacity: !shouldShowToken ? 0 : 1,
                            ...(selectedToken === token.id ? {
                              boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.7)'
                            } : {})
                          }}
                        >
                          <div
                            className={`rounded-full flex items-center justify-center w-full h-full ${getTokenBgColor(token.type)}`}
                            style={{
                              opacity: token.conditions && token.conditions.includes('Invisible') ? 0.3 : 1,
                              filter: token.conditions && token.conditions.includes('Dying') ? 'saturate(0.2)' : 'none',
                            }}
                          >
                            {getTokenIcon(token.type)}
                          </div>
                          {/* Red vignette for Bloodied */}
                          {token.conditions && token.conditions.includes('Bloodied') && shouldShowToken && (
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{
                                boxShadow: 'inset 0 0 30px 10px rgba(220, 38, 38, 0.42)',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Shift-hover info popup */}
                    {shiftHeld && selectedToken === token.id && (token.notes || (token.conditions && token.conditions.length > 0)) && (
                      <div 
                        className="absolute left-1/2 transform -translate-x-1/2 bg-gray-900 border-2 border-gray-600 rounded-lg p-3 shadow-xl z-50 min-w-[200px] max-w-[300px]"
                        style={{ 
                          bottom: `${currentTokenSize + 10}px`
                        }}
                      >
                        {token.conditions && token.conditions.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-bold text-gray-300 mb-2">Conditions:</div>
                            
                            {/* Doomed Conditions */}
                            {token.conditions.some(c => doomedConditions.includes(c)) && (
                              <div className="mb-2">
                                <div className="text-xs font-bold text-red-400 mb-1">Doomed</div>
                                <div className="flex flex-wrap gap-1">
                                  {token.conditions.filter(c => doomedConditions.includes(c)).map(c => (
                                    <span key={c} className="text-xs bg-red-600 px-2 py-0.5 rounded">{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Major Conditions */}
                            {token.conditions.some(c => majorConditions.includes(c)) && (
                              <div className="mb-2">
                                <div className="text-xs font-bold text-orange-400 mb-1">Major</div>
                                <div className="flex flex-wrap gap-1">
                                  {token.conditions.filter(c => majorConditions.includes(c)).map(c => (
                                    <span key={c} className="text-xs bg-orange-600 px-2 py-0.5 rounded">{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Minor Conditions */}
                            {token.conditions.some(c => minorConditions.includes(c)) && (
                              <div className="mb-2">
                                <div className="text-xs font-bold text-yellow-400 mb-1">Minor</div>
                                <div className="flex flex-wrap gap-1">
                                  {token.conditions.filter(c => minorConditions.includes(c)).map(c => (
                                    <span key={c} className="text-xs bg-yellow-600 px-2 py-0.5 rounded">{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {token.notes && (
                          <div>
                            <div className="text-xs font-bold text-blue-400 mb-1">Notes:</div>
                            <div className="text-xs text-gray-300">{token.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            {cursorPos && drawMode !== 'select' && (
              <div
                className="absolute pointer-events-none rounded-full border-2"
                style={{
                  left: cursorPos.x - (drawMode === 'erase' ? eraseSize : drawSize) / 2,
                  top: cursorPos.y - (drawMode === 'erase' ? eraseSize : drawSize) / 2,
                  width: drawMode === 'erase' ? eraseSize : drawSize,
                  height: drawMode === 'erase' ? eraseSize : drawSize,
                  borderColor: drawMode === 'erase' ? '#ef4444' : drawColor,
                  backgroundColor: drawMode === 'erase' ? 'rgba(239, 68, 68, 0.2)' : `${drawColor}40`
                }}
              />
            )}

            {/* HUD - Character Status Display */}
            <HUDDisplay
              selectedToken={selectedToken}
              tokens={tokens}
              HUD_Z_INDEX={HUD_Z_INDEX}
            />
          </div>
        </div>

        <div className="bg-gray-800 border-l border-gray-700 flex flex-col" style={{ width: `${SIDEBAR_WIDTH}px` }}>
          <div className="bg-gray-700 border-b border-gray-600 p-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSidebarView('turnOrder')}
                className={`p-2 rounded flex items-center justify-center ${
                  sidebarView === 'turnOrder' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title="Turn Order"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setSidebarView('dictionary')}
                className={`p-2 rounded flex items-center justify-center ${
                  sidebarView === 'dictionary' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title="Nimble Dictionary"
              >
                <Book size={20} />
              </button>
            </div>
            {sidebarView === 'turnOrder' && (
              <button
                onClick={() => setDeleteMode(!deleteMode)}
                className={`text-sm px-3 py-1.5 rounded flex items-center gap-1 ${
                  deleteMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <Trash2 size={14} />
                {deleteMode ? 'Done' : 'Delete'}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {sidebarView === 'turnOrder' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Turn Order</h2>
                  <button
                    onClick={tokenManager.resetNonHeroActions}
                    className="bg-blue-600 hover:bg-blue-700 p-2 rounded flex items-center justify-center"
                    title="Reset all non-hero actions"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {deleteMode ? 'Click tokens to remove them' : 'Drag to reorder'}
                </div>
            
            <div className="space-y-2">
              {displayTurnOrder.map((item, index) => {
                const token = tokens.find(t => t.id === item.id);
                if (!token) return null;
                
                const isLegendaryEcho = item.isLegendaryEcho;
                const isMainLegendary = item.isMainLegendary;
                const actualIndex = turnOrder.indexOf(item.id);
                
                return (
                  <div key={isLegendaryEcho ? `${item.id}-echo-${index}` : isMainLegendary ? `${item.id}-main` : item.id}>
                    {isLegendaryEcho && (
                      <div className="flex items-center gap-2 py-1 pl-8">
                        <div className="text-purple-400 text-xs">→ Legendary Turn</div>
                      </div>
                    )}
                    <div
                      draggable={!deleteMode && !isLegendaryEcho && !expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`]}
                      onDragStart={() => !isLegendaryEcho && turnOrderManager.handleTurnDragStart(actualIndex)}
                      onDragOver={(e) => !isLegendaryEcho && turnOrderManager.handleTurnDragOver(e, actualIndex)}
                      onDragEnd={turnOrderManager.handleTurnDragEnd}
                      onClick={() => {
                        if (deleteMode && !isLegendaryEcho) {
                          handleRemoveToken(item.id);
                        } else if (!isLegendaryEcho) {
                          setSelectedToken(item.id);
                        }
                      }}
                      className={`bg-gray-700 p-3 rounded ${
                        deleteMode && !isLegendaryEcho ? 'cursor-pointer hover:bg-red-900' :
                        !isLegendaryEcho && !expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] ? 'cursor-move' : ''
                      } ${selectedToken === item.id && !isLegendaryEcho ? 'ring-2 ring-orange-500' : ''} ${
                        isLegendaryEcho ? 'opacity-75 ml-4' : ''
                      } ${isMainLegendary ? 'border-2 border-purple-500' : ''}`}
                    >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {isMainLegendary && (
                          <div className="text-sm font-bold text-purple-400 w-6">L</div>
                        )}
                        {!isLegendaryEcho && !isMainLegendary && (
                          <div className="text-sm font-bold text-gray-400 w-6">{actualIndex + 1}</div>
                        )}
                        {isLegendaryEcho && (
                          <div className="text-sm font-bold text-purple-400 w-6">→</div>
                        )}
                        {token.image ? (
                          <div className="relative w-10 h-10">
                            <div className={`w-10 h-10 rounded-full border-2 ${getTokenBorderColor(token.type)} relative`}>
                              <img
                                src={token.image}
                                alt={token.name}
                                className="w-full h-full rounded-full object-cover"
                                style={{
                                  filter: token.conditions && token.conditions.includes('Dying') ? 'saturate(0.2)' : 'none'
                                }}
                              />
                              {/* Red vignette for Bloodied */}
                              {token.conditions && token.conditions.includes('Bloodied') && (
                                <div
                                  className="absolute inset-0 rounded-full pointer-events-none"
                                  style={{
                                    boxShadow: 'inset 0 0 15px 5px rgba(220, 38, 38, 0.42)',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-10 h-10">
                            <div className={`w-10 h-10 rounded-full border-2 ${getTokenBorderColor(token.type)} relative`}>
                              <div
                                className={`w-full h-full rounded-full flex items-center justify-center ${getTokenBgColor(token.type)}`}
                                style={{
                                  filter: token.conditions && token.conditions.includes('Dying') ? 'saturate(0.2)' : 'none'
                                }}
                              >
                                {getTokenIcon(token.type)}
                              </div>
                              {/* Red vignette for Bloodied */}
                              {token.conditions && token.conditions.includes('Bloodied') && (
                                <div
                                  className="absolute inset-0 rounded-full pointer-events-none"
                                  style={{
                                    boxShadow: 'inset 0 0 15px 5px rgba(220, 38, 38, 0.42)',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-sm">{token.name}</div>
                          <div className="text-xs text-gray-400 capitalize">{token.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {token.type !== 'legendary' && (
                          <div className="text-right">
                            <div className="text-xs text-gray-400">HP</div>
                            {token.showTempHP && (
                              <div className="flex items-center gap-1 mb-1">
                                <input
                                  type="number"
                                  value={token.tempHP || 0}
                                  onChange={(e) => tokenManager.updateTempHP(item.id, parseInt(e.target.value) || 0)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-12 bg-cyan-600 text-center rounded px-1 py-0.5 text-sm"
                                  style={{ backgroundColor: '#06b6d4' }}
                                />
                                <span className="text-sm">🛡️</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={token.health}
                                onChange={(e) => tokenManager.updateHealth(item.id, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-12 bg-gray-600 text-center rounded px-1 py-0.5 text-sm"
                              />
                              <span className="text-xs text-gray-400">/</span>
                              <input
                                type="number"
                                value={token.maxHealth}
                                onChange={(e) => tokenManager.updateMaxHealth(item.id, parseInt(e.target.value) || 1)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-12 bg-gray-600 text-center rounded px-1 py-0.5 text-sm"
                              />
                            </div>
                          </div>
                        )}
                        {!isLegendaryEcho && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const conditionKey = `${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`;
                              setExpandedConditions(prev => ({
                                ...prev,
                                [conditionKey]: !prev[conditionKey]
                              }));
                            }}
                            className={`${
                              token.conditions && token.conditions.length > 0
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                          >
                            <AlertCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Wounds - only show when at 0 HP and for heroes/companions */}
                    {token.health === 0 && (token.type === 'hero' || token.type === 'companion') && (
                      <div className="mt-2 mb-2 flex items-center justify-center gap-1 px-2 flex-wrap">
                        <span className="text-xs text-gray-400 mr-1">Wounds:</span>
                        {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                          const maxWounds = token.maxWounds || 6;
                          const circleSize = maxWounds <= 6 ? 5 : Math.max(4, Math.floor(24 / maxWounds));
                          return (
                            <button
                              key={woundNum}
                              onClick={(e) => {
                                e.stopPropagation();
                                tokenManager.updateWounds(item.id, token.wounds === woundNum ? woundNum - 1 : woundNum);
                              }}
                              className={`rounded-full border transition-all flex items-center justify-center ${
                                (token.wounds || 0) >= woundNum
                                  ? 'bg-red-600 border-red-400'
                                  : 'bg-gray-700 border-gray-500 hover:border-gray-400'
                              }`}
                              style={{
                                width: `${circleSize * 4}px`,
                                height: `${circleSize * 4}px`,
                                fontSize: `${circleSize * 3}px`
                              }}
                              title={`${woundNum} wound${woundNum > 1 ? 's' : ''}`}
                            >
                              {(token.wounds || 0) >= woundNum && (
                                <span className="text-white leading-none">✕</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] && (
                      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                        {/* Wounds - only for heroes and companions */}
                        {(token.type === 'hero' || token.type === 'companion') && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-400">Wounds</label>
                              <button
                                onClick={() => tokenManager.toggleTempHP(item.id)}
                                className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${
                                  token.showTempHP
                                    ? 'bg-cyan-600 hover:bg-cyan-700'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                Temp HP 🛡️
                              </button>
                            </div>
                            <div className="flex gap-1 justify-center items-center flex-wrap">
                              {Array.from({ length: token.maxWounds || 6 }, (_, i) => i + 1).map(woundNum => {
                                const maxWounds = token.maxWounds || 6;
                                const circleSize = maxWounds <= 6 ? 6 : Math.max(4, Math.floor(24 / maxWounds));
                                return (
                                  <button
                                    key={woundNum}
                                    onClick={() => updateWounds(item.id, token.wounds === woundNum ? woundNum - 1 : woundNum)}
                                    className={`rounded-full border transition-all flex items-center justify-center ${
                                      (token.wounds || 0) >= woundNum
                                        ? 'bg-red-600 border-red-400'
                                        : 'bg-gray-700 border-gray-500 hover:border-gray-400'
                                    }`}
                                    style={{
                                      width: `${circleSize * 4}px`,
                                      height: `${circleSize * 4}px`,
                                      fontSize: `${circleSize * 3}px`
                                    }}
                                    title={`${woundNum} wound${woundNum > 1 ? 's' : ''}`}
                                  >
                                    {(token.wounds || 0) >= woundNum && (
                                      <span className="text-white leading-none">✕</span>
                                    )}
                                  </button>
                                );
                              })}
                              <span className="text-xs text-gray-400 mx-1">=</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={token.maxWounds || 6}
                                onChange={(e) => {
                                  const newMax = Math.max(1, Math.min(20, parseInt(e.target.value) || 6));
                                  const currentToken = tokens.find(t => t.id === item.id);
                                  tokenManager.updateTokenResource(item.id, {
                                    maxWounds: newMax,
                                    wounds: Math.min(currentToken?.wounds || 0, newMax)
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-12 bg-gray-600 text-center rounded px-1 py-0.5 text-xs"
                                title="Maximum wounds"
                              />
                            </div>
                          </div>
                        )}

                        {/* Resource - for any token with resources */}
                        {token.hasResource && (
                          <div className="mb-3">
                            <label className="text-xs text-gray-400 block mb-2">{token.resourceName || 'Resource'}</label>
                            <div className="flex gap-2 justify-center items-center">
                              <input
                                type="number"
                                min="0"
                                max={token.maxResource || 0}
                                value={token.currentResource || 0}
                                onChange={(e) => {
                                  const newCurrent = Math.max(0, Math.min(parseInt(e.target.value) || 0, token.maxResource || 0));
                                  tokenManager.updateTokenResource(item.id, { currentResource: newCurrent });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 bg-gray-600 text-center rounded px-2 py-1 text-sm"
                                style={{ borderColor: token.resourceColor, borderWidth: '2px' }}
                              />
                              <span className="text-xs text-gray-400">/</span>
                              <input
                                type="number"
                                min="0"
                                value={token.maxResource || 0}
                                onChange={(e) => {
                                  const newMax = Math.max(0, parseInt(e.target.value) || 0);
                                  const currentToken = tokens.find(t => t.id === item.id);
                                  tokenManager.updateTokenResource(item.id, {
                                    maxResource: newMax,
                                    currentResource: Math.min(currentToken?.currentResource || 0, newMax)
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 bg-gray-600 text-center rounded px-2 py-1 text-sm"
                                style={{ borderColor: token.resourceColor, borderWidth: '2px' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Temp HP toggle for non-hero/companion tokens */}
                        {token.type !== 'legendary' && token.type !== 'hero' && token.type !== 'companion' && (
                          <div className="flex items-center justify-end mb-2">
                            <button
                              onClick={() => toggleTempHP(item.id)}
                              className={`py-1 px-2 rounded text-xs flex items-center gap-1 ${
                                token.showTempHP
                                  ? 'bg-cyan-600 hover:bg-cyan-700'
                                  : 'bg-gray-600 hover:bg-gray-500'
                              }`}
                            >
                              Temp HP 🛡️
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-400">Conditions</label>
                        </div>

                        {/* Doomed Conditions */}
                        <div className="mb-3">
                          <div className="text-xs font-bold text-red-400 mb-1">Doomed</div>
                          <div className="flex flex-wrap gap-1">
                            {doomedConditions.map(condition => (
                              <button
                                key={condition}
                                onClick={() => tokenManager.toggleCondition(item.id, condition)}
                                className={`text-xs px-2 py-1 rounded ${
                                  token.conditions && token.conditions.includes(condition)
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {condition}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Major Conditions */}
                        <div className="mb-3">
                          <div className="text-xs font-bold text-orange-400 mb-1">Major</div>
                          <div className="flex flex-wrap gap-1">
                            {majorConditions.map(condition => (
                              <button
                                key={condition}
                                onClick={() => tokenManager.toggleCondition(item.id, condition)}
                                className={`text-xs px-2 py-1 rounded ${
                                  token.conditions && token.conditions.includes(condition)
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {condition}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Minor Conditions */}
                        <div className="mb-3">
                          <div className="text-xs font-bold text-yellow-400 mb-1">Minor</div>
                          <div className="flex flex-wrap gap-1">
                            {minorConditions.map(condition => (
                              <button
                                key={condition}
                                onClick={() => tokenManager.toggleCondition(item.id, condition)}
                                className={`text-xs px-2 py-1 rounded ${
                                  token.conditions && token.conditions.includes(condition)
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {condition}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Token Size Slider */}
                        <div className="border-t border-gray-600 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-300">Token Size</label>
                            {token.customSize !== null && (
                              <button
                                onClick={() => tokenManager.updateTokenSize(item.id, null)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                                title="Reset to global size"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="32"
                              max="192"
                              step="4"
                              value={token.customSize || tokenSize}
                              onChange={(e) => tokenManager.updateTokenSize(item.id, parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-xs w-12 text-right">
                              {token.customSize || tokenSize}px
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {token.actions && (
                      <div>
                        {token.type === 'hero' && (
                          <div className="mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                token.isActiveTurn ? tokenManager.endTurn(item.id) : tokenManager.startTurn(item.id);
                              }}
                              className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${
                                token.isActiveTurn 
                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                                  : 'bg-gray-600 hover:bg-gray-500'
                              }`}
                            >
                              {token.isActiveTurn ? '★ Active Turn' : 'Start Turn'}
                            </button>
                          </div>
                        )}
                        {!isLegendaryEcho && !isMainLegendary && (
                          <div className="flex gap-1">
                            {token.actions.map((used, actionIndex) => (
                              <button
                                key={actionIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  tokenManager.toggleAction(item.id, actionIndex);
                                }}
                                className={`flex-1 h-8 rounded transition-colors ${
                                  used 
                                    ? 'bg-gray-500' 
                                    : token.isActiveTurn 
                                      ? 'bg-blue-500 hover:bg-blue-600' 
                                      : token.type === 'enemy' 
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                }`}
                              >
                                {token.type === 'hero' ? actionIndex + 1 : '✓'}
                              </button>
                            ))}
                          </div>
                        )}
                        {isLegendaryEcho && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Use the index within the display order to track which legendary turn this is
                                const legendaryTurnIndex = displayTurnOrder
                                  .slice(0, index)
                                  .filter(i => i.id === item.id && i.isLegendaryEcho).length;
                                tokenManager.toggleAction(item.id, legendaryTurnIndex);
                              }}
                              className={`flex-1 h-8 rounded transition-colors ${
                                token.actions[displayTurnOrder
                                  .slice(0, index)
                                  .filter(i => i.id === item.id && i.isLegendaryEcho).length]
                                  ? 'bg-gray-500'
                                  : 'bg-purple-500 hover:bg-purple-600'
                              }`}
                            >
                              ✓
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
              
              {turnOrder.length === 0 && (
                <div className="text-gray-400 text-center py-8 text-sm">
                  No tokens added yet. Click "Add Token" to get started.
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Nimble Dictionary</h2>
            
            <div className="text-xs text-gray-400 mb-4 italic">
              Reference for rules and conditions during gameplay.
            </div>

            {/* VTT Features Section */}
            <div className="mb-4">
              <button
                onClick={() => setExpandedNotes(prev => ({ ...prev, 'vttFeatures': !prev['vttFeatures'] }))}
                className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">VTT Features</span>
                <span className="text-gray-400">{expandedNotes['vttFeatures'] ? '−' : '+'}</span>
              </button>

              {expandedNotes['vttFeatures'] && (
                <div className="bg-gray-700 p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Complete guide to all features available in Nimble VTT for managing combat encounters.
                  </div>

                  {/* Combat Management */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">Combat Management</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-blue-300">Turn & Action Tracking</div>
                        <div className="text-xs text-gray-300">Track turn order, and actions for heros, companions, enemies, and legendary monsters. Reset non-hero actions using the reset button in the top right of the turn order.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-300">Quick Combat Controls</div>
                        <div className="text-xs text-gray-300">Start combat, track turns, and track health & conditions quickly using the info button on each token in the turn order. </div>
                      </div>
                    </div>
                  </div>

                  {/* Token Management */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2">Token Management</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-green-300">Add Combatants</div>
                        <div className="text-xs text-gray-300">Create heroes, companions, enemies, or legendary creatures with a custom name and picture. Set their HP in the turn order.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">HP Management</div>
                        <div className="text-xs text-gray-300">Apply damage or healing with quick buttons. Visual HP bars show current health status. [COMING SOON]Automatically tracks bloodied (half HP) states.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Wounds & Death</div>
                        <div className="text-xs text-gray-300">[COMING SOON]Track wound counters for heroes. Automatically marks tokens as dying at 0 HP. Visual indicators for wounded and dying states.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Token Types</div>
                        <div className="text-xs text-gray-300">Color-coded token types: Heroes (blue), Companions (green), Enemies (red), Legendary (purple) for easy identification.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-300">Delete & Remove</div>
                        <div className="text-xs text-gray-300">Remove individual tokens from combat with the trash icon.</div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Tracking */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">Notes & Tracking</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-purple-300">Per-Token Notes</div>
                        <div className="text-xs text-gray-300">Click any token to access its notes panel. Track exttra resources, special abilities, or any other important information.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Condition Reference</div>
                        <div className="text-xs text-gray-300">Quick access to all Nimble RPG conditions within the info section of a token. Organized by severity: Doomed, Major, and Minor conditions.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-300">Persistent Storage</div>
                        <div className="text-xs text-gray-300">[COMING SOON] All combat data automatically saves to your browser. Your encounter persists between sessions until you reset it.</div>
                      </div>
                    </div>
                  </div>

                  {/* File Management */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">File Management</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Save Battles</div>
                        <div className="text-xs text-gray-300">Export your current encounter as a JSON file. Saves all tokens, HP, actions, notes, and combat state.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Load Battles</div>
                        <div className="text-xs text-gray-300">Import previously saved encounters. Perfect for recurring enemies, pre-planned battles, or portable games.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Battle Templates</div>
                        <div className="text-xs text-gray-300">[COMING SOON] Create reusable encounter templates with pre-configured enemies, HP, and initiatives for quick combat setup.</div>
                      </div>
                    </div>
                  </div>

                  {/* Interface Features */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">Interface Features</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Sidebar Toggle</div>
                        <div className="text-xs text-gray-300">Switch between Turn Order and Dictionary views using the tabs at the top of the sidebar.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Visual Indicators</div>
                        <div className="text-xs text-gray-300">Condition indicators and token highlighting for quick status recognition.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Add Background</div>
                        <div className="text-xs text-gray-300">Quickly upload and use different battlemaps for your games.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Responsive Design</div>
                        <div className="text-xs text-gray-300">Clean, dark-themed interface optimized for readability during game sessions.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Drawing</div>
                        <div className="text-xs text-gray-300">Simple drawing and erasing mechanics to add to levels or point things out.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Keyboard Shortcuts</div>
                        <div className="text-xs text-gray-300"> SHIFT on a token to quickly read conditions and notes. CTRL + Z and CTRL + SHIFT + Z to undo and redo drawings.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Conditions Section */}
            <div className="mb-4">
              <button
                onClick={() => setExpandedNotes(prev => ({ ...prev, 'conditions': !prev['conditions'] }))}
                className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded flex items-center justify-between text-left"
              >
                <span className="font-bold">Conditions</span>
                <span className="text-gray-400">{expandedNotes['conditions'] ? '−' : '+'}</span>
              </button>
              
              {expandedNotes['conditions'] && (
                <div className="bg-gray-700 p-3 rounded-b mt-1">
                  <div className="text-xs text-gray-300 mb-4">
                    Some attacks, traps, spells, or other effects can inflict conditions—usually negative effects other than damage. Some conditions are temporary, lasting as little as a single round; others may last until cured in some way, and some can be ended by using an action to make an appropriate save.
                  </div>
                  
                  {/* Doomed Conditions */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-red-400 mb-2">Doomed Conditions</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-red-300">Bloodied</div>
                        <div className="text-xs text-gray-300">At half HP or less.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Dying</div>
                        <div className="text-xs text-gray-300">At 0 HP. Taking damage while dying causes 2 Wounds, a crit causes 3 instead.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-300">Wounded</div>
                        <div className="text-xs text-gray-300">Has any Wounds (typically 6 Wounds and a hero is dead).</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Major Conditions */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-orange-400 mb-2">Major Conditions</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-orange-300">Blinded</div>
                        <div className="text-xs text-gray-300">Can't see. Attacks against you have advantage, and your attacks have disadvantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Invisible</div>
                        <div className="text-xs text-gray-300">Cannot be seen. Your attacks have advantage, and attacks against you have disadvantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Dazed</div>
                        <div className="text-xs text-gray-300">Heroes: lose 1 action; monsters: can perform one less action on their next turn.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Charmed</div>
                        <div className="text-xs text-gray-300">Sees the charmer as an ally. Charmer has advantage on social interactions with you.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Taunted</div>
                        <div className="text-xs text-gray-300">Disadvantage on attacks except against the most recent taunter.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Frightened</div>
                        <div className="text-xs text-gray-300">Disadvantage on rolls when source of fear is nearby; speed halved when moving closer to it.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Grappled</div>
                        <div className="text-xs text-gray-300">Cannot move. Attacks against you have advantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Riding</div>
                        <div className="text-xs text-gray-300">You move with the creature you are riding. Any attacks that miss you, strike them.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Petrified</div>
                        <div className="text-xs text-gray-300">Incapacitated. You have all the benefits and drawbacks of being a rock! Immune to most damage except from large explosions, picks, or similar tools.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Restrained</div>
                        <div className="text-xs text-gray-300">Cannot move. Attacks against you have advantage.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Incapacitated</div>
                        <div className="text-xs text-gray-300">Can't do anything. Attacks against you have advantage, and melee attacks that hit, crit.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Poisoned</div>
                        <div className="text-xs text-gray-300">Disadvantage on rolls.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Slowed</div>
                        <div className="text-xs text-gray-300">Speed halved during your next turn.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Prone</div>
                        <div className="text-xs text-gray-300">Movement costs twice as much, and disadvantage on attacks. Melee attacks against you have advantage; Ranged have disadvantage. Spend 3 spaces of your Speed to stand up.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-300">Hampered</div>
                        <div className="text-xs text-gray-300">Any creature with their actions or movement reduced (e.g., Dazed, Grappled, Prone, Difficult Terrain).</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Minor Conditions */}
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">Minor Conditions</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Smoldering</div>
                        <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Charged</div>
                        <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">Distracted</div>
                        <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </>
        )}
          </div>

          <NotesPanel
            selectedToken={selectedToken}
            tokens={tokens}
            updateNotes={tokenManager.updateNotes}
          />
        </div>
      </div>
    </div>
  );
}