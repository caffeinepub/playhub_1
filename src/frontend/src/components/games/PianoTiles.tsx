import { useCallback, useEffect, useRef, useState } from "react";

const W = 400;
const H = 500;
const COLS = 4;
const COL_W = W / COLS;
const TILE_H = 120;
const BOTTOM_LINE = H - 60;

type Tile = { id: number; col: number; y: number; hit: boolean };
let tileId = 0;

export default function PianoTiles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const stateRef = useRef({
    tiles: [] as Tile[],
    score: 0,
    misses: 0,
    frame: 0,
    speed: 3,
    lastCol: -1,
  });

  const hitCol = useCallback((col: number) => {
    const s = stateRef.current;
    if (!runningRef.current) return;
    // Find lowest visible tile in that column
    const candidates = s.tiles.filter(t => !t.hit && t.col === col && t.y + TILE_H >= BOTTOM_LINE - 20 && t.y < BOTTOM_LINE + 20);
    if (candidates.length > 0) {
      const tile = candidates.reduce((a, b) => (a.y > b.y ? a : b));
      tile.hit = true;
      s.score++;
      setScore(s.score);
    }
  }, []);

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    for (let i = 1; i < COLS; i++) {
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i * COL_W, 0);
      ctx.lineTo(i * COL_W, H);
      ctx.stroke();
    }

    // Hit line
    ctx.strokeStyle = "#6d28d9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, BOTTOM_LINE);
    ctx.lineTo(W, BOTTOM_LINE);
    ctx.stroke();

    s.frame++;
    s.speed = 3 + s.score * 0.05;

    // Spawn
    if (s.frame % Math.max(20, 50 - s.score) === 0) {
      let col: number;
      do { col = Math.floor(Math.random() * COLS); } while (col === s.lastCol);
      s.lastCol = col;
      s.tiles.push({ id: tileId++, col, y: -TILE_H, hit: false });
    }

    // Move tiles
    for (const t of s.tiles) {
      if (!t.hit) t.y += s.speed;
    }

    // Check missed
    for (const t of s.tiles) {
      if (!t.hit && t.y > BOTTOM_LINE + 10) {
        t.hit = true;
        s.misses++;
        if (s.misses >= 3) {
          runningRef.current = false;
          setGameState("dead");
          return;
        }
      }
    }

    s.tiles = s.tiles.filter(t => t.y < H + TILE_H);

    // Draw tiles
    for (const t of s.tiles) {
      if (t.hit) continue;
      const x = t.col * COL_W;
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(x + 2, t.y, COL_W - 4, TILE_H - 4);
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, t.y, COL_W - 4, TILE_H - 4);
    }

    // Bottom keys
    for (let i = 0; i < COLS; i++) {
      const x = i * COL_W;
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(x + 2, BOTTOM_LINE, COL_W - 4, H - BOTTOM_LINE - 2);
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, BOTTOM_LINE, COL_W - 4, H - BOTTOM_LINE - 2);
    }

    // HUD
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${s.score}`, 8, 24);
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`Misses: ${s.misses}/3`, 8, 48);

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    stateRef.current = { tiles: [], score: 0, misses: 0, frame: 0, speed: 3, lastCol: -1 };
    setScore(0);
    setGameState("playing");
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, [runLoop]);

  useEffect(() => () => cancelAnimationFrame(animIdRef.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing") return;
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const col = Math.floor(x / COL_W);
      hitCol(col);
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [gameState, hitCol]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { a: 0, s: 1, d: 2, f: 3, A: 0, S: 1, D: 2, F: 3 };
      if (map[e.key] !== undefined) hitCol(map[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState, hitCol]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🎹 Piano Tiles</span>
        <span className="font-mono text-violet-200 text-sm">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-violet-500/30 cursor-pointer"
        onClick={gameState !== "playing" ? startGame : undefined}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">3 misses! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
            Try Again
          </button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">Click tiles or press A/S/D/F</p>}
    </div>
  );
}
