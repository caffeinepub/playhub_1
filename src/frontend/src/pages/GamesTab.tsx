import { useState } from "react";
import { Gamepad2, Brain, ChevronRight } from "lucide-react";
import SnakeGame from "../components/games/SnakeGame";
import MemoryGame from "../components/games/MemoryGame";

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
] as const;

type GameId = "snake" | "memory" | null;

export default function GamesTab() {
  const [activeGame, setActiveGame] = useState<GameId>(null);

  if (activeGame === "snake") {
    return (
      <section className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Games
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-display text-sm text-violet-300">🐍 Snake</span>
        </div>
        <div className="flex justify-center">
          <div className="game-panel">
            <SnakeGame />
          </div>
        </div>
      </section>
    );
  }

  if (activeGame === "memory") {
    return (
      <section className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Games
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-display text-sm text-cyan-300">🧠 Memory Match</span>
        </div>
        <div className="flex justify-center">
          <div className="game-panel">
            <MemoryGame />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl font-700 gradient-text">Games Arcade</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pick a game and beat your high score
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        {GAMES.map((game, i) => (
          <button
            key={game.id}
            type="button"
            onClick={() => setActiveGame(game.id)}
            className={`game-select-card animate-fade-in-up stagger-${i + 1} text-left`}
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
                  <h3 className="font-display text-base font-700 text-foreground">
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

      {/* Coming soon section */}
      <div className="mt-8 p-5 rounded-xl border border-violet/10 bg-surface-1/50">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm font-display tracking-wide">MORE COMING SOON</span>
        </div>
        <p className="text-muted-foreground/60 text-xs">
          Tetris, Breakout, and more arcade classics are on the way.
        </p>
      </div>
    </section>
  );
}
