import { useEffect, useRef, useCallback, useState } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Point {
  x: number;
  y: number;
}

const GRID = 20;
const CELL = 22;
const CANVAS_SIZE = GRID * CELL;
const INITIAL_SPEED = 140;

function randomPoint(exclude: Point[]): Point {
  let pt: Point;
  do {
    pt = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (exclude.some((p) => p.x === pt.x && p.y === pt.y));
  return pt;
}

type GameState = "idle" | "playing" | "paused" | "gameover";

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dirRef = useRef<Direction>("RIGHT");
  const nextDirRef = useRef<Direction>("RIGHT");
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [displayScore, setDisplayScore] = useState(0);

  const { data: highScore = BigInt(0) } = useGetHighScore("snake");
  const saveScore = useSaveHighScore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "oklch(0.10 0.015 270)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = "oklch(0.16 0.020 270)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(CANVAS_SIZE, i * CELL);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const gradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL * 0.5);
    gradient.addColorStop(0, "oklch(0.80 0.22 25)");
    gradient.addColorStop(1, "oklch(0.60 0.22 25 / 0.4)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    snakeRef.current.forEach((seg, idx) => {
      const isHead = idx === 0;
      const x = seg.x * CELL;
      const y = seg.y * CELL;
      const pad = 1.5;

      if (isHead) {
        const headGrad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
        headGrad.addColorStop(0, "oklch(0.72 0.22 290)");
        headGrad.addColorStop(1, "oklch(0.72 0.19 195)");
        ctx.fillStyle = headGrad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "oklch(0.62 0.22 290 / 0.8)";
      } else {
        const t = idx / snakeRef.current.length;
        ctx.fillStyle = `oklch(${0.55 - t * 0.15} ${0.18 - t * 0.08} 290)`;
        ctx.shadowBlur = 0;
      }

      const r = isHead ? 5 : 3;
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, r);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  const endGame = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setGameState("gameover");
    const score = scoreRef.current;
    const hs = Number(highScore);
    if (score > hs) {
      saveScore.mutate({ gameName: "snake", score: BigInt(score) });
      toast.success(`New high score: ${score}!`);
    }
  }, [highScore, saveScore]);

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const snake = snakeRef.current;
    const head = snake[0];
    const dir = dirRef.current;

    const next: Point = {
      x: head.x + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0),
      y: head.y + (dir === "DOWN" ? 1 : dir === "UP" ? -1 : 0),
    };

    // Wall collision
    if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
      endGame();
      return;
    }
    // Self collision
    if (snake.some((s) => s.x === next.x && s.y === next.y)) {
      endGame();
      return;
    }

    const ateFood = next.x === foodRef.current.x && next.y === foodRef.current.y;
    const newSnake = [next, ...snake];
    if (!ateFood) newSnake.pop();
    else {
      scoreRef.current += 10;
      setDisplayScore(scoreRef.current);
      foodRef.current = randomPoint(newSnake);
    }
    snakeRef.current = newSnake;
    draw();
  }, [draw, endGame]);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = "RIGHT";
    nextDirRef.current = "RIGHT";
    foodRef.current = randomPoint([{ x: 10, y: 10 }]);
    scoreRef.current = 0;
    setDisplayScore(0);
    setGameState("playing");
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, INITIAL_SPEED);
    draw();
  }, [tick, draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        s: "DOWN",
        a: "LEFT",
        d: "RIGHT",
      };
      const newDir = map[e.key];
      if (!newDir) return;
      e.preventDefault();
      const opposite: Record<Direction, Direction> = {
        UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
      };
      if (newDir !== opposite[dirRef.current]) {
        nextDirRef.current = newDir;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Restart tick ref when interval needs updating
  useEffect(() => {
    if (gameState === "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, INITIAL_SPEED);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, tick]);

  const handleDirBtn = (dir: Direction) => {
    const opposite: Record<Direction, Direction> = {
      UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
    };
    if (dir !== opposite[dirRef.current]) {
      nextDirRef.current = dir;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score bar */}
      <div className="flex gap-6 text-center">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{displayScore}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">{Number(highScore)}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="game-canvas-wrap" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block rounded-lg"
          style={{ imageRendering: "pixelated" }}
        />
        {gameState !== "playing" && (
          <div className="game-overlay">
            {gameState === "gameover" && (
              <div className="text-center">
                <p className="font-display text-3xl font-700 text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {displayScore}</p>
              </div>
            )}
            {gameState === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-lg text-muted-foreground">Arrow keys or WASD</p>
              </div>
            )}
            <button
              type="button"
              onClick={startGame}
              className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-600 tracking-wide"
            >
              {gameState === "gameover" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="grid grid-cols-3 gap-2 mt-2 sm:hidden">
        {(["UP", "DOWN", "LEFT", "RIGHT"] as Direction[]).map((dir) => {
          const labels: Record<Direction, string> = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→" };
          const pos: Record<Direction, string> = {
            UP: "col-start-2 row-start-1",
            DOWN: "col-start-2 row-start-3",
            LEFT: "col-start-1 row-start-2",
            RIGHT: "col-start-3 row-start-2",
          };
          return (
            <button
              key={dir}
              type="button"
              onClick={() => handleDirBtn(dir)}
              className={`${pos[dir]} w-12 h-12 rounded-xl bg-surface-2 border border-violet/20 flex items-center justify-center text-xl text-violet-300 active:bg-violet/20`}
            >
              {labels[dir]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
