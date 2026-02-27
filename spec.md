# PlayHub

## Current State
PlayHub has 46 games in the arcade (GamesTab.tsx + individual game components), plus Videos, AI Assistant, and AI Video Studio tabs. All games are functional but have basic visuals and minimal polish.

## Requested Changes (Diff)

### Add
- Google-style Snake: bright green board (#35b027 background), bright cell-by-cell grid lines, rounded green snake segments with a slightly lighter head, red circular apple food, minimal clean look matching Google's Snake game
- Each game gets at least one meaningful upgrade (see Implementation Plan below)

### Modify
- SnakeGame.tsx: complete visual overhaul to match Google Snake (bright green board, red apple, clean green snake, white grid lines)
- MemoryGame.tsx: add a timer countdown (60 seconds), larger emoji card set (12 pairs), difficulty selector (Easy/Hard)
- TetrisGame.tsx: add next-piece preview panel, hold piece, soft-drop speed boost
- BreakoutGame.tsx: add multiple ball speed levels, multi-row brick layout with varying colors/points, lives display
- Game2048.tsx: add undo last move, animated tile merges, better color scheme per tile value
- WhackAMole.tsx: add difficulty ramp (moles appear faster over time), combo multiplier
- FlappyBird.tsx: add day/night cycle background, score multiplier at 10/20/30 pipes
- SudokuGame.tsx: add hint button (up to 3 hints per game), error highlighting in red
- MinesweeperGame.tsx: add difficulty presets (Easy 9x9/10 mines, Medium 16x16/40 mines), timer
- PongGame.tsx: add AI difficulty selector (Easy/Hard), speed increase over time
- ConnectFour.tsx: add win animation (flash winning 4 cells), AI opponent option
- SpaceInvaders.tsx: add barrier shields, UFO bonus ship, level progression
- TypeRacer.tsx: add WPM chart at end, more sentence variety
- ReactionTime.tsx: add 5-round average mode, personal best tracking
- ColorMatcher.tsx: add difficulty levels, speed ramp
- WordGuess.tsx: add share result button (copy emoji grid to clipboard)
- CrosswordGame.tsx: add reveal letter hint button
- TowerDefense.tsx: add turret upgrade button, enemy health bars
- BubbleShooter.tsx: add level progression, new bubble colors at higher levels
- ChessGame.tsx: add move history sidebar, capture counts
- TriviaQuiz.tsx: expand question bank to 30 questions, add category filter
- FifteenPuzzle.tsx: add move counter, shuffle animation
- AsteroidsGame.tsx: add shield power-up, score multiplier for streaks
- SimonSays.tsx: add speed increase each round
- PlatformerGame.tsx: add coin counter HUD, more obstacle variety
- MathBlaster.tsx: add difficulty levels (add/subtract/multiply/divide), streak bonus
- GeometryDash.tsx: add background parallax scrolling, obstacle variety
- DinoRun.tsx: add score display, speed increase over time, pterodactyls at high scores
- WordleBlitz.tsx: add word counter HUD, combo timer bonus
- PixelArtDraw.tsx: add fill bucket tool, clear canvas button confirmation
- IdleClicker.tsx: add prestige button at 1M cookies, offline earnings indicator
- MazeRunner.tsx: add timer, best time tracker, maze size options
- BattleShips.tsx: add hit/miss animation, remaining ships counter
- BoggleGame.tsx: add word validity feedback (green flash on valid word), longer word bonus
- NumberCruncher.tsx: add combo multiplier for consecutive merges
- StackTower.tsx: add perfect landing bonus glow effect, height counter
- FruitNinja.tsx: add power-up fruits (golden banana = 5 pts), combo counter
- CandyCrushClone.tsx: add cascade animation delay, level goal display
- PianoTiles.tsx: add tempo selector (slow/normal/fast), streak counter
- CheckersGame.tsx: add king promotion animation glow
- HangmanGame.tsx: add category selector (Animals, Countries, Movies, Tech)
- DuckHunt.tsx: add speed difficulty ramp per round, miss counter
- CrossyRoad.tsx: add score counter, river log obstacles
- BallzGame.tsx: add ball multishot power-up brick
- RetroRacer.tsx: add lap/distance counter, fuel gauge mechanic
- ImpostorGame.tsx: add difficulty (more suspects, less obvious stats)

### Remove
- Nothing removed

## Implementation Plan
1. Restyle SnakeGame.tsx completely: bright #4aad52 green board, white grid lines, rounded green snake, red apple (circle), clear Google-style minimal look
2. Add incremental improvements to every other game component, focusing on the highest-impact changes per game
3. Update GamesTab.tsx description strings to reflect new features

## UX Notes
- Google Snake look: solid bright green (#4aad52) board background, white subtle grid, snake is solid green segments (head slightly lighter, rounded), food is a red circle/apple, score shown above
- All game improvements should feel like natural quality-of-life additions, not bloat
- Keep mobile D-pad controls working for Snake
