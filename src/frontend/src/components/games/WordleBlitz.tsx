import { useCallback, useEffect, useRef, useState } from "react";

const WORDS = [
  "BRAVE", "CLOCK", "DANCE", "EARTH", "FLAME", "GRACE", "HEART", "IMAGE",
  "JUICE", "KNEEL", "LAUGH", "MAGIC", "NIGHT", "OCEAN", "PEACE", "QUEEN",
  "RIVER", "SMART", "TRACE", "UNITY", "VOICE", "WATER", "XENON", "YACHT",
  "ZEBRA", "AMBER", "BLEND", "CRISP", "DWELL", "ELDER", "FRESH", "GLOOM",
  "HOVER", "INPUT", "JEWEL", "KNACK", "LIGHT", "MOUNT", "NERVE", "OTTER",
  "PLUMB", "QUIET", "ROUGH", "SHELF", "THINK", "UNDER", "VIGOR", "WHOLE",
];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

type LetterState = "correct" | "present" | "absent" | "empty";

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(5).fill("absent");
  const ansArr = answer.split("");
  const guessArr = guess.split("");
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === ansArr[i]) { result[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === ansArr[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

const cellColor: Record<LetterState, string> = {
  correct: "bg-green-600 border-green-500 text-white",
  present: "bg-yellow-600 border-yellow-500 text-white",
  absent: "bg-zinc-700 border-zinc-600 text-white",
  empty: "bg-zinc-900 border-zinc-700 text-foreground",
};

export default function WordleBlitz() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [wordIndex, setWordIndex] = useState(0);
  const [words] = useState(() => [getRandomWord(), getRandomWord(), getRandomWord()]);
  const [currentWord, setCurrentWord] = useState(0);
  const [guesses, setGuesses] = useState<{ word: string; states: LetterState[] }[][]>([[], [], []]);
  const [current, setCurrent] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalScore, setTotalScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordsRef = useRef<string[]>([]);

  const startGame = useCallback(() => {
    const newWords = [getRandomWord(), getRandomWord(), getRandomWord()];
    wordsRef.current = newWords;
    setGuesses([[], [], []]);
    setCurrent("");
    setCurrentWord(0);
    setTimeLeft(60);
    setTotalScore(0);
    setWordIndex(0);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setPhase("done"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const submitGuess = useCallback(() => {
    if (current.length !== 5 || phase !== "playing") return;
    const target = wordsRef.current[currentWord];
    if (!target) return;
    const states = evaluateGuess(current, target);
    const isWin = states.every(s => s === "correct");
    setGuesses(prev => {
      const next = prev.map((g, i) => i === currentWord ? [...g, { word: current, states }] : g);
      return next;
    });
    setCurrent("");
    if (isWin) {
      const points = Math.max(10, 50 - guesses[currentWord].length * 10);
      setTotalScore(s => s + points);
      if (currentWord < 2) {
        setCurrentWord(cw => cw + 1);
        setWordIndex(wi => wi + 1);
      } else {
        setPhase("done");
      }
    } else if (guesses[currentWord].length >= 5) {
      if (currentWord < 2) {
        setCurrentWord(cw => cw + 1);
        setWordIndex(wi => wi + 1);
      } else {
        setPhase("done");
      }
    }
  }, [current, currentWord, guesses, phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { submitGuess(); return; }
      if (e.key === "Backspace") { setCurrent(c => c.slice(0, -1)); return; }
      if (/^[a-zA-Z]$/.test(e.key) && current.length < 5) {
        setCurrent(c => c + e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, submitGuess, current]);

  void wordIndex;
  const target = wordsRef.current[currentWord] ?? "-----";
  const curGuesses = guesses[currentWord] ?? [];

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full">
        <span className="font-display text-violet-300 text-lg">⚡ Wordle Blitz</span>
        {phase === "playing" && (
          <div className="flex gap-4 items-center">
            <span
              className="font-display font-bold text-2xl"
              style={{ color: timeLeft <= 10 ? "oklch(0.65 0.23 15)" : "oklch(0.80 0.18 80)" }}
            >
              {timeLeft}s
            </span>
            <span className="font-mono text-violet-200 text-sm">Word {currentWord + 1}/3</span>
            <span className="font-mono text-green-300 text-sm">+{totalScore}</span>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="text-center space-y-4 py-8">
          <p className="text-muted-foreground">Guess 3 words in 60 seconds!</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
            Start Blitz
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4 py-4">
          <p className="text-violet-300 font-display text-2xl">Time's Up!</p>
          <p className="text-foreground">Final Score: <span className="text-green-400 font-bold">{totalScore}</span></p>
          <p className="text-muted-foreground text-sm">Words were: {wordsRef.current.join(", ")}</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="space-y-4 w-full max-w-xs">
          {["r0","r1","r2","r3","r4","r5"].map((rowKey, row) => {
            const guess = curGuesses[row];
            const isCurrentRow = row === curGuesses.length;
            return (
              <div key={rowKey} className="flex gap-2 justify-center">
                {["c0","c1","c2","c3","c4"].map((colKey, col) => {
                  let letter = "";
                  let state: LetterState = "empty";
                  if (guess) { letter = guess.word[col]; state = guess.states[col]; }
                  else if (isCurrentRow) { letter = current[col] ?? ""; }
                  return (
                    <div
                      key={`${rowKey}-${colKey}`}
                      className={`w-12 h-12 flex items-center justify-center border-2 rounded font-display font-bold text-lg transition-colors ${cellColor[state]}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div className="flex gap-2 justify-center mt-4">
            <div className="flex gap-1">
              {["p0","p1","p2","p3","p4"].map((key, i) => (
                <div key={key} className="w-10 h-10 flex items-center justify-center border-2 border-violet-500 rounded font-display font-bold bg-zinc-900">
                  {current[i] ?? ""}
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-muted-foreground text-xs">Type a 5-letter word and press Enter</p>
        </div>
      )}
    </div>
  );
}
