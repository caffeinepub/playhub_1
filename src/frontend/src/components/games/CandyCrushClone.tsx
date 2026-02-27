import { useCallback, useState } from "react";

const SIZE = 8;
const COLORS = ["🔴", "🟡", "🔵", "🟢", "🟣"];

function randomGem() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }
function newGrid() { return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, randomGem)); }

function findMatches(grid: string[][]): Set<string> {
  const matched = new Set<string>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      if (grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r][c + 2]) {
        matched.add(`${r},${c}`); matched.add(`${r},${c + 1}`); matched.add(`${r},${c + 2}`);
        if (c + 3 < SIZE && grid[r][c] === grid[r][c + 3]) matched.add(`${r},${c + 3}`);
        if (c + 4 < SIZE && grid[r][c] === grid[r][c + 4]) matched.add(`${r},${c + 4}`);
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      if (grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 2][c]) {
        matched.add(`${r},${c}`); matched.add(`${r + 1},${c}`); matched.add(`${r + 2},${c}`);
        if (r + 3 < SIZE && grid[r][c] === grid[r + 3][c]) matched.add(`${r + 3},${c}`);
        if (r + 4 < SIZE && grid[r][c] === grid[r + 4][c]) matched.add(`${r + 4},${c}`);
      }
    }
  }
  return matched;
}

function collapseGrid(grid: string[][], matched: Set<string>): string[][] {
  const next = grid.map(row => [...row]);
  for (let c = 0; c < SIZE; c++) {
    const col: string[] = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      if (!matched.has(`${r},${c}`)) col.push(next[r][c]);
    }
    while (col.length < SIZE) col.push(randomGem());
    for (let r = SIZE - 1; r >= 0; r--) next[r][c] = col[SIZE - 1 - r];
  }
  return next;
}

export default function CandyCrushClone() {
  const [grid, setGrid] = useState(newGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [phase, setPhase] = useState<"playing" | "done">("playing");

  const processMatches = useCallback((g: string[][]) => {
    let cur = g;
    let added = 0;
    let found = findMatches(cur);
    while (found.size > 0) {
      added += found.size;
      cur = collapseGrid(cur, found);
      found = findMatches(cur);
    }
    setScore(s => s + added * 10);
    return cur;
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (phase !== "playing") return;
    if (!selected) { setSelected([r, c]); return; }
    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }
    const isAdj = (Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r);
    if (!isAdj) { setSelected([r, c]); return; }

    // Swap
    const next = grid.map(row => [...row]);
    [next[sr][sc], next[r][c]] = [next[r][c], next[sr][sc]];

    const matched = findMatches(next);
    if (matched.size === 0) {
      // Swap back (invalid)
      setSelected(null);
      return;
    }

    const final = processMatches(next);
    setGrid(final);
    setSelected(null);
    setMoves(m => {
      const newM = m - 1;
      if (newM <= 0) setPhase("done");
      return newM;
    });
  }, [phase, selected, grid, processMatches]);

  const reset = () => {
    setGrid(newGrid());
    setScore(0);
    setMoves(20);
    setPhase("playing");
    setSelected(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🍬 Candy Crush</span>
        <div className="flex gap-4 items-center">
          <div className={`px-3 py-1 rounded-lg font-display font-bold text-sm border ${
            moves <= 5 ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" :
            moves <= 10 ? "bg-amber-500/20 border-amber-500 text-amber-400" :
            "bg-cyan-500/10 border-cyan-500/40 text-cyan-200"
          }`}>
            {moves} moves left
          </div>
          <span className="font-mono text-green-300 text-sm">Score: {score}</span>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-0.5 bg-zinc-800 p-2 rounded-xl border border-cyan-500/30">
        {grid.map((row, ri) =>
          row.map((gem, ci) => {
            const isSelected = selected?.[0] === ri && selected?.[1] === ci;
            return (
              <button
                key={`gem-${ri * SIZE + ci}`}
                type="button"
                onClick={() => handleClick(ri, ci)}
                className={`w-12 h-12 text-2xl rounded-lg transition-all ${
                  isSelected ? "bg-yellow-400/30 scale-110 ring-2 ring-yellow-400" : "bg-zinc-900 hover:bg-zinc-700"
                }`}
                disabled={phase === "done"}
              >
                {gem}
              </button>
            );
          })
        )}
      </div>

      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-cyan-300 font-display text-xl">Out of moves!</p>
          <p className="text-foreground">Final Score: <span className="text-green-400 font-bold">{score}</span></p>
          <button type="button" onClick={reset} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && <p className="text-muted-foreground text-xs">Click two adjacent gems to swap and match 3+</p>}
    </div>
  );
}
