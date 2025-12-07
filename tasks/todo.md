# Tasks

- [x] Update `src/hooks/useTokens.js` to accept `x` and `y` in `addToken`. <!-- id: 0 -->
- [x] Update `src/NimbleCombatTracker.jsx` to calculate "top middle" coordinates relative to the viewport and pass them to `addToken`. <!-- id: 1 -->
- [x] Verify the changes. <!-- id: 2 -->

# Review
- Modified `src/hooks/useTokens.js` to optionally accept `x` and `y` properties in the `addToken` payload. If provided, these values are used for the new token's position; otherwise, it falls back to the default position (100, 100).
- Modified `src/NimbleCombatTracker.jsx`'s `handleAddToken` function.
    - It now calculates the `startX` and `startY` for the new token.
    - `startX` is calculated to center the token horizontally in the current viewport: `(boardWidth / 2 - viewOffset.x) / zoomLevel - (tokenSize / 2)`.
    - `startY` is calculated to place the token 50px from the top of the current viewport: `(50 - viewOffset.y) / zoomLevel`.
    - These calculated coordinates are passed to `tokenManager.addToken`.
