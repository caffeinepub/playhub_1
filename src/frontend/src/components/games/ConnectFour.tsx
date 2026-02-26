import { useState, useCallback } from "react";

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const P1 = 1;
const P2 = 2;

type Cell = 0 | 1 | 2;
type Board = Cell[][];

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY) as Cell[]);
}

function checkWin(board: Board, player: Cell): boolean {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r][c+i] === player)) return true;
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if ([0,1,2,3].every(i => board[r+i][c] === player)) return true;
    }
  }
  // Diagonal ↘
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r+i][c+i] === player)) return true;
    }
  }
  // Diagonal ↙
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      if ([0,1,2,3].every(i => board[r+i][c-i] === player)) return true;
    }
  }
  return false;
}

function getWinningCells(board: Board, player: Cell): [number, number][] {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r][c+i] === player)) {
        return [0,1,2,3].map(i => [r, c+i]) as [number,number][];
      }
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if ([0,1,2,3].every(i => board[r+i][c] === player)) {
        return [0,1,2,3].map(i => [r+i, c]) as [number,number][];
      }
    }
  }
  // Diagonal ↘
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r+i][c+i] === player)) {
        return [0,1,2,3].map(i => [r+i, c+i]) as [number,number][];
      }
    }
  }
  // Diagonal ↙
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      if ([0,1,2,3].every(i => board[r+i][c-i] === player)) {
        return [0,1,2,3].map(i => [r+i, c-i]) as [number,number][];
      }
    }
  }
  return [];
}

export default function ConnectFour() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [current, setCurrent] = useState<1 | 2>(P1);
  const [winner, setWinner] = useState<0 | 1 | 2>(EMPTY);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [isDraw, setIsDraw] = useState(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const dropDisc = useCallback((col: number) => {
    if (winner || isDraw) return;
    const newBoard = board.map(r => [...r]) as Board;

    // Find lowest empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === EMPTY) { row = r; break; }
    }
    if (row === -1) return; // column full

    newBoard[row][col] = current as Cell;

    if (checkWin(newBoard, current as Cell)) {
      setWinCells(getWinningCells(newBoard, current as Cell));
      setWinner(current);
    } else if (newBoard[0].every(c => c !== EMPTY)) {
      setIsDraw(true);
    } else {
      setCurrent(current === P1 ? 2 : 1);
    }
    setBoard(newBoard);
  }, [board, current, winner, isDraw]);

  const restart = () => {
    setBoard(createBoard());
    setCurrent(P1);
    setWinner(EMPTY);
    setWinCells([]);
    setIsDraw(false);
    setHoverCol(null);
  };

  const isWinCell = (r: number, c: number) =>
    winCells.some(([wr, wc]) => wr === r && wc === c);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status */}
      <div className="flex gap-6 items-center">
        <div className={`score-chip ${current === P1 && !winner && !isDraw ? "ring-1 ring-violet-400" : ""}`}>
          <span className="score-label">Player 1</span>
          <span className="score-value" style={{ color: "oklch(0.62 0.22 290)" }}>●</span>
        </div>
        <div className="text-center">
          {winner ? (
            <p className="font-display text-lg font-bold gradient-text">
              Player {winner} Wins! 🎉
            </p>
          ) : isDraw ? (
            <p className="font-display text-lg font-bold text-muted-foreground">Draw!</p>
          ) : (
            <p className="font-display text-sm text-muted-foreground">
              Player {current}'s turn
            </p>
          )}
        </div>
        <div className={`score-chip ${current === P2 && !winner && !isDraw ? "ring-1 ring-cyan-400" : ""}`}>
          <span className="score-label">Player 2</span>
          <span className="score-value" style={{ color: "oklch(0.72 0.19 195)" }}>●</span>
        </div>
      </div>

      {/* Board */}
      <div
        className="rounded-xl p-3 select-none"
        style={{ background: "oklch(0.14 0.025 250)", border: "1px solid oklch(0.62 0.22 290 / 0.3)" }}
      >
        {/* Column buttons */}
        <div className="flex mb-2">
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={`col-btn-${c}`}
              type="button"
              className="flex-1 flex justify-center items-center h-6 transition-opacity"
              onClick={() => dropDisc(c)}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              aria-label={`Drop in column ${c + 1}`}
            >
              {hoverCol === c && !winner && !isDraw && (
                <span
                  className="text-lg leading-none"
                  style={{ color: current === P1 ? "oklch(0.62 0.22 290)" : "oklch(0.72 0.19 195)" }}
                >
                  ▼
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {board.map((row, r) => (
          <div key={`row-${r}`} className="flex gap-1.5 mb-1.5">
            {row.map((cell, c) => {
              const isWin = isWinCell(r, c);
              return (
                <div
                  key={`cell-${r}-${c}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background:
                      cell === EMPTY
                        ? "oklch(0.10 0.015 270)"
                        : cell === P1
                        ? isWin
                          ? "oklch(0.72 0.25 290)"
                          : "oklch(0.55 0.20 290)"
                        : isWin
                        ? "oklch(0.82 0.22 195)"
                        : "oklch(0.65 0.19 195)",
                    boxShadow:
                      cell !== EMPTY && isWin
                        ? `0 0 14px ${cell === P1 ? "oklch(0.72 0.25 290 / 0.8)" : "oklch(0.82 0.22 195 / 0.8)"}`
                        : "none",
                    transform: isWin ? "scale(1.1)" : "scale(1)",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {(winner !== EMPTY || isDraw) && (
        <button type="button" onClick={restart} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
          Play Again
        </button>
      )}
    </div>
  );
}
