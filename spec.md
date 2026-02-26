# PlayHub - Video & Games Platform

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Video watching section with a curated list of embedded YouTube videos organized by category
- Games section with playable browser-based mini-games (Snake, Memory Card, Tic-Tac-Toe)
- Navigation between Videos and Games tabs
- Video player UI with title, description, and category tags
- Game selection gallery with thumbnails and descriptions
- In-game UI with score tracking and restart button

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Store video metadata (title, URL, category, description) and game scores (game name, high score)
2. Frontend:
   - Home/landing page with tabs: "Videos" and "Games"
   - Videos tab: grid of video cards with embedded YouTube iframes, filter by category
   - Games tab: grid of game cards; clicking opens a fullscreen game view
   - Implement 3 mini-games in React: Snake, Memory Card Flip, Tic-Tac-Toe
   - Score tracking with local state and persisted high scores via backend

## UX Notes
- Bold, modern dark theme with vibrant accent colors
- Responsive grid layout for both video and game cards
- Smooth tab transitions
- Game UI should be clean and focused with visible score and controls
