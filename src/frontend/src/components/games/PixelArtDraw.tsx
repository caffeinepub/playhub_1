import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 16;
const CELL = 28;
const PALETTE = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#a16207", "#6b7280",
];

export default function PixelArtDraw() {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: GRID }, () => Array(GRID).fill("#1a1a2e"))
  );
  const [color, setColor] = useState(PALETTE[0]);
  const painting = useRef(false);

  useEffect(() => {
    const up = () => { painting.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const paint = useCallback((row: number, col: number) => {
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = color;
      return next;
    });
  }, [color]);

  const handleMouseDown = (row: number, col: number) => {
    painting.current = true;
    paint(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (painting.current) paint(row, col);
  };

  const clearGrid = () => {
    setGrid(Array.from({ length: GRID }, () => Array(GRID).fill("#1a1a2e")));
  };

  const fillGrid = () => {
    setGrid(Array.from({ length: GRID }, () => Array(GRID).fill(color)));
  };

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🎨 Pixel Art Draw</span>
        <span className="text-muted-foreground text-sm">16×16 canvas</span>
      </div>

      {/* Grid */}
      <div
        className="border border-zinc-700 rounded-lg overflow-hidden cursor-crosshair"
        style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, ${CELL}px)` }}
      >
        {grid.map((row, ri) =>
          row.map((cellColor, ci) => (
            <button
              type="button"
              key={`px-${ri * GRID + ci}`}
              style={{ width: CELL, height: CELL, backgroundColor: cellColor, boxSizing: "border-box", border: "0.5px solid rgba(255,255,255,0.05)", padding: 0 }}
              onMouseDown={() => handleMouseDown(ri, ci)}
              onMouseEnter={() => handleMouseEnter(ri, ci)}
              aria-label={`pixel ${ri}-${ci}`}
            />
          ))
        )}
      </div>

      {/* Palette */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {PALETTE.map(c => (
          <button
            key={c}
            type="button"
            style={{ backgroundColor: c }}
            className={`w-8 h-8 rounded-md transition-transform hover:scale-110 ${color === c ? "ring-2 ring-white scale-110" : ""}`}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button type="button" onClick={clearGrid} className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-display transition-colors">
          Clear
        </button>
        <button type="button" onClick={fillGrid} className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm font-display transition-colors">
          Fill All
        </button>
      </div>
      <p className="text-muted-foreground text-xs">Click or drag to paint pixels</p>
    </div>
  );
}
