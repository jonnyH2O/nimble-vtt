import React from 'react'
import ReactDOM from 'react-dom/client'
import NimbleCombatTracker from './NimbleCombatTracker.jsx'
import { AnimationStyles } from './effects/animations.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnimationStyles />
    <NimbleCombatTracker />
  </React.StrictMode>,
)
