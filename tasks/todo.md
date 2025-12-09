# Plan: Recover Vertical Space for Legendary Echo Cards

- [x] Remove redundant "Legendary Turn" header (lines 290-294 in `TurnOrderPanel.jsx`) to save vertical space. <!-- id: 0 -->
- [x] Move the Checkmark button for Legendary Echo cards from the right-side actions area to the left-side info area, positioning it next to the "Legendary" type text. <!-- id: 1 -->
- [x] Style the moved button to be compact (smaller width and height) to fit nicely inline. <!-- id: 2 -->
- [x] Move the Legendary Echo checkmark button to the right side of the card. <!-- id: 3 -->
- [x] Increase the button width to `w-24` (twice as wide as `w-12`). <!-- id: 4 -->

# Plan: Replace Hero Action Numbers with Sword Icon

- [x] Import `Sword` icon from `lucide-react` in `TurnOrderPanel.jsx` (line 2). <!-- id: 5 -->
- [x] Replace text content (`actionIndex + 1`) of hero action buttons with `<Sword size={14} />` (around line 852). <!-- id: 6 -->
- [x] Ensure the icon is centered and properly sized. <!-- id: 7 -->

# Plan: Replace Remaining Checkmarks with Sword Icons

- [x] Replace the '✓' character with `<Sword size={14} className="mx-auto" />` in the Legendary Echo action button (around line 435). <!-- id: 8 -->
- [x] Replace the '✓' character with `<Sword size={14} className="mx-auto" />` in the non-hero (Enemy/Legendary/Minion) action buttons (around line 852). <!-- id: 9 -->

# Plan: Toggle Sword/X Icon on Click

- [x] Add `X` to imports from `lucide-react`. <!-- id: 10 -->
- [x] Update Legendary Echo button to show `<X />` when used, `<Sword />` when unused. <!-- id: 11 -->
- [x] Update standard action button to show `<X />` when used, `<Sword />` when unused. <!-- id: 12 -->
- [x] Fix code duplication issue introduced during replacement. <!-- id: 13 -->

# Plan: Hero Shield-X Icon

- [x] Import `ShieldX` from `lucide-react`. <!-- id: 14 -->
- [x] Update logic to show `ShieldX` for hero tokens when action is used AND it's not their active turn. <!-- id: 15 -->
- [x] Fix syntax error introduced by missing `>` closing tag (line 861). <!-- id: 16 -->

# Plan: Adjust Legendary Action Button Width
- [x] Reduce width of Legendary Echo action button from `w-24` to `w-20` (approx 20% smaller). <!-- id: 17 -->
- [x] Make width responsive: `w-12` on mobile, `w-20` on larger screens. <!-- id: 18 -->

# Plan: Preserve Shield Icon when Turn Starts
- [x] Add state `reactionStates` to `TurnOrderPanel` to track actions used as reactions (off-turn). <!-- id: 19 -->
- [x] Use `useEffect` to sync `reactionStates` with token actions, updating state when an action is used off-turn. <!-- id: 20 -->
- [x] Update render logic to display `ShieldX` if the action is in `reactionStates`, even if it is now the active turn. <!-- id: 21 -->

## Review
- Implemented state tracking for hero reactions.
- `ShieldX` icon is preserved when a hero's turn starts if the action was used as a reaction.
- `ShieldX` reverts to `Sword` if the action is reset (untoggled).
