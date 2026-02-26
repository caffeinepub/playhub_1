import { useCallback, useEffect, useRef, useState } from "react";

const GROUND = 320;
const PLAYER_SIZE = 30;
const PLAYER_X = 80;

export default function GeometryDash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const stateRef = useRef({
    playerY: GROUND - PLAYER_SIZE,
    velY: 0,
    onGround: true,
    score: 0,
    speed: 4,
    obstacles: [] as { x: number; w: number; h: number }[],
    frame: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.onGround && runningRef.current) {
      s.velY = -12;
      s.onGround = false;
    }
  }, []);

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, 600, 380);
    ctx.fillStyle = "#1a0030";
    ctx.fillRect(0, 0, 600, 380);
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(0, GROUND + PLAYER_SIZE, 600, 10);

    s.score++;
    s.speed = 4 + Math.floor(s.score / 300) * 0.5;
    setScore(s.score);

    s.frame++;
    const spawnInterval = Math.max(60, 120 - Math.floor(s.score / 500) * 10);
    if (s.frame % spawnInterval === 0) {
      s.obstacles.push({ x: 600, w: 20, h: 20 + Math.random() * 30 });
    }

    s.velY += 0.6;
    s.playerY += s.velY;
    if (s.playerY >= GROUND - PLAYER_SIZE) {
      s.playerY = GROUND - PLAYER_SIZE;
      s.velY = 0;
      s.onGround = true;
    } else {
      s.onGround = false;
    }

    const angle = (s.score * 0.05) % (Math.PI * 2);
    ctx.save();
    ctx.translate(PLAYER_X + PLAYER_SIZE / 2, s.playerY + PLAYER_SIZE / 2);
    ctx.rotate(s.onGround ? angle : Math.PI / 4);
    ctx.fillStyle = "#c4b5fd";
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2;
    ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    ctx.restore();

    s.obstacles = s.obstacles.filter(o => o.x + o.w > -10);
    let hit = false;
    for (const obs of s.obstacles) {
      obs.x -= s.speed;
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(obs.x, GROUND + PLAYER_SIZE);
      ctx.lineTo(obs.x + obs.w / 2, GROUND + PLAYER_SIZE - obs.h);
      ctx.lineTo(obs.x + obs.w, GROUND + PLAYER_SIZE);
      ctx.closePath();
      ctx.fill();

      if (
        PLAYER_X + PLAYER_SIZE - 4 > obs.x &&
        PLAYER_X + 4 < obs.x + obs.w &&
        s.playerY + PLAYER_SIZE - 4 > GROUND + PLAYER_SIZE - obs.h
      ) {
        hit = true;
      }
    }

    if (hit) {
      runningRef.current = false;
      setGameState("dead");
      return;
    }

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    const s = stateRef.current;
    s.playerY = GROUND - PLAYER_SIZE;
    s.velY = 0;
    s.onGround = true;
    s.score = 0;
    s.speed = 4;
    s.obstacles = [];
    s.frame = 0;
    setScore(0);
    setGameState("playing");
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, [runLoop]);

  useEffect(() => {
    return () => cancelAnimationFrame(animIdRef.current);
  }, []);

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
        <span className="font-display text-violet-300 text-lg">🟥 Geometry Dash</span>
        <span className="font-mono text-violet-200 text-sm">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={380}
        className="rounded-xl border border-violet-500/30 cursor-pointer"
        onClick={gameState === "playing" ? jump : startGame}
      />
      {gameState === "idle" && (
        <button
          type="button"
          className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors"
          onClick={startGame}
        >
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Game Over! Score: {score}</p>
          <button
            type="button"
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors"
            onClick={startGame}
          >
            Try Again
          </button>
        </div>
      )}
      {gameState === "playing" && (
        <p className="text-muted-foreground text-xs">Click or press Space/↑ to jump</p>
      )}
    </div>
  );
}
