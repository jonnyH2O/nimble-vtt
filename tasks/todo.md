# Tasks

- [x] Prevent Party Status token container from expanding >3 emojis wide <!-- id: 0 -->
    - [x] Change `flex flex-wrap` to `grid grid-cols-3 w-fit` in `PartyOverview.jsx` <!-- id: 1 -->

## Review
- Modified `src/components/PartyOverview.jsx` to use CSS Grid for displaying conditions.
- Used `grid-cols-3` to enforce a maximum of 3 items per row.
- Added `w-fit` to ensure the grid container doesn't expand to fill the full width of the card, but rather fits its content (up to the 3 columns). This effectively prevents the container from widening when more conditions are added, causing them to stack vertically instead.
