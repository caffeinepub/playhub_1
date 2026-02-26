import { useEffect, useRef, useCallback, useState } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const W = COLS * CELL;
const H = ROWS * CELL;

type Board = (string | null)[][];
type Piece = { shape: number[][]; color: string; x: number; y: number };

const TETROMINOES: { shape: number[][]; color: string }[] = [
  { shape: [[1,1,1,1]], color: "oklch(0.72 0.19 195)" }, // I - cyan
  { shape: [[1,1],[1,1]], color: "oklch(0.80 0.18 50)" }, // O - yellow
  { shape: [[0,1,0],[1,1,1]], color: "oklch(0.62 0.22 290)" }, // T - violet
  { shape: [[1,0],[1,1],[0,1]], color: "oklch(0.72 0.21 160)" }, // S - green
  { shape: [[0,1],[1,1],[1,0]], color: "oklch(0.65 0.23 15)" }, // Z - red
  { shape: [[1,0],[1,0],[1,1]], color: "oklch(0.75 0.20 45)" }, // L - orange
  { shape: [[0,1],[0,1],[1,1]], color: "oklch(0.62 0.22 260)" }, // J - blue
];

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece(): Piece {
  const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  return { shape: t.shape, color: t.color, x: Math.floor(COLS / 2) - 1, y: 0 };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function isValid(board: Board, piece: Piece, dx = 0, dy = 0, shape?: number[][]): boolean {
  const s = shape ?? piece.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function place(board: Board, piece: Piece): Board {
  const b = board.map(row => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const ny = piece.y + r;
      const nx = piece.x + c;
      if (ny >= 0) b[ny][nx] = piece.color;
    }
  }
  return b;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter(row => row.some(cell => !cell));
  const cleared = ROWS - kept.length;
  const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...newRows, ...kept], cleared };
}

type GameState = "idle" | "playing" | "paused" | "gameover";

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>(createBoard());
  const pieceRef = useRef<Piece>(randomPiece());
  const nextPieceRef = useRef<Piece>(randomPiece());
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);

  const { data: highScore = BigInt(0) } = useGetHighScore("tetris");
  const saveScore = useSaveHighScore();

  const getSpeed = useCallback((level: number) => Math.max(80, 500 - (level - 1) * 45), []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "oklch(0.10 0.015 270)";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "oklch(0.16 0.020 270)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
    }

    // Board cells
    boardRef.current.forEach((row, r) => {
      row.forEach((color, c) => {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        ctx.shadowBlur = 0;
        // Highlight top edge
        ctx.fillStyle = "oklch(1 0 0 / 0.25)";
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 3);
      });
    });

    // Ghost piece (drop preview)
    const piece = pieceRef.current;
    let ghostY = 0;
    while (isValid(boardRef.current, piece, 0, ghostY + 1)) ghostY++;
    piece.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (!val) return;
        const gy = piece.y + r + ghostY;
        if (gy >= 0) {
          ctx.fillStyle = `${piece.color.replace(")", " / 0.2)")}`;
          ctx.fillRect((piece.x + c) * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = `${piece.color.replace(")", " / 0.4)")}`;
          ctx.lineWidth = 1;
          ctx.strokeRect((piece.x + c) * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
        }
      });
    });

    // Active piece
    piece.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (!val) return;
        const py = piece.y + r;
        if (py >= 0) {
          ctx.fillStyle = piece.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = piece.color;
          ctx.fillRect((piece.x + c) * CELL + 1, py * CELL + 1, CELL - 2, CELL - 2);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "oklch(1 0 0 / 0.3)";
          ctx.fillRect((piece.x + c) * CELL + 1, py * CELL + 1, CELL - 2, 3);
        }
      });
    });
  }, []);

  // We use a ref for the tick function to avoid circular deps between tick <-> lockAndNext
  const tickRef = useRef<() => void>(() => {});

  const lockAndNext = useCallback(() => {
    boardRef.current = place(boardRef.current, pieceRef.current);
    const { board, cleared } = clearLines(boardRef.current);
    boardRef.current = board;

    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800][cleared] * levelRef.current;
      scoreRef.current += pts;
      linesRef.current += cleared;
      levelRef.current = Math.floor(linesRef.current / 10) + 1;
      setDisplayScore(scoreRef.current);
      setDisplayLevel(levelRef.current);
    }

    const next = nextPieceRef.current;
    pieceRef.current = next;
    nextPieceRef.current = randomPiece();

    if (!isValid(boardRef.current, pieceRef.current)) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setGameState("gameover");
      const score = scoreRef.current;
      if (score > Number(highScore)) {
        saveScore.mutate({ gameName: "tetris", score: BigInt(score) });
        toast.success(`New high score: ${score}!`);
      }
    } else {
      // Restart with new speed
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => tickRef.current(), getSpeed(levelRef.current));
    }
    draw();
  }, [draw, getSpeed, highScore, saveScore]);

  const tick = useCallback(() => {
    if (isValid(boardRef.current, pieceRef.current, 0, 1)) {
      pieceRef.current = { ...pieceRef.current, y: pieceRef.current.y + 1 };
      draw();
    } else {
      lockAndNext();
    }
  }, [draw, lockAndNext]);

  tickRef.current = tick;

  const startGame = useCallback(() => {
    boardRef.current = createBoard();
    pieceRef.current = randomPiece();
    nextPieceRef.current = randomPiece();
    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    setDisplayScore(0);
    setDisplayLevel(1);
    setGameState("playing");
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => tickRef.current(), getSpeed(1));
    draw();
  }, [draw, getSpeed]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      const piece = pieceRef.current;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (isValid(boardRef.current, piece, -1, 0)) {
            pieceRef.current = { ...piece, x: piece.x - 1 };
            draw();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (isValid(boardRef.current, piece, 1, 0)) {
            pieceRef.current = { ...piece, x: piece.x + 1 };
            draw();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (isValid(boardRef.current, piece, 0, 1)) {
            pieceRef.current = { ...piece, y: piece.y + 1 };
            draw();
          } else {
            lockAndNext();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          {
            const rotated = rotate(piece.shape);
            if (isValid(boardRef.current, piece, 0, 0, rotated)) {
              pieceRef.current = { ...piece, shape: rotated };
              draw();
            }
          }
          break;
        case " ":
          e.preventDefault();
          {
            let drop = 0;
            while (isValid(boardRef.current, pieceRef.current, 0, drop + 1)) drop++;
            pieceRef.current = { ...pieceRef.current, y: pieceRef.current.y + drop };
            lockAndNext();
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, draw, lockAndNext]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => { draw(); }, [draw]);

  // Mobile controls
  const moveLeft = () => {
    if (gameState !== "playing") return;
    const p = pieceRef.current;
    if (isValid(boardRef.current, p, -1, 0)) { pieceRef.current = { ...p, x: p.x - 1 }; draw(); }
  };
  const moveRight = () => {
    if (gameState !== "playing") return;
    const p = pieceRef.current;
    if (isValid(boardRef.current, p, 1, 0)) { pieceRef.current = { ...p, x: p.x + 1 }; draw(); }
  };
  const moveDown = () => {
    if (gameState !== "playing") return;
    const p = pieceRef.current;
    if (isValid(boardRef.current, p, 0, 1)) { pieceRef.current = { ...p, y: p.y + 1 }; draw(); }
    else lockAndNext();
  };
  const rotatePiece = () => {
    if (gameState !== "playing") return;
    const p = pieceRef.current;
    const rotated = rotate(p.shape);
    if (isValid(boardRef.current, p, 0, 0, rotated)) { pieceRef.current = { ...p, shape: rotated }; draw(); }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-center">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{displayScore}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Level</span>
          <span className="score-value gradient-text">{displayLevel}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Best</span>
          <span className="score-value">{Number(highScore)}</span>
        </div>
      </div>

      <div className="game-canvas-wrap" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block rounded-lg" style={{ imageRendering: "pixelated" }} />
        {gameState !== "playing" && (
          <div className="game-overlay">
            {gameState === "gameover" && (
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-destructive mb-1">GAME OVER</p>
                <p className="text-muted-foreground text-sm mb-4">Score: {displayScore}</p>
              </div>
            )}
            {gameState === "idle" && (
              <div className="text-center mb-4">
                <p className="font-display text-sm text-muted-foreground">← → Move · ↑ Rotate · ↓ Drop · Space Hard Drop</p>
              </div>
            )}
            <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
              {gameState === "gameover" ? "Play Again" : "Start Tetris"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-2 mt-2 sm:hidden">
        {[
          { label: "↻", action: rotatePiece, pos: "col-start-2 row-start-1" },
          { label: "←", action: moveLeft, pos: "col-start-1 row-start-2" },
          { label: "↓", action: moveDown, pos: "col-start-2 row-start-2" },
          { label: "→", action: moveRight, pos: "col-start-3 row-start-2" },
        ].map(({ label, action, pos }) => (
          <button key={label} type="button" onClick={action}
            className={`${pos} w-12 h-12 rounded-xl bg-surface-2 border border-violet/20 flex items-center justify-center text-xl text-violet-300 active:bg-violet/20`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
