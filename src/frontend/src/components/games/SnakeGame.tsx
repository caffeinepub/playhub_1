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

// Google Snake color palette
const BG_COLOR = "#4aad52";
const GRID_LINE_COLOR = "rgba(255,255,255,0.10)";
const SNAKE_HEAD_COLOR = "#3d9c45";
const SNAKE_BODY_COLOR = "#2d7a34";
const FOOD_COLOR = "#e74c3c";
const STEM_COLOR = "#27ae60";

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

    // Board background — Google Snake bright green
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines — white at low opacity
    ctx.strokeStyle = GRID_LINE_COLOR;
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

    // Food — red apple circle with green stem
    const food = foodRef.current;
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const appleR = CELL * 0.38;

    // Stem
    ctx.strokeStyle = STEM_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fx, fy - appleR);
    ctx.lineTo(fx + 2, fy - appleR - 4);
    ctx.stroke();

    // Apple body
    ctx.fillStyle = FOOD_COLOR;
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(fx, fy, appleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Apple highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(fx - appleR * 0.25, fy - appleR * 0.25, appleR * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Snake segments
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      const x = seg.x * CELL;
      const y = seg.y * CELL;
      const pad = 1;

      ctx.fillStyle = isHead ? SNAKE_HEAD_COLOR : SNAKE_BODY_COLOR;
      const r = isHead ? 5 : 3;
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, r);
      ctx.fill();

      // Subtle highlight on top-left for 3D feel
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, CELL - pad * 2, 3, [r, r, 0, 0]);
      ctx.fill();

      // Eyes on head
      if (isHead) {
        const dir = dirRef.current;
        ctx.fillStyle = "#fff";
        const eyeR = 2.5;
        let e1x = x + CELL / 2, e1y = y + CELL / 2;
        let e2x = x + CELL / 2, e2y = y + CELL / 2;
        if (dir === "RIGHT") { e1x = x + CELL - 6; e1y = y + 5; e2x = x + CELL - 6; e2y = y + CELL - 5; }
        else if (dir === "LEFT") { e1x = x + 6; e1y = y + 5; e2x = x + 6; e2y = y + CELL - 5; }
        else if (dir === "UP") { e1x = x + 5; e1y = y + 6; e2x = x + CELL - 5; e2y = y + 6; }
        else { e1x = x + 5; e1y = y + CELL - 6; e2x = x + CELL - 5; e2y = y + CELL - 6; }
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1a5a1a";
        ctx.beginPath(); ctx.arc(e1x, e1y, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, 1.2, 0, Math.PI * 2); ctx.fill();
      }
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
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block"
          style={{ imageRendering: "pixelated" }}
        />
        {gameState !== "playing" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          >
            {gameState === "gameover" && (
              <div className="text-center">
                <p className="text-white text-3xl font-bold mb-1" style={{ fontFamily: "Oxanium, sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                  GAME OVER
                </p>
                <p className="text-white/80 text-sm mb-4">Score: {displayScore}</p>
              </div>
            )}
            {gameState === "idle" && (
              <div className="text-center mb-1">
                <p className="text-white/80 text-sm">Arrow keys or WASD to move</p>
              </div>
            )}
            <button
              type="button"
              onClick={startGame}
              className="px-8 py-2.5 rounded-full text-white font-bold text-sm tracking-wide transition-all hover:scale-105 active:scale-95"
              style={{
                background: "#4aad52",
                boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
                fontFamily: "Oxanium, sans-serif",
              }}
            >
              {gameState === "gameover" ? "Play Again" : "Start"}
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
              className={`${pos[dir]} w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white font-bold active:opacity-70`}
              style={{ background: "#4aad52", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
            >
              {labels[dir]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
