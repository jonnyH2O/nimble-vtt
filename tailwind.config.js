/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--color-background)',
        'surface': 'var(--color-surface)',
        'surface-highlight': 'var(--color-surface-highlight)',
        'border': 'var(--color-border)',
        'primary': 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'secondary': 'var(--color-secondary)',
        'secondary-hover': 'var(--color-secondary-hover)',
        'destructive': 'var(--color-destructive)',
        'destructive-hover': 'var(--color-destructive-hover)',
        'text': 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'button-muted': 'var(--color-button-muted)',
        'button-muted-hover': 'var(--color-button-muted-hover)',
        'tertiary': 'var(--color-tertiary)',
        'tertiary-hover': 'var(--color-tertiary-hover)',
        'token-selected': 'var(--color-token-selected)',
        'doomed-buttons': 'var(--color-doomed-buttons)',
        'doomed-buttons-hover': 'var(--color-doomed-buttons-hover)',
        'major-buttons': 'var(--color-major-buttons)',
        'major-buttons-hover': 'var(--color-major-buttons-hover)',
        'minor-buttons': 'var(--color-minor-buttons)',
        'minor-buttons': 'var(--color-minor-buttons)',
        'minor-buttons-hover': 'var(--color-minor-buttons-hover)',
        'hero': 'var(--color-hero)',
        'enemy': 'var(--color-enemy)',
        'companion': 'var(--color-companion)',
        'legendary': 'var(--color-legendary)',
        'hero-highlight': 'var(--color-hero-highlight)',
        'enemy-highlight': 'var(--color-enemy-highlight)',
        'companion-highlight': 'var(--color-companion-highlight)',
        'legendary-highlight': 'var(--color-legendary-highlight)',
        'health-healthy': 'var(--color-health-healthy)',
        'health-warning': 'var(--color-health-warning)',
        'health-critical': 'var(--color-health-critical)',
      }
    },
  },
  plugins: [

  ],
}
