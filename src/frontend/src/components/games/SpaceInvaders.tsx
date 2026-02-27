import { useEffect, useRef, useCallback, useState } from "react";

const W = 560;
const H = 400;
const SHIP_W = 36;
const SHIP_H = 20;
const BULLET_W = 3;
const BULLET_H = 12;
const ALIEN_COLS = 10;
const ALIEN_ROWS = 4;
const ALIEN_W = 36;
const ALIEN_H = 28;
const ALIEN_PADDING = 8;
const MOVE_INTERVAL_START = 800;
const SHOOT_INTERVAL = 1600;

interface Bullet { x: number; y: number; active: boolean; }
interface Alien  { x: number; y: number; alive: boolean; row: number; }

type Phase = "idle" | "playing" | "gameover" | "win";

function buildAliens(): Alien[] {
  const aliens: Alien[] = [];
  const totalW = ALIEN_COLS * (ALIEN_W + ALIEN_PADDING) - ALIEN_PADDING;
  const startX = (W - totalW) / 2;
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: startX + c * (ALIEN_W + ALIEN_PADDING),
        y: 48 + r * (ALIEN_H + ALIEN_PADDING),
        alive: true,
        row: r,
      });
    }
  }
  return aliens;
}

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shipXRef  = useRef(W / 2 - SHIP_W / 2);
  const bulletsRef = useRef<Bullet[]>([]);
  const alienBulletsRef = useRef<Bullet[]>([]);
  const aliensRef  = useRef<Alien[]>(buildAliens());
  const keysRef    = useRef<Set<string>>(new Set());
  const phaseRef   = useRef<Phase>("idle");
  const scoreRef   = useRef(0);
  const livesRef   = useRef(3);
  const rafRef     = useRef<number>(0);
  const alienDirRef = useRef(1);
  const lastMoveRef = useRef(0);
  const lastShootRef = useRef(0);
  const moveIntervalRef = useRef(MOVE_INTERVAL_START);
  const lastBulletTimeRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const waveRef = useRef(1);

  const draw = useCallback((ts: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "oklch(0.08 0.015 270)";
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "oklch(0.96 0.01 270 / 0.3)";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137.5 + 50) % W;
      const sy = (i * 97.3 + 30) % H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    const aliens = aliensRef.current;
    const EMOJIS = ["👾", "👾", "🛸", "🤖"];

    // Aliens
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    aliens.filter(a => a.alive).forEach(a => {
      ctx.fillText(EMOJIS[a.row], a.x + ALIEN_W / 2, a.y + ALIEN_H * 0.78);
    });

    // Player bullets
    bulletsRef.current.filter(b => b.active).forEach(b => {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BULLET_H);
      grad.addColorStop(0, "oklch(0.96 0.01 270)");
      grad.addColorStop(1, "oklch(0.62 0.22 290 / 0.3)");
      ctx.fillStyle = grad;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "oklch(0.62 0.22 290)";
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, BULLET_W, BULLET_H, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Alien bullets
    alienBulletsRef.current.filter(b => b.active).forEach(b => {
      ctx.fillStyle = "oklch(0.75 0.20 25)";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "oklch(0.75 0.20 25)";
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, BULLET_W, BULLET_H, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Ship
    const sx = shipXRef.current;
    const sy = H - 44;
    const pulse = Math.sin(ts / 600) * 0.1 + 0.9;
    ctx.fillStyle = `oklch(0.72 0.19 195 / ${pulse})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "oklch(0.72 0.19 195)";
    // Draw a simple spaceship triangle
    ctx.beginPath();
    ctx.moveTo(sx + SHIP_W / 2, sy);
    ctx.lineTo(sx + SHIP_W, sy + SHIP_H);
    ctx.lineTo(sx, sy + SHIP_H);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const tick = useCallback((ts: number) => {
    if (phaseRef.current !== "playing") { draw(ts); return; }
    const keys = keysRef.current;

    // Move ship
    if (keys.has("ArrowLeft")) shipXRef.current = Math.max(0, shipXRef.current - 4);
    if (keys.has("ArrowRight")) shipXRef.current = Math.min(W - SHIP_W, shipXRef.current + 4);

    // Shoot
    if (keys.has(" ") && ts - lastBulletTimeRef.current > 300) {
      bulletsRef.current.push({ x: shipXRef.current + SHIP_W / 2 - 1, y: H - 48, active: true });
      lastBulletTimeRef.current = ts;
    }

    // Move player bullets
    bulletsRef.current.forEach(b => { if (b.active) b.y -= 7; });
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -20);

    // Move alien bullets
    alienBulletsRef.current.forEach(b => { if (b.active) b.y += 5; });
    alienBulletsRef.current = alienBulletsRef.current.filter(b => b.y < H + 20);

    // Move aliens
    if (ts - lastMoveRef.current > moveIntervalRef.current) {
      lastMoveRef.current = ts;
      const alive = aliensRef.current.filter(a => a.alive);
      const dir = alienDirRef.current;
      const rightmost = alive.reduce((max, a) => Math.max(max, a.x + ALIEN_W), 0);
      const leftmost = alive.reduce((min, a) => Math.min(min, a.x), W);

      if ((dir === 1 && rightmost >= W - 5) || (dir === -1 && leftmost <= 5)) {
        aliensRef.current.forEach(a => { a.y += 16; });
        alienDirRef.current *= -1;
      } else {
        aliensRef.current.forEach(a => { a.x += dir * 16; });
      }
    }

    // Alien shoot
    if (ts - lastShootRef.current > SHOOT_INTERVAL) {
      lastShootRef.current = ts;
      const alive = aliensRef.current.filter(a => a.alive);
      if (alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        alienBulletsRef.current.push({ x: shooter.x + ALIEN_W / 2 - 1, y: shooter.y + ALIEN_H, active: true });
      }
    }

    // Check bullet-alien collisions
    bulletsRef.current.forEach(b => {
      if (!b.active) return;
      aliensRef.current.forEach(a => {
        if (!a.alive) return;
        if (b.x + BULLET_W >= a.x && b.x <= a.x + ALIEN_W && b.y <= a.y + ALIEN_H && b.y + BULLET_H >= a.y) {
          a.alive = false;
          b.active = false;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          // Speed up aliens
          const alive = aliensRef.current.filter(x => x.alive).length;
          moveIntervalRef.current = Math.max(120, MOVE_INTERVAL_START * (alive / (ALIEN_COLS * ALIEN_ROWS)));
        }
      });
    });

    // Check alien-bullet-ship collision
    alienBulletsRef.current.forEach(b => {
      if (!b.active) return;
      const sx = shipXRef.current;
      const sy = H - 44;
      if (b.x + BULLET_W >= sx && b.x <= sx + SHIP_W && b.y + BULLET_H >= sy && b.y <= sy + SHIP_H) {
        b.active = false;
        livesRef.current--;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          phaseRef.current = "gameover";
          setPhase("gameover");
        }
      }
    });

    // Check alien reaches bottom
    const bottomAlien = aliensRef.current.filter(a => a.alive).reduce((max, a) => Math.max(max, a.y + ALIEN_H), 0);
    if (bottomAlien >= H - 50) {
      phaseRef.current = "gameover";
      setPhase("gameover");
    }

    // Check win / next wave
    if (aliensRef.current.every(a => !a.alive)) {
      waveRef.current++;
      setWave(waveRef.current);
      aliensRef.current = buildAliens();
      bulletsRef.current = [];
      alienBulletsRef.current = [];
      moveIntervalRef.current = Math.max(300, MOVE_INTERVAL_START - (waveRef.current - 1) * 100);
    }

    draw(ts);
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    shipXRef.current = W / 2 - SHIP_W / 2;
    bulletsRef.current = [];
    alienBulletsRef.current = [];
    aliensRef.current = buildAliens();
    keysRef.current = new Set();
    phaseRef.current = "playing";
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    alienDirRef.current = 1;
    lastMoveRef.current = 0;
    lastShootRef.current = 0;
    moveIntervalRef.current = MOVE_INTERVAL_START;
    lastBulletTimeRef.current = 0;
    setPhase("playing");
    setScore(0);
    setLives(3);
    setWave(1);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Lives</span>
          <span className="score-value">{Array.from({ length: lives }, () => "♥").join(" ")}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Wave</span>
          <span className="score-value gradient-text">{wave}</span>
        </div>
      </div>

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block rounded-lg" />
        {phase !== "playing" && (
          <div className="game-overlay">
            {phase === "gameover" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {score}</p>
              </div>
            )}
            {phase === "win" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold gradient-text mb-1">YOU WIN! 🎉</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {score}</p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center mb-2">
                <p className="font-display text-lg text-muted-foreground mb-1">Space Invaders</p>
                <p className="text-muted-foreground text-xs">← → to move &nbsp;|&nbsp; SPACE to shoot</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {phase === "idle" ? "Start Game" : "Play Again"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex gap-3 sm:hidden">
        <button
          type="button"
          className="w-16 h-12 rounded-xl bg-surface-2 border border-cyan-400/20 flex items-center justify-center text-xl text-cyan-300 active:bg-cyan/20"
          onTouchStart={() => keysRef.current.add("ArrowLeft")}
          onTouchEnd={() => keysRef.current.delete("ArrowLeft")}
        >←</button>
        <button
          type="button"
          className="w-20 h-12 rounded-xl bg-surface-2 border border-violet-400/20 flex items-center justify-center text-sm text-violet-300 active:bg-violet/20"
          onTouchStart={() => { const ts = performance.now(); if (ts - lastBulletTimeRef.current > 300) { bulletsRef.current.push({ x: shipXRef.current + SHIP_W/2 - 1, y: H - 48, active: true }); lastBulletTimeRef.current = ts; } }}
        >FIRE</button>
        <button
          type="button"
          className="w-16 h-12 rounded-xl bg-surface-2 border border-cyan-400/20 flex items-center justify-center text-xl text-cyan-300 active:bg-cyan/20"
          onTouchStart={() => keysRef.current.add("ArrowRight")}
          onTouchEnd={() => keysRef.current.delete("ArrowRight")}
        >→</button>
      </div>
    </div>
  );
}
