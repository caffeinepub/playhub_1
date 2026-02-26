import { useState, useRef, useCallback } from "react";

type Phase = "waiting" | "ready" | "clicked" | "tooearly";

export default function ReactionTime() {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);

  const startRound = useCallback(() => {
    setPhase("waiting");
    setReactionMs(null);
    const delay = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setPhase("ready");
      startTimeRef.current = performance.now();
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === "waiting") {
      // Too early
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("tooearly");
      return;
    }
    if (phase === "ready") {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionMs(elapsed);
      setAttempts(prev => [...prev, elapsed]);
      setPersonalBest(prev => (prev === null ? elapsed : Math.min(prev, elapsed)));
      setPhase("clicked");
    }
  }, [phase]);

  const bgColor = phase === "ready"
    ? "oklch(0.32 0.14 150)"
    : phase === "tooearly"
    ? "oklch(0.28 0.15 25)"
    : "oklch(0.16 0.020 270)";

  const avgMs = attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : null;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      {/* Stats */}
      <div className="flex gap-4 flex-wrap justify-center">
        <div className="score-chip">
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">{personalBest !== null ? `${personalBest}ms` : "—"}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Average</span>
          <span className="score-value">{avgMs !== null ? `${avgMs}ms` : "—"}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Rounds</span>
          <span className="score-value">{attempts.length}</span>
        </div>
      </div>

      {/* Main panel */}
      <button
        type="button"
        onClick={phase === "waiting" || phase === "ready" ? handleClick : startRound}
        className="w-full rounded-2xl select-none transition-all duration-200 flex flex-col items-center justify-center gap-3"
        style={{
          background: bgColor,
          border: `2px solid ${phase === "ready" ? "oklch(0.55 0.20 150 / 0.6)" : phase === "tooearly" ? "oklch(0.55 0.20 25 / 0.6)" : "oklch(0.62 0.22 290 / 0.2)"}`,
          minHeight: 240,
          boxShadow: phase === "ready" ? "0 0 40px oklch(0.45 0.20 150 / 0.4)" : "none",
          transform: phase === "ready" ? "scale(1.01)" : "scale(1)",
        }}
      >
        {phase === "waiting" && (
          <>
            <span className="font-display text-4xl">🎯</span>
            <p className="font-display text-2xl font-bold text-foreground">Get Ready...</p>
            <p className="text-muted-foreground text-sm">Wait for green, then click!</p>
          </>
        )}
        {phase === "ready" && (
          <>
            <span className="text-4xl">⚡</span>
            <p className="font-display text-3xl font-bold" style={{ color: "oklch(0.90 0.18 150)" }}>CLICK NOW!</p>
          </>
        )}
        {phase === "clicked" && (
          <>
            <span className="text-4xl">✅</span>
            <p className="font-display text-3xl font-bold gradient-text">{reactionMs}ms</p>
            {personalBest === reactionMs && attempts.length > 1 && (
              <p className="text-yellow-400 text-sm font-display">🏆 New Personal Best!</p>
            )}
            <p className="text-muted-foreground text-sm mt-2">Click to try again</p>
          </>
        )}
        {phase === "tooearly" && (
          <>
            <span className="text-4xl">🚫</span>
            <p className="font-display text-2xl font-bold" style={{ color: "oklch(0.72 0.20 25)" }}>Too Early!</p>
            <p className="text-muted-foreground text-sm mt-2">Click to try again</p>
          </>
        )}
      </button>

      {/* Recent results */}
      {attempts.length > 0 && (
        <div className="w-full">
          <p className="text-xs font-display tracking-widest uppercase text-muted-foreground mb-2">Recent</p>
          <div className="flex flex-wrap gap-2">
            {[...attempts].reverse().slice(0, 6).map((ms, i) => (
              <span
                key={`attempt-${attempts.length - i}`}
                className="text-xs px-2 py-1 rounded-lg font-display"
                style={{
                  background: "oklch(0.18 0.02 270)",
                  border: "1px solid oklch(0.62 0.22 290 / 0.2)",
                  color: ms < 250 ? "oklch(0.72 0.19 150)" : ms < 400 ? "oklch(0.80 0.16 60)" : "oklch(0.65 0.18 25)",
                }}
              >
                {ms}ms
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
