import { useCallback, useEffect, useRef, useState } from "react";

const W = 500;
const H = 380;
const DUCKS_PER_ROUND = 10;
const PASS_THRESHOLD = 6;
const TOTAL_ROUNDS = 3;

type Duck = { id: number; x: number; y: number; vx: number; vy: number; hit: boolean };
let duckId = 0;

export default function DuckHunt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [roundHits, setRoundHits] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const gsRef = useRef({
    ducks: [] as Duck[],
    score: 0,
    round: 1,
    roundHits: 0,
    ducksSpawned: 0,
    frame: 0,
  });

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = gsRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#87ceeb");
    sky.addColorStop(1, "#e0f7fa");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = "#4a7c59";
    ctx.fillRect(0, H - 60, W, 60);

    s.frame++;

    // Spawn
    const spawnInterval = 90;
    if (s.frame % spawnInterval === 0 && s.ducksSpawned < DUCKS_PER_ROUND) {
      s.ducks.push({
        id: duckId++,
        x: Math.random() < 0.5 ? -40 : W + 40,
        y: 60 + Math.random() * (H - 180),
        vx: (Math.random() < 0.5 ? 1 : -1) * (2 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 1.5,
        hit: false,
      });
      s.ducksSpawned++;
    }

    // Move ducks
    for (const d of s.ducks) {
      if (d.hit) continue;
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < -60 || d.x > W + 60) d.hit = true;
      if (d.y < 20) { d.y = 20; d.vy = Math.abs(d.vy); }
      if (d.y > H - 80) { d.y = H - 80; d.vy = -Math.abs(d.vy); }
    }

    // Draw ducks
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of s.ducks) {
      if (!d.hit) {
        ctx.save();
        if (d.vx < 0) { ctx.scale(-1, 1); ctx.fillText("🦆", -d.x, d.y); }
        else ctx.fillText("🦆", d.x, d.y);
        ctx.restore();
      }
    }

    // HUD
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Round ${s.round}/${TOTAL_ROUNDS}  Hits: ${s.roundHits}/10  Score: ${s.score}`, 10, 24);

    // Check round end
    const allGone = s.ducks.every(d => d.hit);
    if (allGone && s.ducksSpawned >= DUCKS_PER_ROUND) {
      if (s.roundHits < PASS_THRESHOLD) {
        runningRef.current = false;
        setGameState("lost");
        return;
      }
      if (s.round >= TOTAL_ROUNDS) {
        runningRef.current = false;
        setGameState("won");
        return;
      }
      s.round++;
      s.roundHits = 0;
      s.ducksSpawned = 0;
      s.ducks = [];
      s.frame = 0;
      setRound(s.round);
      setRoundHits(0);
    }

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    gsRef.current = { ducks: [], score: 0, round: 1, roundHits: 0, ducksSpawned: 0, frame: 0 };
    setScore(0);
    setRound(1);
    setRoundHits(0);
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
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const s = gsRef.current;
      for (const d of s.ducks) {
        if (d.hit) continue;
        if (Math.abs(mx - d.x) < 24 && Math.abs(my - d.y) < 24) {
          d.hit = true;
          s.score++;
          s.roundHits++;
          setScore(s.score);
          setRoundHits(s.roundHits);
          break;
        }
      }
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🦆 Duck Hunt</span>
        <div className="flex gap-2 items-center text-sm font-mono">
          <span className={`px-2 py-0.5 rounded-full font-bold ${
            round === TOTAL_ROUNDS ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
          }`}>Round {round}/{TOTAL_ROUNDS}</span>
          <span className="text-zinc-400">Hits: {roundHits}/10</span>
          <span className="text-cyan-200">Score: {score}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-cyan-500/30 max-w-full"
        style={{ cursor: gameState === "playing" ? "crosshair" : "default" }}
        onClick={gameState !== "playing" ? startGame : undefined}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
          Start Hunt
        </button>
      )}
      {gameState === "won" && (
        <div className="text-center">
          <p className="text-green-400 font-display text-xl mb-2">You passed all rounds! 🎉 Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">Play Again</button>
        </div>
      )}
      {gameState === "lost" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-xl mb-2">Not enough hits! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">Try Again</button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">Click the ducks to shoot! Hit 6/10 to pass</p>}
    </div>
  );
}
