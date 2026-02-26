import { useState, useEffect, useCallback } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

type Board = (number | null)[][];
type Dir = "left" | "right" | "up" | "down";

function createBoard(): Board {
  const b: Board = Array.from({ length: 4 }, () => Array(4).fill(null));
  return addRandom(addRandom(b));
}

function addRandom(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!board[r][c]) empty.push([r, c]);
  if (!empty.length) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = board.map(row => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const nums = row.filter(Boolean) as number[];
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(nums[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged.map(v => v || null), score };
}

function move(board: Board, dir: Dir): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;

  const transform = (b: Board): Board => {
    let nb = b.map(row => [...row]);
    const result: Board = [];
    for (let r = 0; r < 4; r++) {
      let rowData = nb[r];
      if (dir === "right") rowData = [...rowData].reverse();
      const { row: slid, score } = slideRow(rowData);
      const finalRow = dir === "right" ? [...slid].reverse() : slid;
      totalScore += score;
      if (JSON.stringify(finalRow) !== JSON.stringify(nb[r])) moved = true;
      result.push(finalRow);
    }
    return result;
  };

  let nb = board;
  if (dir === "up" || dir === "down") {
    // Transpose
    let transposed: Board = Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (__, c) => board[c][r]));
    if (dir === "down") transposed = transposed.map(row => [...row].reverse());
    const processed = transform(transposed);
    const unprocessed = dir === "down" ? processed.map(row => [...row].reverse()) : processed;
    nb = Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (__, c) => unprocessed[c][r]));
  } else {
    nb = transform(board);
  }

  return { board: nb, score: totalScore, moved };
}

function hasWon(board: Board): boolean {
  return board.some(row => row.some(v => v === 2048));
}

function isGameOver(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) return false;
      if (c < 3 && board[r][c] === board[r][c + 1]) return false;
      if (r < 3 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2:    { bg: "oklch(0.20 0.02 270)", text: "oklch(0.85 0.02 270)" },
  4:    { bg: "oklch(0.22 0.03 270)", text: "oklch(0.85 0.02 270)" },
  8:    { bg: "oklch(0.55 0.18 45)",  text: "oklch(0.99 0 0)" },
  16:   { bg: "oklch(0.60 0.20 35)",  text: "oklch(0.99 0 0)" },
  32:   { bg: "oklch(0.65 0.23 15)",  text: "oklch(0.99 0 0)" },
  64:   { bg: "oklch(0.62 0.23 10)",  text: "oklch(0.99 0 0)" },
  128:  { bg: "oklch(0.72 0.21 160)", text: "oklch(0.99 0 0)" },
  256:  { bg: "oklch(0.65 0.22 175)", text: "oklch(0.99 0 0)" },
  512:  { bg: "oklch(0.72 0.19 195)", text: "oklch(0.99 0 0)" },
  1024: { bg: "oklch(0.65 0.21 220)", text: "oklch(0.99 0 0)" },
  2048: { bg: "oklch(0.62 0.22 290)", text: "oklch(0.99 0 0)" },
};

function tileStyle(val: number | null) {
  if (!val) return { background: "oklch(0.16 0.018 270)", color: "transparent" };
  const cfg = TILE_COLORS[val] ?? { bg: "oklch(0.55 0.22 290)", text: "oklch(0.99 0 0)" };
  return { background: cfg.bg, color: cfg.text };
}

function tileSize(val: number | null): string {
  if (!val || val < 100) return "text-2xl font-bold";
  if (val < 1000) return "text-xl font-bold";
  return "text-base font-bold";
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  const { data: highScore = BigInt(0) } = useGetHighScore("2048");
  const saveScore = useSaveHighScore();

  const handleMove = useCallback((dir: Dir) => {
    if (over || (won && !keepPlaying)) return;
    setBoard(prev => {
      const { board: next, score: pts, moved } = move(prev, dir);
      if (!moved) return prev;
      const withNew = addRandom(next);
      setScore(s => {
        const newScore = s + pts;
        setBestScore(b => Math.max(b, newScore));
        return newScore;
      });
      if (!won && !keepPlaying && hasWon(withNew)) {
        setWon(true);
        toast.success("You reached 2048! 🎉");
      }
      if (isGameOver(withNew)) {
        setOver(true);
      }
      return withNew;
    });
  }, [over, won, keepPlaying]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      handleMove(dir);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  // Touch swipe
  const touchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const sx = t.clientX, sy = t.clientY;
    const onEnd = (e2: TouchEvent) => {
      const dx = e2.changedTouches[0].clientX - sx;
      const dy = e2.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? "right" : "left");
      else handleMove(dy > 0 ? "down" : "up");
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchend", onEnd, { once: true });
  }, [handleMove]);

  const newGame = useCallback(() => {
    setBoard(createBoard());
    const s = score;
    if (s > Number(highScore)) {
      saveScore.mutate({ gameName: "2048", score: BigInt(s) });
    }
    setScore(0);
    setWon(false);
    setOver(false);
    setKeepPlaying(false);
  }, [score, highScore, saveScore]);

  return (
    <div className="flex flex-col items-center gap-4" onTouchStart={touchStart}>
      {/* Score row */}
      <div className="flex gap-3 text-center w-full max-w-xs justify-between">
        <div className="score-chip flex-1">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-chip flex-1">
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">{Math.max(bestScore, Number(highScore))}</span>
        </div>
        <button type="button" onClick={newGame}
          className="px-3 py-1 rounded-lg border border-violet/30 text-violet-300 text-xs font-display tracking-wide hover:bg-violet/10 transition-colors self-center">
          New
        </button>
      </div>

      {/* Board */}
      <div className="relative rounded-xl p-2" style={{ background: "oklch(0.14 0.018 270)" }}>
        <div className="grid grid-cols-4 gap-2">
          {board.flatMap((row, r) => row.map((val, c) => {
            const cellKey = `cell-r${r}c${c}`;
            return (
              <div
                key={cellKey}
                className={`w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-100 ${tileSize(val)}`}
                style={{ ...tileStyle(val), fontFamily: "Oxanium, sans-serif", boxShadow: val && val >= 128 ? `0 0 12px ${tileStyle(val).background}80` : undefined }}
              >
                {val ?? ""}
              </div>
            );
          }))}

        </div>

        {/* Win overlay */}
        {won && !keepPlaying && (
          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3"
            style={{ background: "oklch(0.10 0.015 270 / 0.9)" }}>
            <p className="font-display text-3xl font-bold gradient-text">2048! 🎉</p>
            <p className="text-muted-foreground text-sm">Score: {score}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setKeepPlaying(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-white font-display font-semibold text-sm">
                Keep Going
              </button>
              <button type="button" onClick={newGame}
                className="px-4 py-2 rounded-xl border border-violet/30 text-violet-300 font-display text-sm hover:bg-violet/10 transition-colors">
                New Game
              </button>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {over && (
          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3"
            style={{ background: "oklch(0.10 0.015 270 / 0.9)" }}>
            <p className="font-display text-3xl font-bold text-destructive">Game Over</p>
            <p className="text-muted-foreground text-sm">Score: {score}</p>
            <button type="button" onClick={newGame}
              className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold">
              Try Again
            </button>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-xs font-display tracking-wide">Arrow keys or swipe to merge tiles · Reach 2048!</p>
    </div>
  );
}
