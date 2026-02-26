import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type Grid = Cell[][];
type GameState = "idle" | "playing" | "won" | "lost";

const CELL_IDS = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (__, c) => `ms-${r}-${c}`)
);

function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(grid: Grid, safeR: number, safeC: number): Grid {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (g[r][c].isMine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    g[r][c].isMine = true;
    placed++;
  }
  // Count adjacents
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && g[nr][nc].isMine) count++;
        }
      }
      g[r][c].adjacentMines = count;
    }
  }
  return g;
}

function reveal(grid: Grid, r: number, c: number): Grid {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  const queue: [number, number][] = [[r, c]];
  while (queue.length) {
    const [cr, cc] = queue.shift()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    const cell = g[cr][cc];
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          queue.push([cr + dr, cc + dc]);
    }
  }
  return g;
}

const NUM_COLORS: Record<number, string> = {
  1: "oklch(0.65 0.20 220)",
  2: "oklch(0.65 0.20 150)",
  3: "oklch(0.65 0.23 15)",
  4: "oklch(0.55 0.22 270)",
  5: "oklch(0.60 0.22 10)",
  6: "oklch(0.65 0.19 195)",
  7: "oklch(0.55 0.22 290)",
  8: "oklch(0.65 0.02 270)",
};

export default function MinesweeperGame() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const checkWin = useCallback((g: Grid) => {
    const unrevealed = g.flat().filter(c => !c.isRevealed).length;
    return unrevealed === MINE_COUNT;
  }, []);

  const handleReveal = useCallback((r: number, c: number) => {
    if (gameState === "won" || gameState === "lost") return;
    setGrid(prev => {
      const cell = prev[r][c];
      if (cell.isRevealed || cell.isFlagged) return prev;

      let g = prev;
      // First click: place mines
      if (gameState === "idle") {
        g = placeMines(prev, r, c);
        setGameState("playing");
        startTimer();
      }

      if (g[r][c].isMine) {
        // Reveal all mines
        const exploded = g.map(row => row.map(cell =>
          cell.isMine ? { ...cell, isRevealed: true } : cell
        ));
        setGameState("lost");
        stopTimer();
        toast.error("💥 BOOM! You hit a mine!");
        return exploded;
      }

      const revealed = reveal(g, r, c);
      if (checkWin(revealed)) {
        setGameState("won");
        stopTimer();
        toast.success("🎉 You cleared the minefield!");
      }
      return revealed;
    });
  }, [gameState, startTimer, stopTimer, checkWin]);

  const handleFlag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState === "won" || gameState === "lost" || gameState === "idle") return;
    setGrid(prev => {
      const cell = prev[r][c];
      if (cell.isRevealed) return prev;
      const g = prev.map(row => row.map(c => ({ ...c })));
      g[r][c].isFlagged = !g[r][c].isFlagged;
      setFlagCount(fc => g[r][c].isFlagged ? fc + 1 : fc - 1);
      return g;
    });
  }, [gameState]);

  const reset = useCallback(() => {
    stopTimer();
    setGrid(createEmptyGrid());
    setGameState("idle");
    setFlagCount(0);
    setTime(0);
  }, [stopTimer]);

  const minesLeft = MINE_COUNT - flagCount;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stats */}
      <div className="flex gap-4 text-center w-full max-w-xs justify-between">
        <div className="score-chip flex-1">
          <span className="score-label">💣</span>
          <span className="score-value">{minesLeft}</span>
        </div>
        <div className="score-chip flex-1">
          <span className="score-label">Time</span>
          <span className="score-value gradient-text">{time}s</span>
        </div>
        <button type="button" onClick={reset}
          className="px-3 py-1 rounded-lg border border-violet/30 text-violet-300 text-lg hover:bg-violet/10 transition-colors self-center">
          {gameState === "won" ? "😎" : gameState === "lost" ? "😵" : "🙂"}
        </button>
      </div>

      {/* Grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "2px solid oklch(0.62 0.22 290 / 0.3)", background: "oklch(0.12 0.016 270)" }}
      >
        {grid.map((row, r) => (
          <div key={CELL_IDS[r][0].split("-").slice(0, 2).join("-")} className="flex">
            {row.map((cell, c) => {
              const cid = CELL_IDS[r][c];
              let bg = "oklch(0.17 0.022 270)";
              let content: React.ReactNode = "";
              let textColor = "transparent";

              if (cell.isRevealed) {
                bg = "oklch(0.13 0.016 270)";
                if (cell.isMine) {
                  bg = "oklch(0.58 0.22 25 / 0.5)";
                  content = "💣";
                } else if (cell.adjacentMines > 0) {
                  content = cell.adjacentMines;
                  textColor = NUM_COLORS[cell.adjacentMines] ?? "oklch(0.65 0.02 270)";
                }
              } else if (cell.isFlagged) {
                content = "🚩";
              }

              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => handleReveal(r, c)}
                  onContextMenu={e => handleFlag(e, r, c)}
                  className="w-9 h-9 text-sm font-bold flex items-center justify-center transition-colors duration-75 select-none"
                  style={{
                    background: bg,
                    color: textColor,
                    fontFamily: "Oxanium, sans-serif",
                    fontSize: typeof content === "number" ? 14 : 18,
                    border: "1px solid oklch(0.20 0.025 270)",
                    cursor: cell.isRevealed ? "default" : "pointer",
                    boxShadow: !cell.isRevealed && gameState !== "lost" && gameState !== "won"
                      ? "inset 0 1px 0 oklch(1 0 0 / 0.08), inset 0 -1px 0 oklch(0 0 0 / 0.2)"
                      : undefined,
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Status messages */}
      {gameState === "won" && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-2xl font-bold gradient-text mb-1">Minefield Cleared! 🎉</p>
          <p className="text-muted-foreground text-sm mb-3">Time: {time}s</p>
          <button type="button" onClick={reset}
            className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            New Game
          </button>
        </div>
      )}

      {gameState === "lost" && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-2xl font-bold text-destructive mb-3">💥 Game Over</p>
          <button type="button" onClick={reset}
            className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            Try Again
          </button>
        </div>
      )}

      {gameState === "idle" && (
        <p className="text-muted-foreground text-xs font-display tracking-wide">Left click to reveal · Right click to flag</p>
      )}
    </div>
  );
}
