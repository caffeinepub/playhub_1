import { useState, useCallback } from "react";

type Grid = (number | null)[][];

function buildSolved(): Grid {
  const tiles = [...Array(15).keys()].map((n) => n + 1) as (number | null)[];
  tiles.push(null);
  const g: Grid = [];
  for (let r = 0; r < 4; r++) g.push(tiles.slice(r * 4, r * 4 + 4));
  return g;
}

function isSolved(grid: Grid): boolean {
  const flat = grid.flat();
  for (let i = 0; i < 15; i++) {
    if (flat[i] !== i + 1) return false;
  }
  return flat[15] === null;
}

function shuffle(grid: Grid): Grid {
  const flat = grid.flat();
  // Do many random valid moves to shuffle
  let blankIdx = flat.indexOf(null);
  const copy = [...flat];
  for (let i = 0; i < 500; i++) {
    const blankR = Math.floor(blankIdx / 4);
    const blankC = blankIdx % 4;
    const neighbors: number[] = [];
    if (blankR > 0) neighbors.push(blankIdx - 4);
    if (blankR < 3) neighbors.push(blankIdx + 4);
    if (blankC > 0) neighbors.push(blankIdx - 1);
    if (blankC < 3) neighbors.push(blankIdx + 1);
    const swapIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
    [copy[blankIdx], copy[swapIdx]] = [copy[swapIdx], copy[blankIdx]];
    blankIdx = swapIdx;
  }
  const g: Grid = [];
  for (let r = 0; r < 4; r++) g.push(copy.slice(r * 4, r * 4 + 4));
  return g;
}

export default function FifteenPuzzle() {
  const [grid, setGrid] = useState<Grid>(() => shuffle(buildSolved()));
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);

  const handleTileClick = useCallback(
    (r: number, c: number) => {
      if (solved) return;
      // Find blank
      let blankR = -1, blankC = -1;
      outer: for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (grid[row][col] === null) { blankR = row; blankC = col; break outer; }
        }
      }
      // Check adjacency
      const isAdj =
        (Math.abs(r - blankR) === 1 && c === blankC) ||
        (Math.abs(c - blankC) === 1 && r === blankR);
      if (!isAdj) return;

      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[blankR][blankC] = next[r][c];
        next[r][c] = null;
        return next;
      });
      setMoves((m) => m + 1);

      // Check solved after swap
      const next2 = grid.map((row) => [...row]);
      next2[blankR][blankC] = next2[r][c];
      next2[r][c] = null;
      if (isSolved(next2)) setSolved(true);
    },
    [grid, solved]
  );

  const restart = () => {
    setGrid(shuffle(buildSolved()));
    setMoves(0);
    setSolved(false);
  };

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* Score bar */}
      <div className="flex gap-6">
        <div className="score-chip">
          <span className="score-label">Moves</span>
          <span className="score-value">{moves}</span>
        </div>
        {solved && (
          <div className="score-chip">
            <span className="score-label">Status</span>
            <span className="score-value gradient-text">Solved! 🎉</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2">
        {grid.map((row, r) =>
          row.map((tile, c) => (
            <button
              key={`tile-r${r}c${c}-${tile ?? 'blank'}`}
              type="button"
              onClick={() => handleTileClick(r, c)}
              disabled={tile === null}
              className={`w-16 h-16 rounded-xl font-display text-xl font-bold transition-all duration-150 select-none
                ${tile === null
                  ? "bg-transparent border-2 border-dashed border-border/20 cursor-default"
                  : "bg-surface-2 border border-violet/30 text-foreground hover:border-violet/60 hover:bg-violet/10 active:scale-95 cursor-pointer shadow-sm"
                }
              `}
            >
              {tile}
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={restart}
        className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide mt-2"
      >
        New Puzzle
      </button>

      <p className="text-muted-foreground text-xs text-center">
        Slide tiles into order 1–15 with the blank in the bottom right.
      </p>
    </div>
  );
}
