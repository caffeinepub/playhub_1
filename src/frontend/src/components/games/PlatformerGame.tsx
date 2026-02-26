import { useEffect, useRef, useCallback, useState } from "react";

const W = 500, H = 400;
const GRAVITY = 0.5;
const JUMP_FORCE = -11;
const SCROLL_SPEED = 3;
const PLAYER_W = 24, PLAYER_H = 28;
const PLAT_H = 14;
const COIN_R = 8;

interface Platform { x: number; y: number; w: number; }
interface Coin { x: number; y: number; collected: boolean; }

function genInitialPlatforms(): Platform[] {
  const plats: Platform[] = [{ x: 0, y: H - 60, w: 320 }];
  let lastX = 320;
  while (lastX < W + 200) {
    const gap = 60 + Math.random() * 60;
    const w = 80 + Math.random() * 80;
    const y = H - 60 - Math.random() * 100;
    plats.push({ x: lastX + gap, y, w });
    lastX += gap + w;
  }
  return plats;
}

function genCoins(plats: Platform[]): Coin[] {
  return plats.slice(1).map(p => ({
    x: p.x + p.w / 2,
    y: p.y - 24,
    collected: false,
  }));
}

export default function PlatformerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<"idle" | "playing" | "gameover">("idle");
  const playerRef = useRef({ x: 80, y: H - 88, vy: 0, onGround: false, jumping: false });
  const platformsRef = useRef<Platform[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const scrollRef = useRef(0);
  const scoreRef = useRef(0);
  const nextPlatEndRef = useRef(0);
  const rafRef = useRef(0);
  const jumpInputRef = useRef(false);

  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);

  const resetGame = useCallback(() => {
    const plats = genInitialPlatforms();
    platformsRef.current = plats;
    coinsRef.current = genCoins(plats);
    nextPlatEndRef.current = plats[plats.length - 1].x + plats[plats.length - 1].w;
    scrollRef.current = 0;
    scoreRef.current = 0;
    playerRef.current = { x: 80, y: H - 88, vy: 0, onGround: false, jumping: false };
  }, []);

  const draw = useCallback((ts: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scroll = scrollRef.current;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "oklch(0.18 0.05 265)");
    sky.addColorStop(1, "oklch(0.12 0.03 265)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars parallax
    ctx.fillStyle = "oklch(0.80 0.01 270 / 0.4)";
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 137.5 - scroll * 0.2) % W + W) % W;
      const sy = (i * 67.3) % (H * 0.7);
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Ground
    ctx.fillStyle = "oklch(0.25 0.04 150)";
    ctx.fillRect(0, H - 20, W, 20);

    // Platforms
    platformsRef.current.forEach(p => {
      const px = p.x - scroll;
      if (px + p.w < -20 || px > W + 20) return;
      // Platform body
      const grad = ctx.createLinearGradient(px, p.y, px, p.y + PLAT_H);
      grad.addColorStop(0, "oklch(0.48 0.18 150)");
      grad.addColorStop(1, "oklch(0.32 0.12 150)");
      ctx.fillStyle = grad;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "oklch(0.45 0.18 150 / 0.6)";
      ctx.beginPath();
      ctx.roundRect(px, p.y, p.w, PLAT_H, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Coins
    coinsRef.current.forEach(c => {
      if (c.collected) return;
      const cx = c.x - scroll;
      if (cx < -20 || cx > W + 20) return;
      const pulse = 0.85 + Math.sin(ts / 300 + c.x) * 0.15;
      ctx.fillStyle = `oklch(0.85 0.22 80 / ${pulse})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "oklch(0.80 0.22 80)";
      ctx.beginPath();
      ctx.arc(cx, c.y, COIN_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Player
    const { x, y } = playerRef.current;
    const px2 = x - scroll + W * 0.1;
    const runFrame = Math.floor(ts / 120) % 2;
    ctx.fillStyle = "oklch(0.72 0.20 25)";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "oklch(0.65 0.22 25 / 0.8)";
    ctx.beginPath();
    ctx.roundRect(px2, y, PLAYER_W, PLAYER_H, 5);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(px2 + PLAYER_W * 0.65, y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(px2 + PLAYER_W * 0.65 + 1, y + 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Legs animation
    ctx.fillStyle = "oklch(0.55 0.15 25)";
    const leg1Y = y + PLAYER_H - (runFrame === 0 ? 0 : 4);
    const leg2Y = y + PLAYER_H - (runFrame === 0 ? 4 : 0);
    ctx.fillRect(px2 + 4, leg1Y, 7, 6);
    ctx.fillRect(px2 + PLAYER_W - 11, leg2Y, 7, 6);
    ctx.shadowBlur = 0;
  }, []);

  const tick = useCallback((ts: number) => {
    if (phaseRef.current !== "playing") { draw(ts); return; }

    const player = playerRef.current;
    const scroll = scrollRef.current;

    // Auto-scroll
    scrollRef.current += SCROLL_SPEED;
    scoreRef.current += 1;
    if (scoreRef.current % 10 === 0) setScore(Math.floor(scoreRef.current / 10));

    // Jump input
    if (jumpInputRef.current && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      jumpInputRef.current = false;
    }

    // Physics
    player.vy += GRAVITY;
    player.y += player.vy;
    player.onGround = false;

    // Ground
    if (player.y + PLAYER_H >= H - 20) {
      player.y = H - 20 - PLAYER_H;
      player.vy = 0;
      player.onGround = true;
    }

    // Platform collisions
    const playerScreenX = player.x - scroll + W * 0.1;
    platformsRef.current.forEach(p => {
      const px = p.x - scroll;
      if (
        player.vy >= 0 &&
        playerScreenX + PLAYER_W > px &&
        playerScreenX < px + p.w &&
        player.y + PLAYER_H >= p.y &&
        player.y + PLAYER_H <= p.y + PLAT_H + player.vy + 4
      ) {
        player.y = p.y - PLAYER_H;
        player.vy = 0;
        player.onGround = true;
      }
    });

    // Coin collection
    coinsRef.current.forEach(c => {
      if (c.collected) return;
      const cx = c.x - scroll;
      const dist = Math.hypot(playerScreenX + PLAYER_W / 2 - cx, player.y + PLAYER_H / 2 - c.y);
      if (dist < COIN_R + PLAYER_W / 2) {
        c.collected = true;
        scoreRef.current += 50;
        setScore(Math.floor(scoreRef.current / 10));
      }
    });

    // Generate new platforms
    const viewRight = scrollRef.current + W + 100;
    if (viewRight > nextPlatEndRef.current - 200) {
      const gap = 60 + Math.random() * 60;
      const w = 80 + Math.random() * 80;
      const y2 = H - 60 - Math.random() * 100;
      const newPlat = { x: nextPlatEndRef.current + gap, y: y2, w };
      platformsRef.current.push(newPlat);
      coinsRef.current.push({ x: newPlat.x + w / 2, y: y2 - 24, collected: false });
      nextPlatEndRef.current += gap + w;
    }

    // Cull old platforms/coins
    platformsRef.current = platformsRef.current.filter(p => p.x + p.w > scrollRef.current - 100);
    coinsRef.current = coinsRef.current.filter(c => c.x > scrollRef.current - 100);

    // Game over: fell off screen
    if (player.y > H + 50) {
      phaseRef.current = "gameover";
      setPhase("gameover");
      return;
    }

    // Check if player fell behind scroll
    if (playerScreenX + PLAYER_W < 0) {
      phaseRef.current = "gameover";
      setPhase("gameover");
      return;
    }

    draw(ts);
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    resetGame();
    phaseRef.current = "playing";
    setPhase("playing");
    setScore(0);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, resetGame]);

  const handleJump = useCallback(() => {
    jumpInputRef.current = true;
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        jumpInputRef.current = true;
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="score-chip">
        <span className="score-label">Score</span>
        <span className="score-value">{score}</span>
      </div>

      <div
        className="game-canvas-wrap"
        style={{ width: W, height: H }}
      >
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
                <p className="font-display text-xl text-foreground mb-1">Platformer Run</p>
                <p className="text-muted-foreground text-xs">Space / Click to jump · Collect coins!</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {phase === "gameover" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleJump}
        className="sm:hidden btn-gradient px-10 py-4 rounded-xl text-white font-display font-semibold text-lg tracking-wide active:scale-95"
      >
        Jump!
      </button>
      <p className="text-muted-foreground text-xs hidden sm:block">Space or click to jump · Collect coins for bonus points</p>
    </div>
  );
}
