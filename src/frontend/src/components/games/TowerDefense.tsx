import { useEffect, useRef, useCallback, useState } from "react";

const W = 440, H = 440;
const CELL = 44;
const COLS = 10, ROWS = 10;
const MAX_LIVES = 10;

// Path: winding from left to right
const PATH: [number, number][] = [
  [0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[4,3],[5,3],[5,4],[5,5],[5,6],[6,6],[7,6],[7,5],[7,4],[7,3],[8,3],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],
];
const PATH_SET = new Set(PATH.map(([r,c]) => `${r},${c}`));

type TowerType = "basic" | "fast" | "heavy";
interface Tower { col: number; row: number; type: TowerType; cooldown: number; }
interface Enemy { pathIdx: number; hp: number; maxHp: number; x: number; y: number; speed: number; reward: number; id: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

const TOWER_DATA: Record<TowerType, { range: number; damage: number; cooldownMax: number; color: string; emoji: string; cost: number; }> = {
  basic: { range: 2.5, damage: 1, cooldownMax: 60, color: "oklch(0.62 0.18 250)", emoji: "🗼", cost: 0 },
  fast:  { range: 2,   damage: 0.5, cooldownMax: 20, color: "oklch(0.72 0.20 195)", emoji: "⚡", cost: 0 },
  heavy: { range: 3,   damage: 3, cooldownMax: 120, color: "oklch(0.65 0.22 25)",  emoji: "💣", cost: 0 },
};

let _eid = 0;
function makeEnemy(wave: number, pathIdx = 0): Enemy {
  const hp = 3 + wave * 2;
  return { pathIdx, hp, maxHp: hp, x: PATH[pathIdx][1] * CELL + CELL / 2, y: PATH[pathIdx][0] * CELL + CELL / 2, speed: 0.4 + wave * 0.05, reward: wave, id: ++_eid };
}

export default function TowerDefense() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const waveRef = useRef(1);
  const waveCounterRef = useRef(0);
  const rafRef = useRef(0);
  const phaseRef = useRef<"idle" | "playing" | "gameover" | "win">("idle");
  const frameRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "playing" | "gameover" | "win">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wave, setWave] = useState(1);
  const [selectedType, setSelectedType] = useState<TowerType>("basic");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "oklch(0.12 0.02 150)";
    ctx.fillRect(0, 0, W, H);

    // Grid cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isPath = PATH_SET.has(`${r},${c}`);
        ctx.fillStyle = isPath ? "oklch(0.22 0.04 80)" : "oklch(0.14 0.015 150)";
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // Path arrows
    ctx.fillStyle = "oklch(0.40 0.06 80)";
    PATH.forEach(([r, c], i) => {
      if (i === PATH.length - 1) return;
      const [nr, nc] = PATH[i + 1];
      const cx2 = c * CELL + CELL / 2;
      const cy2 = r * CELL + CELL / 2;
      const dx = (nc - c) * 8, dy = (nr - r) * 8;
      ctx.beginPath();
      ctx.moveTo(cx2 + dx, cy2 + dy);
      ctx.arc(cx2 + dx, cy2 + dy, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Towers
    towersRef.current.forEach(t => {
      const td = TOWER_DATA[t.type];
      const tx2 = t.col * CELL + CELL / 2;
      const ty2 = t.row * CELL + CELL / 2;
      ctx.fillStyle = td.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = td.color;
      ctx.beginPath();
      ctx.arc(tx2, ty2, CELL * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(td.emoji, tx2, ty2);
    });

    // Enemies
    enemiesRef.current.forEach(e => {
      // Body
      ctx.fillStyle = "oklch(0.65 0.22 25)";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "oklch(0.65 0.22 25 / 0.8)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, CELL * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // HP bar
      const barW = CELL * 0.7;
      ctx.fillStyle = "oklch(0.20 0.02 0)";
      ctx.fillRect(e.x - barW / 2, e.y - CELL * 0.4, barW, 4);
      ctx.fillStyle = "oklch(0.62 0.22 150)";
      ctx.fillRect(e.x - barW / 2, e.y - CELL * 0.4, barW * (e.hp / e.maxHp), 4);
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, []);

  const tick = useCallback(() => {
    if (phaseRef.current !== "playing") { draw(); return; }
    frameRef.current++;

    // Spawn enemies
    waveCounterRef.current++;
    const spawnInterval = Math.max(60, 120 - waveRef.current * 10);
    const enemiesPerWave = 5 + waveRef.current * 2;
    if (waveCounterRef.current % spawnInterval === 0) {
      const spawned = enemiesRef.current.length + (waveCounterRef.current / spawnInterval);
      if (spawned <= enemiesPerWave) {
        enemiesRef.current.push(makeEnemy(waveRef.current));
      }
    }

    // Move enemies along path
    enemiesRef.current.forEach(e => {
      const target = PATH[Math.min(e.pathIdx + 1, PATH.length - 1)];
      const tx2 = target[1] * CELL + CELL / 2;
      const ty2 = target[0] * CELL + CELL / 2;
      const dx = tx2 - e.x, dy = ty2 - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < e.speed * 2) {
        e.pathIdx = Math.min(e.pathIdx + 1, PATH.length - 1);
      } else {
        e.x += (dx / dist) * e.speed * CELL * 0.1;
        e.y += (dy / dist) * e.speed * CELL * 0.1;
      }
    });

    // Enemies reaching end
    const reached = enemiesRef.current.filter(e => e.pathIdx >= PATH.length - 1);
    reached.forEach(() => {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
    });
    enemiesRef.current = enemiesRef.current.filter(e => e.pathIdx < PATH.length - 1);

    if (livesRef.current <= 0) {
      phaseRef.current = "gameover";
      setPhase("gameover");
      draw();
      return;
    }

    // Tower shooting
    towersRef.current.forEach(t => {
      const td = TOWER_DATA[t.type];
      if (t.cooldown > 0) { t.cooldown--; return; }
      const tx2 = t.col * CELL + CELL / 2;
      const ty2 = t.row * CELL + CELL / 2;
      let closest: Enemy | null = null;
      let closestDist = Infinity;
      enemiesRef.current.forEach(e => {
        const d = Math.hypot(e.x - tx2, e.y - ty2);
        if (d < td.range * CELL && d < closestDist) { closest = e; closestDist = d; }
      });
      if (closest) {
        (closest as Enemy).hp -= td.damage;
        t.cooldown = td.cooldownMax;
        // Bullet particle
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({ x: tx2, y: ty2, vx: ((closest as Enemy).x - tx2) / 10 + (Math.random() - 0.5), vy: ((closest as Enemy).y - ty2) / 10 + (Math.random() - 0.5), life: 20, color: td.color });
        }
      }
    });

    // Remove dead enemies
    const killed = enemiesRef.current.filter(e => e.hp <= 0);
    killed.forEach(e => {
      scoreRef.current += e.reward;
      setScore(scoreRef.current);
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 20, color: "oklch(0.85 0.20 60)" });
      }
    });
    enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

    // Particles
    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Wave progression
    const waveCleared = enemiesRef.current.length === 0 && waveCounterRef.current > (enemiesPerWave + 2) * spawnInterval;
    if (waveCleared && waveRef.current < 5) {
      waveRef.current++;
      waveCounterRef.current = 0;
      setWave(waveRef.current);
    } else if (waveCleared && waveRef.current >= 5) {
      phaseRef.current = "win";
      setPhase("win");
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    towersRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    waveRef.current = 1;
    waveCounterRef.current = 0;
    frameRef.current = 0;
    phaseRef.current = "playing";
    setPhase("playing");
    setScore(0);
    setLives(MAX_LIVES);
    setWave(1);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "playing") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor(mx / CELL);
    const row = Math.floor(my / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    if (PATH_SET.has(`${row},${col}`)) return;
    if (towersRef.current.some(t => t.col === col && t.row === row)) return;
    towersRef.current.push({ col, row, type: selectedType, cooldown: 0 });
  };

  const spawnInterval = Math.max(60, 120 - (wave - 1) * 10);
  const enemiesPerWave2 = 5 + wave * 2;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stats */}
      <div className="flex gap-4">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Lives</span>
          <span className="score-value">{lives}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Wave</span>
          <span className="score-value gradient-text">{wave}/5</span>
        </div>
      </div>

      {/* Tower selector */}
      {phase === "playing" && (
        <div className="flex gap-2">
          {(["basic", "fast", "heavy"] as TowerType[]).map(t => {
            const td = TOWER_DATA[t];
            return (
              <button
                key={`td-type-${t}`}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-colors
                  ${selectedType === t ? "border-violet-400 bg-violet/20 text-violet-300" : "border-border/40 text-muted-foreground hover:border-border/70"}`}
              >
                {td.emoji} {t}
              </button>
            );
          })}
        </div>
      )}

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`block rounded-lg ${phase === "playing" ? "cursor-crosshair" : ""}`}
          onClick={handleCanvasClick}
        />
        {phase !== "playing" && (
          <div className="game-overlay">
            {phase === "gameover" && (
              <div className="text-center mb-4">
                <p className="font-display text-3xl font-bold text-destructive mb-1">DEFEAT!</p>
                <p className="text-muted-foreground text-sm">Score: {score}</p>
              </div>
            )}
            {phase === "win" && (
              <div className="text-center mb-4">
                <p className="font-display text-3xl font-bold gradient-text mb-1">VICTORY! 🏆</p>
                <p className="text-muted-foreground text-sm">Score: {score}</p>
              </div>
            )}
            {phase === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-xl text-foreground mb-1">Tower Defense</p>
                <p className="text-muted-foreground text-xs">Click empty cells to place towers · Survive 5 waves!</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {phase === "idle" ? "Start Game" : "Play Again"}
            </button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Wave {wave}: ~{enemiesPerWave2} enemies · Spawn every {Math.round(spawnInterval / 60)}s
      </p>
    </div>
  );
}
