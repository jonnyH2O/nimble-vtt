/**
 * Returns the tailwind class for the health color based on the percentage
 * @param {number} healthPercent - 0 to 100
 * @returns {string} Tailwind class name
 */
export const getHealthColor = (healthPercent) => {
    if (healthPercent <= 10) return 'bg-health-critical';
    if (healthPercent <= 50) return 'bg-health-warning';
    return 'bg-health-healthy';
};

/**
 * Calculates the health percentage
 * @param {number} current - Current health
 * @param {number} max - Max health
 * @returns {number} Percentage (0-100)
 */
export const getHealthPercent = (current, max) => {
    return max > 0 ? (current / max) * 100 : 0;
};

/**
 * Calculates the resource percentage
 * @param {number} current - Current resource
 * @param {number} max - Max resource
 * @returns {number} Percentage (0-100)
 */
export const getResourcePercent = (current, max) => {
    return max > 0 ? (current / max) * 100 : 0;
};

/**
 * Token Type Styling Configuration
 */
export const TOKEN_STYLES = {
    hero: {
        border: 'border-hero-highlight',
        bg: 'bg-hero',
        icon: 'Users'
    },
    enemy: {
        border: 'border-enemy-highlight',
        bg: 'bg-enemy',
        icon: 'Swords'
    },
    companion: {
        border: 'border-companion-highlight',
        bg: 'bg-companion',
        icon: 'Heart'
    },
    legendary: {
        border: 'border-legendary-highlight',
        bg: 'bg-legendary',
        icon: 'Crown'
    }
};

/**
 * Helper function to get token border color class
 */
export function getTokenBorderColor(type) {
    return TOKEN_STYLES[type]?.border || 'border-gray-500';
}

/**
 * Helper function to get token background color class
 */
export function getTokenBgColor(type) {
    return TOKEN_STYLES[type]?.bg || 'bg-gray-600';
}

/**
 * Helper function to get token icon name
 */
export function getTokenIconName(type) {
    return TOKEN_STYLES[type]?.icon || 'Users';
}
