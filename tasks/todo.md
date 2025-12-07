# Tasks

- [x] Remove unused `SettingsPanel.jsx` file <!-- id: 0 -->
- [x] Remove unused `SettingsPanel` import in `TurnOrderPanel.jsx` <!-- id: 1 -->
- [x] Remove unused `showSettings` props in `TurnOrderPanel.jsx` <!-- id: 2 -->
- [x] Remove unused `showSettings` state in `NimbleCombatTracker.jsx` <!-- id: 3 -->
- [x] Place Import and Export buttons side-by-side with Import first <!-- id: 4 -->

## Review
- Deleted `src/components/SettingsPanel.jsx` as it was unused and its functionality is duplicated within `TurnOrderPanel.jsx`.
- Removed `SettingsPanel` import and unused `showSettings` props from `TurnOrderPanel.jsx`.
- Cleaned up `NimbleCombatTracker.jsx` by removing the unused `showSettings` state and its prop passing.
- Updated the "Import & Export" section in `TurnOrderPanel.jsx` to display the "Import Battle" and "Export Battle" buttons side-by-side (flex row) with equal width, placing "Import Battle" on the left.
