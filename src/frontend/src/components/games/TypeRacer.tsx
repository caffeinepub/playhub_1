import { useState, useRef, useEffect, useCallback } from "react";

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "A journey of a thousand miles begins with a single step.",
  "To be or not to be that is the question.",
  "All that glitters is not gold in this world.",
  "The only way to do great work is to love what you do.",
  "In the middle of every difficulty lies opportunity.",
  "Life is what happens when you are busy making other plans.",
  "The future belongs to those who believe in their dreams.",
  "You miss one hundred percent of shots you do not take.",
  "Success is not final and failure is not fatal it is courage that counts.",
];

function pickRandom(): string {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
}

type Phase = "idle" | "typing" | "done";

export default function TypeRacer() {
  const [sentence, setSentence] = useState(pickRandom);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCharsTypedRef = useRef(0);
  const wrongCharsRef = useRef(0);

  const startGame = useCallback(() => {
    const newSentence = pickRandom();
    setSentence(newSentence);
    setInput("");
    setPhase("idle");
    setWpm(0);
    setAccuracy(100);
    totalCharsTypedRef.current = 0;
    wrongCharsRef.current = 0;
    setTimeout(() => { inputRef.current?.focus(); setPhase("typing"); setStartTime(Date.now()); }, 50);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== "typing") return;
    const val = e.target.value;

    // Track accuracy
    const charIdx = val.length - 1;
    if (val.length > input.length && charIdx >= 0) {
      totalCharsTypedRef.current++;
      if (val[charIdx] !== sentence[charIdx]) wrongCharsRef.current++;
    }

    setInput(val);

    // Live WPM calculation
    if (val.length > 0) {
      const elapsed = (Date.now() - startTime) / 60000;
      if (elapsed > 0) {
        const wordsTyped = val.length / 5;
        setLiveWpm(Math.round(wordsTyped / elapsed));
      }
    }

    if (val === sentence) {
      const elapsed = (Date.now() - startTime) / 60000; // minutes
      const words = sentence.split(" ").length;
      const calculatedWpm = Math.round(words / elapsed);
      const correctChars = totalCharsTypedRef.current - wrongCharsRef.current;
      const acc = Math.round((correctChars / Math.max(1, totalCharsTypedRef.current)) * 100);
      setWpm(calculatedWpm);
      setAccuracy(acc);
      setPhase("done");
    }
  }, [phase, input, sentence, startTime]);

  useEffect(() => {
    if (phase === "typing") inputRef.current?.focus();
  }, [phase]);

  // Render characters
  const chars = sentence.split("").map((char, i) => {
    let className = "opacity-40 text-muted-foreground";
    if (i < input.length) {
      className = input[i] === char
        ? "text-green-400"
        : "text-red-400 underline decoration-red-400";
    } else if (i === input.length) {
      className = "text-foreground border-b-2 border-violet-400";
    }
    return { char, className };
  });

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">
      <div className="flex gap-6">
        <div className="score-chip">
          <span className="score-label">WPM</span>
          <span className="score-value gradient-text">
            {phase === "done" ? wpm : phase === "typing" ? liveWpm : "—"}
          </span>
        </div>
        <div className="score-chip">
          <span className="score-label">Accuracy</span>
          <span className="score-value">{phase === "done" ? `${accuracy}%` : "—"}</span>
        </div>
      </div>

      {phase === "idle" && (
        <div className="text-center py-4">
          <p className="font-display text-xl font-bold gradient-text mb-2">Type Racer</p>
          <p className="text-muted-foreground text-sm mb-5">Type the text as fast and accurately as you can</p>
          <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            Start Typing
          </button>
        </div>
      )}

      {(phase === "typing" || phase === "done") && (
        <>
          {/* Sentence display */}
          <div
            className="w-full rounded-xl p-4 font-mono text-base leading-loose tracking-wide"
            style={{ background: "oklch(0.14 0.018 270)", border: "1px solid oklch(0.62 0.22 290 / 0.2)" }}
          >
            {chars.map(({ char, className }, i) => {
              const stableKey = `pos${i}`;
              return <span key={stableKey} className={className}>{char === " " ? "\u00A0" : char}</span>;
            })}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            disabled={phase === "done"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all"
            style={{
              background: "oklch(0.12 0.016 270)",
              border: "1px solid oklch(0.62 0.22 290 / 0.3)",
              color: "oklch(0.96 0.01 270)",
              caretColor: "oklch(0.72 0.19 195)",
            }}
            placeholder="Start typing..."
          />

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full" style={{ background: "oklch(0.18 0.02 270)" }}>
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${(input.length / sentence.length) * 100}%`,
                background: "linear-gradient(90deg, oklch(0.62 0.22 290), oklch(0.72 0.19 195))",
              }}
            />
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-xl font-bold gradient-text mb-1">🎉 Done!</p>
          <p className="text-muted-foreground text-sm mb-4">
            {wpm} WPM &nbsp;|&nbsp; {accuracy}% accuracy
          </p>
          <button type="button" onClick={startGame} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
