
// Centralized Condition Registry
// Single source of truth for all condition visual effects


export const CONDITION_CATEGORIES = {
  DOOMED: ['Bloodied', 'Dying', 'Wounded'],
  MAJOR: [
    'Blinded', 'Invisible', 'Dazed', 'Charmed', 'Taunted', 'Frightened',
    'Grappled', 'Riding', 'Petrified', 'Restrained', 'Incapacitated',
    'Poisoned', 'Slowed', 'Prone', 'Hampered'
  ],
  MINOR: ['Smoldering', 'Charged', 'Distracted']
};


export const CONDITION_EMOJIS = {
  // Doomed
  'Bloodied': '🩸',
  'Dying': '💀',
  'Wounded': '🩹',
  // Major
  'Blinded': '🌫️',
  'Invisible': '🫥',
  'Dazed': '😵‍💫',
  'Charmed': '😍',
  'Taunted': '😡',
  'Frightened': '😰',
  'Grappled': '🤼',
  'Riding': '🏇',
  'Petrified': '🗿',
  'Restrained': '⛓️',
  'Incapacitated': '🚫',
  'Poisoned': '🤢',
  'Slowed': '🐌',
  'Prone': '⬇️',
  'Hampered': '🚧',
  // Minor
  'Smoldering': '💨',
  'Charged': '⚡',
  'Distracted': '💭'
};


// Visual Effect Registry
export const CONDITION_EFFECTS = {
  'Bloodied': {
    tokenOverlay: {
      type: 'boxShadow',
      style: {
        boxShadow: 'inset 0 0 30px 10px rgba(220, 38, 38, 1)',
        animation: 'heartbeat 1.5s ease-in-out infinite'
      }
    },
    sidebarOverlay: {
      type: 'boxShadow',
      style: {
        boxShadow: 'inset 0 0 20px 5px rgba(220, 38, 38, 1)',
        animation: 'heartbeat 1.5s ease-in-out infinite'
      }
    },
    emoji: '🩸',
    category: 'DOOMED'
  },


  'Invisible': {
    tokenStyle: {
      opacity: 0.3
    },
    emoji: '🫥',
    category: 'MAJOR'
  },


  'Dying': {
    tokenStyle: {
      filter: 'saturate(0.2)'
    },
    sidebarStyle: {
      filter: 'saturate(0.2)'
    },
    emoji: '💀',
    category: 'DOOMED'
  },


  'Wounded': {
    emoji: '🩹',
    category: 'DOOMED'
  },


  // Placeholder for other conditions (can be filled in later)
  'Blinded': { emoji: '🌫️', category: 'MAJOR' },
  'Dazed': { emoji: '😵‍💫', category: 'MAJOR' },
  'Charmed': { emoji: '😍', category: 'MAJOR' },
  'Taunted': { emoji: '😡', category: 'MAJOR' },
  'Frightened': { emoji: '😰', category: 'MAJOR' },
  'Grappled': { emoji: '🤼', category: 'MAJOR' },
  'Riding': { emoji: '🏇', category: 'MAJOR' },
  'Petrified': { emoji: '🗿', category: 'MAJOR' },
  'Restrained': { emoji: '⛓️', category: 'MAJOR' },
  'Incapacitated': { emoji: '🚫', category: 'MAJOR' },
  'Poisoned': { emoji: '🤢', category: 'MAJOR' },
  'Slowed': { emoji: '🐌', category: 'MAJOR' },
  'Prone': { emoji: '⬇️', category: 'MAJOR' },
  'Hampered': { emoji: '🚧', category: 'MAJOR' },
  'Smoldering': {
    tokenOverlay: {
      type: 'particles',
      component: 'SmolderingParticles'
    },
    emoji: '💨',
    category: 'MINOR'
  },
  'Charged': { emoji: '⚡', category: 'MINOR' },
  'Distracted': { emoji: '💭', category: 'MINOR' }
};


/**
 * Get all active effects for a token based on its conditions
 * @param {string[]} conditions - Array of condition names
 * @param {string} context - Context for effects ('token' or 'sidebar')
 * @returns {Object} Combined effects object with overlays, styles, and emojis
 */
export function getTokenEffects(conditions = [], context = 'token') {
  const effects = {
    overlays: [],
    styles: {},
    emojis: []
  };


  if (!conditions || !Array.isArray(conditions)) {
    return effects;
  }


  conditions.forEach(condition => {
    const effect = CONDITION_EFFECTS[condition];
    if (!effect) return;


    // Add overlays based on context
    if (context === 'token' && effect.tokenOverlay) {
      effects.overlays.push(effect.tokenOverlay);
    } else if (context === 'sidebar' && effect.sidebarOverlay) {
      effects.overlays.push(effect.sidebarOverlay);
    }


    // Add styles based on context
    if (context === 'token' && effect.tokenStyle) {
      Object.assign(effects.styles, effect.tokenStyle);
    } else if (context === 'sidebar' && effect.sidebarStyle) {
      Object.assign(effects.styles, effect.sidebarStyle);
    }


    // Add emoji
    if (effect.emoji) {
      effects.emojis.push(effect.emoji);
    }
  });


  return effects;
}


/**
 * Check if a condition has visual effects
 * @param {string} condition - Condition name
 * @returns {boolean} True if the condition has visual effects
 */
export function hasVisualEffects(condition) {
  const effect = CONDITION_EFFECTS[condition];
  return !!(effect && (effect.tokenOverlay || effect.tokenStyle || effect.sidebarOverlay || effect.sidebarStyle));
}


