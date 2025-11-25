# Nimble Combat Tracker

A web-based combat tracker (or VTT) for tabletop RPG "Nimble" built with React. Track actions, health, conditions, and more with an intuitive drag-and-drop interface.

## Features

- 🎲 Action tracking with turn order
- 💚 Health and temporary HP management
- 🎨 Drawing tools for tactical maps
- 🖼️ Custom background and token images
- 📝 Notes and conditions tracking
- 🌙 Darkness/Fog effect
- 🎯 Multiple token types (Hero, Companion, Monster, Legendary)
- 💾 Save and load game states

## Live Demo

Visit: https://[your-username].github.io/nimble-combat-tracker/

## Getting Started Locally

### Prerequisites
- Node.js 16+ installed on your computer

### Installation

1. Clone this repository:
```bash
git clone https://github.com/[your-username]/nimble-combat-tracker.git
cd nimble-combat-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deployment to GitHub Pages

This project is configured to deploy to GitHub Pages. The deployment happens automatically via GitHub Actions when you push to the main branch.

### Manual Deployment Steps:

1. Make sure your changes are committed
2. Push to GitHub:
```bash
git push origin main
```

3. GitHub Actions will automatically build and deploy your site
4. Your site will be live at: `https://[your-username].github.io/nimble-combat-tracker/`

## How to Use

1. **Add Tokens**: Click "Add Token" to create heroes, companions, or monsters
2. **Upload Background**: Use the upload button to add a battle map
3. **Drag Tokens**: Click and drag tokens to position them on the map
4. **Track Initiative**: Use the sidebar to manage turn order
5. **Health Management**: Click tokens to adjust HP and add conditions
6. **Drawing Tools**: Use the drawing tools to mark areas and ranges
7. **Save/Load**: Export your game state and load it later

## Technologies Used

- React
- Vite
- Lucide React (icons)
- HTML5 Canvas

## License

MIT License - feel free to use and modify for your games!
