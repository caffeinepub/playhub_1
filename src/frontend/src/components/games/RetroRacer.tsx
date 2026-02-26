import { useCallback, useEffect, useRef, useState } from "react";

const W = 400;
const H = 480;

type Car = { lane: number; z: number };

export default function RetroRacer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const gsRef = useRef({
    playerLane: 1, // 0=left, 1=center, 2=right
    cars: [] as Car[],
    score: 0,
    speed: 0.02,
    frame: 0,
    horizon: 0,
    laneOffset: 0,
  });

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = gsRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);

    // Sky
    ctx.fillStyle = "#0a0a1e";
    ctx.fillRect(0, 0, W, H / 2);
    // Stars
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect((i * 97 + s.frame * 0.1) % W, (i * 37) % (H / 2), 1, 1);
    }

    // Road perspective
    const vanishX = W / 2;
    const vanishY = H / 2 - 20;
    const roadW = 280;
    const bottomL = vanishX - roadW / 2;
    const bottomR = vanishX + roadW / 2;

    ctx.fillStyle = "#2d2d2d";
    ctx.beginPath();
    ctx.moveTo(vanishX - 10, vanishY);
    ctx.lineTo(vanishX + 10, vanishY);
    ctx.lineTo(bottomR, H);
    ctx.lineTo(bottomL, H);
    ctx.closePath();
    ctx.fill();

    // Road stripes
    const stripeZ = (s.frame * s.speed * 10) % 1;
    for (let i = 0; i < 8; i++) {
      const t = (i / 8 + stripeZ) % 1;
      const y = vanishY + (H - vanishY) * t;
      const halfW = ((roadW / 2) * t);
      const x = vanishX;
      ctx.fillStyle = "rgba(255,255,0,0.4)";
      ctx.fillRect(x - halfW / 3, y - 2, halfW * 2 / 3, 4 * t);
    }

    // Lane markers
    for (let lane = 1; lane < 3; lane++) {
      const lx = bottomL + (bottomR - bottomL) * (lane / 3);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(lx, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Spawn cars
    s.frame++;
    s.speed = Math.min(0.06, 0.02 + s.score / 5000);
    s.score++;
    setScore(s.score);

    const spawnInterval = Math.max(60, 150 - s.score / 100);
    if (s.frame % spawnInterval === 0) {
      const lane = Math.floor(Math.random() * 3);
      s.cars.push({ lane, z: 0 });
    }

    // Move cars
    for (const car of s.cars) car.z += s.speed;
    s.cars = s.cars.filter(c => c.z < 1.05);

    // Draw cars
    for (const car of s.cars) {
      const t = car.z;
      const carW = 50 * t;
      const carH = 30 * t;
      const laneX = bottomL + (bottomR - bottomL) * ((car.lane + 0.5) / 3);
      const laneVX = vanishX;
      const cx = laneVX + (laneX - laneVX) * t;
      const cy = vanishY + (H - vanishY) * t;

      ctx.fillStyle = ["#ef4444", "#3b82f6", "#22c55e"][car.lane];
      ctx.fillRect(cx - carW / 2, cy - carH, carW, carH);
      ctx.fillStyle = "#333";
      ctx.fillRect(cx - carW / 2 + 3, cy - carH + 3, carW - 6, carH / 2);

      // Collision with player (near bottom)
      if (car.z > 0.85 && car.lane === s.playerLane) {
        runningRef.current = false;
        setGameState("dead");
        return;
      }
    }

    // Player car
    const lanePositions = [bottomL + (bottomR - bottomL) * 0.17, W / 2, bottomL + (bottomR - bottomL) * 0.83];
    const px = lanePositions[s.playerLane];
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(px - 25, H - 80, 50, 40);
    ctx.fillStyle = "#333";
    ctx.fillRect(px - 20, H - 76, 40, 20);

    // HUD
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${s.score}`, 8, 24);
    const kmh = Math.floor(60 + s.score / 20);
    ctx.textAlign = "right";
    ctx.fillText(`${kmh} km/h`, W - 8, 24);

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    gsRef.current = { playerLane: 1, cars: [], score: 0, speed: 0.02, frame: 0, horizon: 0, laneOffset: 0 };
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
    if (gameState !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const s = gsRef.current;
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); s.playerLane = Math.max(0, s.playerLane - 1); }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); s.playerLane = Math.min(2, s.playerLane + 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🏎️ Retro Racer</span>
        <span className="font-mono text-violet-200 text-sm">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-violet-500/30 max-w-full"
        onClick={gameState !== "playing" ? startGame : undefined}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          Start Race
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Crash! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">Try Again</button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">← → Arrow keys or A/D to switch lanes</p>}
    </div>
  );
}
