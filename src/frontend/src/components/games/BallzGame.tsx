import { useCallback, useEffect, useRef, useState } from "react";

const W = 400;
const H = 500;
const COLS = 6;
const COL_W = W / COLS;
const BALL_R = 6;
const BRICK_H = 40;
const ROWS_VISIBLE = 9;

type Brick = { val: number; col: number; row: number };
type Ball = { x: number; y: number; vx: number; vy: number; active: boolean };

function genBrickRow(row: number, score: number): Brick[] {
  const cols = new Set<number>();
  const count = 2 + Math.floor(Math.random() * 3);
  while (cols.size < count) cols.add(Math.floor(Math.random() * COLS));
  return [...cols].map(col => ({ val: score + 1 + Math.floor(Math.random() * 3), col, row }));
}

export default function BallzGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "aiming" | "shooting" | "dead">("idle");
  const [score, setScore] = useState(0);
  const [ballCount, setBallCount] = useState(5);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const gsRef = useRef({
    bricks: [] as Brick[],
    balls: [] as Ball[],
    score: 0,
    ballCount: 5,
    launchX: W / 2,
    aimAngle: -Math.PI / 2,
    row: 0,
  });

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = gsRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    // Draw bricks
    for (const b of s.bricks) {
      const x = b.col * COL_W;
      const y = (b.row) * BRICK_H;
      ctx.fillStyle = `hsl(${b.val * 20 % 360}, 70%, 45%)`;
      ctx.fillRect(x + 2, y + 2, COL_W - 4, BRICK_H - 4);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(b.val), x + COL_W / 2, y + BRICK_H / 2);
    }

    // Move balls
    let allDone = true;
    for (const ball of s.balls) {
      if (!ball.active) continue;
      allDone = false;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Walls
      if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

      // Floor
      if (ball.y + BALL_R > H - 20) {
        ball.active = false;
        s.launchX = ball.x;
        continue;
      }

      // Brick collisions
      for (const b of s.bricks) {
        const bx = b.col * COL_W, by = b.row * BRICK_H;
        if (ball.x + BALL_R > bx + 2 && ball.x - BALL_R < bx + COL_W - 2 &&
            ball.y + BALL_R > by + 2 && ball.y - BALL_R < by + BRICK_H - 2) {
          b.val--;
          // Determine which side
          const fromLeft = ball.x < bx + COL_W / 2;
          const fromTop = ball.y < by + BRICK_H / 2;
          const overlapX = fromLeft ? (ball.x + BALL_R) - (bx + 2) : (bx + COL_W - 2) - (ball.x - BALL_R);
          const overlapY = fromTop ? (ball.y + BALL_R) - (by + 2) : (by + BRICK_H - 2) - (ball.y - BALL_R);
          if (overlapX < overlapY) ball.vx = fromLeft ? -Math.abs(ball.vx) : Math.abs(ball.vx);
          else ball.vy = fromTop ? -Math.abs(ball.vy) : Math.abs(ball.vy);
        }
      }
    }

    // Remove dead bricks
    s.bricks = s.bricks.filter(b => b.val > 0);

    // Draw balls
    for (const ball of s.balls) {
      if (!ball.active) continue;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "#a78bfa";
      ctx.fill();
    }

    // Floor ball
    ctx.beginPath();
    ctx.arc(s.launchX, H - 15, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = "#a78bfa";
    ctx.fill();

    // Check if shooting done
    if (allDone && gameState === "shooting") {
      // Advance rows
      s.row++;
      for (const b of s.bricks) b.row++;
      const newRow = genBrickRow(0, s.score);
      s.bricks.push(...newRow);
      s.score++;
      s.ballCount++;
      setScore(s.score);
      setBallCount(s.ballCount);

      // Game over check
      if (s.bricks.some(b => b.row >= ROWS_VISIBLE)) {
        runningRef.current = false;
        setGameState("dead");
        return;
      }
      setGameState("aiming");
    }

    // Aim line
    if (gameState === "aiming") {
      ctx.strokeStyle = "rgba(167,139,250,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(s.launchX, H - 20);
      ctx.lineTo(s.launchX + Math.cos(s.aimAngle) * 100, H - 20 + Math.sin(s.aimAngle) * 100);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // HUD
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${s.score}  Balls: ${s.ballCount}`, 8, H - 5);

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, [gameState]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    const initialBricks: Brick[] = [];
    for (let r = 0; r < 4; r++) initialBricks.push(...genBrickRow(r, r));
    gsRef.current = {
      bricks: initialBricks, balls: [], score: 0, ballCount: 5,
      launchX: W / 2, aimAngle: -Math.PI / 2, row: 0,
    };
    setScore(0);
    setBallCount(5);
    setGameState("aiming");
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, [runLoop]);

  useEffect(() => () => cancelAnimationFrame(animIdRef.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "aiming") return;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const s = gsRef.current;
      const angle = Math.atan2(my - (H - 20), mx - s.launchX);
      s.aimAngle = Math.max(-Math.PI + 0.2, Math.min(-0.2, angle));
    };
    const onClick = () => {
      if (gameState !== "aiming") return;
      const s = gsRef.current;
      const speed = 8;
      s.balls = Array.from({ length: s.ballCount }, (_, i) => ({
        x: s.launchX,
        y: H - 20,
        vx: Math.cos(s.aimAngle) * speed,
        vy: Math.sin(s.aimAngle) * speed,
        active: false,
      }));
      // Stagger launches
      let launched = 0;
      const launchInterval = setInterval(() => {
        if (launched >= s.balls.length) { clearInterval(launchInterval); return; }
        s.balls[launched].active = true;
        launched++;
      }, 80);
      setGameState("shooting");
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🎱 Ballz</span>
        <div className="flex gap-3 text-sm font-mono">
          <span className="text-violet-300">🎱 ×{ballCount}</span>
          <span className="text-cyan-200">Score: {score}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-cyan-500/30 max-w-full"
        style={{ cursor: gameState === "aiming" ? "crosshair" : "default" }}
        onClick={gameState === "idle" || gameState === "dead" ? startGame : undefined}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Game Over! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">Try Again</button>
        </div>
      )}
      {(gameState === "aiming" || gameState === "shooting") && (
        <p className="text-muted-foreground text-xs">Move mouse to aim, click to shoot • {gsRef.current.ballCount} balls</p>
      )}
    </div>
  );
}
