import { useCallback, useEffect, useRef, useState } from "react";

const W = 500;
const H = 450;
const FRUITS = ["🍉", "🍊", "🍋", "🍓", "🫐", "🍇", "🍑"];

type Fruit = { id: number; x: number; y: number; vx: number; vy: number; r: number; sliced: boolean; isBomb: boolean; emoji: string };

let nextId = 0;

type GameState = {
  fruits: Fruit[];
  score: number;
  lives: number;
  frame: number;
  slashPoints: { x: number; y: number }[];
  mouseDown: boolean;
  combo: number;
  lastSliceFrame: number;
};

export default function FruitNinja() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const gsRef = useRef<GameState>({
    fruits: [],
    score: 0,
    lives: 3,
    frame: 0,
    slashPoints: [],
    mouseDown: false,
    combo: 0,
    lastSliceFrame: 0,
  });

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = gsRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0c0a1e";
    ctx.fillRect(0, 0, W, H);

    s.frame++;
    if (s.frame % 60 === 0) {
      const isBomb = Math.random() < 0.15;
      s.fruits.push({
        id: nextId++,
        x: 60 + Math.random() * (W - 120),
        y: H + 30,
        vx: (Math.random() - 0.5) * 4,
        vy: -12 - Math.random() * 5,
        r: 28,
        sliced: false,
        isBomb,
        emoji: isBomb ? "💣" : FRUITS[Math.floor(Math.random() * FRUITS.length)],
      });
    }

    // Physics
    s.fruits = s.fruits.filter(f => f.y < H + 80);
    let lost = false;
    for (const f of s.fruits) {
      if (f.sliced) continue;
      f.x += f.vx;
      f.vy += 0.3;
      f.y += f.vy;
      if (f.y > H + 40 && !f.sliced) {
        f.sliced = true;
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { lost = true; }
      }
    }
    if (lost) {
      runningRef.current = false;
      setGameState("dead");
      return;
    }

    // Draw fruits
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of s.fruits) {
      if (!f.sliced) ctx.fillText(f.emoji, f.x, f.y);
    }

    // Slash trail
    if (s.slashPoints.length > 1 && s.mouseDown) {
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.slashPoints[0].x, s.slashPoints[0].y);
      for (const p of s.slashPoints) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    if (s.slashPoints.length > 20) s.slashPoints.splice(0, 5);

    // Decay combo if no slice for 60 frames
    if (s.combo > 0 && s.frame - s.lastSliceFrame > 60) {
      s.combo = 0;
      setCombo(0);
    }

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${s.score}`, 10, 28);
    if (s.combo >= 2) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`🔥 COMBO x${s.combo}`, 10, 52);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    for (let i = 0; i < s.lives; i++) {
      ctx.fillText("♥", W - 30 - i * 22, 28);
    }

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    gsRef.current = { fruits: [], score: 0, lives: 3, frame: 0, slashPoints: [], mouseDown: false, combo: 0, lastSliceFrame: 0 };
    setScore(0);
    setLives(3);
    setCombo(0);
    setGameState("playing");
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, [runLoop]);

  useEffect(() => () => cancelAnimationFrame(animIdRef.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing") return;

    const checkSlash = (x: number, y: number) => {
      const s = gsRef.current;
      for (const f of s.fruits) {
        if (f.sliced) continue;
        const dx = x - f.x, dy = y - f.y;
        if (Math.sqrt(dx * dx + dy * dy) < f.r + 5) {
          f.sliced = true;
          if (f.isBomb) {
            runningRef.current = false;
            setGameState("dead");
            return;
          }
          s.combo++;
          s.lastSliceFrame = s.frame;
          s.score += s.combo >= 2 ? 2 : 1;
          setScore(s.score);
          setCombo(s.combo);
        }
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      const s = gsRef.current;
      if (s.mouseDown) {
        s.slashPoints.push({ x, y });
        checkSlash(x, y);
      }
    };
    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = gsRef.current;
      s.mouseDown = true;
      s.slashPoints = [{ x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) }];
    };
    const onUp = () => {
      gsRef.current.mouseDown = false;
      gsRef.current.slashPoints = [];
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🍉 Fruit Ninja</span>
        <div className="flex gap-3 text-sm font-mono">
          {combo >= 2 && <span className="text-amber-400">🔥 x{combo}</span>}
          <span className="text-violet-200">Score: {score}</span>
          <span className="text-red-400">♥ {lives}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-violet-500/30 cursor-crosshair max-w-full"
        onClick={gameState !== "playing" ? startGame : undefined}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Game Over! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
            Try Again
          </button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">Hold & drag to slice fruits — avoid bombs!</p>}
    </div>
  );
}
