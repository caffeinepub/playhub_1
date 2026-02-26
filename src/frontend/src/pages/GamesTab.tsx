import { useState } from "react";
import { Gamepad2, ChevronRight } from "lucide-react";
import SnakeGame from "../components/games/SnakeGame";
import MemoryGame from "../components/games/MemoryGame";
import TetrisGame from "../components/games/TetrisGame";
import BreakoutGame from "../components/games/BreakoutGame";
import Game2048 from "../components/games/Game2048";
import WhackAMole from "../components/games/WhackAMole";
import FlappyBird from "../components/games/FlappyBird";
import SudokuGame from "../components/games/SudokuGame";
import MinesweeperGame from "../components/games/MinesweeperGame";
import PongGame from "../components/games/PongGame";
import ConnectFour from "../components/games/ConnectFour";
import SpaceInvaders from "../components/games/SpaceInvaders";
import TypeRacer from "../components/games/TypeRacer";
import ReactionTime from "../components/games/ReactionTime";
import ColorMatcher from "../components/games/ColorMatcher";
import WordGuess from "../components/games/WordGuess";
import CrosswordGame from "../components/games/CrosswordGame";
import TowerDefense from "../components/games/TowerDefense";
import BubbleShooter from "../components/games/BubbleShooter";
import ChessGame from "../components/games/ChessGame";
import TriviaQuiz from "../components/games/TriviaQuiz";
import FifteenPuzzle from "../components/games/FifteenPuzzle";
import AsteroidsGame from "../components/games/AsteroidsGame";
import SimonSays from "../components/games/SimonSays";
import PlatformerGame from "../components/games/PlatformerGame";
import MathBlaster from "../components/games/MathBlaster";
// 20 new games
import GeometryDash from "../components/games/GeometryDash";
import DinoRun from "../components/games/DinoRun";
import WordleBlitz from "../components/games/WordleBlitz";
import PixelArtDraw from "../components/games/PixelArtDraw";
import IdleClicker from "../components/games/IdleClicker";
import MazeRunner from "../components/games/MazeRunner";
import BattleShips from "../components/games/BattleShips";
import BoggleGame from "../components/games/BoggleGame";
import NumberCruncher from "../components/games/NumberCruncher";
import StackTower from "../components/games/StackTower";
import FruitNinja from "../components/games/FruitNinja";
import CandyCrushClone from "../components/games/CandyCrushClone";
import PianoTiles from "../components/games/PianoTiles";
import CheckersGame from "../components/games/CheckersGame";
import HangmanGame from "../components/games/HangmanGame";
import DuckHunt from "../components/games/DuckHunt";
import CrossyRoad from "../components/games/CrossyRoad";
import BallzGame from "../components/games/BallzGame";
import RetroRacer from "../components/games/RetroRacer";
import ImpostorGame from "../components/games/ImpostorGame";

const GAMES = [
  {
    id: "snake",
    name: "Snake",
    description: "Classic snake game. Eat food, grow longer, don't crash!",
    icon: "🐍",
    color: "violet",
    badge: "Classic",
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Flip cards to find matching emoji pairs. Test your memory!",
    icon: "🧠",
    color: "cyan",
    badge: "Puzzle",
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Stack falling blocks to clear lines. Speed increases each level!",
    icon: "🟦",
    color: "violet",
    badge: "Classic",
  },
  {
    id: "breakout",
    name: "Breakout",
    description: "Break all the bricks with your ball and paddle. 3 lives!",
    icon: "🧱",
    color: "cyan",
    badge: "Arcade",
  },
  {
    id: "2048",
    name: "2048",
    description: "Slide tiles to merge numbers. Reach the 2048 tile!",
    icon: "🔢",
    color: "violet",
    badge: "Strategy",
  },
  {
    id: "whackamole",
    name: "Whack-A-Mole",
    description: "Smash moles as they pop up. 30-second frenzy round!",
    icon: "🐹",
    color: "cyan",
    badge: "Reflex",
  },
  {
    id: "flappy",
    name: "Flappy Bird",
    description: "Tap to flap through pipes. How far can you go?",
    icon: "🐦",
    color: "violet",
    badge: "Endless",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Fill the 9×9 grid so every row, column and box has 1–9.",
    icon: "🔡",
    color: "cyan",
    badge: "Logic",
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    description: "Reveal the grid without hitting any mines. First click is safe!",
    icon: "💣",
    color: "violet",
    badge: "Classic",
  },
  {
    id: "pong",
    name: "Pong",
    description: "Classic 2-player paddle battle. First to 5 points wins!",
    icon: "🏓",
    color: "cyan",
    badge: "2 Player",
  },
  {
    id: "connectfour",
    name: "Connect Four",
    description: "Drop discs to get 4 in a row. Two players, one winner!",
    icon: "🔵",
    color: "violet",
    badge: "2 Player",
  },
  {
    id: "spaceinvaders",
    name: "Space Invaders",
    description: "Blast alien invaders before they reach Earth. 3 lives!",
    icon: "👾",
    color: "cyan",
    badge: "Arcade",
  },
  {
    id: "typeracer",
    name: "Type Racer",
    description: "Race against the clock typing sentences. Calculate your WPM!",
    icon: "⌨️",
    color: "violet",
    badge: "Skill",
  },
  {
    id: "reactiontime",
    name: "Reaction Time",
    description: "How fast are your reflexes? Wait for green and click!",
    icon: "⚡",
    color: "cyan",
    badge: "Reflex",
  },
  {
    id: "colormatcher",
    name: "Color Matcher",
    description: "Click the ink color, not the word. Classic Stroop test!",
    icon: "🎨",
    color: "violet",
    badge: "Brain",
  },
  {
    id: "wordguess",
    name: "Word Guess",
    description: "Guess the 5-letter word in 6 tries. Green = correct spot!",
    icon: "📝",
    color: "cyan",
    badge: "Wordle",
  },
  {
    id: "crossword",
    name: "Mini Crossword",
    description: "Solve a compact 5×5 crossword with across and down clues.",
    icon: "📰",
    color: "violet",
    badge: "Logic",
  },
  {
    id: "towerdefense",
    name: "Tower Defense",
    description: "Place cannons on the grid to stop enemies before they escape. 5 waves!",
    icon: "🏰",
    color: "cyan",
    badge: "Strategy",
  },
  {
    id: "bubbleshooter",
    name: "Bubble Shooter",
    description: "Aim and shoot bubbles to pop groups of 3+ matching colors!",
    icon: "🫧",
    color: "violet",
    badge: "Arcade",
  },
  {
    id: "chess",
    name: "Chess",
    description: "Play chess against the AI. Full 8×8 board with emoji pieces!",
    icon: "♟️",
    color: "cyan",
    badge: "Classic",
  },
  {
    id: "trivia",
    name: "Trivia Quiz",
    description: "10 general knowledge questions. How high can you score?",
    icon: "🧩",
    color: "violet",
    badge: "Brain",
  },
  {
    id: "fifteenpuzzle",
    name: "15 Puzzle",
    description: "Slide tiles to arrange 1–15 in order. Classic brain teaser!",
    icon: "🔢",
    color: "cyan",
    badge: "Puzzle",
  },
  {
    id: "asteroids",
    name: "Asteroids",
    description: "Fly your ship and blast asteroids before they hit you. 3 lives!",
    icon: "☄️",
    color: "violet",
    badge: "Arcade",
  },
  {
    id: "simonsays",
    name: "Simon Says",
    description: "Watch the color sequence then repeat it. How long can you go?",
    icon: "🟢",
    color: "cyan",
    badge: "Memory",
  },
  {
    id: "platformer",
    name: "Platformer Run",
    description: "Jump across procedurally generated platforms and collect coins!",
    icon: "🎮",
    color: "violet",
    badge: "Endless",
  },
  {
    id: "mathblaster",
    name: "Math Blaster",
    description: "Solve arithmetic fast for bonus points. 10 questions, 10 seconds each!",
    icon: "🧮",
    color: "cyan",
    badge: "Brain",
  },
  // 20 New Games
  {
    id: "geometrydash",
    name: "Geometry Dash",
    description: "Auto-run and tap to jump over spikes. How far can you go?",
    icon: "🟥",
    color: "violet",
    badge: "Endless",
  },
  {
    id: "dinorun",
    name: "Dino Run",
    description: "Jump over cacti and dodge birds. 3 lives in this endless runner!",
    icon: "🦕",
    color: "cyan",
    badge: "Endless",
  },
  {
    id: "wordleblitz",
    name: "Wordle Blitz",
    description: "Guess 3 words in 60 seconds! Speed Wordle with a countdown timer.",
    icon: "⚡",
    color: "violet",
    badge: "Timed",
  },
  {
    id: "pixelartdraw",
    name: "Pixel Art Draw",
    description: "Paint on a 16×16 grid with a 12-color palette. Create your masterpiece!",
    icon: "🎨",
    color: "cyan",
    badge: "Creative",
  },
  {
    id: "idleclicker",
    name: "Idle Clicker",
    description: "Click cookies, earn coins, buy upgrades. Cookie-clicker style idle game!",
    icon: "🍪",
    color: "violet",
    badge: "Idle",
  },
  {
    id: "mazerunner",
    name: "Maze Runner",
    description: "Navigate a procedurally generated 15×15 maze. Reach the exit!",
    icon: "🌀",
    color: "cyan",
    badge: "Puzzle",
  },
  {
    id: "battleships",
    name: "Battle Ships",
    description: "Classic Battleship vs AI. Place 5 ships and sink the enemy fleet!",
    icon: "🚢",
    color: "violet",
    badge: "Strategy",
  },
  {
    id: "bogglegame",
    name: "Boggle",
    description: "Find words in the 4×4 letter grid before time runs out. 90 seconds!",
    icon: "🔤",
    color: "cyan",
    badge: "Word",
  },
  {
    id: "numbercruncher",
    name: "Number Cruncher",
    description: "Drop numbered tiles into columns. Same values merge and double!",
    icon: "🔢",
    color: "violet",
    badge: "Puzzle",
  },
  {
    id: "stacktower",
    name: "Stack Tower",
    description: "Drop platforms onto the stack. Overhang gets cut off — how high?",
    icon: "🏗️",
    color: "cyan",
    badge: "Arcade",
  },
  {
    id: "fruitninja",
    name: "Fruit Ninja",
    description: "Swipe to slice fruits but avoid the bombs! 3 missed fruits = game over.",
    icon: "🍉",
    color: "violet",
    badge: "Reflex",
  },
  {
    id: "candycrush",
    name: "Candy Crush",
    description: "Swap adjacent gems to match 3+ in a row. 20 moves to max your score!",
    icon: "🍬",
    color: "cyan",
    badge: "Puzzle",
  },
  {
    id: "pianotiles",
    name: "Piano Tiles",
    description: "Tap black tiles before they pass the line. Miss 3 and it's game over!",
    icon: "🎹",
    color: "violet",
    badge: "Music",
  },
  {
    id: "checkers",
    name: "Checkers",
    description: "Full draughts vs AI on an 8×8 board. Kings on back row!",
    icon: "🔴",
    color: "cyan",
    badge: "Classic",
  },
  {
    id: "hangman",
    name: "Hangman",
    description: "Guess the hidden word letter by letter. 7 wrong guesses and it's over!",
    icon: "🪢",
    color: "violet",
    badge: "Word",
  },
  {
    id: "duckhunt",
    name: "Duck Hunt",
    description: "Shoot ducks as they fly across. Hit 6/10 per round to advance!",
    icon: "🦆",
    color: "cyan",
    badge: "Reflex",
  },
  {
    id: "crossyroad",
    name: "Crossy Road",
    description: "Hop your chicken across roads and rivers. Don't get hit!",
    icon: "🐔",
    color: "violet",
    badge: "Endless",
  },
  {
    id: "ballzgame",
    name: "Ballz",
    description: "Aim and shoot balls to destroy numbered bricks before they reach bottom!",
    icon: "🎱",
    color: "cyan",
    badge: "Arcade",
  },
  {
    id: "retroracer",
    name: "Retro Racer",
    description: "Pseudo-3D road racer. Dodge oncoming cars as speed increases!",
    icon: "🏎️",
    color: "violet",
    badge: "Speed",
  },
  {
    id: "impostorgame",
    name: "Impostor",
    description: "Analyze crew stats and deduce who the impostor is. 10 rounds!",
    icon: "🔍",
    color: "cyan",
    badge: "Logic",
  },
] as const;

type GameId =
  | "snake" | "memory" | "tetris" | "breakout" | "2048" | "whackamole"
  | "flappy" | "sudoku" | "minesweeper" | "pong" | "connectfour" | "spaceinvaders"
  | "typeracer" | "reactiontime" | "colormatcher" | "wordguess"
  | "crossword" | "towerdefense" | "bubbleshooter" | "chess" | "trivia"
  | "fifteenpuzzle" | "asteroids" | "simonsays" | "platformer" | "mathblaster"
  | "geometrydash" | "dinorun" | "wordleblitz" | "pixelartdraw" | "idleclicker"
  | "mazerunner" | "battleships" | "bogglegame" | "numbercruncher" | "stacktower"
  | "fruitninja" | "candycrush" | "pianotiles" | "checkers" | "hangman"
  | "duckhunt" | "crossyroad" | "ballzgame" | "retroracer" | "impostorgame"
  | null;

function GameBreadcrumb({
  name,
  icon,
  color,
  onBack,
}: {
  name: string;
  icon: string;
  color: "violet" | "cyan";
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Games
      </button>
      <span className="text-muted-foreground/40">/</span>
      <span className={`font-display text-sm ${color === "violet" ? "text-violet-300" : "text-cyan-300"}`}>
        {icon} {name}
      </span>
    </div>
  );
}

export default function GamesTab() {
  const [activeGame, setActiveGame] = useState<GameId>(null);

  const activeInfo = GAMES.find(g => g.id === activeGame);

  if (activeGame && activeInfo) {
    return (
      <section className="animate-fade-in-up">
        <GameBreadcrumb
          name={activeInfo.name}
          icon={activeInfo.icon}
          color={activeInfo.color}
          onBack={() => setActiveGame(null)}
        />
        <div className="flex justify-center">
          <div className="game-panel">
            {activeGame === "snake" && <SnakeGame />}
            {activeGame === "memory" && <MemoryGame />}
            {activeGame === "tetris" && <TetrisGame />}
            {activeGame === "breakout" && <BreakoutGame />}
            {activeGame === "2048" && <Game2048 />}
            {activeGame === "whackamole" && <WhackAMole />}
            {activeGame === "flappy" && <FlappyBird />}
            {activeGame === "sudoku" && <SudokuGame />}
            {activeGame === "minesweeper" && <MinesweeperGame />}
            {activeGame === "pong" && <PongGame />}
            {activeGame === "connectfour" && <ConnectFour />}
            {activeGame === "spaceinvaders" && <SpaceInvaders />}
            {activeGame === "typeracer" && <TypeRacer />}
            {activeGame === "reactiontime" && <ReactionTime />}
            {activeGame === "colormatcher" && <ColorMatcher />}
            {activeGame === "wordguess" && <WordGuess />}
            {activeGame === "crossword" && <CrosswordGame />}
            {activeGame === "towerdefense" && <TowerDefense />}
            {activeGame === "bubbleshooter" && <BubbleShooter />}
            {activeGame === "chess" && <ChessGame />}
            {activeGame === "trivia" && <TriviaQuiz />}
            {activeGame === "fifteenpuzzle" && <FifteenPuzzle />}
            {activeGame === "asteroids" && <AsteroidsGame />}
            {activeGame === "simonsays" && <SimonSays />}
            {activeGame === "platformer" && <PlatformerGame />}
            {activeGame === "mathblaster" && <MathBlaster />}
            {activeGame === "geometrydash" && <GeometryDash />}
            {activeGame === "dinorun" && <DinoRun />}
            {activeGame === "wordleblitz" && <WordleBlitz />}
            {activeGame === "pixelartdraw" && <PixelArtDraw />}
            {activeGame === "idleclicker" && <IdleClicker />}
            {activeGame === "mazerunner" && <MazeRunner />}
            {activeGame === "battleships" && <BattleShips />}
            {activeGame === "bogglegame" && <BoggleGame />}
            {activeGame === "numbercruncher" && <NumberCruncher />}
            {activeGame === "stacktower" && <StackTower />}
            {activeGame === "fruitninja" && <FruitNinja />}
            {activeGame === "candycrush" && <CandyCrushClone />}
            {activeGame === "pianotiles" && <PianoTiles />}
            {activeGame === "checkers" && <CheckersGame />}
            {activeGame === "hangman" && <HangmanGame />}
            {activeGame === "duckhunt" && <DuckHunt />}
            {activeGame === "crossyroad" && <CrossyRoad />}
            {activeGame === "ballzgame" && <BallzGame />}
            {activeGame === "retroracer" && <RetroRacer />}
            {activeGame === "impostorgame" && <ImpostorGame />}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl font-bold gradient-text">Games Arcade</h2>
        <p className="text-muted-foreground text-sm mt-1">
          46 games to play — pick one and beat your high score
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game, i) => (
          <button
            key={`game-card-${game.id}`}
            type="button"
            onClick={() => setActiveGame(game.id)}
            className={`game-select-card group animate-fade-in-up stagger-${Math.min(i + 1, 9)} text-left`}
          >
            {/* Glow bg */}
            <div
              className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-xl ${
                game.color === "violet" ? "bg-violet/10" : "bg-cyan/10"
              }`}
            />

            <div className="relative flex items-start gap-4 p-5">
              <div
                className={`game-icon-wrap ${
                  game.color === "violet"
                    ? "border-violet/30 bg-violet/10"
                    : "border-cyan/30 bg-cyan/10"
                }`}
              >
                <span className="text-3xl">{game.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {game.name}
                  </h3>
                  <span
                    className={`text-[10px] font-display tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                      game.color === "violet"
                        ? "border-violet/30 text-violet-300 bg-violet/10"
                        : "border-cyan/30 text-cyan-300 bg-cyan/10"
                    }`}
                  >
                    {game.badge}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {game.description}
                </p>
                <div
                  className={`flex items-center gap-1.5 mt-3 text-xs font-display tracking-wide transition-colors ${
                    game.color === "violet"
                      ? "text-violet-400 group-hover:text-violet-300"
                      : "text-cyan-400 group-hover:text-cyan-300"
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Play Now
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Bottom accent */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-px transition-all duration-300 ${
                game.color === "violet"
                  ? "bg-gradient-to-r from-transparent via-violet/50 to-transparent opacity-0 group-hover:opacity-100"
                  : "bg-gradient-to-r from-transparent via-cyan/50 to-transparent opacity-0 group-hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
