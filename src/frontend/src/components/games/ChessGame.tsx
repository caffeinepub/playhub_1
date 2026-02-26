import { useState, useCallback } from "react";

type Color = "w" | "b";
type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
type Square = { type: PieceType; color: Color } | null;
type Board = Square[][];

const EMOJIS: Record<Color, Record<PieceType, string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

function initBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ["R","N","B","Q","K","B","N","R"];
  back.forEach((t, c) => { b[0][c] = { type: t, color: "b" }; b[7][c] = { type: t, color: "w" }; });
  for (let c = 0; c < 8; c++) { b[1][c] = { type: "P", color: "b" }; b[6][c] = { type: "P", color: "w" }; }
  return b;
}

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(sq => sq ? { ...sq } : null));
}

function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function legalMoves(board: Board, r: number, c: number): [number, number][] {
  const sq = board[r][c];
  if (!sq) return [];
  const { type, color } = sq;
  const moves: [number, number][] = [];
  const opp = color === "w" ? "b" : "w";

  const slide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      if (board[nr][nc]) { if (board[nr][nc]!.color === opp) moves.push([nr, nc]); break; }
      moves.push([nr, nc]);
      nr += dr; nc += dc;
    }
  };
  const step = (dr: number, dc: number) => {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc]?.color !== color) moves.push([nr, nc]);
  };

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const start = color === "w" ? 6 : 1;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === start && !board[r + dir * 2][c]) moves.push([r + dir * 2, c]);
    }
    for (const dc of [-1, 1]) { if (inBounds(r + dir, c + dc) && board[r + dir][c + dc]?.color === opp) moves.push([r + dir, c + dc]); }
  } else if (type === "N") {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] as [number,number][]) step(dr, dc);
  } else if (type === "B") {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]) slide(dr, dc);
  } else if (type === "R") {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) slide(dr, dc);
  } else if (type === "Q") {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) slide(dr, dc);
  } else if (type === "K") {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] as [number,number][]) step(dr, dc);
  }
  return moves;
}

function isInCheck(board: Board, color: Color): boolean {
  let kr = -1, kc = -1;
  outer: for (let r2 = 0; r2 < 8; r2++) { for (let c2 = 0; c2 < 8; c2++) { if (board[r2][c2]?.type === "K" && board[r2][c2]?.color === color) { kr = r2; kc = c2; break outer; } } }
  const opp = color === "w" ? "b" : "w";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.color === opp) {
      if (legalMoves(board, r, c).some(([mr, mc]) => mr === kr && mc === kc)) return true;
    }
  }
  return false;
}

function applyMove(board: Board, fr: number, fc: number, tr: number, tc: number): Board {
  const next = cloneBoard(board);
  next[tr][tc] = next[fr][fc];
  next[fr][fc] = null;
  // Pawn promotion
  if (next[tr][tc]?.type === "P" && (tr === 0 || tr === 7)) next[tr][tc]!.type = "Q";
  return next;
}

function safeMoves(board: Board, r: number, c: number): [number, number][] {
  const color = board[r][c]?.color;
  if (!color) return [];
  return legalMoves(board, r, c).filter(([tr, tc]) => {
    const next = applyMove(board, r, c, tr, tc);
    return !isInCheck(next, color);
  });
}

function hasAnyMove(board: Board, color: Color): boolean {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.color === color && safeMoves(board, r, c).length > 0) return true;
  }
  return false;
}

function aiMove(board: Board): Board | null {
  const moves: [number, number, number, number][] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.color === "b") {
      for (const [tr, tc] of safeMoves(board, r, c)) moves.push([r, c, tr, tc]);
    }
  }
  if (moves.length === 0) return null;
  // Prefer captures
  const captures = moves.filter(([,,tr,tc]) => board[tr][tc]?.color === "w");
  const pick = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
  return applyMove(board, pick[0], pick[1], pick[2], pick[3]);
}

const CELL = 52;

export default function ChessGame() {
  const [board, setBoard] = useState<Board>(initBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [highlights, setHighlights] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<Color>("w");
  const [status, setStatus] = useState<string>("Your turn (White)");
  const [phase, setPhase] = useState<"playing" | "over">("playing");

  const handleSquareClick = useCallback((r: number, c: number) => {
    if (phase !== "playing" || turn !== "w") return;
    const sq = board[r][c];

    if (selected) {
      const [sr, sc] = selected;
      const isTarget = highlights.some(([hr, hc]) => hr === r && hc === c);

      if (isTarget) {
        let next = applyMove(board, sr, sc, r, c);
        setSelected(null);
        setHighlights([]);

        // AI move
        setTimeout(() => {
          const afterAI = aiMove(next);
          if (!afterAI) {
            setStatus("Stalemate! Draw.");
            setPhase("over");
            return;
          }
          next = afterAI;
          setBoard(next);
          setTurn("w");

          const inCk = isInCheck(next, "w");
          const canMove = hasAnyMove(next, "w");
          if (!canMove) {
            setStatus(inCk ? "Checkmate! Black wins! ♟" : "Stalemate! Draw.");
            setPhase("over");
          } else {
            setStatus(inCk ? "Check! Your turn (White)" : "Your turn (White)");
          }
        }, 300);

        setBoard(next);
        setTurn("b");
        return;
      }

      // Deselect or select different piece
      setSelected(null);
      setHighlights([]);
      if (sq?.color !== "w") return;
    }

    if (sq?.color === "w") {
      const moves = safeMoves(board, r, c);
      setSelected([r, c]);
      setHighlights(moves);
    }
  }, [board, selected, highlights, turn, phase]);

  const restart = () => {
    setBoard(initBoard());
    setSelected(null);
    setHighlights([]);
    setTurn("w");
    setStatus("Your turn (White)");
    setPhase("playing");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center">
        <p className={`font-display text-sm font-semibold ${status.includes("Check") && !status.includes("Checkmate") ? "text-yellow-300" : status.includes("wins") ? "text-destructive" : "text-muted-foreground"}`}>
          {status}
        </p>
      </div>

      {/* Board */}
      <div className="border-2 border-border/40 rounded-lg overflow-hidden shadow-2xl" style={{ width: CELL * 8, height: CELL * 8 }}>
        {board.map((row, r) => (
          <div key={`chess-row-rank-${8-r}`} className="flex">
            {row.map((sq, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isHighlighted = highlights.some(([hr, hc]) => hr === r && hc === c);
              const isCapture = isHighlighted && !!sq;
              const files = ["a","b","c","d","e","f","g","h"];

              let bg = isLight ? "oklch(0.82 0.04 80)" : "oklch(0.42 0.06 150)";
              if (isSelected) bg = "oklch(0.78 0.18 80)";
              else if (isHighlighted && !isCapture) bg = isLight ? "oklch(0.72 0.15 150)" : "oklch(0.55 0.18 150)";
              else if (isCapture) bg = "oklch(0.55 0.20 25)";

              return (
                <button
                  key={`chess-sq-${files[c]}${8-r}`}
                  type="button"
                  onClick={() => handleSquareClick(r, c)}
                  style={{ width: CELL, height: CELL, background: bg, fontSize: CELL * 0.6 }}
                  className="flex items-center justify-center transition-colors duration-100 relative select-none leading-none"
                >
                  {sq && (
                    <span
                      style={{
                        filter: sq.color === "w" ? "drop-shadow(1px 1px 1px oklch(0 0 0 / 0.6))" : "drop-shadow(0 0 4px oklch(0 0 0 / 0.8))",
                      }}
                    >
                      {EMOJIS[sq.color][sq.type]}
                    </span>
                  )}
                  {isHighlighted && !isCapture && (
                    <span className="absolute w-3 h-3 rounded-full bg-black/20 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Coordinate labels */}
      <div className="flex gap-2 text-muted-foreground text-xs font-display">
        {["a","b","c","d","e","f","g","h"].map(l => (
          <span key={`chess-file-${l}`} style={{ width: CELL, textAlign: "center" }}>{l}</span>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">Click a white piece to select, then click destination</p>

      {phase === "over" && (
        <button type="button" onClick={restart} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
          New Game
        </button>
      )}
    </div>
  );
}
