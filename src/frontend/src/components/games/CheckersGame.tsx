import { useCallback, useState } from "react";

type Piece = { color: "red" | "black"; king: boolean } | null;
type Board = Piece[][];

function initBoard(): Board {
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => {
      if ((r + c) % 2 !== 0) return null;
      if (r < 3) return { color: "black", king: false };
      if (r > 4) return { color: "red", king: false };
      return null;
    })
  );
}

function getJumps(board: Board, r: number, c: number, piece: NonNullable<Piece>): [number, number, number, number][] {
  const jumps: [number, number, number, number][] = [];
  const dirs = piece.king
    ? [[-2, -2], [-2, 2], [2, -2], [2, 2]]
    : piece.color === "red"
    ? [[-2, -2], [-2, 2]]
    : [[2, -2], [2, 2]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc, mr = r + dr / 2, mc = c + dc / 2;
    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
    if (board[nr][nc] !== null) continue;
    const mid = board[mr][mc];
    if (mid && mid.color !== piece.color) jumps.push([r, c, nr, nc]);
  }
  return jumps;
}

function getMoves(board: Board, r: number, c: number, piece: NonNullable<Piece>): [number, number, number, number][] {
  const moves: [number, number, number, number][] = [];
  const dirs = piece.king
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === "red"
    ? [[-1, -1], [-1, 1]]
    : [[1, -1], [1, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
    if (board[nr][nc] === null) moves.push([r, c, nr, nc]);
  }
  return [...getJumps(board, r, c, piece), ...moves];
}

function applyMove(board: Board, fr: number, fc: number, tr: number, tc: number): Board {
  const next = board.map(row => [...row]);
  const piece = next[fr][fc]!;
  next[tr][tc] = { ...piece, king: piece.king || tr === 0 || tr === 7 };
  next[fr][fc] = null;
  if (Math.abs(tr - fr) === 2) next[(fr + tr) / 2][(fc + tc) / 2] = null;
  return next;
}

function aiMove(board: Board): Board {
  const allMoves: [number, number, number, number][] = [];
  const allJumps: [number, number, number, number][] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.color === "black") {
        allJumps.push(...getJumps(board, r, c, p));
        allMoves.push(...getMoves(board, r, c, p));
      }
    }
  }
  const choices = allJumps.length > 0 ? allJumps : allMoves;
  if (choices.length === 0) return board;
  const [fr, fc, tr, tc] = choices[Math.floor(Math.random() * choices.length)];
  return applyMove(board, fr, fc, tr, tc);
}

export default function CheckersGame() {
  const [board, setBoard] = useState(initBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<"red" | "black">("red");
  const [winner, setWinner] = useState<string | null>(null);
  const [message, setMessage] = useState("Your turn (red)");
  const [playerCaptures, setPlayerCaptures] = useState(0);
  const [aiCaptures, setAiCaptures] = useState(0);

  const validMoves = useCallback((b: Board): [number, number, number, number][] => {
    const moves: [number, number, number, number][] = [];
    const jumps: [number, number, number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p?.color === "red") {
          jumps.push(...getJumps(b, r, c, p));
          moves.push(...getMoves(b, r, c, p));
        }
      }
    }
    return jumps.length > 0 ? jumps : moves;
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (winner || turn !== "red") return;
    const piece = board[r][c];

    if (!selected) {
      if (piece?.color === "red") setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (board[sr][sc]?.color === "red") {
      const valid = validMoves(board);
      const canDo = valid.some(([fr, fc, tr, tc]) => fr === sr && fc === sc && tr === r && tc === c);
      if (canDo) {
        const newBoard = applyMove(board, sr, sc, r, c);
        const prevBlacks = board.flat().filter(p => p?.color === "black").length;
        const reds = newBoard.flat().filter(p => p?.color === "red").length;
        const blacks = newBoard.flat().filter(p => p?.color === "black").length;
        const playerJumped = prevBlacks - blacks;
        if (playerJumped > 0) setPlayerCaptures(c2 => c2 + playerJumped);
        if (blacks === 0) { setBoard(newBoard); setWinner("Player (Red)"); return; }
        if (reds === 0) { setBoard(newBoard); setWinner("AI (Black)"); return; }

        // AI turn
        const afterAI = aiMove(newBoard);
        const prevReds = newBoard.flat().filter(p => p?.color === "red").length;
        const redsAfter = afterAI.flat().filter(p => p?.color === "red").length;
        const blacksAfter = afterAI.flat().filter(p => p?.color === "black").length;
        const aiJumped = prevReds - redsAfter;
        if (aiJumped > 0) setAiCaptures(c2 => c2 + aiJumped);
        setBoard(afterAI);
        setSelected(null);
        if (redsAfter === 0) { setWinner("AI (Black)"); setMessage("AI wins!"); return; }
        if (blacksAfter === 0) { setWinner("Player (Red)"); setMessage("You win!"); return; }
        setMessage("Your turn (red)");
        return;
      }
    }
    if (piece?.color === "red") setSelected([r, c]);
    else setSelected(null);
  }, [board, selected, turn, winner, validMoves]);

  const reset = () => {
    setBoard(initBoard());
    setSelected(null);
    setTurn("red");
    setWinner(null);
    setMessage("Your turn (red)");
    setPlayerCaptures(0);
    setAiCaptures(0);
  };

  void turn;

  const highlights = selected
    ? validMoves(board).filter(([fr, fc]) => fr === selected[0] && fc === selected[1]).map(([,, tr, tc]) => `${tr},${tc}`)
    : [];

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🔴 Checkers</span>
        <div className="flex gap-3 items-center text-xs font-mono">
          <span className="text-red-400">You: {playerCaptures}</span>
          <span className="text-zinc-400">|</span>
          <span className="text-zinc-400">AI: {aiCaptures}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-sm text-muted-foreground">{winner ? `${winner} wins!` : message}</span>
      </div>

      <div className="grid grid-cols-8 border border-zinc-600 rounded-lg overflow-hidden">
        {board.map((row, ri) =>
          row.map((piece, ci) => {
            const isDark = (ri + ci) % 2 === 0;
            const isSelected = selected?.[0] === ri && selected?.[1] === ci;
            const isHighlight = highlights.includes(`${ri},${ci}`);
            return (
              <button
                key={`ch-${ri * 8 + ci}`}
                type="button"
                onClick={() => handleClick(ri, ci)}
                className={`w-10 h-10 flex items-center justify-center transition-all ${
                  isDark ? "bg-zinc-200" : isHighlight ? "bg-green-500/50" : "bg-zinc-800"
                } ${isSelected ? "ring-2 ring-yellow-400 ring-inset" : ""}`}
                disabled={!!winner}
              >
                {piece && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    piece.color === "red" ? "bg-red-500 text-white" : "bg-zinc-900 text-white border border-zinc-600"
                  }`}>
                    {piece.king ? "♛" : ""}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {winner && (
        <div className="text-center">
          <p className="text-cyan-300 font-display text-xl mb-2">{winner} wins!</p>
          <button type="button" onClick={reset} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
            New Game
          </button>
        </div>
      )}
      {!winner && <p className="text-muted-foreground text-xs">Click your piece, then click destination</p>}
    </div>
  );
}
