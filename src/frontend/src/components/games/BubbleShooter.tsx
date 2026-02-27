import { useEffect, useRef, useCallback, useState } from "react";

const W = 380, H = 500;
const COLS = 9;
const BUBBLE_R = 20;
const BUBBLE_D = BUBBLE_R * 2;
const ROWS_INIT = 6;
const SHOOTER_Y = H - 50;
const SHOOTER_X = W / 2;
const SPEED = 8;

const COLORS = [
  "oklch(0.65 0.25 25)",
  "oklch(0.62 0.22 250)",
  "oklch(0.55 0.22 150)",
  "oklch(0.85 0.20 80)",
  "oklch(0.65 0.25 305)",
];

type BubbleCell = { color: string } | null;

function rowX(col: number, row: number): number {
  const offset = row % 2 === 0 ? 0 : BUBBLE_R;
  return BUBBLE_R + col * BUBBLE_D + offset;
}

function buildGrid(): BubbleCell[][] {
  return Array.from({ length: ROWS_INIT }, (_, r) => {
    const cols = r % 2 === 0 ? COLS : COLS - 1;
    return Array.from({ length: cols }, () => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  });
}

interface Ball { x: number; y: number; vx: number; vy: number; color: string; active: boolean; }

export default function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<BubbleCell[][]>(buildGrid());
  const ballRef = useRef<Ball | null>(null);
  const nextColorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const shooterColorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const shotsRef = useRef(0);
  const rafRef = useRef(0);
  const phaseRef = useRef<"idle" | "playing" | "gameover" | "win">("idle");

  const [phase, setPhase] = useState<"idle" | "playing" | "gameover" | "win">("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [aimX, setAimX] = useState(SHOOTER_X);
  const [aimY, setAimY] = useState(SHOOTER_Y - 80);

  const drawBubble = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, r = BUBBLE_R) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
    grad.addColorStop(0, color.replace(")", " / 1.0)").replace("oklch(", "oklch(").replace(/\/.*\)/, "/ 1)").concat("").replace(/oklch\((.+)\)/, (_, m) => {
      const parts = m.split(" ");
      parts[0] = String(Math.min(1, parseFloat(parts[0]) + 0.2));
      return `oklch(${parts.join(" ")})`;
    }));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Shine
    ctx.fillStyle = "oklch(0.98 0 0 / 0.35)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.3, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "oklch(0.10 0.02 270)";
    ctx.fillRect(0, 0, W, H);

    // Grid bubbles
    gridRef.current.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const cx = rowX(c, r);
        const cy = BUBBLE_R + r * (BUBBLE_D - 2);
        drawBubble(ctx, cx, cy, cell.color);
      });
    });

    // Aim line
    if (phaseRef.current === "playing" && !ballRef.current) {
      const dx = aimX - SHOOTER_X;
      const dy = aimY - SHOOTER_Y;
      const len = Math.hypot(dx, dy);
      const nx = dx / len, ny = dy / len;
      ctx.strokeStyle = "oklch(0.75 0.01 270 / 0.3)";
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(SHOOTER_X, SHOOTER_Y);
      let tx = SHOOTER_X + nx * 50, ty = SHOOTER_Y + ny * 50;
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(tx, ty);
        tx += nx * 30; ty += ny * 30;
        if (tx < BUBBLE_R && nx < 0) { tx = BUBBLE_R; } // clamp at wall
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Flying ball
    if (ballRef.current) {
      const b = ballRef.current;
      drawBubble(ctx, b.x, b.y, b.color);
    }

    // Shooter
    drawBubble(ctx, SHOOTER_X, SHOOTER_Y, shooterColorRef.current, BUBBLE_R - 2);
    ctx.strokeStyle = "oklch(0.60 0.15 270)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHOOTER_X, SHOOTER_Y);
    const dx = aimX - SHOOTER_X;
    const dy = aimY - SHOOTER_Y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.lineTo(SHOOTER_X + (dx / len) * 28, SHOOTER_Y + (dy / len) * 28);
    ctx.stroke();

    // Next bubble preview
    ctx.fillStyle = "oklch(0.65 0.02 270)";
    ctx.font = "11px sans-serif";
    ctx.fillText("NEXT", W - 54, SHOOTER_Y - 30);
    drawBubble(ctx, W - 38, SHOOTER_Y - 10, nextColorRef.current, BUBBLE_R - 6);
  }, [drawBubble, aimX, aimY]);

  const snapToGrid = useCallback((bx: number, by: number, color: string) => {
    const row = Math.round((by - BUBBLE_R) / (BUBBLE_D - 2));
    const r = Math.max(0, Math.min(row, gridRef.current.length));
    const offset = r % 2 === 0 ? 0 : BUBBLE_R;
    const col = Math.round((bx - BUBBLE_R - offset) / BUBBLE_D);
    const maxCols = r % 2 === 0 ? COLS : COLS - 1;
    const safeCol = Math.max(0, Math.min(col, maxCols - 1));

    // Extend grid if needed
    while (gridRef.current.length <= r) {
      const newRow = r % 2 === 0 ? COLS : COLS - 1;
      gridRef.current.push(Array(newRow).fill(null));
    }

    gridRef.current[r][safeCol] = { color };

    // Pop matching bubbles
    const toRemove = new Set<string>();
    const visited = new Set<string>();
    const stack = [`${r},${safeCol}`];

    while (stack.length) {
      const key = stack.pop()!;
      if (visited.has(key)) continue;
      visited.add(key);
      const [cr, cc] = key.split(",").map(Number);
      const cell = gridRef.current[cr]?.[cc];
      if (!cell || cell.color !== color) continue;
      toRemove.add(key);
      // Neighbors
      const isEven = cr % 2 === 0;
      const neighbors = [
        [cr, cc - 1], [cr, cc + 1],
        [cr - 1, isEven ? cc - 1 : cc], [cr - 1, isEven ? cc : cc + 1],
        [cr + 1, isEven ? cc - 1 : cc], [cr + 1, isEven ? cc : cc + 1],
      ];
      neighbors.forEach(([nr, nc]) => {
        const nkey = `${nr},${nc}`;
        if (!visited.has(nkey) && gridRef.current[nr]?.[nc]) {
          stack.push(nkey);
        }
      });
    }

    if (toRemove.size >= 3) {
      toRemove.forEach(key => {
        const [pr, pc] = key.split(",").map(Number);
        if (gridRef.current[pr]) gridRef.current[pr][pc] = null;
      });
      scoreRef.current += toRemove.size * 10 * levelRef.current;
      setScore(scoreRef.current);
    }

    // Level up every 10 shots
    shotsRef.current++;
    if (shotsRef.current % 10 === 0) {
      levelRef.current++;
      setLevel(levelRef.current);
    }

    // Check game over: any bubble in last rows
    if (gridRef.current.some((row2, ri) => ri >= 12 && row2.some(c => c !== null))) {
      phaseRef.current = "gameover";
      setPhase("gameover");
    }

    // Check win
    if (gridRef.current.every(row2 => row2.every(c => c === null))) {
      phaseRef.current = "win";
      setPhase("win");
    }

    // Prep next shot
    shooterColorRef.current = nextColorRef.current;
    nextColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
    ballRef.current = null;
  }, []);

  const tick = useCallback(() => {
    if (phaseRef.current !== "playing") { draw(); return; }
    const ball = ballRef.current;

    if (ball && ball.active) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x - BUBBLE_R < 0) { ball.x = BUBBLE_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x + BUBBLE_R > W) { ball.x = W - BUBBLE_R; ball.vx = -Math.abs(ball.vx); }

      // Snap at top or collision
      let hit = false;
      if (ball.y - BUBBLE_R < BUBBLE_R) {
        hit = true;
      } else {
        gridRef.current.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (!cell || hit) return;
            const cx2 = rowX(c, r);
            const cy2 = BUBBLE_R + r * (BUBBLE_D - 2);
            if (Math.hypot(ball.x - cx2, ball.y - cy2) < BUBBLE_D - 2) {
              hit = true;
            }
          });
        });
      }

      if (hit) {
        snapToGrid(ball.x, ball.y, ball.color);
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, snapToGrid]);

  const shoot = useCallback((tx: number, ty: number) => {
    if (phaseRef.current !== "playing" || ballRef.current) return;
    const dx = tx - SHOOTER_X;
    const dy = ty - SHOOTER_Y;
    const len = Math.hypot(dx, dy) || 1;
    if (dy > -20) return; // prevent shooting down
    ballRef.current = {
      x: SHOOTER_X,
      y: SHOOTER_Y,
      vx: (dx / len) * SPEED,
      vy: (dy / len) * SPEED,
      color: shooterColorRef.current,
      active: true,
    };
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    gridRef.current = buildGrid();
    ballRef.current = null;
    shooterColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
    nextColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
    scoreRef.current = 0;
    levelRef.current = 1;
    shotsRef.current = 0;
    phaseRef.current = "playing";
    setPhase("playing");
    setScore(0);
    setLevel(1);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAimX(e.clientX - rect.left);
    setAimY(e.clientY - rect.top);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    shoot(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Level</span>
          <span className="score-value">{level}</span>
        </div>
      </div>

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block rounded-lg cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        />
        {phase !== "playing" && (
          <div className="game-overlay">
            {phase === "gameover" && (
              <div className="text-center mb-4">
                <p className="font-display text-3xl font-bold text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm">Score: {score}</p>
              </div>
            )}
            {phase === "win" && (
              <div className="text-center mb-4">
                <p className="font-display text-3xl font-bold gradient-text mb-1">YOU WIN! 🎉</p>
                <p className="text-muted-foreground text-sm">Score: {score}</p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-xl text-foreground mb-2">Bubble Shooter</p>
                <p className="text-muted-foreground text-xs">Click to aim & shoot · Pop 3+ matching bubbles!</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {phase === "idle" ? "Start Game" : "Play Again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
