import { useEffect, useRef, useCallback, useState } from "react";

const W = 600;
const H = 360;
const PADDLE_W = 12;
const PADDLE_H = 70;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED_INIT = 4;
const WIN_SCORE = 5;

interface GameState {
  p1y: number;
  p2y: number;
  bx: number;
  by: number;
  bvx: number;
  bvy: number;
  s1: number;
  s2: number;
  phase: "idle" | "playing" | "won";
  winner: "" | "Player 1" | "Player 2";
}

function initState(): GameState {
  return {
    p1y: H / 2 - PADDLE_H / 2,
    p2y: H / 2 - PADDLE_H / 2,
    bx: W / 2,
    by: H / 2,
    bvx: BALL_SPEED_INIT * (Math.random() > 0.5 ? 1 : -1),
    bvy: BALL_SPEED_INIT * (Math.random() > 0.5 ? 1 : -1),
    s1: 0,
    s2: 0,
    phase: "idle",
    winner: "",
  };
}

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initState());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const [scores, setScores] = useState({ s1: 0, s2: 0 });
  const [phase, setPhase] = useState<"idle" | "playing" | "won">("idle");
  const [winner, setWinner] = useState("");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // BG
    ctx.fillStyle = "oklch(0.10 0.015 270)";
    ctx.fillRect(0, 0, W, H);

    // Centre line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "oklch(0.96 0.01 270 / 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    const drawPaddle = (x: number, y: number, isP1: boolean) => {
      const color = isP1 ? "oklch(0.62 0.22 290)" : "oklch(0.72 0.19 195)";
      ctx.fillStyle = color;
      ctx.shadowBlur = 14;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.roundRect(x, y, PADDLE_W, PADDLE_H, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    drawPaddle(16, s.p1y, true);
    drawPaddle(W - 16 - PADDLE_W, s.p2y, false);

    // Ball
    ctx.fillStyle = "oklch(0.96 0.01 270)";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "oklch(0.82 0.14 60)";
    ctx.beginPath();
    ctx.arc(s.bx, s.by, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score
    ctx.font = `bold 32px Oxanium, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "oklch(0.62 0.22 290 / 0.7)";
    ctx.fillText(String(s.s1), W / 4, 44);
    ctx.fillStyle = "oklch(0.72 0.19 195 / 0.7)";
    ctx.fillText(String(s.s2), (3 * W) / 4, 44);
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.bx = W / 2;
    s.by = H / 2;
    s.bvx = BALL_SPEED_INIT * (Math.random() > 0.5 ? 1 : -1);
    s.bvy = BALL_SPEED_INIT * (Math.random() * 2 - 1) * 1.5;
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const keys = keysRef.current;
    if (s.phase !== "playing") { draw(); return; }

    // Move paddles
    if (keys.has("w") || keys.has("W")) s.p1y = Math.max(0, s.p1y - PADDLE_SPEED);
    if (keys.has("s") || keys.has("S")) s.p1y = Math.min(H - PADDLE_H, s.p1y + PADDLE_SPEED);
    if (keys.has("ArrowUp")) s.p2y = Math.max(0, s.p2y - PADDLE_SPEED);
    if (keys.has("ArrowDown")) s.p2y = Math.min(H - PADDLE_H, s.p2y + PADDLE_SPEED);

    // Move ball
    s.bx += s.bvx;
    s.by += s.bvy;

    // Bounce top/bottom
    if (s.by - BALL_SIZE / 2 <= 0) { s.by = BALL_SIZE / 2; s.bvy = Math.abs(s.bvy); }
    if (s.by + BALL_SIZE / 2 >= H) { s.by = H - BALL_SIZE / 2; s.bvy = -Math.abs(s.bvy); }

    // Paddle collision P1
    if (
      s.bx - BALL_SIZE / 2 <= 16 + PADDLE_W &&
      s.bx - BALL_SIZE / 2 >= 16 &&
      s.by >= s.p1y &&
      s.by <= s.p1y + PADDLE_H
    ) {
      const relY = (s.by - (s.p1y + PADDLE_H / 2)) / (PADDLE_H / 2);
      const speed = Math.sqrt(s.bvx ** 2 + s.bvy ** 2) + 0.2;
      s.bvx = Math.abs(s.bvx) + 0.1;
      s.bvy = relY * speed * 1.2;
      s.bx = 16 + PADDLE_W + BALL_SIZE / 2;
    }

    // Paddle collision P2
    const p2x = W - 16 - PADDLE_W;
    if (
      s.bx + BALL_SIZE / 2 >= p2x &&
      s.bx + BALL_SIZE / 2 <= p2x + PADDLE_W &&
      s.by >= s.p2y &&
      s.by <= s.p2y + PADDLE_H
    ) {
      const relY = (s.by - (s.p2y + PADDLE_H / 2)) / (PADDLE_H / 2);
      const speed = Math.sqrt(s.bvx ** 2 + s.bvy ** 2) + 0.2;
      s.bvx = -(Math.abs(s.bvx) + 0.1);
      s.bvy = relY * speed * 1.2;
      s.bx = p2x - BALL_SIZE / 2;
    }

    // Score
    if (s.bx < 0) {
      s.s2++;
      setScores({ s1: s.s1, s2: s.s2 });
      if (s.s2 >= WIN_SCORE) {
        s.phase = "won"; s.winner = "Player 2";
        setPhase("won"); setWinner("Player 2");
      } else reset();
    }
    if (s.bx > W) {
      s.s1++;
      setScores({ s1: s.s1, s2: s.s2 });
      if (s.s1 >= WIN_SCORE) {
        s.phase = "won"; s.winner = "Player 1";
        setPhase("won"); setWinner("Player 1");
      } else reset();
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, reset]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current = initState();
    stateRef.current.phase = "playing";
    setScores({ s1: 0, s2: 0 });
    setPhase("playing");
    setWinner("");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Labels */}
      <div className="flex w-full max-w-[600px] justify-between text-xs font-display tracking-widest uppercase">
        <span className="text-violet-300">P1 — W/S</span>
        <span className="text-cyan-300">P2 — ↑/↓</span>
      </div>

      {/* Canvas */}
      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block rounded-lg" />
        {phase !== "playing" && (
          <div className="game-overlay">
            {phase === "won" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold gradient-text mb-1">{winner} Wins!</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Score: {scores.s1} — {scores.s2}
                </p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center mb-2">
                <p className="font-display text-lg text-muted-foreground mb-1">First to {WIN_SCORE} wins</p>
                <p className="text-muted-foreground text-xs">P1: W/S &nbsp;|&nbsp; P2: ↑↓</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {phase === "won" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
