import { useCallback, useState } from "react";

const SIZE = 10;
const SHIP_LENGTHS = [5, 4, 3, 3, 2];

type CellState = "empty" | "ship" | "hit" | "miss";

function emptyGrid(): CellState[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill("empty"));
}

function placeShipsRandom(): CellState[][] {
  const grid = emptyGrid();
  for (const len of SHIP_LENGTHS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * (horiz ? SIZE : SIZE - len + 1));
      const c = Math.floor(Math.random() * (horiz ? SIZE - len + 1 : SIZE));
      let ok = true;
      for (let i = 0; i < len; i++) {
        const tr = horiz ? r : r + i;
        const tc = horiz ? c + i : c;
        if (grid[tr][tc] !== "empty") { ok = false; break; }
      }
      if (ok) {
        for (let i = 0; i < len; i++) {
          const tr = horiz ? r : r + i;
          const tc = horiz ? c + i : c;
          grid[tr][tc] = "ship";
        }
        placed = true;
      }
    }
  }
  return grid;
}

export default function BattleShips() {
  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [playerGrid, setPlayerGrid] = useState(emptyGrid);
  const [aiGrid, setAiGrid] = useState(emptyGrid);
  const [aiShips, setAiShips] = useState(emptyGrid);
  const [placingShipIdx, setPlacingShipIdx] = useState(0);
  const [placeHoriz, setPlaceHoriz] = useState(true);
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);
  const [message, setMessage] = useState("Place your ships! Click a cell to start.");
  const aiShotRef = { visited: new Set<string>() };

  const placeShip = useCallback((r: number, c: number) => {
    if (phase !== "setup" || placingShipIdx >= SHIP_LENGTHS.length) return;
    const len = SHIP_LENGTHS[placingShipIdx];
    const cells: [number, number][] = [];
    for (let i = 0; i < len; i++) {
      const tr = placeHoriz ? r : r + i;
      const tc = placeHoriz ? c + i : c;
      if (tr >= SIZE || tc >= SIZE || playerGrid[tr][tc] !== "empty") return;
      cells.push([tr, tc]);
    }
    setPlayerGrid(prev => {
      const next = prev.map(row => [...row]);
      for (const [tr, tc] of cells) next[tr][tc] = "ship";
      return next;
    });
    const newIdx = placingShipIdx + 1;
    setPlacingShipIdx(newIdx);
    if (newIdx >= SHIP_LENGTHS.length) {
      const newAiShips = placeShipsRandom();
      setAiShips(newAiShips);
      setAiGrid(emptyGrid());
      setPhase("playing");
      setMessage("Fire at the enemy grid!");
    }
  }, [phase, placingShipIdx, placeHoriz, playerGrid]);

  const playerShoot = useCallback((r: number, c: number) => {
    if (phase !== "playing" || aiGrid[r][c] !== "empty") return;
    const isHit = aiShips[r][c] === "ship";
    const newAiGrid = aiGrid.map(row => [...row]);
    newAiGrid[r][c] = isHit ? "hit" : "miss";
    setAiGrid(newAiGrid);

    const playerWon = newAiGrid.flat().filter(v => v === "hit").length ===
      SHIP_LENGTHS.reduce((a, b) => a + b, 0);
    if (playerWon) { setWinner("player"); setPhase("done"); return; }

    // AI turn
    const newPlayerGrid = playerGrid.map(row => [...row]);
    let ar: number, ac: number;
    do {
      ar = Math.floor(Math.random() * SIZE);
      ac = Math.floor(Math.random() * SIZE);
    } while (aiShotRef.visited.has(`${ar},${ac}`) || newPlayerGrid[ar][ac] === "hit" || newPlayerGrid[ar][ac] === "miss");
    aiShotRef.visited.add(`${ar},${ac}`);

    const aiHit = newPlayerGrid[ar][ac] === "ship";
    newPlayerGrid[ar][ac] = aiHit ? "hit" : "miss";
    setPlayerGrid(newPlayerGrid);

    const aiWon = newPlayerGrid.flat().filter(v => v === "hit").length ===
      SHIP_LENGTHS.reduce((a, b) => a + b, 0);
    if (aiWon) { setWinner("ai"); setPhase("done"); return; }

    setMessage(isHit ? "Hit! 💥 Fire again." : "Miss. AI fires back.");
  }, [phase, aiGrid, aiShips, playerGrid, aiShotRef.visited]);

  const cellStyle = (state: CellState, isEnemy: boolean, shipVisible: boolean) => {
    if (state === "hit") return "bg-red-500 text-white";
    if (state === "miss") return "bg-zinc-700 text-zinc-500";
    if (state === "ship" && (shipVisible || !isEnemy)) return "bg-violet-600";
    return isEnemy ? "bg-zinc-900 hover:bg-cyan-900 cursor-pointer" : "bg-zinc-900";
  };

  const resetGame = () => {
    setPhase("setup");
    setPlayerGrid(emptyGrid());
    setAiGrid(emptyGrid());
    setAiShips(emptyGrid());
    setPlacingShipIdx(0);
    setPlaceHoriz(true);
    setWinner(null);
    setMessage("Place your ships! Click a cell to start.");
  };

  const COLS = "ABCDEFGHIJ";

  const renderGrid = (grid: CellState[][], isEnemy: boolean, showShips: boolean) => (
    <div>
      <div className="flex">
        <div className="w-5" />
        {COLS.split("").map(c => (
          <div key={c} className="w-6 text-center text-xs text-muted-foreground">{c}</div>
        ))}
      </div>
      {grid.map((row, ri) => {
        const rowId = `${isEnemy ? "e" : "p"}r${ri}`;
        return (
          <div key={rowId} className="flex">
            <div className="w-5 text-xs text-muted-foreground flex items-center">{ri + 1}</div>
            {row.map((cell, ci) => {
              const cellId = `${rowId}c${ci}`;
              return (
                <button
                  key={cellId}
                  type="button"
                  onClick={() => isEnemy ? playerShoot(ri, ci) : (phase === "setup" ? placeShip(ri, ci) : undefined)}
                  className={`w-6 h-6 border border-zinc-700 text-[10px] transition-colors ${cellStyle(cell, isEnemy, showShips)}`}
                  disabled={phase === "done"}
                >
                  {cell === "hit" ? "💥" : cell === "miss" ? "·" : ""}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🚢 Battle Ships</span>
        <span className="text-muted-foreground text-sm">
          {phase === "setup" && `Place ship ${placingShipIdx + 1}/${SHIP_LENGTHS.length} (len: ${SHIP_LENGTHS[placingShipIdx]})`}
          {phase === "playing" && "Your turn"}
          {phase === "done" && (winner === "player" ? "You win! 🎉" : "AI wins! 🤖")}
        </span>
      </div>

      {phase === "setup" && (
        <button
          type="button"
          onClick={() => setPlaceHoriz(h => !h)}
          className="px-4 py-1 bg-violet-700 hover:bg-violet-600 text-white rounded text-sm"
        >
          Direction: {placeHoriz ? "Horizontal →" : "Vertical ↓"}
        </button>
      )}

      <p className="text-cyan-300 text-sm">{message}</p>

      <div className="flex gap-6 flex-wrap justify-center">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-display text-violet-300">Your Fleet</p>
            <span className="text-xs text-violet-400 font-mono">
              Ships: {SHIP_LENGTHS.reduce((a, b) => a + b, 0) - playerGrid.flat().filter(v => v === "hit").length}/{SHIP_LENGTHS.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          {renderGrid(playerGrid, false, true)}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-display text-cyan-300">Enemy Waters</p>
            <span className="text-xs text-cyan-400 font-mono">
              Ships: {SHIP_LENGTHS.reduce((a, b) => a + b, 0) - aiGrid.flat().filter(v => v === "hit").length}/{SHIP_LENGTHS.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          {renderGrid(aiGrid, true, phase === "done")}
        </div>
      </div>

      {phase === "done" && (
        <button type="button" onClick={resetGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          Play Again
        </button>
      )}
    </div>
  );
}
