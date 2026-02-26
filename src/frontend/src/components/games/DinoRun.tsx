import { useCallback, useEffect, useRef, useState } from "react";

const GROUND_Y = 300;
const DINO_W = 40;
const DINO_H = 50;
const DINO_X = 80;

export default function DinoRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const stateRef = useRef({
    dinoY: GROUND_Y - DINO_H,
    velY: 0,
    onGround: true,
    score: 0,
    speed: 4,
    lives: 3,
    obstacles: [] as { x: number; type: "cactus" | "bird"; y: number }[],
    frame: 0,
    invincible: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.onGround && runningRef.current) {
      s.velY = -14;
      s.onGround = false;
    }
  }, []);

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, 600, 360);

    // Sky
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, 600, 360);

    // Ground
    ctx.fillStyle = "#0e7490";
    ctx.fillRect(0, GROUND_Y, 600, 4);

    s.score++;
    s.speed = 4 + s.score / 600;
    if (s.invincible > 0) s.invincible--;
    setScore(s.score);

    // Physics
    s.velY += 0.7;
    s.dinoY += s.velY;
    if (s.dinoY >= GROUND_Y - DINO_H) {
      s.dinoY = GROUND_Y - DINO_H;
      s.velY = 0;
      s.onGround = true;
    } else {
      s.onGround = false;
    }

    // Spawn
    s.frame++;
    if (s.frame % Math.max(50, 100 - Math.floor(s.score / 400)) === 0) {
      const isBird = Math.random() < 0.3;
      s.obstacles.push({
        x: 620,
        type: isBird ? "bird" : "cactus",
        y: isBird ? GROUND_Y - 80 : GROUND_Y - 50,
      });
    }

    // Draw dino
    const dinoFlash = s.invincible > 0 && Math.floor(s.invincible / 4) % 2 === 0;
    if (!dinoFlash) {
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(DINO_X, s.dinoY, DINO_W, DINO_H);
      ctx.fillStyle = "#0e7490";
      ctx.fillRect(DINO_X + 25, s.dinoY + 10, 8, 8);
      // Legs
      const legOffset = Math.floor(s.score / 8) % 2;
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(DINO_X + 5 + legOffset * 12, s.dinoY + DINO_H, 10, 10);
      ctx.fillRect(DINO_X + 17 - legOffset * 12, s.dinoY + DINO_H, 10, 10);
    }

    // Draw obstacles
    s.obstacles = s.obstacles.filter(o => o.x > -60);
    let hit = false;
    for (const obs of s.obstacles) {
      obs.x -= s.speed;
      if (obs.type === "cactus") {
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(obs.x + 5, obs.y, 15, 50);
        ctx.fillRect(obs.x, obs.y + 10, 8, 20);
        ctx.fillRect(obs.x + 17, obs.y + 15, 8, 15);
      } else {
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(obs.x, obs.y, 40, 20);
        ctx.fillRect(obs.x + 5, obs.y - 10, 15, 10);
      }

      if (s.invincible === 0) {
        const ox = obs.type === "cactus" ? obs.x : obs.x;
        const ow = obs.type === "cactus" ? 30 : 40;
        const oh = obs.type === "cactus" ? 50 : 20;
        if (
          DINO_X + 5 < ox + ow - 5 &&
          DINO_X + DINO_W - 5 > ox + 5 &&
          s.dinoY + 5 < obs.y + oh &&
          s.dinoY + DINO_H > obs.y + 5
        ) {
          hit = true;
        }
      }
    }

    if (hit) {
      s.lives--;
      setLives(s.lives);
      if (s.lives <= 0) {
        runningRef.current = false;
        setGameState("dead");
        return;
      }
      s.invincible = 90;
      s.obstacles = [];
    }

    // Lives HUD
    for (let i = 0; i < s.lives; i++) {
      ctx.fillStyle = "#f43f5e";
      ctx.font = "16px sans-serif";
      ctx.fillText("♥", 10 + i * 22, 26);
    }

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    const s = stateRef.current;
    s.dinoY = GROUND_Y - DINO_H;
    s.velY = 0;
    s.onGround = true;
    s.score = 0;
    s.speed = 4;
    s.lives = 3;
    s.obstacles = [];
    s.frame = 0;
    s.invincible = 0;
    setScore(0);
    setLives(3);
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
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🦕 Dino Run</span>
        <span className="font-mono text-cyan-200 text-sm">Score: {score} | ♥ {lives}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={360}
        className="rounded-xl border border-cyan-500/30 cursor-pointer"
        onClick={gameState === "playing" ? jump : startGame}
      />
      {gameState === "idle" && (
        <button type="button" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors" onClick={startGame}>
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Game Over! Score: {score}</p>
          <button type="button" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors" onClick={startGame}>
            Try Again
          </button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">Click or Space/↑ to jump</p>}
    </div>
  );
}
