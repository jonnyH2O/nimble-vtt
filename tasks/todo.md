
## Summary of Changes
- Adjusted the `zIndex` of the Darkness/Fog of War overlay in `src/NimbleCombatTracker.jsx` from `10` to `20` to ensure it renders on top of tokens (which have `zIndex: 10`).
- Adjusted the `zIndex` of the "Selection rings for hidden tokens" overlay in `src/NimbleCombatTracker.jsx` from `11` to `25` to ensure it remains visible above the darkness layer.

## Verification
- Checked that Darkness overlay now has `zIndex: 20`.
- Checked that Selection Rings overlay now has `zIndex: 25`.
- Verified that these values are appropriate relative to:
  - Tokens (`zIndex: 10`)
  - Canvas (`zIndex: 5`)
  - HUD (`zIndex: 50`)

This change ensures that tokens in darkness are properly obscured by the fog of war, while maintaining visibility of selection indicators for the GM.
