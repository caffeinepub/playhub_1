import { useEffect, useRef, useCallback, useState } from "react";

const W = 500, H = 500;
const SHIP_SIZE = 14;
const BULLET_SPEED = 7;
const ROTATE_SPEED = 0.05;
const THRUST = 0.2;
const FRICTION = 0.98;
const MAX_BULLETS = 6;
const SHOOT_COOLDOWN = 200;

interface Vec2 { x: number; y: number; }
interface Asteroid { pos: Vec2; vel: Vec2; radius: number; angle: number; spin: number; verts: Vec2[]; }
interface Bullet { pos: Vec2; vel: Vec2; age: number; }

function randVerts(r: number): Vec2[] {
  const n = 8 + Math.floor(Math.random() * 4);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const jitter = r * (0.8 + Math.random() * 0.4);
    return { x: Math.cos(a) * jitter, y: Math.sin(a) * jitter };
  });
}

function makeAsteroids(count: number, shipPos: Vec2): Asteroid[] {
  return Array.from({ length: count }, () => {
    let pos: Vec2;
    do {
      pos = { x: Math.random() * W, y: Math.random() * H };
    } while (Math.hypot(pos.x - shipPos.x, pos.y - shipPos.y) < 120);
    const r = 30 + Math.random() * 20;
    const speed = 0.5 + Math.random() * 1.2;
    const angle = Math.random() * Math.PI * 2;
    return {
      pos,
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      radius: r,
      angle: 0,
      spin: (Math.random() - 0.5) * 0.02,
      verts: randVerts(r),
    };
  });
}

function wrap(v: Vec2) {
  v.x = ((v.x % W) + W) % W;
  v.y = ((v.y % H) + H) % H;
}

export default function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const posRef = useRef<Vec2>({ x: W / 2, y: H / 2 });
  const velRef = useRef<Vec2>({ x: 0, y: 0 });
  const angleRef = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const lastShootRef = useRef(0);
  const rafRef = useRef(0);
  const phaseRef = useRef<"idle" | "playing" | "gameover">("idle");

  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const respawn = useCallback(() => {
    posRef.current = { x: W / 2, y: H / 2 };
    velRef.current = { x: 0, y: 0 };
    angleRef.current = 0;
    bulletsRef.current = [];
  }, []);

  const draw = useCallback((ts: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "oklch(0.07 0.01 270)";
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = (i * 131.3 + 17) % W;
      const sy = (i * 89.7 + 43) % H;
      const brightness = 0.2 + (i % 5) * 0.1;
      ctx.fillStyle = `oklch(${brightness} 0.01 270)`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Ship
    if (phaseRef.current === "playing") {
      const { x, y } = posRef.current;
      const a = angleRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.strokeStyle = "oklch(0.75 0.18 195)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "oklch(0.62 0.18 195)";
      ctx.beginPath();
      ctx.moveTo(SHIP_SIZE, 0);
      ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6);
      ctx.lineTo(-SHIP_SIZE * 0.4, 0);
      ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6);
      ctx.closePath();
      ctx.stroke();
      if (keysRef.current.has("ArrowUp") || keysRef.current.has("w")) {
        ctx.fillStyle = `oklch(0.75 0.22 60 / ${0.5 + Math.sin(ts / 100) * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE * 0.4, 0);
        ctx.lineTo(-SHIP_SIZE * 0.7 - 6 - Math.random() * 4, SHIP_SIZE * 0.25);
        ctx.lineTo(-SHIP_SIZE * 0.7 - 6 - Math.random() * 4, -SHIP_SIZE * 0.25);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Bullets
    ctx.fillStyle = "oklch(0.95 0.02 80)";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "oklch(0.85 0.20 60)";
    bulletsRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Asteroids
    asteroidsRef.current.forEach(ast => {
      ctx.save();
      ctx.translate(ast.pos.x, ast.pos.y);
      ctx.rotate(ast.angle);
      ctx.strokeStyle = "oklch(0.65 0.08 60)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = "oklch(0.55 0.08 60 / 0.5)";
      ctx.beginPath();
      ast.verts.forEach((v, i) => { if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y); });
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }, []);

  const tick = useCallback((ts: number) => {
    if (phaseRef.current !== "playing") { draw(ts); return; }
    const keys = keysRef.current;

    // Rotate
    if (keys.has("ArrowLeft") || keys.has("a")) angleRef.current -= ROTATE_SPEED;
    if (keys.has("ArrowRight") || keys.has("d")) angleRef.current += ROTATE_SPEED;

    // Thrust
    if (keys.has("ArrowUp") || keys.has("w")) {
      velRef.current.x += Math.cos(angleRef.current) * THRUST;
      velRef.current.y += Math.sin(angleRef.current) * THRUST;
    }

    // Friction
    velRef.current.x *= FRICTION;
    velRef.current.y *= FRICTION;

    // Move ship
    posRef.current.x += velRef.current.x;
    posRef.current.y += velRef.current.y;
    wrap(posRef.current);

    // Shoot
    if ((keys.has(" ") || keys.has("ArrowDown")) && ts - lastShootRef.current > SHOOT_COOLDOWN && bulletsRef.current.length < MAX_BULLETS) {
      lastShootRef.current = ts;
      bulletsRef.current.push({
        pos: { x: posRef.current.x + Math.cos(angleRef.current) * SHIP_SIZE, y: posRef.current.y + Math.sin(angleRef.current) * SHIP_SIZE },
        vel: { x: Math.cos(angleRef.current) * BULLET_SPEED + velRef.current.x, y: Math.sin(angleRef.current) * BULLET_SPEED + velRef.current.y },
        age: 0,
      });
    }

    // Move bullets
    bulletsRef.current.forEach(b => {
      b.pos.x += b.vel.x; b.pos.y += b.vel.y; b.age++;
      wrap(b.pos);
    });
    bulletsRef.current = bulletsRef.current.filter(b => b.age < 60);

    // Move asteroids
    asteroidsRef.current.forEach(a => {
      a.pos.x += a.vel.x; a.pos.y += a.vel.y; a.angle += a.spin;
      wrap(a.pos);
    });

    // Bullet-asteroid collision
    const toRemoveBullets = new Set<number>();
    const toSplitAsteroids: number[] = [];
    bulletsRef.current.forEach((b, bi) => {
      asteroidsRef.current.forEach((a, ai) => {
        if (toSplitAsteroids.includes(ai)) return;
        const dist = Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y);
        if (dist < a.radius) {
          toRemoveBullets.add(bi);
          toSplitAsteroids.push(ai);
          scoreRef.current += Math.floor(100 / a.radius * 10);
          setScore(scoreRef.current);
        }
      });
    });

    const newAsteroids: Asteroid[] = [];
    asteroidsRef.current = asteroidsRef.current.filter((a, i) => {
      if (!toSplitAsteroids.includes(i)) return true;
      if (a.radius > 20) {
        for (let k = 0; k < 2; k++) {
          const speed = 0.8 + Math.random() * 1.5;
          const ang = Math.random() * Math.PI * 2;
          const r = a.radius * 0.55;
          newAsteroids.push({ pos: { ...a.pos }, vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed }, radius: r, angle: 0, spin: (Math.random() - 0.5) * 0.04, verts: randVerts(r) });
        }
      }
      return false;
    });
    asteroidsRef.current.push(...newAsteroids);
    bulletsRef.current = bulletsRef.current.filter((_, i) => !toRemoveBullets.has(i));

    // Ship-asteroid collision
    asteroidsRef.current.forEach(a => {
      const dist = Math.hypot(posRef.current.x - a.pos.x, posRef.current.y - a.pos.y);
      if (dist < a.radius + SHIP_SIZE * 0.5) {
        livesRef.current--;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          phaseRef.current = "gameover";
          setPhase("gameover");
        } else {
          respawn();
        }
      }
    });

    // Level complete
    if (asteroidsRef.current.length === 0) {
      levelRef.current++;
      setLevel(levelRef.current);
      asteroidsRef.current = makeAsteroids(3 + levelRef.current, posRef.current);
    }

    draw(ts);
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, respawn]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    respawn();
    livesRef.current = 3;
    scoreRef.current = 0;
    levelRef.current = 1;
    asteroidsRef.current = makeAsteroids(4, { x: W / 2, y: H / 2 });
    phaseRef.current = "playing";
    setPhase("playing");
    setScore(0);
    setLives(3);
    setLevel(1);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, respawn]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
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
      <div className="flex gap-4">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Lives</span>
          <span className="score-value">{Array.from({ length: lives }, () => "△").join(" ")}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Level</span>
          <span className="score-value gradient-text">{level}</span>
        </div>
      </div>

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block rounded-lg" />
        {phase !== "playing" && (
          <div className="game-overlay">
            {phase === "gameover" && (
              <div className="text-center mb-4">
                <p className="font-display text-3xl font-bold text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm">Score: {score}</p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-xl text-foreground mb-1">Asteroids</p>
                <p className="text-muted-foreground text-xs">Arrow keys to steer · Space to shoot</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {phase === "gameover" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">← → Rotate &nbsp;·&nbsp; ↑ Thrust &nbsp;·&nbsp; Space Shoot</p>
    </div>
  );
}
