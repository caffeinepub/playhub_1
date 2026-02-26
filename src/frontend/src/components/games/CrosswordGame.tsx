import { useState, useEffect, useRef } from "react";

// 5x5 crossword grid
// Solution:
//   C A T S _
//   O _ A _ _
//   D _ R _ _
//   E _ S _ _
//   _ _ _ _ _
// ACROSS: 1. CATS (row0,col0), 4. nothing
// DOWN: 1. CODE (col0,row0), 2. TARS (col2,row0)
// Let's use a cleaner grid:
// Grid (row, col) 5x5:
// R E A C T  (row 0, across)
// _ _ P _ _
// _ _ I _ _
// _ _ C _ _
// _ _ _ _ _
// DOWN: API (col2, rows 0-2), REACT across
// Simpler:
//  B R A V E
//  _ A _ _ _
//  _ T _ _ _
//  _ _ _ _ _
//  _ _ _ _ _
// Across: BRAVE (1), DOWN: BAT (col1)

// Let's design a 5x5 with 3 across + 3 down
// Solution grid:
// S N A K E
// _ O _ _ _
// _ T _ _ _
// _ E _ _ _
// _ _ _ _ _
// ACROSS: 1-SNAKE (0,0)
// DOWN: 1-SNAKE-start is S (0,0), 2-NOTE (col1,rows0-3)
// Let's try to be more creative:
// B L A Z E
// _ _ P _ _
// _ _ I _ _
// _ _ C _ _
// _ _ _ _ _
// ACROSS: 1-BLAZE (row0)
// DOWN: 2-APIC..hmm
// Let me design properly:

// GRID solution (5x5):
//   col: 0 1 2 3 4
// row0:  R E A C T
// row1:  _ A _ _ _
// row2:  _ D _ _ _
// row3:  _ _ _ _ _
// row4:  _ _ _ _ _
// ACROSS: 1-REACT (row0,col0-4)
// DOWN: 1-R (col0,row0 only 1 letter)... need bigger
//
// Let me try with a proper design:
// col:   0 1 2 3 4
// row0:  G A M E S
// row1:  _ _ O _ _
// row2:  _ _ V _ _
// row3:  _ _ E _ _
// row4:  _ _ _ _ _
// ACROSS: 1-GAMES (row0)
// DOWN: 3-MOVE? (col2,rows0-3) = G,O,V,E ... no
// Actually let's just hard-code something valid:
// ACROSS: FLAME (row0), LATE (row2,col1)
// DOWN: FILL (col0,row0), ART (col2,row0)
//
// Final grid - simple and unambiguous:
// F L A M E   (row0: FLAME across)
// _ A _ _ _
// _ T _ _ _
// _ E _ _ _
// _ _ _ _ _
// DOWN: LATE (col1, rows0-3) = L,A,T,E -> LATE ✓
// DOWN: ARM? col2 row0 = A only
// Let's add col3 down: M,_,_... not enough
// Add: OAT across row2 starting col1? L,A,T,E is col1. row2 is _,T,_
// Let's use:
// F L A M E
// _ A _ _ _
// C A T _ _
// _ T _ _ _
// _ E _ _ _
// Hmm too complex. Let me just define the puzzle directly:

// FINAL DESIGN:
// row0: S P A C E (SPACE across)
// row1: _ I _ _ _
// row2: _ C _ _ _
// row3: _ K _ _ _
// row4: _ _ _ _ _
// ACROSS: 1 - SPACE
// DOWN: 2 - PICK (col1, rows0-3) = P,I,C,K -> PICK ✓
//   but col1 row0 is P (part of SPACE) - consistent ✓
// Add another:
// row0: S P A C E
// row1: _ I _ A _
// row2: _ C A T _
// row3: _ K _ _ _
// row4: _ _ _ _ _
// ACROSS: 3 - CAT (row2, col1-3) = C,A,T ✓
// DOWN: 4 - ACE? col3 rows0-2 = C,A,T... no
// col3: row0=C, row1=A, row2=T => CAT! ✓

type CellData = {
  letter: string;
  clueNumbers: number[];
  row: number;
  col: number;
  isBlack: boolean;
};

interface ClueEntry {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
}

const SOLUTION: (string | null)[][] = [
  ["S","P","A","C","E"],
  [null,"I",null,"A",null],
  [null,"C","A","T",null],
  [null,"K",null,null,null],
  [null,null,null,null,null],
];

const CLUES: ClueEntry[] = [
  { number: 1, direction: "across", clue: "The final frontier (5 letters)", answer: "SPACE", startRow: 0, startCol: 0 },
  { number: 2, direction: "down",   clue: "Choose, select (4 letters)", answer: "PICK", startRow: 0, startCol: 1 },
  { number: 3, direction: "across", clue: "A small feline (3 letters)", answer: "CAT", startRow: 2, startCol: 1 },
  { number: 4, direction: "down",   clue: "Small feline — col 3 top to row 2", answer: "CAT", startRow: 0, startCol: 3 },
];

function buildClueNumberGrid(): Map<string, number[]> {
  const map = new Map<string, number[]>();
  let num = 1;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (SOLUTION[r][c] === null) continue;
      const nums: number[] = [];

      const acrossStart =
        (c === 0 || SOLUTION[r][c - 1] === null) &&
        c + 1 < 5 && SOLUTION[r][c + 1] !== null;

      const downStart =
        (r === 0 || SOLUTION[r - 1][c] === null) &&
        r + 1 < 5 && SOLUTION[r + 1][c] !== null;

      if (acrossStart || downStart) {
        const clueIdx = CLUES.findIndex(cl => cl.startRow === r && cl.startCol === c);
        if (clueIdx >= 0) {
          nums.push(CLUES[clueIdx].number);
        } else {
          nums.push(num++);
        }
      }

      if (nums.length) map.set(`${r},${c}`, nums);
    }
  }
  return map;
}

export default function CrosswordGame() {
  const [userGrid, setUserGrid] = useState<(string | null)[][]>(() =>
    SOLUTION.map(row => row.map(cell => (cell === null ? null : "")))
  );
  const [selectedClue, setSelectedClue] = useState<ClueEntry | null>(CLUES[0]);
  const [focusedCell, setFocusedCell] = useState<[number, number] | null>([0, 0]);
  const [won, setWon] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const clueNumberGrid = buildClueNumberGrid();

  const isInClue = (r: number, c: number, clue: ClueEntry | null): boolean => {
    if (!clue) return false;
    if (clue.direction === "across") {
      return r === clue.startRow && c >= clue.startCol && c < clue.startCol + clue.answer.length;
    }
    return c === clue.startCol && r >= clue.startRow && r < clue.startRow + clue.answer.length;
  };

  const handleCellClick = (r: number, c: number) => {
    if (SOLUTION[r][c] === null) return;
    setFocusedCell([r, c]);

    if (focusedCell?.[0] === r && focusedCell?.[1] === c) {
      // Toggle direction if there's another clue at this cell
      const cluesAtCell = CLUES.filter(cl => isInClue(r, c, cl));
      if (cluesAtCell.length > 1 && selectedClue) {
        const idx = cluesAtCell.findIndex(cl => cl.number === selectedClue.number && cl.direction === selectedClue.direction);
        setSelectedClue(cluesAtCell[(idx + 1) % cluesAtCell.length]);
      }
      return;
    }

    // Select first clue that contains this cell
    const clue = CLUES.find(cl => isInClue(r, c, cl));
    if (clue) setSelectedClue(clue);
    setTimeout(() => inputRefs.current.get(`${r},${c}`)?.focus(), 10);
  };

  const handleInput = (r: number, c: number, value: string) => {
    const letter = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setUserGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = letter;
      return next;
    });

    // Advance to next cell in selected clue direction
    if (selectedClue && letter) {
      const nextR = selectedClue.direction === "down" ? r + 1 : r;
      const nextC = selectedClue.direction === "across" ? c + 1 : c;
      if (isInClue(nextR, nextC, selectedClue)) {
        setFocusedCell([nextR, nextC]);
        setTimeout(() => inputRefs.current.get(`${nextR},${nextC}`)?.focus(), 10);
      }
    }
  };

  useEffect(() => {
    // Check win
    let correct = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const expected = SOLUTION[r][c];
        if (expected === null) continue;
        if (userGrid[r][c] !== expected) { correct = false; break; }
      }
      if (!correct) break;
    }
    if (correct) setWon(true);
  }, [userGrid]);

  const restart = () => {
    setUserGrid(SOLUTION.map(row => row.map(cell => (cell === null ? null : ""))));
    setWon(false);
    setSelectedClue(CLUES[0]);
    setFocusedCell([0, 0]);
  };

  const CELL_SIZE = 52;

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {won && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-2xl font-bold gradient-text">🎉 Solved!</p>
          <button type="button" onClick={restart} className="mt-3 btn-gradient px-6 py-2 rounded-xl text-white font-display font-semibold">
            Play Again
          </button>
        </div>
      )}

      <div className="flex gap-6 flex-wrap justify-center">
        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(5, ${CELL_SIZE}px)`, gap: 2 }}>
          {([0,1,2,3,4] as const).map(r =>
            ([0,1,2,3,4] as const).map(c => {
              const cell = SOLUTION[r][c];
              if (cell === null) {
                return <div key={`xw-blk-${r}${c}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} className="bg-gray-900 rounded-sm" />;
              }

              const clueNums = clueNumberGrid.get(`${r},${c}`);
              const isFocused = focusedCell?.[0] === r && focusedCell?.[1] === c;
              const isHighlighted = isInClue(r, c, selectedClue);
              const userVal = userGrid[r]?.[c] ?? "";
              const isCorrect = userVal === cell;

              return (
                <div
                  key={`xw-${r}${c}`}
                  className={`relative border transition-colors duration-100 rounded-sm
                    ${isFocused ? "border-violet-400" : isHighlighted ? "border-cyan-500/60" : "border-border/40"}
                  `}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: isFocused
                      ? "oklch(0.22 0.08 270)"
                      : isHighlighted
                      ? "oklch(0.16 0.04 250)"
                      : "oklch(0.14 0.02 270)",
                  }}
                >
                  {clueNums && (
                    <span className="absolute top-0.5 left-1 text-[9px] text-muted-foreground font-display leading-none pointer-events-none z-10">
                      {clueNums[0]}
                    </span>
                  )}
                  <input
                    ref={el => { if (el) inputRefs.current.set(`${r},${c}`, el); }}
                    type="text"
                    maxLength={1}
                    value={userVal}
                    onChange={e => handleInput(r, c, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace") {
                        setUserGrid(prev => { const n = prev.map(rw => [...rw]); n[r][c] = ""; return n; });
                      }
                    }}
                    className="absolute inset-0 w-full h-full bg-transparent text-center font-display font-bold text-lg uppercase caret-transparent outline-none cursor-pointer pt-3"
                    style={{
                      color: won
                        ? "oklch(0.72 0.22 150)"
                        : isCorrect && userVal
                        ? "oklch(0.72 0.20 150)"
                        : "oklch(0.92 0.02 270)",
                    }}
                    onClick={() => handleCellClick(r, c)}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Clues */}
        <div className="text-sm min-w-[180px] max-w-[220px]">
          <div className="mb-3">
            <p className="font-display font-bold text-foreground mb-1.5 text-xs tracking-widest uppercase">Across</p>
            {CLUES.filter(cl => cl.direction === "across").map(cl => (
              <button
                key={`clue-across-${cl.number}`}
                type="button"
                onClick={() => {
                  setSelectedClue(cl);
                  setFocusedCell([cl.startRow, cl.startCol]);
                  setTimeout(() => inputRefs.current.get(`${cl.startRow},${cl.startCol}`)?.focus(), 10);
                }}
                className={`block w-full text-left px-2 py-1 rounded mb-0.5 text-xs transition-colors
                  ${selectedClue?.number === cl.number && selectedClue?.direction === cl.direction
                    ? "bg-cyan/15 text-cyan-300"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span className="font-bold">{cl.number}.</span> {cl.clue}
              </button>
            ))}
          </div>
          <div>
            <p className="font-display font-bold text-foreground mb-1.5 text-xs tracking-widest uppercase">Down</p>
            {CLUES.filter(cl => cl.direction === "down").map(cl => (
              <button
                key={`clue-down-${cl.number}`}
                type="button"
                onClick={() => {
                  setSelectedClue(cl);
                  setFocusedCell([cl.startRow, cl.startCol]);
                  setTimeout(() => inputRefs.current.get(`${cl.startRow},${cl.startCol}`)?.focus(), 10);
                }}
                className={`block w-full text-left px-2 py-1 rounded mb-0.5 text-xs transition-colors
                  ${selectedClue?.number === cl.number && selectedClue?.direction === cl.direction
                    ? "bg-violet/15 text-violet-300"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span className="font-bold">{cl.number}.</span> {cl.clue}
              </button>
            ))}
          </div>

          {!won && (
            <button
              type="button"
              onClick={restart}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg py-1.5 transition-colors"
            >
              Clear / Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
