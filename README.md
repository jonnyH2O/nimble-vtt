# Nimble Combat Tracker

A web-based combat tracker (or VTT) for tabletop RPG "Nimble" built with React. Track actions, health, conditions, and more with an intuitive drag-and-drop interface.

## Features

- 🛡️ Action tracking with turn order
- 🎲 Dice menu for quick rolls
- 💚 Health and temporary HP management
- 🎨 Drawing tools for tactical maps
- 🖼️ Custom background and token images
- 📝 Notes and conditions tracking
- 🌙 Darkness/Fog effect
- 🎯 Multiple token types (Hero, Companion, Monster, Legendary)
- 💾 Save and load game states

## Live Demo

Visit: https://jonnyh2o.github.io/nimble-vtt/

## How to Use

Start by downloading "ExampleBattle.json", then open up the live demo and import the json. From here you can test out the VTT's current features. 

1. **Add Tokens**: Click "Add Token" to create heroes, companions, or monsters
2. **Upload Background**: Use the upload button to add a battle map
3. **Drag Tokens**: Click and drag tokens to position them on the map
4. **Track Initiative**: Use the sidebar to manage turn order
5. **Conditions**: Click token info button to adjust TEMP HP and add conditions
6. **Drawing Tools**: Use the drawing tools to mark areas and ranges
7. **Settings**: Use settings to adjust token sizes, grid, and if it's dark
8. **Save/Load**: Export your game state and load it later

## Getting Started Locally

### Prerequisites
- Node.js 16+ installed on your computer

### Installation

1. Clone this repository:
```bash
git clone https://github.com/jonnyh2o/nimble-vtt.git
cd nimble-vtt
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to localhost

## Technologies Used

- React
- Vite
- Lucide React (icons)
- HTML5 Canvas

## License

MIT License - feel free to use and modify for your games!
