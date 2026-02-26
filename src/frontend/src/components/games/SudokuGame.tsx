import { useState, useCallback } from "react";

type Board = (number | null)[][];
type Fixed = boolean[][];

// Medium difficulty puzzle (0 = empty)
const PUZZLE: number[][] = [
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],
  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,0,3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],
  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9],
];

const SOLUTION: number[][] = [
  [5,3,4, 6,7,8, 9,1,2],
  [6,7,2, 1,9,5, 3,4,8],
  [1,9,8, 3,4,2, 5,6,7],
  [8,5,9, 7,6,1, 4,2,3],
  [4,2,6, 8,5,3, 7,9,1],
  [7,1,3, 9,2,4, 8,5,6],
  [9,6,1, 5,3,7, 2,8,4],
  [2,8,7, 4,1,9, 6,3,5],
  [3,4,5, 2,8,6, 1,7,9],
];

function puzzleToBoard(): Board {
  return PUZZLE.map(row => row.map(v => v === 0 ? null : v));
}

function puzzleToFixed(): Fixed {
  return PUZZLE.map(row => row.map(v => v !== 0));
}

function hasConflict(board: Board, r: number, c: number, val: number): boolean {
  // Row
  for (let col = 0; col < 9; col++) {
    if (col !== c && board[r][col] === val) return true;
  }
  // Col
  for (let row = 0; row < 9; row++) {
    if (row !== r && board[row][c] === val) return true;
  }
  // Box
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const row = br + dr, col = bc + dc;
      if ((row !== r || col !== c) && board[row][col] === val) return true;
    }
  }
  return false;
}

function isSolved(board: Board): boolean {
  return board.every((row, r) => row.every((val, c) => val === SOLUTION[r][c]));
}

export default function SudokuGame() {
  const [board, setBoard] = useState<Board>(puzzleToBoard);
  const [fixed] = useState<Fixed>(puzzleToFixed);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (won) return;
    setSelected([r, c]);
  }, [won]);

  const handleInput = useCallback((val: number | null) => {
    if (!selected) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = val;
      if (isSolved(next)) setWon(true);
      return next;
    });
    setValidated(false);
  }, [selected, fixed]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selected) return;
    const [r, c] = selected;
    if (e.key >= "1" && e.key <= "9") {
      e.preventDefault();
      handleInput(parseInt(e.key));
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      e.preventDefault();
      handleInput(null);
    } else if (e.key === "ArrowUp" && r > 0) { e.preventDefault(); setSelected([r - 1, c]); }
    else if (e.key === "ArrowDown" && r < 8) { e.preventDefault(); setSelected([r + 1, c]); }
    else if (e.key === "ArrowLeft" && c > 0) { e.preventDefault(); setSelected([r, c - 1]); }
    else if (e.key === "ArrowRight" && c < 8) { e.preventDefault(); setSelected([r, c + 1]); }
  }, [selected, handleInput]);

  const reset = useCallback(() => {
    setBoard(puzzleToBoard());
    setSelected(null);
    setWon(false);
    setValidated(false);
  }, []);

  const validate = useCallback(() => {
    setValidated(true);
  }, []);

  const isCellConflict = useCallback((r: number, c: number): boolean => {
    const val = board[r][c];
    if (!val) return false;
    return hasConflict(board, r, c, val);
  }, [board]);

  const isHighlighted = useCallback((r: number, c: number): boolean => {
    if (!selected) return false;
    const [sr, sc] = selected;
    if (r === sr && c === sc) return false;
    if (r === sr || c === sc) return true;
    if (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)) return true;
    return false;
  }, [selected]);

  const isSameValue = useCallback((r: number, c: number): boolean => {
    if (!selected) return false;
    const [sr, sc] = selected;
    const val = board[r][c];
    return !!val && val === board[sr][sc] && !(r === sr && c === sc);
  }, [selected, board]);

  const completedCount = board.flat().filter(Boolean).length;
  const totalCells = 81;
  const filledPuzzle = PUZZLE.flat().filter(Boolean).length;
  const progress = Math.round(((completedCount - filledPuzzle) / (totalCells - filledPuzzle)) * 100);

  return (
    <div className="flex flex-col items-center gap-4" role="application" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="score-chip">
          <span className="score-label">Progress</span>
          <span className="score-value">{Math.max(0, progress)}%</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={validate}
            className="px-3 py-1.5 rounded-lg text-xs font-display tracking-wide border border-cyan/30 text-cyan-300 hover:bg-cyan/10 transition-colors">
            Check
          </button>
          <button type="button" onClick={reset}
            className="px-3 py-1.5 rounded-lg text-xs font-display tracking-wide border border-violet/30 text-violet-300 hover:bg-violet/10 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "2px solid oklch(0.62 0.22 290 / 0.4)", background: "oklch(0.13 0.018 270)" }}
      >
        {board.map((row, r) => {
          const rowKey = `sudoku-row-${r}`;
          return (
          <div key={rowKey} className="flex" style={{ borderBottom: r % 3 === 2 && r < 8 ? "2px solid oklch(0.62 0.22 290 / 0.4)" : undefined }}>
            {row.map((val, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isHighlight = isHighlighted(r, c);
              const isSame = isSameValue(r, c);
              const isConflict = (validated || isSelected) && isCellConflict(r, c);
              const isFixedCell = fixed[r][c];

              let bg = "transparent";
              if (isSelected) bg = "oklch(0.62 0.22 290 / 0.3)";
              else if (isConflict) bg = "oklch(0.58 0.22 25 / 0.25)";
              else if (isSame) bg = "oklch(0.62 0.22 290 / 0.15)";
              else if (isHighlight) bg = "oklch(0.16 0.020 270)";

              let textColor = isFixedCell ? "oklch(0.90 0.02 270)" : "oklch(0.72 0.19 195)";
              if (isConflict) textColor = "oklch(0.70 0.22 15)";

              const cellKey = `sudoku-cell-r${r}-c${c}`;
              return (
                <button
                  key={cellKey}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className="w-9 h-9 text-sm font-bold flex items-center justify-center transition-colors duration-100 relative"
                  style={{
                    background: bg,
                    color: textColor,
                    fontFamily: "Oxanium, sans-serif",
                    borderRight: c % 3 === 2 && c < 8 ? "2px solid oklch(0.62 0.22 290 / 0.4)" : "1px solid oklch(0.20 0.025 270)",
                    borderBottom: "none",
                    outline: isSelected ? "none" : undefined,
                  }}
                >
                  {val ?? ""}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={`num-${n}`} type="button" onClick={() => handleInput(n)}
            className="w-10 h-10 rounded-lg font-display font-bold text-sm text-cyan-300 transition-colors"
            style={{ background: "oklch(0.16 0.020 270)", border: "1px solid oklch(0.62 0.22 290 / 0.2)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.62 0.22 290 / 0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.16 0.020 270)")}
          >
            {n}
          </button>
        ))}
        <button type="button" onClick={() => handleInput(null)}
          className="w-10 h-10 rounded-lg font-display font-bold text-xs text-muted-foreground transition-colors"
          style={{ background: "oklch(0.16 0.020 270)", border: "1px solid oklch(0.62 0.22 290 / 0.2)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.65 0.23 15 / 0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.16 0.020 270)")}
        >
          ✕
        </button>
      </div>

      {/* Won state */}
      {won && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-2xl font-bold gradient-text mb-1">🎉 Solved!</p>
          <button type="button" onClick={reset}
            className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            New Game
          </button>
        </div>
      )}

      {validated && !won && (
        <p className="text-xs font-display tracking-wide text-muted-foreground">
          {board.some((row, r) => row.some((v, c) => v !== null && isCellConflict(r, c)))
            ? "⚠️ Conflicts highlighted in red"
            : "✓ No conflicts found so far!"}
        </p>
      )}

      <p className="text-muted-foreground text-xs font-display tracking-wide">Click a cell, then type a number (1-9) or use the pad</p>
    </div>
  );
}
