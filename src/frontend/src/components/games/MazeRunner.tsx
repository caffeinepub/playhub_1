import { useCallback, useEffect, useRef, useState } from "react";

const SIZE = 15;
const CELL = 30;

type Cell = { walls: [boolean, boolean, boolean, boolean]; visited: boolean }; // N,E,S,W

function generateMaze(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ walls: [true, true, true, true], visited: false }))
  );
  const stack: [number, number][] = [];
  let cr = 0, cc = 0;
  grid[cr][cc].visited = true;
  let count = 1;
  const total = SIZE * SIZE;
  while (count < total) {
    const neighbors: [number, number, number][] = [];
    const dirs: [number, number, number][] = [[-1, 0, 0], [0, 1, 1], [1, 0, 2], [0, -1, 3]];
    for (const [dr, dc, d] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !grid[nr][nc].visited) {
        neighbors.push([nr, nc, d]);
      }
    }
    if (neighbors.length > 0) {
      const [nr, nc, d] = neighbors[Math.floor(Math.random() * neighbors.length)];
      const opp = [2, 3, 0, 1][d];
      grid[cr][cc].walls[d] = false;
      grid[nr][nc].walls[opp] = false;
      grid[nr][nc].visited = true;
      stack.push([cr, cc]);
      cr = nr; cc = nc;
      count++;
    } else if (stack.length > 0) {
      [cr, cc] = stack.pop()!;
    }
  }
  return grid;
}

export default function MazeRunner() {
  const [maze] = useState(generateMaze);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const startTime = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    setPos(([r, c]) => {
      const dirMap: Record<string, number> = { "-10": 0, "01": 1, "10": 2, "0-1": 3 };
      const key = `${dr}${dc}`;
      const d = dirMap[key];
      if (d === undefined || maze[r][c].walls[d]) return [r, c];
      const nr = r + dr, nc = c + dc;
      if (nr === SIZE - 1 && nc === SIZE - 1) {
        setWon(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return [nr, nc];
    });
  }, [maze, won]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
        w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
        W: [-1, 0], S: [1, 0], A: [0, -1], D: [0, 1],
      };
      if (map[e.key]) {
        e.preventDefault();
        if (!started) {
          setStarted(true);
          startTime.current = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - (startTime.current ?? Date.now())) / 1000));
          }, 500);
        }
        move(...map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (timerRef.current) clearInterval(timerRef.current); };
  }, [move, started]);

  const W = SIZE * CELL;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🌀 Maze Runner</span>
        <span className="font-mono text-cyan-200 text-sm">{won ? `Solved in ${elapsed}s! 🎉` : `⏱ ${elapsed}s`}</span>
      </div>

      <svg width={W + 2} height={W + 2} className="rounded-lg border border-cyan-500/30" aria-label="Maze puzzle">
        <title>Maze puzzle</title>
        <rect width={W + 2} height={W + 2} fill="#0a1628" />
        {maze.map((row, ri) =>
          row.map((cell, ci) => {
            const x = ci * CELL + 1, y = ri * CELL + 1;
            const walls: { d: string; key: string }[] = [];
            if (cell.walls[0]) walls.push({ d: `M${x},${y} L${x + CELL},${y}`, key: `N${ri}-${ci}` });
            if (cell.walls[1]) walls.push({ d: `M${x + CELL},${y} L${x + CELL},${y + CELL}`, key: `E${ri}-${ci}` });
            if (cell.walls[2]) walls.push({ d: `M${x},${y + CELL} L${x + CELL},${y + CELL}`, key: `S${ri}-${ci}` });
            if (cell.walls[3]) walls.push({ d: `M${x},${y} L${x},${y + CELL}`, key: `W${ri}-${ci}` });
            return walls.map(w => (
              <path key={w.key} d={w.d} stroke="#0e7490" strokeWidth="2" />
            ));
          })
        )}
        {/* Exit */}
        <rect
          x={(SIZE - 1) * CELL + 5}
          y={(SIZE - 1) * CELL + 5}
          width={CELL - 10}
          height={CELL - 10}
          fill="#22c55e"
          opacity="0.6"
          rx="3"
        />
        {/* Player */}
        <circle
          cx={pos[1] * CELL + CELL / 2 + 1}
          cy={pos[0] * CELL + CELL / 2 + 1}
          r={CELL / 2 - 5}
          fill="#06b6d4"
        />
      </svg>
      {won ? (
        <p className="text-green-400 font-display text-base">You escaped in {elapsed} seconds!</p>
      ) : (
        <p className="text-muted-foreground text-xs">Arrow keys or WASD to move. Reach the 🟩 exit</p>
      )}
    </div>
  );
}
