import React from 'react'
import ReactDOM from 'react-dom/client'
import NimbleCombatTracker from './NimbleCombatTracker.jsx'
import PopoutWindow from './components/PopoutWindow.jsx'
import { AnimationStyles } from './effects/animations.jsx'
import './index.css'

// Simple routing based on URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const isPopout = urlParams.get('popout') === 'true';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnimationStyles />
    {isPopout ? <PopoutWindow /> : <NimbleCombatTracker />}
  </React.StrictMode>,
)
