import { useCallback, useEffect, useRef, useState } from "react";

const COLS = 5;
const ROWS = 10;
const CELL = 56;

type Cell = { value: number } | null;

function randValue() { return [2, 4, 8, 16][Math.floor(Math.random() * 4)]; }

export default function NumberCruncher() {
  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [falling, setFalling] = useState<{ col: number; value: number } | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const fallingRef = useRef(falling);
  const gridRef = useRef(grid);

  useEffect(() => { fallingRef.current = falling; }, [falling]);
  useEffect(() => { gridRef.current = grid; }, [grid]);

  const spawnTile = useCallback(() => {
    setFalling({ col: Math.floor(Math.random() * COLS), value: randValue() });
  }, []);

  const dropTile = useCallback((col: number) => {
    const g = gridRef.current;
    const f = fallingRef.current;
    if (!f || phase !== "playing") return;

    // Find bottom-most empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!g[r][col]) { row = r; break; }
    }
    if (row === -1) return; // Column full

    // Place tile
    let newGrid = g.map(r => [...r]);
    newGrid[row][col] = { value: f.value };

    // Merge same values in column
    let merged = true;
    let gained = 0;
    while (merged) {
      merged = false;
      for (let r = ROWS - 1; r > 0; r--) {
        if (newGrid[r][col] && newGrid[r - 1][col] && newGrid[r][col]!.value === newGrid[r - 1][col]!.value) {
          const newVal = newGrid[r][col]!.value * 2;
          gained += newVal;
          // Remove both, add merged below
          newGrid[r][col] = { value: newVal };
          newGrid[r - 1][col] = null;
          // Compact column
          const colCells: Cell[] = [];
          for (let cr = 0; cr < ROWS; cr++) colCells.push(newGrid[cr][col]);
          const nonNull = colCells.filter(Boolean) as { value: number }[];
          const padded = [...Array(ROWS - nonNull.length).fill(null), ...nonNull];
          for (let cr = 0; cr < ROWS; cr++) newGrid[cr][col] = padded[cr];
          merged = true;
          break;
        }
      }
    }

    if (gained > 0) setScore(s => s + gained);

    // Check game over: top row occupied
    const topFull = newGrid[0].some(c => c !== null);
    if (topFull) {
      setGrid(newGrid);
      setFalling(null);
      setPhase("done");
      return;
    }

    setGrid(newGrid);
    spawnTile();
  }, [phase, spawnTile]);

  const startGame = useCallback(() => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setScore(0);
    setPhase("playing");
    setFalling({ col: Math.floor(Math.random() * COLS), value: randValue() });
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const f = fallingRef.current;
      if (!f) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); setFalling(prev => prev ? { ...prev, col: Math.max(0, prev.col - 1) } : null); }
      if (e.key === "ArrowRight") { e.preventDefault(); setFalling(prev => prev ? { ...prev, col: Math.min(COLS - 1, prev.col + 1) } : null); }
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); if (f) dropTile(f.col); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, dropTile]);

  const getColor = (v: number) => {
    const colors: Record<number, string> = {
      2: "#6ee7b7", 4: "#34d399", 8: "#059669", 16: "#047857",
      32: "#fbbf24", 64: "#f59e0b", 128: "#d97706",
      256: "#ef4444", 512: "#dc2626", 1024: "#a78bfa",
    };
    return colors[v] ?? "#7c3aed";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🔢 Number Cruncher</span>
        <span className="font-mono text-violet-200 text-sm">Score: {score}</span>
      </div>

      {/* Column buttons + grid */}
      <div className="flex gap-0">
      {[0, 1, 2, 3, 4].map(col => (
        <div key={`nc-col-${col}`} className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => falling && dropTile(col)}
            disabled={phase !== "playing" || !falling}
            className={`w-14 h-8 rounded-t text-xs font-display transition-colors ${
              falling?.col === col
                ? "bg-violet-500 text-white"
                : "bg-zinc-700 hover:bg-violet-600 text-muted-foreground"
            }`}
          >
            ↓
          </button>
          {grid.map((row, ri) => (
            <div
              key={`nc-cell-${col * ROWS + ri}`}
              style={{ width: CELL, height: CELL, backgroundColor: row[col] ? getColor(row[col]!.value) : "#1a1a2e", border: "1px solid #27272a" }}
              className="flex items-center justify-center font-display font-bold text-sm"
            >
              {row[col] ? row[col]!.value : ""}
            </div>
          ))}
        </div>
      ))}
      </div>

      {/* Falling preview */}
      {falling && phase === "playing" && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Next:</span>
          <div
            style={{ backgroundColor: getColor(falling.value) }}
            className="w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm text-black"
          >
            {falling.value}
          </div>
          <span className="text-muted-foreground text-xs">Col {falling.col + 1}</span>
        </div>
      )}

      {phase === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}
      {phase === "done" && (
        <div className="text-center space-y-2">
          <p className="text-red-400 font-display text-xl">Column full! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">Play Again</button>
        </div>
      )}
      {phase === "playing" && <p className="text-muted-foreground text-xs">Click column or ← → ↓/Space to drop</p>}
    </div>
  );
}
