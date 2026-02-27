import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const WORDS = [
  "FLAME","STONE","BRAVE","CRANE","SHIFT","PLUMB","FROST","GRACE","BLAZE","TROVE",
  "SHARD","CLEFT","WHIRL","STARK","GLOOM","CREST","FLINT","PROWL","CRISP","SPOKE",
  "TREND","SWAMP","PRIZE","KNEEL","BLOOM","SNARE","DWELL","CHESS","GLIDE","THRUM",
];

type LetterState = "correct" | "present" | "absent" | "empty" | "tbd";

interface GuessRow {
  letters: { char: string; state: LetterState }[];
}

function pickWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function buildEmptyGrid(guesses: GuessRow[], maxGuesses: number): GuessRow[] {
  const rows = [...guesses];
  while (rows.length < maxGuesses) {
    rows.push({ letters: Array.from({ length: 5 }, () => ({ char: "", state: "empty" as LetterState })) });
  }
  return rows;
}

const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const STATE_COLORS: Record<LetterState, string> = {
  correct: "oklch(0.48 0.17 150)",
  present: "oklch(0.60 0.18 80)",
  absent:  "oklch(0.22 0.02 270)",
  empty:   "oklch(0.16 0.020 270)",
  tbd:     "oklch(0.20 0.025 270)",
};
const STATE_BORDERS: Record<LetterState, string> = {
  correct: "oklch(0.55 0.20 150)",
  present: "oklch(0.68 0.20 80)",
  absent:  "oklch(0.30 0.03 270)",
  empty:   "oklch(0.30 0.03 270 / 0.5)",
  tbd:     "oklch(0.55 0.04 270)",
};

export default function WordGuess() {
  const [answer, setAnswer] = useState(pickWord);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [shake, setShake] = useState(false);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});

  const grid = buildEmptyGrid(guesses, MAX_GUESSES);

  // Active row shows current typed letters
  const activeRowIdx = guesses.length;
  const displayGrid = grid.map((row, ri) => {
    if (ri === activeRowIdx && phase === "playing") {
      return {
        letters: Array.from({ length: 5 }, (_, ci) => ({
          char: currentGuess[ci] ?? "",
          state: (currentGuess[ci] ? "tbd" : "empty") as LetterState,
        })),
      };
    }
    return row;
  });

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== 5) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    if (!WORDS.includes(currentGuess)) { setShake(true); setTimeout(() => setShake(false), 500); return; }

    const ans = answer;
    const result: { char: string; state: LetterState }[] = Array.from({ length: 5 }, (_, i) => ({
      char: currentGuess[i],
      state: "absent" as LetterState,
    }));

    // Mark correct
    const remaining = ans.split("");
    for (let i = 0; i < 5; i++) {
      if (currentGuess[i] === ans[i]) {
        result[i].state = "correct";
        remaining[i] = "_";
      }
    }
    // Mark present
    for (let i = 0; i < 5; i++) {
      if (result[i].state !== "correct") {
        const idx = remaining.indexOf(currentGuess[i]);
        if (idx !== -1) {
          result[i].state = "present";
          remaining[idx] = "_";
        }
      }
    }

    const newGuesses = [...guesses, { letters: result }];
    setGuesses(newGuesses);

    // Update keyboard colors — priority: correct > present > absent
    setLetterStates(prev => {
      const next = { ...prev };
      result.forEach(({ char, state }) => {
        const cur: LetterState | undefined = next[char];
        if (cur === "correct") return; // never downgrade from correct
        if (state === "correct") { next[char] = "correct"; }
        else if (state === "present" && cur !== "present") { next[char] = "present"; }
        else if (state === "absent" && cur === undefined) { next[char] = "absent"; }
      });
      return next;
    });

    setCurrentGuess("");

    if (result.every(l => l.state === "correct")) {
      setPhase("won");
    } else if (newGuesses.length >= MAX_GUESSES) {
      setPhase("lost");
    }
  }, [currentGuess, guesses, answer]);

  const handleKey = useCallback((key: string) => {
    if (phase !== "playing") return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫" || key === "Backspace") { setCurrentGuess(g => g.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(g => g + key);
    }
  }, [phase, submitGuess, currentGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") { handleKey("ENTER"); return; }
      if (e.key === "Backspace") { handleKey("⌫"); return; }
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) handleKey(k);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const shareResult = useCallback(() => {
    const emojiMap: Record<string, string> = { correct: "🟩", present: "🟨", absent: "⬛", empty: "⬛", tbd: "⬛" };
    const grid = guesses.map(row =>
      row.letters.map(l => emojiMap[l.state]).join("")
    ).join("\n");
    const text = `Word Guess ${phase === "won" ? guesses.length : "X"}/${MAX_GUESSES}\n\n${grid}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }, [guesses, phase]);

  const restart = () => {
    setAnswer(pickWord());
    setGuesses([]);
    setCurrentGuess("");
    setPhase("playing");
    setLetterStates({});
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Grid */}
      <div className="flex flex-col gap-1.5">
        {displayGrid.map((row, ri) => {
          const isActive = ri === activeRowIdx && phase === "playing";
          const rowKey = `guess-row-r${ri}`;
          return (
            <div
              key={rowKey}
              className={`flex gap-1.5 ${isActive && shake ? "animate-pulse" : ""}`}
            >
              {row.letters.map((cell, ci) => {
                const cellKey = `guess-cell-r${ri}-c${ci}`;
                return (
                  <div
                    key={cellKey}
                    className="w-12 h-12 flex items-center justify-center font-display text-xl font-bold rounded-lg transition-all duration-200 select-none"
                    style={{
                      background: STATE_COLORS[cell.state],
                      border: `2px solid ${STATE_BORDERS[cell.state]}`,
                      transform: cell.state !== "empty" && cell.state !== "tbd" && ri < guesses.length ? "rotateX(0deg)" : "none",
                      color: cell.state === "empty" ? "oklch(0.40 0.02 270)" : "oklch(0.96 0.01 270)",
                      boxShadow: cell.state === "correct" ? "0 0 10px oklch(0.45 0.17 150 / 0.5)" : "none",
                    }}
                  >
                    {cell.char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Status */}
      {phase === "won" && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-xl font-bold gradient-text">🎉 You got it!</p>
          <p className="text-muted-foreground text-sm">in {guesses.length} guess{guesses.length !== 1 ? "es" : ""}</p>
        </div>
      )}
      {phase === "lost" && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-xl font-bold text-destructive">Game Over</p>
          <p className="text-muted-foreground text-sm">The word was <strong className="text-foreground">{answer}</strong></p>
        </div>
      )}

      {/* Keyboard */}
      <div className="flex flex-col gap-1.5 items-center">
        {KEYBOARD_ROWS.map((row) => (
          <div key={`kb-row-${row[0]}`} className="flex gap-1">
            {row.map(key => {
              const state = letterStates[key];
              const isWide = key === "ENTER" || key === "⌫";
              return (
                <button
                  key={`kb-key-${key}`}
                  type="button"
                  onClick={() => handleKey(key)}
                  className="rounded-lg font-display font-bold text-xs transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    width: isWide ? 52 : 34,
                    height: 40,
                    background: state ? STATE_COLORS[state] : "oklch(0.22 0.025 270)",
                    border: `1px solid ${state ? STATE_BORDERS[state] : "oklch(0.32 0.03 270)"}`,
                    color: "oklch(0.90 0.01 270)",
                    fontSize: isWide ? "0.65rem" : "0.75rem",
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {phase !== "playing" && (
        <div className="flex gap-3">
          <button type="button" onClick={shareResult} className="px-4 py-2 rounded-xl border border-green-400/30 text-green-300 font-display text-sm hover:bg-green-400/10 transition-colors">
            📤 Share
          </button>
          <button type="button" onClick={restart} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            New Game
          </button>
        </div>
      )}
    </div>
  );
}
