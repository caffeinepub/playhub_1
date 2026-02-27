import { useEffect, useRef, useCallback, useState } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

const W = 360;
const H = 500;
const BIRD_X = 80;
const BIRD_R = 16;
const PIPE_W = 52;
const GAP = 140;
const PIPE_SPEED = 2.4;
const GRAVITY = 0.32;
const FLAP = -7.5;

interface Pipe { x: number; topH: number; passed: boolean; }

type GameState = "idle" | "playing" | "gameover";

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdYRef = useRef(H / 2);
  const birdVyRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [displayScore, setDisplayScore] = useState(0);

  const { data: highScore = BigInt(0) } = useGetHighScore("flappy");
  const saveScore = useSaveHighScore();
  const endGameRef = useRef<() => void>(() => {});

  const flap = useCallback(() => {
    if (gameState !== "playing") return;
    birdVyRef.current = FLAP;
  }, [gameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, "oklch(0.12 0.025 240)");
    skyGrad.addColorStop(1, "oklch(0.15 0.020 210)");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "oklch(0.90 0.01 270)";
    for (let s = 0; s < 30; s++) {
      const sx = ((s * 137 + frameRef.current * 0.1) % W);
      const sy = (s * 97) % (H * 0.6);
      const sr = s % 3 === 0 ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = "oklch(0.45 0.14 155)";
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = "oklch(0.55 0.18 140)";
    ctx.fillRect(0, H - 40, W, 8);

    // Pipes
    pipesRef.current.forEach(pipe => {
      // Top pipe
      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
      pipeGrad.addColorStop(0, "oklch(0.50 0.18 150)");
      pipeGrad.addColorStop(0.4, "oklch(0.60 0.20 145)");
      pipeGrad.addColorStop(1, "oklch(0.40 0.15 150)");
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
      // Top cap
      ctx.fillStyle = "oklch(0.55 0.18 150)";
      ctx.fillRect(pipe.x - 4, pipe.topH - 20, PIPE_W + 8, 20);
      ctx.strokeStyle = "oklch(0.30 0.12 150)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pipe.x - 4, pipe.topH - 20, PIPE_W + 8, 20);

      // Bottom pipe
      const botY = pipe.topH + GAP;
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, botY, PIPE_W, H - botY - 40);
      // Bottom cap
      ctx.fillStyle = "oklch(0.55 0.18 150)";
      ctx.fillRect(pipe.x - 4, botY, PIPE_W + 8, 20);
      ctx.strokeStyle = "oklch(0.30 0.12 150)";
      ctx.strokeRect(pipe.x - 4, botY, PIPE_W + 8, 20);
    });

    // Bird
    const by = birdYRef.current;
    const vy = birdVyRef.current;
    const angle = Math.max(-30, Math.min(30, vy * 4)) * (Math.PI / 180);

    ctx.save();
    ctx.translate(BIRD_X, by);
    ctx.rotate(angle);

    // Body
    const birdGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BIRD_R);
    birdGrad.addColorStop(0, "oklch(0.90 0.18 80)");
    birdGrad.addColorStop(0.6, "oklch(0.80 0.20 55)");
    birdGrad.addColorStop(1, "oklch(0.65 0.22 45)");
    ctx.fillStyle = birdGrad;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "oklch(0.80 0.20 55 / 0.6)";
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R, BIRD_R * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Wing
    ctx.fillStyle = "oklch(0.70 0.18 50)";
    ctx.beginPath();
    ctx.ellipse(-2, 4, 10, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "oklch(0.99 0 0)";
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "oklch(0.15 0.02 270)";
    ctx.beginPath();
    ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "oklch(0.75 0.20 45)";
    ctx.beginPath();
    ctx.moveTo(BIRD_R - 2, -2);
    ctx.lineTo(BIRD_R + 8, 0);
    ctx.lineTo(BIRD_R - 2, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score display during play
    if (scoreRef.current > 0 || pipesRef.current.length > 0) {
      ctx.font = "bold 32px Oxanium, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.fillText(String(scoreRef.current), W / 2, 52);
      ctx.shadowBlur = 0;
    }
  }, []);

  const gameLoop = useCallback(() => {
    frameRef.current++;

    // Physics
    birdVyRef.current += GRAVITY;
    birdYRef.current += birdVyRef.current;

    // Spawn pipes every 90 frames
    if (frameRef.current % 90 === 0) {
      const topH = 60 + Math.random() * (H - GAP - 140);
      pipesRef.current.push({ x: W + 10, topH, passed: false });
    }

    // Move pipes
    pipesRef.current.forEach(p => { p.x -= PIPE_SPEED; });
    pipesRef.current = pipesRef.current.filter(p => p.x + PIPE_W > -10);

    // Score
    pipesRef.current.forEach(p => {
      if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
        p.passed = true;
        scoreRef.current++;
        setDisplayScore(scoreRef.current);
      }
    });

    // Collision: ground / ceiling
    if (birdYRef.current + BIRD_R >= H - 40 || birdYRef.current - BIRD_R <= 0) {
      endGameRef.current();
      return;
    }

    // Collision: pipes
    for (const pipe of pipesRef.current) {
      if (
        BIRD_X + BIRD_R > pipe.x + 6 &&
        BIRD_X - BIRD_R < pipe.x + PIPE_W - 6
      ) {
        if (birdYRef.current - BIRD_R < pipe.topH || birdYRef.current + BIRD_R > pipe.topH + GAP) {
          endGameRef.current();
          return;
        }
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  const endGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setGameState("gameover");
    const s = scoreRef.current;
    if (s > Number(highScore)) {
      saveScore.mutate({ gameName: "flappy", score: BigInt(s) });
      toast.success(`New high score: ${s}!`);
    }
    draw();
  }, [highScore, saveScore, draw]);

  endGameRef.current = endGame;

  const startGame = useCallback(() => {
    birdYRef.current = H / 2;
    birdVyRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    setDisplayScore(0);
    setGameState("playing");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (gameState === "playing") flap();
        else startGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, flap, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTap = () => {
      if (gameState === "playing") flap();
    };
    canvas.addEventListener("click", onTap);
    canvas.addEventListener("touchstart", onTap, { passive: true });
    return () => {
      canvas.removeEventListener("click", onTap);
      canvas.removeEventListener("touchstart", onTap);
    };
  }, [gameState, flap]);

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
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">{Number(highScore)}</span>
        </div>
      </div>

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block rounded-lg cursor-pointer" />
        {gameState !== "playing" && (
          <div className="game-overlay">
            {gameState === "gameover" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {displayScore}</p>
              </div>
            )}
            {gameState === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-sm text-muted-foreground">Click, tap, or press Space to flap</p>
              </div>
            )}
            <button type="button" onClick={startGame}
              className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {gameState === "gameover" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
