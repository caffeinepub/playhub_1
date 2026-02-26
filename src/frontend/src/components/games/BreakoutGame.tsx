import { useEffect, useRef, useCallback, useState } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

const W = 400;
const H = 500;
const PADDLE_W = 80;
const PADDLE_H = 12;
const PADDLE_Y = H - 40;
const BALL_R = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 8;
const BRICK_W = 44;
const BRICK_H = 18;
const BRICK_PAD = 4;
const BRICK_TOP = 50;

const BRICK_COLORS = [
  "oklch(0.65 0.23 15)",   // red
  "oklch(0.75 0.20 45)",   // orange
  "oklch(0.80 0.18 50)",   // yellow
  "oklch(0.72 0.21 160)",  // green
  "oklch(0.72 0.19 195)",  // cyan
  "oklch(0.62 0.22 290)",  // violet
];

interface Brick { x: number; y: number; alive: boolean; color: string; }
interface Ball  { x: number; y: number; vx: number; vy: number; }

function createBricks(): Brick[] {
  const bricks: Brick[] = [];
  const totalW = BRICK_COLS * (BRICK_W + BRICK_PAD) - BRICK_PAD;
  const startX = (W - totalW) / 2;
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: startX + c * (BRICK_W + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        alive: true,
        color: BRICK_COLORS[r],
      });
    }
  }
  return bricks;
}

type GameState = "idle" | "playing" | "won" | "gameover";

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paddleXRef = useRef(W / 2 - PADDLE_W / 2);
  const ballRef = useRef<Ball>({ x: W / 2, y: PADDLE_Y - BALL_R - 2, vx: 3.5, vy: -4 });
  const bricksRef = useRef<Brick[]>(createBricks());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const rafRef = useRef<number | null>(null);
  const mouseXRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);

  const { data: highScore = BigInt(0) } = useGetHighScore("breakout");
  const saveScore = useSaveHighScore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "oklch(0.10 0.015 270)";
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = "oklch(0.14 0.018 270)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    // Bricks
    bricksRef.current.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      const r = 4;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, BRICK_W, BRICK_H, r);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Highlight
      ctx.fillStyle = "oklch(1 0 0 / 0.2)";
      ctx.beginPath();
      ctx.roundRect(b.x + 2, b.y + 2, BRICK_W - 4, 4, 2);
      ctx.fill();
    });

    // Paddle
    const px = paddleXRef.current;
    const grad = ctx.createLinearGradient(px, PADDLE_Y, px + PADDLE_W, PADDLE_Y);
    grad.addColorStop(0, "oklch(0.62 0.22 290)");
    grad.addColorStop(1, "oklch(0.72 0.19 195)");
    ctx.fillStyle = grad;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "oklch(0.62 0.22 290 / 0.7)";
    ctx.beginPath();
    ctx.roundRect(px, PADDLE_Y, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    const ball = ballRef.current;
    const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
    ballGrad.addColorStop(0, "oklch(0.95 0.05 195)");
    ballGrad.addColorStop(1, "oklch(0.72 0.19 195)");
    ctx.fillStyle = ballGrad;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "oklch(0.72 0.19 195 / 0.8)";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const gameLoop = useCallback(() => {
    const ball = ballRef.current;
    const px = paddleXRef.current;

    // Move paddle toward mouse
    if (mouseXRef.current !== null) {
      const target = mouseXRef.current - PADDLE_W / 2;
      paddleXRef.current = Math.max(0, Math.min(W - PADDLE_W, target));
    }

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounces
    if (ball.x - BALL_R <= 0) { ball.x = BALL_R; ball.vx *= -1; }
    if (ball.x + BALL_R >= W) { ball.x = W - BALL_R; ball.vx *= -1; }
    if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.vy *= -1; }

    // Paddle collision
    if (
      ball.y + BALL_R >= PADDLE_Y &&
      ball.y + BALL_R <= PADDLE_Y + PADDLE_H &&
      ball.x >= px &&
      ball.x <= px + PADDLE_W
    ) {
      const hitPos = (ball.x - px) / PADDLE_W; // 0..1
      const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63..63 deg
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.abs(Math.cos(angle) * speed);
      ball.y = PADDLE_Y - BALL_R - 1;
    }

    // Brick collisions
    let hitBrick = false;
    for (const b of bricksRef.current) {
      if (!b.alive) continue;
      if (ball.x + BALL_R >= b.x && ball.x - BALL_R <= b.x + BRICK_W &&
          ball.y + BALL_R >= b.y && ball.y - BALL_R <= b.y + BRICK_H) {
        b.alive = false;
        hitBrick = true;
        scoreRef.current += 10;
        setDisplayScore(scoreRef.current);

        // Determine bounce axis
        const overlapLeft  = ball.x + BALL_R - b.x;
        const overlapRight = b.x + BRICK_W - (ball.x - BALL_R);
        const overlapTop   = ball.y + BALL_R - b.y;
        const overlapBot   = b.y + BRICK_H - (ball.y - BALL_R);
        const minH = Math.min(overlapLeft, overlapRight);
        const minV = Math.min(overlapTop, overlapBot);
        if (minH < minV) ball.vx *= -1; else ball.vy *= -1;
        break;
      }
    }

    // Win check
    if (hitBrick && bricksRef.current.every(b => !b.alive)) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setGameState("won");
      const score = scoreRef.current;
      if (score > Number(highScore)) {
        saveScore.mutate({ gameName: "breakout", score: BigInt(score) });
        toast.success(`New high score: ${score}!`);
      } else {
        toast.success(`You cleared the board! Score: ${score}`);
      }
      draw();
      return;
    }

    // Bottom wall — lose life
    if (ball.y - BALL_R > H) {
      livesRef.current -= 1;
      setDisplayLives(livesRef.current);
      if (livesRef.current <= 0) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setGameState("gameover");
        const score = scoreRef.current;
        if (score > Number(highScore)) {
          saveScore.mutate({ gameName: "breakout", score: BigInt(score) });
          toast.success(`New high score: ${score}!`);
        }
        draw();
        return;
      }
      // Reset ball
      ball.x = W / 2;
      ball.y = PADDLE_Y - BALL_R - 2;
      ball.vx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -4;
    }

    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw, highScore, saveScore]);

  const startGame = useCallback(() => {
    paddleXRef.current = W / 2 - PADDLE_W / 2;
    ballRef.current = { x: W / 2, y: PADDLE_Y - BALL_R - 2, vx: 3.5, vy: -4 };
    bricksRef.current = createBricks();
    scoreRef.current = 0;
    livesRef.current = 3;
    setDisplayScore(0);
    setDisplayLives(3);
    setGameState("playing");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
    draw();
  }, [gameLoop, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      mouseXRef.current = (e.clientX - rect.left) * scaleX;
    };
    const onTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      mouseXRef.current = (e.touches[0].clientX - rect.left) * scaleX;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      const speed = 20;
      if (e.key === "ArrowLeft") { paddleXRef.current = Math.max(0, paddleXRef.current - speed); draw(); }
      if (e.key === "ArrowRight") { paddleXRef.current = Math.min(W - PADDLE_W, paddleXRef.current + speed); draw(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, draw]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-center">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{displayScore}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Lives</span>
          <span className="score-value">{Array(displayLives).fill("❤️").join("")}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">{Number(highScore)}</span>
        </div>
      </div>

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block rounded-lg cursor-none" style={{ imageRendering: "pixelated" }} />
        {gameState !== "playing" && (
          <div className="game-overlay">
            {gameState === "gameover" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {displayScore}</p>
              </div>
            )}
            {gameState === "won" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold gradient-text mb-1">YOU WIN! 🎉</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {displayScore}</p>
              </div>
            )}
            {gameState === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-sm text-muted-foreground">Move mouse or ← → keys to control paddle</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {gameState === "idle" ? "Start Game" : "Play Again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
