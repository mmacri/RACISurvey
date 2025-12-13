# UI notes

- Layout: hash-routed single shell (`index.html`) with left navigation, content container, and mode indicator (Static vs Local).
- Pages are fragments in `pages/` loaded into the shell; `assets/router.js` swaps content on `hashchange`.
- Components: cards/panels/pills defined in `assets/styles.css`, tables rendered via `renderTable` in `uiComponents.js`.
- Wizard: three-column layout (sections list, active activity, live decisions/gaps). Buttons are large with minimal text input.
- Responsiveness: grids collapse via `repeat(auto-fit, minmax())` for cards, tables scroll horizontally when needed.
- Visual language: dark theme with accent green; badges show readiness and mode; alerts highlight gaps.
