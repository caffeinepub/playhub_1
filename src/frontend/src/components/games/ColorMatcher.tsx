import { useState, useCallback, useEffect, useRef } from "react";

const TOTAL_ROUNDS = 20;

const COLORS = [
  { name: "RED",    hex: "oklch(0.62 0.22 25)",  bg: "oklch(0.28 0.12 25)"  },
  { name: "BLUE",   hex: "oklch(0.55 0.20 260)", bg: "oklch(0.22 0.10 260)" },
  { name: "GREEN",  hex: "oklch(0.65 0.20 150)", bg: "oklch(0.24 0.10 150)" },
  { name: "YELLOW", hex: "oklch(0.85 0.18 90)",  bg: "oklch(0.28 0.10 90)"  },
  { name: "PURPLE", hex: "oklch(0.60 0.22 300)", bg: "oklch(0.22 0.12 300)" },
];

interface Round {
  wordIdx: number;  // the word displayed
  inkIdx: number;   // the actual ink color (correct answer)
}

function generateRound(): Round {
  const wordIdx = Math.floor(Math.random() * COLORS.length);
  let inkIdx = Math.floor(Math.random() * COLORS.length);
  // Ensure mismatch for most rounds
  if (Math.random() > 0.15) {
    while (inkIdx === wordIdx) inkIdx = Math.floor(Math.random() * COLORS.length);
  }
  return { wordIdx, inkIdx };
}

type Phase = "idle" | "playing" | "done";

export default function ColorMatcher() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState<Round>(generateRound);
  const [score, setScore] = useState(0);
  const [roundNum, setRoundNum] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setPhase("playing");
    setRound(generateRound());
    setScore(0);
    setRoundNum(0);
    setStreak(0);
    setBestStreak(0);
    setLastCorrect(null);
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimeMs(Date.now() - startTimeRef.current), 100);
  }, []);

  const handleAnswer = useCallback((colorIdx: number) => {
    const isCorrect = colorIdx === round.inkIdx;
    setLastCorrect(isCorrect);

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(st => {
        const next = st + 1;
        setBestStreak(bs => Math.max(bs, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    const nextRound = roundNum + 1;
    setRoundNum(nextRound);

    if (nextRound >= TOTAL_ROUNDS) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("done");
    } else {
      setRound(generateRound());
    }
  }, [round, roundNum]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const elapsed = (timeMs / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm">
      {/* Stats */}
      <div className="flex gap-4 flex-wrap justify-center">
        <div className="score-chip">
          <span className="score-label">Score</span>
          <span className="score-value">{score}/{TOTAL_ROUNDS}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Streak</span>
          <span className="score-value gradient-text">{streak}</span>
        </div>
        {phase === "playing" && (
          <div className="score-chip">
            <span className="score-label">Time</span>
            <span className="score-value">{elapsed}s</span>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="text-center py-4">
          <p className="font-display text-xl font-bold gradient-text mb-2">Stroop Test</p>
          <p className="text-muted-foreground text-sm mb-2">Click the button matching the <strong className="text-foreground">ink color</strong></p>
          <p className="text-muted-foreground text-xs mb-5">Not the word — the color of the text!</p>
          <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            Start Test
          </button>
        </div>
      )}

      {phase === "playing" && (
        <>
          {/* Progress */}
          <div className="w-full h-1 rounded-full" style={{ background: "oklch(0.18 0.02 270)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(roundNum / TOTAL_ROUNDS) * 100}%`,
                background: "linear-gradient(90deg, oklch(0.62 0.22 290), oklch(0.72 0.19 195))",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">{roundNum + 1} / {TOTAL_ROUNDS}</p>

          {/* Color word */}
          <div
            className="w-full rounded-2xl flex items-center justify-center"
            style={{
              background: "oklch(0.13 0.018 270)",
              border: "1px solid oklch(0.62 0.22 290 / 0.2)",
              height: 120,
            }}
          >
            <span
              className="font-display text-5xl font-extrabold tracking-widest select-none"
              style={{ color: COLORS[round.inkIdx].hex }}
            >
              {COLORS[round.wordIdx].name}
            </span>
          </div>

          {/* Feedback flash */}
          {lastCorrect !== null && (
            <p
              className={`font-display text-sm font-bold transition-opacity ${lastCorrect ? "text-green-400" : "text-red-400"}`}
            >
              {lastCorrect ? "✓ Correct!" : "✗ Wrong!"}
            </p>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-5 gap-2 w-full">
            {COLORS.map((color, idx) => (
              <button
                key={color.name}
                type="button"
                onClick={() => handleAnswer(idx)}
                className="rounded-xl py-3 font-display text-xs font-bold tracking-widest transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  background: color.bg,
                  border: `2px solid ${color.hex}`,
                  color: color.hex,
                }}
              >
                {color.name}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="text-center animate-fade-in-up py-2">
          <p className="font-display text-3xl font-bold gradient-text mb-1">Done! 🧠</p>
          <div className="flex gap-4 justify-center flex-wrap my-4">
            <div className="score-chip">
              <span className="score-label">Score</span>
              <span className="score-value gradient-text">{score}/{TOTAL_ROUNDS}</span>
            </div>
            <div className="score-chip">
              <span className="score-label">Time</span>
              <span className="score-value">{elapsed}s</span>
            </div>
            <div className="score-chip">
              <span className="score-label">Best Streak</span>
              <span className="score-value">{bestStreak}</span>
            </div>
          </div>
          <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
