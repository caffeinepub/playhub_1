# PlayHub

## Current State
PlayHub has 4 tabs: Videos, Games, AI Assistant, and AI Video Studio. The Games tab has 26 games already implemented as individual React components under `src/frontend/src/components/games/`.

Existing games: Snake, Memory Match, Tetris, Breakout, 2048, Whack-A-Mole, Flappy Bird, Sudoku, Minesweeper, Pong, Connect Four, Space Invaders, Type Racer, Reaction Time, Color Matcher, Word Guess, Mini Crossword, Tower Defense, Bubble Shooter, Chess, Trivia Quiz, 15 Puzzle, Asteroids, Simon Says, Platformer Run, Math Blaster.

## Requested Changes (Diff)

### Add
20 new modern-day game components, each fully playable in-browser with no dependencies:
1. **Geometry Dash** (id: geodash) - Tap/space to jump over spikes in a rhythm-runner. Arcade / Endless
2. **Dino Run** (id: dinorun) - Offline dino-style obstacle runner. Jump cacti and birds. Endless
3. **Wordle Blitz** (id: wordleblitz) - Speed Wordle: 3 words in 60 seconds, one-letter-per-second timer. Brain / Timed
4. **Pixel Art Draw** (id: pixelart) - 16x16 grid pixel canvas with color palette, draw freely. Creative
5. **Idle Clicker** (id: idleclicker) - Cookie-clicker style: click to earn, buy upgrades to automate. Idle
6. **Maze Runner** (id: maze) - Navigate a procedurally generated maze with arrow keys, beat the clock. Puzzle
7. **Among Us Impostor** (id: impostor) - Quick deduction mini-game: spot the impostor in a crew lineup from behavioral clues. Logic
8. **Battle Ships** (id: battleships) - Classic Battleship vs AI on 10x10 grid. Strategy / 2-Player
9. **Boggle** (id: boggle) - 4x4 letter grid, find words before the timer runs out. Word / Timed
10. **Number Cruncher** (id: numbercruncher) - Merge identical number tiles (like 2048 but vertical columns). Puzzle
11. **Stack Tower** (id: stacktower) - Tap to stack blocks; perfect alignment gives bonus. Arcade
12. **Fruit Ninja** (id: fruitninja) - Slice fruits flying across the screen, avoid bombs. Reflex
13. **Candy Crush Clone** (id: candycrush) - Match-3 gem swapping puzzle with move counter. Puzzle
14. **Piano Tiles** (id: pianotiles) - Tap black tiles falling down, avoid white tiles. Reflex / Music
15. **Checkers** (id: checkers) - Full draughts vs AI on 8x8 board. Strategy / Classic
16. **Hangman** (id: hangman) - Guess the word letter by letter before the man is hanged. Word
17. **Duck Hunt** (id: duckhunt) - Click ducks flying across the screen before they escape. 3 rounds. Reflex
18. **Crossy Road** (id: crossyroad) - Hop across traffic lanes and river logs, go as far as you can. Endless
19. **Ballz** (id: ballz) - Launch balls to break numbered bricks (like BB-style brick breaker). Arcade
20. **Retro Racer** (id: retroracer) - Pseudo-3D top-down road racer, dodge oncoming cars. Speed / Arcade

### Modify
- `GamesTab.tsx`: import all 20 new game components, add their metadata to the `GAMES` array, extend the `GameId` union type, and add render cases in the active-game view. Update the subtitle count from "26 games" to "46 games".

### Remove
Nothing removed.

## Implementation Plan
1. Create 20 new game component files in `src/frontend/src/components/games/`.
2. Each game must be self-contained (no external API calls), playable with keyboard/mouse, and handle its own score/state.
3. Update `GamesTab.tsx` to register all 20 new games.

## UX Notes
- Alternate violet/cyan color assignments to maintain visual rhythm.
- Badge labels should match the game genre (see list above).
- Use canvas-based rendering for action games (Geometry Dash, Dino Run, Fruit Ninja, Duck Hunt, Crossy Road, Piano Tiles, Retro Racer, Stack Tower).
- Non-canvas games use standard React state (Wordle Blitz, Pixel Art, Idle Clicker, Boggle, Battleships, Candy Crush, Checkers, Hangman, Number Cruncher, Ballz, Among Us, Maze).
