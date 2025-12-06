import React, { useState, useRef, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Upload, Plus, Users, Swords, Heart, Crown } from 'lucide-react';
import { HUDDisplay } from './components/HUD';
import Toolbar from './components/Toolbar';
import TurnOrderPanel from './components/TurnOrderPanel';
import { TokenEffects, TokenEffectOverlay } from './components/TokenEffects';
import { PartyOverview } from './components/PartyOverview';
import DiceRoller from './components/DiceRoller';
import { useTokens } from './hooks/useTokens';
import { useDrawing } from './hooks/useDrawing';
import { useTurnOrder } from './hooks/useTurnOrder';
import { useDiceRoller } from './hooks/useDiceRoller';
import { useWindowSync } from './hooks/useWindowSync';
import { MESSAGE_TYPES, createMessage } from './utils/windowMessages';
import { VIRTUAL_CANVAS_SIZE, SIDEBAR_WIDTH, HUD_Z_INDEX, getTokenBorderColor, getTokenBgColor, getTokenIconName } from './constants';
import { CONDITION_CATEGORIES } from './effects/conditionEffects';

export default function NimbleCombatTracker() {
  // UI State
  const [background, setBackground] = useState(null);
  const [backgroundSize, setBackgroundSize] = useState(100);
  const [tokenSize, setTokenSize] = useState(64);
  const [currentTheme, setCurrentTheme] = useState('default');

  // Apply theme to document
  useEffect(() => {
    if (currentTheme === 'dracula') {
      document.documentElement.setAttribute('data-theme', 'dracula');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [currentTheme]);

  // Refs
  const boardRef = useRef(null);
  const previousDrawModeRef = useRef(null);

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
  const [ghostTokenPosition, setGhostTokenPosition] = useState(null); // { x, y, tokenId, distanceMoved }

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
  const [showPartyOverview, setShowPartyOverview] = useState(true);
  const [showDiceInViewport, setShowDiceInViewport] = useState(true); // Whether to show dice animations in viewport

  // Pop-out window state
  const [isPopoutMode, setIsPopoutMode] = useState(false);
  const [popoutWindow, setPopoutWindow] = useState(null);
  const windowSync = useWindowSync(true); // true = main window

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

  const doomedConditions = CONDITION_CATEGORIES.DOOMED;
  const majorConditions = CONDITION_CATEGORIES.MAJOR;
  const minorConditions = CONDITION_CATEGORIES.MINOR;

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
      // Store the original position for the ghost token
      setGhostTokenPosition({
        x: token.x,
        y: token.y,
        tokenId: tokenId,
        distanceMoved: 0
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

  const handlePopout = useCallback(() => {
    // Prevent multiple pop-outs
    if (isPopoutMode && popoutWindow && !popoutWindow.closed) {
      popoutWindow.focus();
      return;
    }

    const popout = window.open(
      '/?popout=true',
      'nimble-sidebar',
      'width=400,height=800,left=100,top=100,resizable=yes,scrollbars=yes'
    );

    if (popout) {
      setPopoutWindow(popout);
      setIsPopoutMode(true);
    } else {
      alert('Please allow popups for this site to use the pop-out feature.');
    }
  }, [isPopoutMode, popoutWindow]);

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

      // Calculate distance moved from original position for ghost token fade-in
      if (ghostTokenPosition && ghostTokenPosition.tokenId === dragging) {
        const dx = x - ghostTokenPosition.x;
        const dy = y - ghostTokenPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        setGhostTokenPosition(prev => ({
          ...prev,
          distanceMoved: distance
        }));
      }
    }

    // Handle drawing
    drawingManager.handleDrawMove(e);
  };

  const handleMouseUp = () => {
    drawingManager.handleDrawEnd();
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    setGhostTokenPosition(null);
    setPanningView(false);
  };

  const handleMouseLeave = () => {
    drawingManager.handleDrawEnd();
    drawingManager.clearCursorPos();
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    setGhostTokenPosition(null);
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

      // Spacebar release - revert to previous tool
      if (e.code === 'Space' && previousDrawModeRef.current !== null) {
        setDrawMode(previousDrawModeRef.current);
        previousDrawModeRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [historyStep, drawingHistory, selectedToken, drawMode]);

  // Broadcast state to pop-out window
  useEffect(() => {
    if (isPopoutMode && windowSync.channel) {
      console.log('[MainWindow] Broadcasting STATE_UPDATE, isPopoutMode:', isPopoutMode, 'hasChannel:', !!windowSync.channel);
      windowSync.broadcast(createMessage(MESSAGE_TYPES.STATE_UPDATE, {
        tokens,
        turnOrder,
        displayTurnOrder,
        selectedToken,
        expandedConditions,
        expandedNotes,
        sidebarView,
        tokenSize,
        deleteMode,
        doomedConditions: CONDITION_CATEGORIES.DOOMED,
        majorConditions: CONDITION_CATEGORIES.MAJOR,
        minorConditions: CONDITION_CATEGORIES.MINOR,
        // Dice state
        diceCount,
        showDiceInViewport,
        rollingDice,
        diceRolls,
        // Settings state
        backgroundSize,
        showGrid,
        gridSize,
        darknessMode,
        heroLightRadius,
        companionLightRadius,
        darknessIntensity,
        showPartyOverview
      }));
    } else {
      console.log('[MainWindow] NOT broadcasting - isPopoutMode:', isPopoutMode, 'hasChannel:', !!windowSync.channel);
    }
  }, [
    isPopoutMode,
    tokens,
    turnOrder,
    displayTurnOrder,
    selectedToken,
    expandedConditions,
    expandedNotes,
    sidebarView,
    deleteMode,
    windowSync,
    diceCount,
    showDiceInViewport,
    rollingDice,
    diceRolls,
    backgroundSize,
    showGrid,
    gridSize,
    darknessMode,
    heroLightRadius,
    companionLightRadius,
    darknessIntensity,
    showPartyOverview,
    tokenSize,
  ]);

  // Listen for actions from pop-out window
  useEffect(() => {
    if (!windowSync.channel) return;

    const handleMessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case MESSAGE_TYPES.HEALTH_UPDATE:
          tokenManager.updateHealth(payload.tokenId, payload.newHealth);
          break;
        case MESSAGE_TYPES.TOKEN_UPDATE:
          tokenManager.updateMaxHealth(payload.tokenId, payload.newMaxHealth);
          break;
        case MESSAGE_TYPES.CONDITION_TOGGLE:
          tokenManager.toggleCondition(payload.tokenId, payload.condition);
          break;
        case MESSAGE_TYPES.TURN_ORDER_UPDATE:
          turnOrderManager.setAllTurnOrder(payload.turnOrder);
          break;
        case MESSAGE_TYPES.NOTES_UPDATE:
          tokenManager.updateNotes(payload.tokenId, payload.notes);
          break;
        case MESSAGE_TYPES.ACTION_TOGGLE:
          tokenManager.toggleAction(payload.tokenId, payload.actionIndex);
          break;
        case MESSAGE_TYPES.WOUNDS_UPDATE:
          tokenManager.updateWounds(payload.tokenId, payload.newWounds);
          break;
        case MESSAGE_TYPES.TEMP_HP_UPDATE:
          tokenManager.updateTempHP(payload.tokenId, payload.tempHP);
          break;
        case MESSAGE_TYPES.TEMP_HP_TOGGLE:
          tokenManager.toggleTempHP(payload.tokenId);
          break;
        case MESSAGE_TYPES.HEALTH_IN_VIEWPORT_TOGGLE:
          tokenManager.toggleHealthInViewport(payload.tokenId);
          break;
        case MESSAGE_TYPES.TOKEN_SIZE_UPDATE:
          tokenManager.updateTokenSize(payload.tokenId, payload.size);
          break;
        case MESSAGE_TYPES.TOKEN_RESOURCE_UPDATE:
          tokenManager.updateTokenResource(payload.tokenId, payload.updates);
          break;
        case MESSAGE_TYPES.SIDEBAR_VIEW_UPDATE:
          setSidebarView(payload.view);
          break;
        case MESSAGE_TYPES.DELETE_MODE_UPDATE:
          setDeleteMode(payload.mode);
          break;
        case MESSAGE_TYPES.SELECT_TOKEN:
          setSelectedToken(payload.tokenId);
          break;
        case MESSAGE_TYPES.EXPANDED_CONDITIONS_UPDATE:
          setExpandedConditions(payload.expanded);
          break;
        case MESSAGE_TYPES.EXPANDED_NOTES_UPDATE:
          setExpandedNotes(payload.expanded);
          break;
        case MESSAGE_TYPES.REMOVE_TOKEN:
          handleRemoveToken(payload.tokenId);
          break;
        case MESSAGE_TYPES.START_TURN:
          tokenManager.startTurn(payload.tokenId);
          break;
        case MESSAGE_TYPES.END_TURN:
          tokenManager.endTurn(payload.tokenId);
          break;
        case MESSAGE_TYPES.RESET_NON_HERO_ACTIONS:
          tokenManager.resetNonHeroActions();
          break;
        case MESSAGE_TYPES.DICE_ROLL:
          rollDice(payload.diceType);
          break;
        case MESSAGE_TYPES.DICE_COUNT_UPDATE:
          setDiceCount(payload.count);
          break;
        case MESSAGE_TYPES.SETTINGS_UPDATE:
          if (payload.tokenSize !== undefined) setTokenSize(payload.tokenSize);
          if (payload.backgroundSize !== undefined) setBackgroundSize(payload.backgroundSize);
          if (payload.showGrid !== undefined) setShowGrid(payload.showGrid);
          if (payload.gridSize !== undefined) setGridSize(payload.gridSize);
          if (payload.darknessMode !== undefined) setDarknessMode(payload.darknessMode);
          if (payload.heroLightRadius !== undefined) setHeroLightRadius(payload.heroLightRadius);
          if (payload.companionLightRadius !== undefined) setCompanionLightRadius(payload.companionLightRadius);
          if (payload.darknessIntensity !== undefined) setDarknessIntensity(payload.darknessIntensity);
          if (payload.showPartyOverview !== undefined) setShowPartyOverview(payload.showPartyOverview);
          if (payload.showDiceInViewport !== undefined) setShowDiceInViewport(payload.showDiceInViewport);
          break;
        case MESSAGE_TYPES.EXPORT_BATTLE:
          exportBattle();
          break;
        case MESSAGE_TYPES.IMPORT_BATTLE:
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.json';
          fileInput.style.display = 'none';
          fileInput.onchange = (e) => {
            importBattle(e);
            document.body.removeChild(fileInput);
          };
          document.body.appendChild(fileInput);
          fileInput.click();
          break;
        case MESSAGE_TYPES.WINDOW_CLOSING:
          setIsPopoutMode(false);
          setPopoutWindow(null);
          break;
      }
    };

    windowSync.channel.onmessage = handleMessage;

    return () => {
      if (windowSync.channel) {
        windowSync.channel.onmessage = null;
      }
    };
  }, [
    windowSync.channel,
    tokenManager,
    turnOrderManager,
    setSidebarView,
    setDeleteMode,
    setSelectedToken,
    setExpandedConditions,
    setExpandedNotes,
    handleRemoveToken,
    rollDice,
    setDiceCount,
    setTokenSize,
    setBackgroundSize,
    setShowGrid,
    setGridSize,
    setDarknessMode,
    setHeroLightRadius,
    setCompanionLightRadius,
    setDarknessIntensity,
    setShowPartyOverview,
    setShowDiceInViewport,
    exportBattle,
    importBattle,
  ]);

  // Detect when pop-out window closes (polling fallback)
  useEffect(() => {
    if (!popoutWindow) return;

    const checkClosed = setInterval(() => {
      if (popoutWindow.closed) {
        setIsPopoutMode(false);
        setPopoutWindow(null);
      }
    }, 500);

    return () => clearInterval(checkClosed);
  }, [popoutWindow]);

  // Helper to get icon component from icon name
  const getTokenIcon = (type) => {
    const iconName = getTokenIconName(type);
    switch (iconName) {
      case 'Users': return <Users size={20} />;
      case 'Swords': return <Swords size={20} />;
      case 'Heart': return <Heart size={20} />;
      case 'Crown': return <Crown size={20} />;
      default: return <Users size={20} />;
    }
  };

  return (
    <div className="h-screen bg-background text-text flex flex-col">
      <div className="bg-surface border-b border-border p-3">
        <div className="flex gap-3 items-center flex-wrap justify-between">
          <div className="flex gap-3 items-center flex-wrap">
            <h1 className="text-xl font-bold">Nimble Combat Tracker</h1>

            <div className="h-8 w-px bg-button-muted"></div>

            <label className="bg-primary hover:bg-primary-hover px-3 py-1.5 rounded cursor-pointer flex items-center gap-2 text-sm">
              <Upload size={16} />
              Background
              <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowAddToken(!showAddToken)}
              className="bg-secondary hover:bg-secondary-hover px-3 py-1.5 rounded flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add Token
            </button>

            {showAddToken && (
              <div className="absolute left-0 top-12 bg-surface border border-border rounded-lg p-4 shadow-lg z-[100] w-80">
                <h3 className="text-sm font-bold mb-3">Add New Token</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1">Name</label>
                    <input
                      type="text"
                      value={newToken.name}
                      onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                      className="w-full bg-surface-highlight px-3 py-2 rounded text-sm"
                      placeholder="Token name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Type</label>
                    <select
                      value={newToken.type}
                      onChange={(e) => setNewToken({ ...newToken, type: e.target.value })}
                      className="w-full bg-surface-highlight px-3 py-2 rounded text-sm"
                    >
                      <option value="hero">Hero</option>
                      <option value="companion">Companion</option>
                      <option value="enemy">Enemy</option>
                      <option value="legendary">Legendary</option>
                    </select>
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
                              className="w-full bg-surface-highlight px-3 py-2 rounded text-sm"
                              placeholder="e.g., Mana, Focus, Rage"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Color</label>
                            <input
                              type="color"
                              value={newToken.resourceColor}
                              onChange={(e) => setNewToken({ ...newToken, resourceColor: e.target.value })}
                              className="w-12 h-10 bg-surface-highlight rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddToken}
                      className="flex-1 bg-secondary hover:bg-secondary-hover px-3 py-2 rounded text-sm font-bold"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddToken(false)}
                      className="flex-1 bg-button-muted hover:bg-button-muted-hover px-3 py-2 rounded text-sm"
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

        </div>
      </div>


      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden">
          <div
            ref={boardRef}
            className={`relative bg-surface-highlight rounded w-full h-full min-h-[600px] overflow-hidden ${drawMode === 'select' ? 'cursor-grab active:cursor-grabbing' : ''
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
                      <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
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
                        className={`absolute ring-2 ring-token-selected`}
                        style={{
                          left: token.x - 2,
                          top: token.y - 2,
                          width: `${currentTokenSize + 4}px`,
                          height: `${currentTokenSize + 4}px`,
                          borderRadius: '50%',
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Ghost Token - shows where drag started */}
              {ghostTokenPosition && (() => {
                const ghostToken = tokens.find(t => t.id === ghostTokenPosition.tokenId);
                if (!ghostToken) return null;

                const currentTokenSize = ghostToken.customSize || tokenSize;
                const FADE_THRESHOLD = 200; // pixels to move before ghost fades in
                const opacity = Math.min(ghostTokenPosition.distanceMoved / FADE_THRESHOLD, 1) * 0.5; // Max opacity 0.5

                if (opacity < 0.01) return null; // Don't render if barely visible

                return (
                  <div
                    key={`ghost-${ghostToken.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: ghostTokenPosition.x,
                      top: ghostTokenPosition.y,
                      opacity: opacity,
                      transition: 'opacity 0.15s ease-out'
                    }}
                  >
                    <div className="relative">
                      {ghostToken.image ? (
                        <div className="relative">
                          <div
                            className={`rounded-full ${getTokenBorderColor(ghostToken.type)} relative`}
                            style={{
                              width: `${currentTokenSize}px`,
                              height: `${currentTokenSize}px`,
                              borderWidth: `${Math.max(2, Math.round(currentTokenSize / 16))}px`,
                              borderStyle: 'solid',
                              zIndex: 0
                            }}
                          >
                            <img
                              src={ghostToken.image}
                              alt={ghostToken.name}
                              className="rounded-full object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div
                            className={`rounded-full ${getTokenBorderColor(ghostToken.type)} relative`}
                            style={{
                              width: `${currentTokenSize}px`,
                              height: `${currentTokenSize}px`,
                              borderWidth: `${Math.max(2, Math.round(currentTokenSize / 16))}px`,
                              borderStyle: 'solid',
                              zIndex: 0
                            }}
                          >
                            <div
                              className={`rounded-full flex items-center justify-center w-full h-full ${getTokenBgColor(ghostToken.type)}`}
                            >
                              {getTokenIcon(ghostToken.type)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

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
                    <TokenEffects token={token} context="token">
                      <div className="relative">
                        {token.image ? (
                          <div className="relative">
                            <div
                              className={`rounded-full ${getTokenBorderColor(token.type)} relative ${selectedToken === token.id ? 'ring-2 ring-token-selected' : ''}`}
                              style={{
                                width: `${currentTokenSize}px`,
                                height: `${currentTokenSize}px`,
                                borderWidth: `${Math.max(2, Math.round(currentTokenSize / 16))}px`,
                                borderStyle: 'solid',
                                opacity: !shouldShowToken ? 0 : 1,
                                zIndex: 1,
                              }}
                            >
                              <img
                                src={token.image}
                                alt={token.name}
                                className="rounded-full object-cover w-full h-full"
                              />
                              <TokenEffectOverlay token={token} context="token" />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div
                              className={`rounded-full ${getTokenBorderColor(token.type)} relative ${selectedToken === token.id ? 'ring-2 ring-token-selected' : ''}`}
                              style={{
                                width: `${currentTokenSize}px`,
                                height: `${currentTokenSize}px`,
                                borderWidth: `${Math.max(2, Math.round(currentTokenSize / 16))}px`,
                                borderStyle: 'solid',
                                opacity: !shouldShowToken ? 0 : 1,
                                zIndex: 1,
                              }}
                            >
                              <div
                                className={`rounded-full flex items-center justify-center w-full h-full ${getTokenBgColor(token.type)}`}
                              >
                                {getTokenIcon(token.type)}
                              </div>
                              <TokenEffectOverlay token={token} context="token" />
                            </div>
                          </div>
                        )}

                        {/* Shift-hover info popup */}
                        {shiftHeld && selectedToken === token.id && (token.notes || (token.conditions && token.conditions.length > 0)) && (
                          <div
                            className="absolute left-1/2 transform -translate-x-1/2 bg-background border-2 border-border rounded-lg p-3 shadow-xl z-50 min-w-[200px] max-w-[300px]"
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
                                    <div className="text-xs font-bold text-destructive mb-1">Doomed</div>
                                    <div className="flex flex-wrap gap-1">
                                      {token.conditions.filter(c => doomedConditions.includes(c)).map(c => (
                                        <span key={c} className="text-xs bg-doomed-buttons px-2 py-0.5 rounded">{c}</span>
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
                                        <span key={c} className="text-xs bg-major-buttons px-2 py-0.5 rounded">{c}</span>
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
                                        <span key={c} className="text-xs bg-minor-buttons px-2 py-0.5 rounded">{c}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {token.notes && (
                              <div>
                                <div className="text-xs font-bold text-primary mb-1">Notes:</div>
                                <div className="text-xs text-gray-300">{token.notes}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TokenEffects>
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

            {/* Party Overview - Show when no token selected and feature is enabled */}
            {showPartyOverview && !selectedToken && (
              <PartyOverview
                tokens={tokens.filter(t => t.type === 'hero' || t.type === 'companion')}
              />
            )}
          </div>
        </div>

        {/* Dice Roller - Floating Animations Only (if enabled) */}
        {showDiceInViewport && (
          <DiceRoller
            showDiceMenu={false}
            setShowDiceMenu={() => { }}
            diceCount={diceCount}
            setDiceCount={setDiceCount}
            rollDice={rollDice}
            rollingDice={rollingDice}
            diceRolls={diceRolls}
            hideButton={true}
          />
        )}

        {!isPopoutMode && (
          <TurnOrderPanel
            sidebarView={sidebarView}
            setSidebarView={setSidebarView}
            deleteMode={deleteMode}
            setDeleteMode={setDeleteMode}
            displayTurnOrder={displayTurnOrder}
            tokens={tokens}
            turnOrder={turnOrder}
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            expandedConditions={expandedConditions}
            setExpandedConditions={setExpandedConditions}
            expandedNotes={expandedNotes}
            setExpandedNotes={setExpandedNotes}
            tokenSize={tokenSize}
            handleRemoveToken={handleRemoveToken}
            getTokenBorderColor={getTokenBorderColor}
            getTokenBgColor={getTokenBgColor}
            getTokenIcon={getTokenIcon}
            tokenManager={tokenManager}
            turnOrderManager={turnOrderManager}
            doomedConditions={doomedConditions}
            majorConditions={majorConditions}
            minorConditions={minorConditions}
            SIDEBAR_WIDTH={SIDEBAR_WIDTH}
            updateNotes={tokenManager.updateNotes}
            onPopout={handlePopout}
            // Dice Roller props
            showDiceMenu={showDiceMenu}
            setShowDiceMenu={setShowDiceMenu}
            diceCount={diceCount}
            setDiceCount={setDiceCount}
            rollDice={rollDice}
            rollingDice={rollingDice}
            diceRolls={diceRolls}
            showDiceInViewport={showDiceInViewport}
            setShowDiceInViewport={setShowDiceInViewport}
            // Settings props
            showSettings={showSettings}
            setShowSettings={setShowSettings}
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
            showPartyOverview={showPartyOverview}
            setShowPartyOverview={setShowPartyOverview}
            exportBattle={exportBattle}
            importBattle={importBattle}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
          />
        )}
      </div>
    </div>
  );
}
