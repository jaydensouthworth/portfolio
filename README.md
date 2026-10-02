# Jayden’s Realm

A personal portfolio built around moving through three connected worlds: an introduction, selected projects, and a computational contact space.

The project combines a Canvas2D environment with HTML content and an SVG portal boundary. Native scrolling moves through the same destination visible inside each opening, with reversible travel and independent visual identities for each world.

## Features

- Three dimensional environments with procedural materials and localized animation
- Project notes for Store Shoppers, Aethel, TEnmo, and Vendo-Matic 800
- A continuous Reading view with the same content and color identities
- Keyboard navigation, visible focus states, accessible dialogs, and reduced-motion support
- Responsive layouts and separate touch and desktop travel pacing
- A full-size mobile folio with horizontal project browsing and uninterrupted vertical world travel

## Structure

- `dist/shared/` — rendering, interaction, and styles
- `dist/index.html` — the portfolio document
- `content/portfolio.json` — project and background content
- `tools/` — page generation and static-asset validation
- `dist/assets/` — local fonts and the outlined R favicon

Built with JavaScript, Canvas2D, SVG, HTML, and CSS.

## Font credits

Realm Display is a subset of Open Sans Condensed Bold, licensed under Apache 2.0. Realm Overprint is a renamed subset of Tourney Black Italic, licensed under SIL OFL 1.1. License texts are included in `dist/assets/`.
