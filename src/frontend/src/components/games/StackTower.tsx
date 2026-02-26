import { useCallback, useEffect, useRef, useState } from "react";

const W = 400;
const H = 500;
const BLOCK_H = 30;
const BASE_W = 200;

export default function StackTower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const stateRef = useRef({
    blocks: [] as { x: number; w: number }[],
    mover: { x: 0, w: BASE_W, dir: 1 },
    speed: 2,
    score: 0,
    cameraY: 0,
  });

  const drop = useCallback(() => {
    const s = stateRef.current;
    if (!runningRef.current) return;
    const prev = s.blocks[s.blocks.length - 1] ?? { x: W / 2 - BASE_W / 2, w: BASE_W };
    const mx = s.mover.x;
    const mw = s.mover.w;
    // Calculate overlap
    const left = Math.max(mx, prev.x);
    const right = Math.min(mx + mw, prev.x + prev.w);
    const overlap = right - left;
    if (overlap <= 0) {
      runningRef.current = false;
      setGameState("dead");
      return;
    }
    s.blocks.push({ x: left, w: overlap });
    s.score++;
    s.speed = Math.min(6, 2 + s.score * 0.1);
    setScore(s.score);
    // Camera scrolls up
    if (s.blocks.length > 10) {
      s.cameraY = (s.blocks.length - 10) * BLOCK_H;
    }
    // New mover
    s.mover = { x: 0, w: overlap, dir: 1 };
  }, []);

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f0a1e";
    ctx.fillRect(0, 0, W, H);

    // Draw blocks
    const visibleStart = s.cameraY;
    s.blocks.forEach((block, i) => {
      const y = H - (i + 1) * BLOCK_H + visibleStart;
      if (y > H || y + BLOCK_H < 0) return;
      const hue = (i * 20) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
      ctx.fillRect(block.x, y, block.w, BLOCK_H - 2);
    });

    // Draw moving block
    const moverY = H - (s.blocks.length + 1) * BLOCK_H + visibleStart;
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(s.mover.x, moverY, s.mover.w, BLOCK_H - 2);

    // Move
    s.mover.x += s.speed * s.mover.dir;
    if (s.mover.x + s.mover.w > W) { s.mover.x = W - s.mover.w; s.mover.dir = -1; }
    if (s.mover.x < 0) { s.mover.x = 0; s.mover.dir = 1; }

    // Score
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${s.score}`, 10, 30);

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    const s = stateRef.current;
    s.blocks = [{ x: W / 2 - BASE_W / 2, w: BASE_W }];
    s.mover = { x: 0, w: BASE_W, dir: 1 };
    s.speed = 2;
    s.score = 0;
    s.cameraY = 0;
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
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); drop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drop]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🏗️ Stack Tower</span>
        <span className="font-mono text-cyan-200 text-sm">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-cyan-500/30 cursor-pointer max-w-full"
        onClick={gameState === "playing" ? drop : startGame}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Game Over! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
            Try Again
          </button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">Click or Space to drop the block</p>}
    </div>
  );
}
