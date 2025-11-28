import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Plus, Users, Swords, Heart, Eraser, Pencil, Info, MousePointer, Settings, Download, FileUp, Dices, AlertCircle, Book, List, Undo2, Redo2, Crown, RotateCcw } from 'lucide-react';

export default function NimbleCombatTracker() {
  const [background, setBackground] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [turnOrder, setTurnOrder] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('select');
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawSize, setDrawSize] = useState(3);
  const [eraseSize, setEraseSize] = useState(10);
  const [cursorPos, setCursorPos] = useState(null);
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({ name: '', type: 'hero', image: null });
  const [draggedTurnIndex, setDraggedTurnIndex] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [panningView, setPanningView] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tokenSize, setTokenSize] = useState(64);
  const [backgroundSize, setBackgroundSize] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [showDiceMenu, setShowDiceMenu] = useState(false);
  const [diceCount, setDiceCount] = useState(1);
  const [diceRolls, setDiceRolls] = useState([]);
  const [rollingDice, setRollingDice] = useState([]);
  const [expandedConditions, setExpandedConditions] = useState({});
  const [shiftHeld, setShiftHeld] = useState(false);
  const [sidebarView, setSidebarView] = useState('turnOrder'); // 'turnOrder' or 'dictionary'
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [darknessMode, setDarknessMode] = useState(false);
  const [heroLightRadius, setHeroLightRadius] = useState(3); // Multiplier of token size
  const [companionLightRadius, setCompanionLightRadius] = useState(2); // Multiplier of token size
  const [darknessIntensity, setDarknessIntensity] = useState(0.95); // 0-1, how dark the shadows are
  
  const drawCanvasRef = useRef(null);
  const boardRef = useRef(null);
  const drawingRef = useRef([]);

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

  const addToken = () => {
    if (newToken.name) {
      const token = {
        id: Date.now(),
        name: newToken.name,
        type: newToken.type,
        image: newToken.image,
        x: 100,
        y: 100,
        actions: newToken.type === 'hero' ? [false, false, false] : 
                 newToken.type === 'legendary' ? [false, false, false, false, false, false] : // 6 actions for legendary (max hero count)
                 [false],
        isActiveTurn: false,
        health: 10,
        maxHealth: 10,
        tempHP: 0,
        showTempHP: false,
        notes: '',
        conditions: [],
        customSize: tokenSize // Start with the default token size
      };
      setTokens([...tokens, token]);
      setTurnOrder([...turnOrder, token.id]);
      setNewToken({ name: '', type: 'hero', image: null });
      setShowAddToken(false);
    }
  };

  const removeToken = (id) => {
    setTokens(tokens.filter(t => t.id !== id));
    setTurnOrder(turnOrder.filter(tid => tid !== id));
    if (selectedToken === id) setSelectedToken(null);
  };

  // Generate display turn order with legendary tokens at top and after each hero
  const getDisplayTurnOrder = () => {
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
  };

  const updateHealth = (tokenId, newHealth) => {
    setTokens(tokens.map(t => {
      if (t.id === tokenId) {
        const clampedHealth = Math.max(0, Math.min(t.maxHealth, newHealth));
        const conditions = t.conditions || [];
        let newConditions = [...conditions];

        // Auto-manage Dying condition (at 0 HP)
        if (clampedHealth === 0) {
          if (!newConditions.includes('Dying')) {
            newConditions.push('Dying');
          }
          // Remove Bloodied when Dying
          newConditions = newConditions.filter(c => c !== 'Bloodied');
        } else {
          // Remove Dying if HP > 0
          newConditions = newConditions.filter(c => c !== 'Dying');

          // Auto-manage Bloodied condition (at or below half HP)
          const isBloodied = clampedHealth <= t.maxHealth / 2;
          if (isBloodied && !newConditions.includes('Bloodied')) {
            newConditions.push('Bloodied');
          } else if (!isBloodied && newConditions.includes('Bloodied')) {
            newConditions = newConditions.filter(c => c !== 'Bloodied');
          }
        }

        return { ...t, health: clampedHealth, conditions: newConditions };
      }
      return t;
    }));
  };

  const updateMaxHealth = (tokenId, newMaxHealth) => {
    setTokens(tokens.map(t => {
      if (t.id === tokenId) {
        const maxHP = Math.max(1, newMaxHealth);
        const clampedHealth = Math.min(t.health, maxHP);
        const conditions = t.conditions || [];
        let newConditions = [...conditions];

        // Auto-manage Dying condition (at 0 HP)
        if (clampedHealth === 0) {
          if (!newConditions.includes('Dying')) {
            newConditions.push('Dying');
          }
          // Remove Bloodied when Dying
          newConditions = newConditions.filter(c => c !== 'Bloodied');
        } else {
          // Remove Dying if HP > 0
          newConditions = newConditions.filter(c => c !== 'Dying');

          // Auto-manage Bloodied condition (at or below half HP)
          const isBloodied = clampedHealth <= maxHP / 2;
          if (isBloodied && !newConditions.includes('Bloodied')) {
            newConditions.push('Bloodied');
          } else if (!isBloodied && newConditions.includes('Bloodied')) {
            newConditions = newConditions.filter(c => c !== 'Bloodied');
          }
        }

        return { ...t, maxHealth: maxHP, health: clampedHealth, conditions: newConditions };
      }
      return t;
    }));
  };

  const updateNotes = (tokenId, notes) => {
    setTokens(tokens.map(t => 
      t.id === tokenId ? { ...t, notes } : t
    ));
  };

  const updateTokenSize = (tokenId, size) => {
    setTokens(tokens.map(t => 
      t.id === tokenId ? { ...t, customSize: size } : t
    ));
  };

  const updateTempHP = (tokenId, tempHP) => {
    setTokens(tokens.map(t => 
      t.id === tokenId ? { ...t, tempHP: Math.max(0, tempHP) } : t
    ));
  };

  const toggleTempHP = (tokenId) => {
    setTokens(tokens.map(t => 
      t.id === tokenId ? { ...t, showTempHP: !t.showTempHP } : t
    ));
  };

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

  const toggleCondition = (tokenId, condition) => {
    setTokens(tokens.map(t => {
      if (t.id === tokenId) {
        const conditions = t.conditions || [];
        const hasCondition = conditions.includes(condition);
        return {
          ...t,
          conditions: hasCondition
            ? conditions.filter(c => c !== condition)
            : [...conditions, condition]
        };
      }
      return t;
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

  const conditionEmojis = {
    'Bloodied': '🩸',
    'Dying': '💀',
    'Wounded': '🩹',
    'Blinded': '🌫️',
    'Invisible': '🫥',
    'Dazed': '😵‍💫',
    'Charmed': '💖',
    'Taunted': '😜',
    'Frightened': '👻',
    'Grappled': '🤼',
    'Riding': '🪑',
    'Petrified': '🪨',
    'Restrained': '⛓️',
    'Incapacitated': '😵',
    'Poisoned': '🧪',
    'Slowed': '🐌',
    'Prone': '🙇',
    'Hampered': '🕸️',
    'Smoldering': '🔥',
    'Charged': '🌩️',
    'Distracted': '🌀'
  };

  const toggleAction = (tokenId, actionIndex) => {
    setTokens(tokens.map(t => {
      if (t.id === tokenId && t.actions) {
        const newActions = [...t.actions];
        newActions[actionIndex] = !newActions[actionIndex];
        return { ...t, actions: newActions };
      }
      return t;
    }));
  };

  const startTurn = (tokenId) => {
    setTokens(tokens.map(t => {
      if (t.id === tokenId && t.type === 'hero') {
        return { ...t, isActiveTurn: true };
      }
      return t;
    }));
  };

  const endTurn = (tokenId) => {
    setTokens(tokens.map(t => {
      if (t.id === tokenId && t.type === 'hero') {
        return { ...t, isActiveTurn: false, actions: [false, false, false] };
      }
      return t;
    }));
  };

  const resetNonHeroActions = () => {
    setTokens(tokens.map(t => {
      if (t.type !== 'hero') {
        // Reset all actions to false for non-hero tokens
        return { ...t, actions: t.actions.map(() => false) };
      }
      return t;
    }));
  };

  const handleMouseDown = (e, tokenId) => {
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
  };

  const handleWheel = (e) => {
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
  };

  const handleBoardMouseDown = (e) => {
    if (drawMode === 'select') {
      e.preventDefault();
      setPanningView(true);
      setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
      
      if (e.target === boardRef.current) {
        setSelectedToken(null);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCursorPos({ x, y });
    }

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
      setTokens(tokens.map(t =>
        t.id === dragging ? { ...t, x, y } : t
      ));
    }
    
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
  };

  const handleMouseUp = () => {
    if (drawing) {
      saveToHistory();
    }
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    setDrawing(false);
    setPanningView(false);
    drawingRef.current = [];
  };

  const handleMouseLeave = () => {
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    setDrawing(false);
    setPanningView(false);
    drawingRef.current = [];
    setCursorPos(null);
  };

  const handleDrawStart = (e) => {
    if (e.target === drawCanvasRef.current && drawMode !== 'select') {
      setDrawing(true);
      const rect = boardRef.current.getBoundingClientRect();
      // Adjust for zoom and pan
      const x = (e.clientX - rect.left - viewOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - viewOffset.y) / zoomLevel;
      drawingRef.current = [{ x, y }];
    }
  };

  const clearDrawings = () => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const saveToHistory = () => {
    if (!drawCanvasRef.current) return;
    
    const canvas = drawCanvasRef.current;
    const imageData = canvas.toDataURL();
    
    // Remove any future history if we're not at the end
    const newHistory = drawingHistory.slice(0, historyStep + 1);
    newHistory.push(imageData);
    
    // Limit history to last 50 steps to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
      setDrawingHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    } else {
      setDrawingHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep);
    }
  };

  const redo = () => {
    if (historyStep < drawingHistory.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep);
    }
  };

  const restoreFromHistory = (step) => {
    if (!drawCanvasRef.current || step < 0 || step >= drawingHistory.length) return;
    
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = drawingHistory[step];
  };

  const handleTurnDragStart = (index) => {
    setDraggedTurnIndex(index);
  };

  const handleTurnDragOver = (e, index) => {
    e.preventDefault();
    if (draggedTurnIndex !== null && draggedTurnIndex !== index) {
      const newOrder = [...turnOrder];
      const draggedId = newOrder[draggedTurnIndex];
      newOrder.splice(draggedTurnIndex, 1);
      newOrder.splice(index, 0, draggedId);
      setTurnOrder(newOrder);
      setDraggedTurnIndex(index);
    }
  };

  const handleTurnDragEnd = () => {
    setDraggedTurnIndex(null);
  };

  const rollDice = (sides) => {
    const rolls = [];
    let total = 0;
    
    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }
    
    const rollId = Date.now();
    
    // Show "rolling" animation first
    const rollingRoll = {
      id: rollId,
      dice: `${diceCount}d${sides}`,
      rolling: true
    };
    
    setRollingDice(prev => [...prev, rollingRoll]);
    setShowDiceMenu(false);
    
    // After 2.5 seconds, show the actual result
    setTimeout(() => {
      setRollingDice(prev => prev.filter(r => r.id !== rollId));
      
      const newRoll = {
        id: rollId,
        dice: `${diceCount}d${sides}`,
        rolls: rolls,
        total: total,
        fading: false
      };
      
      setDiceRolls(prev => [...prev, newRoll]);
      
      // Start fading after 5 seconds
      setTimeout(() => {
        setDiceRolls(prev => prev.map(r => 
          r.id === rollId ? { ...r, fading: true } : r
        ));
        
        // Remove completely after fade (3 more seconds)
        setTimeout(() => {
          setDiceRolls(prev => prev.filter(r => r.id !== rollId));
        }, 3000);
      }, 5000);
    }, 2500);
  };

  const exportBattle = () => {
    const canvas = drawCanvasRef.current;
    const drawingData = canvas ? canvas.toDataURL() : null;
    
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
        if (battleState.tokens) setTokens(battleState.tokens);
        if (battleState.turnOrder) setTurnOrder(battleState.turnOrder);
        if (battleState.background) setBackground(battleState.background);
        if (battleState.backgroundSize) setBackgroundSize(battleState.backgroundSize);
        if (battleState.tokenSize) setTokenSize(battleState.tokenSize);
        if (battleState.zoomLevel) setZoomLevel(battleState.zoomLevel);
        if (battleState.viewOffset) setViewOffset(battleState.viewOffset);
        if (battleState.gridSize !== undefined) setGridSize(battleState.gridSize);
        if (battleState.showGrid !== undefined) setShowGrid(battleState.showGrid);
        if (battleState.darknessMode !== undefined) setDarknessMode(battleState.darknessMode);
        if (battleState.heroLightRadius !== undefined) setHeroLightRadius(battleState.heroLightRadius);
        if (battleState.companionLightRadius !== undefined) setCompanionLightRadius(battleState.companionLightRadius);
        if (battleState.darknessIntensity !== undefined) setDarknessIntensity(battleState.darknessIntensity);
        
        // Restore drawings
        if (battleState.drawings && drawCanvasRef.current) {
          const canvas = drawCanvasRef.current;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            // Reset history after import
            const newHistory = [canvas.toDataURL()];
            setDrawingHistory(newHistory);
            setHistoryStep(0);
          };
          img.src = battleState.drawings;
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
      if (drawCanvasRef.current && boardRef.current) {
        const canvas = drawCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = boardRef.current.getBoundingClientRect();
        
        // Save current canvas content before resizing
        const imageData = canvas.toDataURL();
        
        // Resize canvas
        canvas.width = rect.width;
        canvas.height = rect.height;
        
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
    
    const handleResize = () => {
      updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Initialize history with blank canvas if empty
    if (drawCanvasRef.current && drawingHistory.length === 0) {
      const blankCanvas = drawCanvasRef.current.toDataURL();
      setDrawingHistory([blankCanvas]);
      setHistoryStep(0);
    }
  }, [drawCanvasRef.current]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setShiftHeld(true);
      }
      
      // Redo: Ctrl+Shift+Z (or Cmd+Shift+Z on Mac) - check this first
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        redo();
        return;
      }
      
      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
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
  }, [historyStep, drawingHistory]);

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
              <div className="absolute left-0 top-12 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50 w-80">
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
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={addToken}
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

            <div className="h-8 w-px bg-gray-600"></div>
            
            <button
              onClick={() => setDrawMode('select')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm ${
                drawMode === 'select' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <MousePointer size={16} />
              Select
            </button>
            
            <button
              onClick={() => setDrawMode('draw')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm ${
                drawMode === 'draw' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Pencil size={16} />
              Draw
            </button>
            
            <button
              onClick={() => setDrawMode('erase')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm ${
                drawMode === 'erase' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Eraser size={16} />
              Erase
            </button>
            
            {drawMode !== 'select' && <div className="h-8 w-px bg-gray-600"></div>}
            
            {drawMode === 'draw' && (
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            )}
            
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
                
                <div className="h-8 w-px bg-gray-600"></div>
                
                <button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  className={`px-2 py-1.5 rounded flex items-center gap-1 text-sm ${
                    historyStep <= 0 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                
                <button
                  onClick={redo}
                  disabled={historyStep >= drawingHistory.length - 1}
                  className={`px-2 py-1.5 rounded flex items-center gap-1 text-sm ${
                    historyStep >= drawingHistory.length - 1
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 size={16} />
                </button>
                
                <button
                  onClick={clearDrawings}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              </>
            )}
            
            {drawMode === 'select' && (
              <>
                <div className="h-8 w-px bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Zoom:</span>
                  <button
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                    className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
                    className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setViewOffset({ x: 0, y: 0 });
                    }}
                    className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowDiceMenu(!showDiceMenu)}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded flex items-center justify-center relative"
          >
            <Dices size={20} />
          </button>

          {showDiceMenu && (
            <div className="absolute right-80 top-12 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50 w-64">
              <h3 className="text-sm font-bold mb-3">Roll Dice</h3>
              
              <div className="mb-4">
                <label className="text-sm block mb-2">Number of Dice</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-700 px-3 py-2 rounded text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => rollDice(4)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                >
                  d4
                </button>
                <button
                  onClick={() => rollDice(6)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                >
                  d6
                </button>
                <button
                  onClick={() => rollDice(8)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                >
                  d8
                </button>
                <button
                  onClick={() => rollDice(10)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                >
                  d10
                </button>
                <button
                  onClick={() => rollDice(12)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                >
                  d12
                </button>
                <button
                  onClick={() => rollDice(20)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                >
                  d20
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded flex items-center justify-center"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 top-12 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50 w-64">
                <h3 className="text-sm font-bold mb-3">Display Settings</h3>
                
                <div className="space-y-4">
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

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold">Show Grid</label>
                      <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`px-3 py-1 rounded text-sm ${
                          showGrid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
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

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold">Darkness Mode</label>
                      <button
                        onClick={() => setDarknessMode(!darknessMode)}
                        className={`px-3 py-1 rounded text-sm ${
                          darknessMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-500'
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

                  <div className="border-t border-gray-700 pt-4 space-y-2">
                    <h3 className="text-sm font-bold mb-2">Save/Load</h3>
                    <button
                      onClick={exportBattle}
                      className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                    >
                      <Download size={16} />
                      Export Battle
                    </button>
                    <label className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <FileUp size={16} />
                      Import Battle
                      <input type="file" accept=".json" onChange={importBattle} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dice roll results overlay */}
      <style>{`
        @keyframes spinSlow {
          0% {
            transform: rotate(0deg);
          }
          10% {
            transform: rotate(3600deg);
          }
          20% {
            transform: rotate(6480deg);
          }
          30% {
            transform: rotate(8640deg);
          }
          40% {
            transform: rotate(10080deg);
          }
          50% {
            transform: rotate(11160deg);
          }
          60% {
            transform: rotate(11880deg);
          }
          70% {
            transform: rotate(12420deg);
          }
          80% {
            transform: rotate(12780deg);
          }
          90% {
            transform: rotate(13050deg);
          }
          95% {
            transform: rotate(13185deg);
          }
          100% {
            transform: rotate(13320deg);
          }
        }
        .dice-spin {
          animation: spinSlow 2.5s linear forwards;
        }
        .dice-pop {
          animation: pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .dice-fade {
          animation: fadeOut 3s ease-out forwards;
        }
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>

      {(rollingDice.length > 0 || diceRolls.length > 0) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
          {[...rollingDice.map(r => ({ ...r, type: 'rolling' })), ...diceRolls.map(r => ({ ...r, type: 'result' }))]
            .sort((a, b) => b.id - a.id)
            .map((item) => 
              item.type === 'rolling' ? (
                <div
                  key={`rolling-${item.id}`}
                  className="bg-purple-600 text-white px-8 py-6 rounded-lg shadow-2xl border-4 border-purple-400 transition-all duration-300"
                >
                  <div className="text-center dice-spin">
                    <div className="text-6xl">🎲</div>
                  </div>
                </div>
              ) : (
                <div
                  key={`result-${item.id}`}
                  className={`bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl border-4 border-green-400 transition-all duration-300 ${
                    item.fading ? 'dice-fade' : 'dice-pop'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold mb-1">{item.dice}</div>
                    <div className="text-3xl font-bold">{item.total}</div>
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
            onWheel={handleWheel}
          >
            <div 
              className="absolute inset-0"
              style={{
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
                className={`absolute inset-0 ${drawMode === 'select' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                onMouseDown={handleDrawStart}
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
                    {tokens.filter(t => t.type === 'hero' || t.type === 'companion').map((token) => {
                      const currentTokenSize = token.customSize || tokenSize;
                      const lightRadius = token.type === 'hero' 
                        ? currentTokenSize * heroLightRadius 
                        : currentTokenSize * companionLightRadius;
                      
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
                      {tokens.filter(t => t.type === 'hero' || t.type === 'companion').map((token) => {
                        const currentTokenSize = token.customSize || tokenSize;
                        const lightRadius = token.type === 'hero' 
                          ? currentTokenSize * heroLightRadius 
                          : currentTokenSize * companionLightRadius;
                        const centerX = token.x + currentTokenSize / 2;
                        const centerY = token.y + currentTokenSize / 2;
                        
                        return (
                          <circle
                            key={`light-${token.id}`}
                            cx={centerX}
                            cy={centerY}
                            r={lightRadius}
                            fill={`url(#gradient-${token.id})`}
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
                    
                    // Check if token is lit (visible)
                    const currentTokenSize = t.customSize || tokenSize;
                    const lightSources = tokens.filter(lt => lt.type === 'hero' || lt.type === 'companion');
                    for (const source of lightSources) {
                      const sourceSize = source.customSize || tokenSize;
                      const lightRadius = source.type === 'hero' 
                        ? sourceSize * heroLightRadius 
                        : sourceSize * companionLightRadius;
                      
                      const sourceCenterX = source.x + sourceSize / 2;
                      const sourceCenterY = source.y + sourceSize / 2;
                      const tokenCenterX = t.x + currentTokenSize / 2;
                      const tokenCenterY = t.y + currentTokenSize / 2;
                      
                      const distance = Math.sqrt(
                        Math.pow(tokenCenterX - sourceCenterX, 2) + 
                        Math.pow(tokenCenterY - sourceCenterY, 2)
                      );
                      
                      if (distance <= lightRadius) {
                        return false; // Token is visible, don't show ring
                      }
                    }
                    return true; // Token is hidden, show ring
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
                
                // Check if token is in darkness (only for enemies and legendaries)
                const isInDarkness = darknessMode && (token.type === 'enemy' || token.type === 'legendary');
                let tokenIsLit = false;
                
                if (isInDarkness) {
                  // Check if this token is within light radius of any hero or companion
                  const lightSources = tokens.filter(t => t.type === 'hero' || t.type === 'companion');
                  for (const source of lightSources) {
                    const sourceSize = source.customSize || tokenSize;
                    const lightRadius = source.type === 'hero' 
                      ? sourceSize * heroLightRadius 
                      : sourceSize * companionLightRadius;
                    
                    const sourceCenterX = source.x + sourceSize / 2;
                    const sourceCenterY = source.y + sourceSize / 2;
                    const tokenCenterX = token.x + currentTokenSize / 2;
                    const tokenCenterY = token.y + currentTokenSize / 2;
                    
                    const distance = Math.sqrt(
                      Math.pow(tokenCenterX - sourceCenterX, 2) + 
                      Math.pow(tokenCenterY - sourceCenterY, 2)
                    );
                    
                    if (distance <= lightRadius) {
                      tokenIsLit = true;
                      break;
                    }
                  }
                }
                
                const shouldShowToken = !isInDarkness || tokenIsLit;
                
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
                          className={`rounded-full border-4 ${getTokenBorderColor(token.type)} relative`}
                          style={{
                            width: `${currentTokenSize}px`,
                            height: `${currentTokenSize}px`,
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
                        {token.conditions && token.conditions.filter(c => c !== 'Bloodied' && c !== 'Dying').length > 0 && shouldShowToken && (
                          <div
                            className="absolute top-0 left-0 right-0 rounded-t-full border-t-4 border-l-4 border-r-4 border-yellow-400"
                            style={{
                              width: `${currentTokenSize}px`,
                              height: `${currentTokenSize / 2}px`,
                              borderBottomLeftRadius: 0,
                              borderBottomRightRadius: 0
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          className={`rounded-full border-4 ${getTokenBorderColor(token.type)} relative`}
                          style={{
                            width: `${currentTokenSize}px`,
                            height: `${currentTokenSize}px`,
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
                        {token.conditions && token.conditions.filter(c => c !== 'Bloodied' && c !== 'Dying').length > 0 && shouldShowToken && (
                          <div
                            className="absolute top-0 left-0 right-0 rounded-t-full border-t-4 border-l-4 border-r-4 border-yellow-400"
                            style={{
                              width: `${currentTokenSize}px`,
                              height: `${currentTokenSize / 2}px`,
                              borderBottomLeftRadius: 0,
                              borderBottomRightRadius: 0
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none"
                      style={{ 
                        top: `-${currentTokenSize * 0.12}px`,
                        fontSize: `${Math.max(10, currentTokenSize * 0.18)}px`,
                        opacity: shouldShowToken ? 1 : 0
                      }}
                    >
                      {token.name}
                      {token.conditions && token.conditions.length > 0 && (
                        <span className="ml-1">
                          {token.conditions.map(condition => conditionEmojis[condition] || '').join(' ')}
                        </span>
                      )}
                    </div>
                    
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
          </div>
        </div>

        <div className="bg-gray-800 border-l border-gray-700 flex flex-col" style={{ width: '352px' }}>
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
                    onClick={resetNonHeroActions}
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
              {getDisplayTurnOrder().map((item, index) => {
                const token = tokens.find(t => t.id === item.id);
                if (!token) return null;
                
                const isLegendaryEcho = item.isLegendaryEcho;
                const isMainLegendary = item.isMainLegendary;
                const actualIndex = turnOrder.indexOf(item.id);
                
                return (
                  <div key={`${item.id}-${index}`}>
                    {isLegendaryEcho && (
                      <div className="flex items-center gap-2 py-1 pl-8">
                        <div className="text-purple-400 text-xs">→ Legendary Turn</div>
                      </div>
                    )}
                    <div
                      draggable={!deleteMode && !isLegendaryEcho && !expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`]}
                      onDragStart={() => !isLegendaryEcho && handleTurnDragStart(actualIndex)}
                      onDragOver={(e) => !isLegendaryEcho && handleTurnDragOver(e, actualIndex)}
                      onDragEnd={handleTurnDragEnd}
                      onClick={() => {
                        if (deleteMode && !isLegendaryEcho) {
                          removeToken(item.id);
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
                                  onChange={(e) => updateTempHP(item.id, parseInt(e.target.value) || 0)}
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
                                onChange={(e) => updateHealth(item.id, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-12 bg-gray-600 text-center rounded px-1 py-0.5 text-sm"
                              />
                              <span className="text-xs text-gray-400">/</span>
                              <input
                                type="number"
                                value={token.maxHealth}
                                onChange={(e) => updateMaxHealth(item.id, parseInt(e.target.value) || 1)}
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
                    
                    {expandedConditions[`${item.id}-${isLegendaryEcho ? 'echo-' + index : 'main'}`] && (
                      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-400">Conditions</label>
                          {/* Temp HP Toggle */}
                          {token.type !== 'legendary' && (
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
                          )}
                        </div>
                        
                        {/* Doomed Conditions */}
                        <div className="mb-3">
                          <div className="text-xs font-bold text-red-400 mb-1">Doomed</div>
                          <div className="flex flex-wrap gap-1">
                            {doomedConditions.map(condition => (
                              <button
                                key={condition}
                                onClick={() => toggleCondition(item.id, condition)}
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
                                onClick={() => toggleCondition(item.id, condition)}
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
                                onClick={() => toggleCondition(item.id, condition)}
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
                          <label className="text-xs font-bold text-gray-300 block mb-2">Token Size</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="32"
                              max="192"
                              step="4"
                              value={token.customSize || tokenSize}
                              onChange={(e) => updateTokenSize(item.id, parseInt(e.target.value))}
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
                                token.isActiveTurn ? endTurn(item.id) : startTurn(item.id);
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
                                  toggleAction(item.id, actionIndex);
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
                                const legendaryTurnIndex = getDisplayTurnOrder()
                                  .slice(0, index)
                                  .filter(i => i.id === item.id && i.isLegendaryEcho).length;
                                toggleAction(item.id, legendaryTurnIndex);
                              }}
                              className={`flex-1 h-8 rounded transition-colors ${
                                token.actions[getDisplayTurnOrder()
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

          {selectedToken && tokens.find(t => t.id === selectedToken) && (
            <div className="border-t border-gray-700 bg-gray-800 p-4">
              <h3 className="text-sm font-bold mb-2">
                {tokens.find(t => t.id === selectedToken).name} - Notes
              </h3>
              <textarea
                value={tokens.find(t => t.id === selectedToken).notes}
                onChange={(e) => updateNotes(selectedToken, e.target.value)}
                placeholder="Track resources, conditions, etc..."
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm resize-none"
                rows={4}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
