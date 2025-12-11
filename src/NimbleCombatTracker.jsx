import React, { useState, useRef, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Users, Swords, Heart, Crown, ShieldX, Sword, X } from 'lucide-react';
import { HUDDisplay } from './components/HUD';
import Toolbar from './components/Toolbar';
import DMTools from './components/DMTools';
import { TokenEffects, TokenEffectOverlay } from './components/TokenEffects';
import { PartyOverview } from './components/PartyOverview';
import DiceRoller from './components/DiceRoller';
import { useTokens } from './hooks/useTokens';
import { useDrawing } from './hooks/useDrawing';
import { useTurnOrder } from './hooks/useTurnOrder';
import { useDiceRoller } from './hooks/useDiceRoller';
import { useWindowSync } from './hooks/useWindowSync';
import { MESSAGE_TYPES, createMessage } from './utils/windowMessages';
import { VIRTUAL_CANVAS_SIZE, SIDEBAR_WIDTH, HUD_Z_INDEX } from './constants';
import { getTokenBorderColor, getTokenBgColor, getTokenIconName } from './utils/tokenUtils';
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
    } else if (currentTheme === 'retro') {
      document.documentElement.setAttribute('data-theme', 'retro');
    } else if (currentTheme === 'hero') {
      document.documentElement.setAttribute('data-theme', 'hero');
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

  // State to track which actions were used as reactions (off-turn)
  const [reactionStates, setReactionStates] = useState({});

  // Effect to sync reaction states
  useEffect(() => {
    if (!tokens) return;

    let updates = {};
    let hasUpdates = false;

    tokens.forEach(token => {
      if (token.type === 'hero' && token.actions) {
        token.actions.forEach((used, index) => {
          const key = `${token.id}-${index}`;
          const isStoredReaction = reactionStates[key];

          // If action is cleared, clear reaction state
          if (!used && isStoredReaction) {
            updates[key] = false;
            hasUpdates = true;
          }
          // If action is used off-turn, mark as reaction
          // We don't clear it if used && isActiveTurn (preserve history)
          else if (used && !token.isActiveTurn && !isStoredReaction) {
            updates[key] = true;
            hasUpdates = true;
          }
        });
      }
    });

    if (hasUpdates) {
      setReactionStates(prev => ({ ...prev, ...updates }));
    }
  }, [tokens, reactionStates]);

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
  const [lastActionUserId, setLastActionUserId] = useState(null);

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
      // Calculate start position to be top-middle of current view
      let startX = 100;
      let startY = 100;

      if (boardRef.current) {
        const boardWidth = boardRef.current.offsetWidth;
        // Center horizontally in viewport
        // Equation: x * zoom + viewOffset = centerScreen
        // x = (centerScreen - viewOffset) / zoom
        const centerScreenX = boardWidth / 2;
        startX = (centerScreenX - viewOffset.x) / zoomLevel - (tokenSize / 2);

        // Top of viewport with padding
        // Equation: y * zoom + viewOffset = topPadding
        // y = (topPadding - viewOffset) / zoom
        const topPadding = 50;
        startY = (topPadding - viewOffset.y) / zoomLevel;
      }

      const tokenId = tokenManager.addToken({
        ...newToken,
        x: startX,
        y: startY
      });
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
      'width=400,height=1100,left=100,top=100,resizable=yes,scrollbars=yes'
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
      currentTheme: currentTheme,
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

  const loadBattleState = (battleState) => {
    try {
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
      if (battleState.currentTheme !== undefined) setCurrentTheme(battleState.currentTheme);

      // Restore drawings
      if (battleState.drawings) {
        drawingManager.loadDrawing(battleState.drawings);
      }

      // Switch back to turn order view
      setSidebarView('turnOrder');
    } catch (error) {
      console.error('Error loading battle state:', error);
      alert('Error loading battle state. File may be corrupted.');
    }
  };

  const importBattle = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const battleState = JSON.parse(event.target.result);
        loadBattleState(battleState);
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

      // Ignore shortcuts if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Spacebar Tool Toggle (press to Select, release to revert)
      if (e.code === 'Space') {
        // Prevent scrolling
        if (e.target === document.body) {
          e.preventDefault();
        }

        if (!e.repeat && previousDrawModeRef.current === null) {
          previousDrawModeRef.current = drawMode;
          setDrawMode('select');
        }
        return;
      }

      // Token Selection Shortcuts (1-9)
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < turnOrder.length) {
          const tokenId = turnOrder[index];
          // Check if token exists in tokens array (might be hidden/deleted but still in turn order? shouldn't happen but good to check)
          const token = tokens.find(t => t.id === tokenId);
          if (token) {
            setSelectedToken(tokenId);
          }
        }
      }

      // Drawing Tools Shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setDrawMode('select');
      }
      if (e.key === 'd' || e.key === 'D') {
        setDrawMode('draw');
      }
      if (e.key === 'e' || e.key === 'E') {
        setDrawMode('erase');
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
        lastActionUserId,
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
        showPartyOverview,
        currentTheme,
        reactionStates
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
    lastActionUserId,
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
    currentTheme,
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
        case MESSAGE_TYPES.ACTION_TOGGLE: {
          const token = tokens.find(t => t.id === payload.tokenId);
          const willBeUsed = token && !token.actions[payload.actionIndex];
          const isHeroReaction = token && token.type === 'hero' && !token.isActiveTurn;

          tokenManager.toggleAction(payload.tokenId, payload.actionIndex);

          // Track last action user (excluding hero reactions)
          if (willBeUsed && !isHeroReaction) {
            // For legendary tokens, track with echo index so arrow points to the right echo card
            if (token && token.type === 'legendary') {
              setLastActionUserId(`${payload.tokenId}-echo-${payload.actionIndex}`);
            } else {
              setLastActionUserId(payload.tokenId);
            }
          }
          break;
        }
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
          if (payload.currentTheme !== undefined) setCurrentTheme(payload.currentTheme);
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
        case MESSAGE_TYPES.IMPORT_BATTLE_DATA:
          loadBattleState(payload);
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
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden">
          <div
            ref={boardRef}
            className={`relative bg-surface-highlight rounded w-full h-full min-h-[600px] overflow-hidden`}
            style={{
              cursor: drawMode === 'select'
                ? panningView
                  ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 1px 1px black);"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><path d="M7 15c1.49 1.48 3.2 2.34 6 2.34h2a8 8 0 0 0 8-8V8"/></svg>') 12 12, grabbing`
                  : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 1px 1px black);"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>') 12 12, grab`
                : 'default'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleBoardMouseDown}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheel}
          >
            {/* Floating Toolbar */}
            <div
              className="absolute top-4 z-50 bg-surface/90 backdrop-blur-sm p-2 rounded-lg border border-border shadow-lg transition-all duration-300"
              style={{ right: isPopoutMode ? '1rem' : `${SIDEBAR_WIDTH + 32}px` }}
            >
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
                className={`absolute ${drawMode === 'select' ? 'pointer-events-none' : ''}`}
                style={{
                  width: '2000px',
                  height: '2000px',
                  top: 0,
                  left: 0,
                  zIndex: 5,
                  cursor: drawMode === 'draw'
                    ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 1px 1px black);"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>') 0 24, auto`
                    : drawMode === 'erase'
                      ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 1px 1px black);"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>') 0 24, auto`
                      : 'default'
                }}
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
                <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 20 }}>
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
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
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
                    className={`absolute ${drawMode === 'select' ? '' : 'pointer-events-none'}`}
                    style={{
                      left: token.x,
                      top: token.y,
                      cursor: drawMode === 'select'
                        ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 1px 1px black);"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M19 9l3 3-3 3"/><path d="M15 19l-3 3-3-3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>') 12 12, move`
                        : 'inherit'
                    }}
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
                                zIndex: 10,
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
                                zIndex: 10,
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
                            {/* ... existing popup content ... */}
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

                        {/* Action Indicators */}
                        {token.actions && token.type !== 'legendary' && (
                          <div
                            className={`absolute left-1/2 transform -translate-x-1/2 flex justify-center gap-1 bg-surface/90 backdrop-blur-sm p-1 rounded-lg border-2 shadow-lg pointer-events-none ${getTokenBorderColor(token.type)}`}
                            style={{
                              bottom: `-${currentTokenSize * 0.22}px`, // Lowered by 20% (0.1 -> 0.3)
                              zIndex: 15
                            }}
                          >
                            {token.actions.map((used, index) => {
                              const isReaction = reactionStates[`${token.id}-${index}`] || (token.type === 'hero' && used && !token.isActiveTurn);
                              const indicatorSize = Math.max(14, currentTokenSize * 0.24);

                              return (
                                <div
                                  key={index}
                                  className={`rounded-full flex items-center justify-center shadow-sm border border-black/50 ${used
                                    ? 'bg-button-muted-hover'
                                    : token.isActiveTurn
                                      ? 'bg-secondary'
                                      : 'bg-secondary'
                                    }`}
                                  style={{
                                    width: `${indicatorSize}px`,
                                    height: `${indicatorSize}px`,
                                  }}
                                >
                                  {used ? (
                                    isReaction ? (
                                      <ShieldX size={indicatorSize * 0.7} className="text-text" />
                                    ) : (
                                      <X size={indicatorSize * 0.7} className="text-text" />
                                    )
                                  ) : (
                                    <Sword size={indicatorSize * 0.7} className="text-text" />
                                  )}
                                </div>
                              );
                            })}
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
                  borderColor: drawMode === 'erase' ? '#ffffff' : drawColor,
                  backgroundColor: drawMode === 'erase' ? 'rgba(255, 255, 255, 0.2)' : `${drawColor}40`
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

            {/* Turn Order Overlay */}
            {!isPopoutMode && (
              <div
                className="absolute right-4 top-4 bottom-4 z-40 bg-surface border-2 border-border rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                style={{ width: `${SIDEBAR_WIDTH}px` }}
                onMouseDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
              >
                {/* Sidebar (Turn Order / Dictionary / Dice / Settings) */}
                <DMTools
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
                  doomedConditions={doomedConditions}
                  majorConditions={majorConditions}
                  minorConditions={minorConditions}
                  SIDEBAR_WIDTH={SIDEBAR_WIDTH}
                  updateNotes={tokenManager.updateNotes}
                  onPopout={handlePopout}
                  updateTurnOrder={turnOrderManager.setAllTurnOrder}
                  getTokenBorderColor={getTokenBorderColor}
                  getTokenBgColor={getTokenBgColor}
                  getTokenIcon={getTokenIcon}
                  tokenManager={tokenManager}
                  turnOrderManager={turnOrderManager}
                  lastActionUserId={lastActionUserId}
                  setLastActionUserId={setLastActionUserId}
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
                  showSettings={false} // Managed internally by sidebar sidebarView
                  setShowSettings={() => { }}
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
                  // Add Token props
                  handleBackgroundUpload={handleBackgroundUpload}
                  showAddToken={showAddToken}
                  setShowAddToken={setShowAddToken}
                  newToken={newToken}
                  setNewToken={setNewToken}
                  handleAddToken={handleAddToken}
                  handleTokenImageUpload={handleTokenImageUpload}
                  currentTheme={currentTheme}
                  setCurrentTheme={setCurrentTheme}
                  reactionStates={reactionStates}
                  exportBattle={exportBattle}
                  importBattle={importBattle}
                />
              </div>
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


      </div>
    </div >
  );
}
