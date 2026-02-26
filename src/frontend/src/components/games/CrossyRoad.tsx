import { useCallback, useEffect, useRef, useState } from "react";

const W = 400;
const H = 480;
const CELL = 40;
const COLS = W / CELL;
const ROWS = H / CELL;
const START_ROW = ROWS - 2;

type Lane = { type: "road" | "water" | "safe"; cars: { x: number; speed: number; w: number }[]; logs: { x: number; speed: number; w: number }[] };

function genLanes(count: number): Lane[] {
  return Array.from({ length: count }, (_, i) => {
    if (i === 0 || i % 5 === 0) return { type: "safe", cars: [], logs: [] };
    const t = Math.random() < 0.4 ? "water" : "road";
    const speed = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.random() * 2);
    const objs = Array.from({ length: 3 }, () => ({ x: Math.random() * W, speed, w: t === "water" ? 80 : 50 }));
    return { type: t, cars: t === "road" ? objs : [], logs: t === "water" ? objs : [] };
  });
}

export default function CrossyRoad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const runningRef = useRef(false);
  const animIdRef = useRef(0);
  const gsRef = useRef({
    playerRow: START_ROW,
    playerCol: Math.floor(COLS / 2),
    onLog: false,
    score: 0,
    lanes: [] as Lane[],
    cameraRow: 0,
    bestRow: START_ROW,
  });

  const runLoop = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = gsRef.current;
    if (!runningRef.current) return;

    ctx.clearRect(0, 0, W, H);

    // Move obstacles
    for (const lane of s.lanes) {
      for (const car of lane.cars) {
        car.x += car.speed * 0.5;
        if (car.x > W + car.w) car.x = -car.w;
        if (car.x < -car.w) car.x = W + car.w;
      }
      for (const log of lane.logs) {
        log.x += log.speed * 0.3;
        if (log.x > W + log.w) log.x = -log.w;
        if (log.x < -log.w) log.x = W + log.w;
      }
    }

    const camOffset = s.cameraRow;

    // Draw lanes
    for (let r = 0; r < s.lanes.length; r++) {
      const screenR = r - camOffset;
      if (screenR < -1 || screenR > ROWS + 1) continue;
      const lane = s.lanes[r];
      const y = screenR * CELL;
      ctx.fillStyle = lane.type === "road" ? "#374151" : lane.type === "water" ? "#1e40af" : "#4a7c59";
      ctx.fillRect(0, y, W, CELL);

      for (const car of lane.cars) {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(car.x, y + 5, car.w, CELL - 10);
      }
      for (const log of lane.logs) {
        ctx.fillStyle = "#92400e";
        ctx.fillRect(log.x, y + 8, log.w, CELL - 16);
      }
    }

    // Player
    const pScreenR = s.playerRow - camOffset;
    const lane = s.lanes[s.playerRow];

    // Water check
    if (lane?.type === "water") {
      const px = s.playerCol * CELL + CELL / 2;
      let onLog = false;
      for (const log of lane.logs) {
        if (px > log.x && px < log.x + log.w) {
          onLog = true;
          s.playerCol = Math.round((px + log.speed * 0.3 - CELL / 2) / CELL);
          break;
        }
      }
      if (!onLog) {
        runningRef.current = false;
        setGameState("dead");
        return;
      }
    }

    // Car collision
    if (lane?.type === "road") {
      const px = s.playerCol * CELL;
      for (const car of lane.cars) {
        if (px + 5 < car.x + car.w && px + CELL - 5 > car.x) {
          runningRef.current = false;
          setGameState("dead");
          return;
        }
      }
    }

    // Clamp player
    s.playerCol = Math.max(0, Math.min(COLS - 1, s.playerCol));

    // Draw player
    ctx.font = "28px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐔", s.playerCol * CELL + CELL / 2, pScreenR * CELL + CELL / 2);

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${s.score}`, 8, 22);

    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    runningRef.current = false;
    const lanes = genLanes(100);
    gsRef.current = {
      playerRow: START_ROW,
      playerCol: Math.floor(COLS / 2),
      onLog: false,
      score: 0,
      lanes,
      cameraRow: 0,
      bestRow: START_ROW,
    };
    setScore(0);
    setGameState("playing");
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    animIdRef.current = requestAnimationFrame(() => runLoop(ctx));
  }, [runLoop]);

  useEffect(() => () => cancelAnimationFrame(animIdRef.current), []);

  useEffect(() => {
    if (gameState !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const s = gsRef.current;
      if (!runningRef.current) return;
      const map: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
        w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
      };
      const move = map[e.key];
      if (!move) return;
      e.preventDefault();
      const [dr, dc] = move;
      s.playerRow += dr;
      s.playerCol += dc;
      s.playerRow = Math.max(0, Math.min(s.lanes.length - 1, s.playerRow));
      // Scroll camera
      const pScreenR = s.playerRow - s.cameraRow;
      if (pScreenR < 3) s.cameraRow = Math.max(0, s.playerRow - 3);
      if (pScreenR > ROWS - 3) s.cameraRow = s.playerRow - (ROWS - 3);
      // Score
      if (s.playerRow < s.bestRow) {
        s.score += s.bestRow - s.playerRow;
        s.bestRow = s.playerRow;
        setScore(s.score);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🐔 Crossy Road</span>
        <span className="font-mono text-violet-200 text-sm">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-violet-500/30 max-w-full"
        onClick={gameState !== "playing" ? startGame : undefined}
      />
      {gameState === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}
      {gameState === "dead" && (
        <div className="text-center">
          <p className="text-red-400 font-display text-lg mb-2">Squished! Score: {score}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">Try Again</button>
        </div>
      )}
      {gameState === "playing" && <p className="text-muted-foreground text-xs">Arrow keys or WASD to hop</p>}
    </div>
  );
}
