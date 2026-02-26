import { useState, useCallback, useRef } from "react";

type ColorId = "green" | "red" | "yellow" | "blue";
const COLORS: ColorId[] = ["green", "red", "yellow", "blue"];

const COLOR_STYLES: Record<ColorId, { base: string; active: string }> = {
  green:  { base: "bg-green-800/60 border-green-700/40 text-green-400", active: "bg-green-400 border-green-300 text-green-900 scale-105 shadow-[0_0_30px_oklch(0.72_0.23_150)]" },
  red:    { base: "bg-red-900/60 border-red-700/40 text-red-400",       active: "bg-red-400 border-red-300 text-red-900 scale-105 shadow-[0_0_30px_oklch(0.65_0.28_25)]" },
  yellow: { base: "bg-yellow-900/60 border-yellow-700/40 text-yellow-400", active: "bg-yellow-300 border-yellow-200 text-yellow-900 scale-105 shadow-[0_0_30px_oklch(0.88_0.22_85)]" },
  blue:   { base: "bg-blue-900/60 border-blue-700/40 text-blue-400",    active: "bg-blue-400 border-blue-300 text-blue-900 scale-105 shadow-[0_0_30px_oklch(0.62_0.22_250)]" },
};
const ICONS: Record<ColorId, string> = { green: "🟢", red: "🔴", yellow: "🟡", blue: "🔵" };

export default function SimonSays() {
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "gameover">("idle");
  const [sequence, setSequence] = useState<ColorId[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [activeColor, setActiveColor] = useState<ColorId | null>(null);
  const [level, setLevel] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const flashSequence = useCallback((seq: ColorId[]) => {
    clearTimeouts();
    setPhase("showing");
    setActiveColor(null);

    seq.forEach((color, i) => {
      const t1 = setTimeout(() => setActiveColor(color), i * 700 + 400);
      const t2 = setTimeout(() => setActiveColor(null), i * 700 + 700);
      timeoutsRef.current.push(t1, t2);
    });

    const done = setTimeout(() => {
      setPhase("input");
      setPlayerIdx(0);
      setActiveColor(null);
    }, seq.length * 700 + 800);
    timeoutsRef.current.push(done);
  }, [clearTimeouts]);

  const startGame = useCallback(() => {
    clearTimeouts();
    const first: ColorId = COLORS[Math.floor(Math.random() * 4)];
    const newSeq = [first];
    setSequence(newSeq);
    setLevel(1);
    flashSequence(newSeq);
  }, [flashSequence, clearTimeouts]);

  const handleColorPress = (color: ColorId) => {
    if (phase !== "input") return;

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    if (color !== sequence[playerIdx]) {
      setPhase("gameover");
      return;
    }

    const nextIdx = playerIdx + 1;
    if (nextIdx >= sequence.length) {
      // Advance to next round
      const nextColor: ColorId = COLORS[Math.floor(Math.random() * 4)];
      const newSeq = [...sequence, nextColor];
      setSequence(newSeq);
      setLevel((l) => l + 1);
      setTimeout(() => flashSequence(newSeq), 600);
    } else {
      setPlayerIdx(nextIdx);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Level display */}
      <div className="score-chip">
        <span className="score-label">Level</span>
        <span className="score-value gradient-text">{level}</span>
      </div>

      {/* Status message */}
      <div className="h-6 text-center">
        {phase === "idle" && <p className="text-muted-foreground text-sm">Press Start to begin</p>}
        {phase === "showing" && <p className="text-cyan-300 text-sm font-display">Watch the sequence…</p>}
        {phase === "input" && <p className="text-violet-300 text-sm font-display">Your turn! ({sequence.length - playerIdx} left)</p>}
        {phase === "gameover" && <p className="text-destructive text-sm font-display font-bold">Wrong! Game Over</p>}
      </div>

      {/* 2×2 buttons */}
      <div className="grid grid-cols-2 gap-4">
        {COLORS.map((color) => {
          const isActive = activeColor === color;
          const styles = COLOR_STYLES[color];
          return (
            <button
              key={`simon-${color}`}
              type="button"
              onClick={() => handleColorPress(color)}
              disabled={phase !== "input"}
              className={`w-32 h-32 rounded-2xl border-2 text-4xl font-bold transition-all duration-150 select-none
                ${isActive ? styles.active : styles.base}
                ${phase !== "input" ? "cursor-default" : "cursor-pointer hover:brightness-110 active:scale-95"}
              `}
            >
              {ICONS[color]}
            </button>
          );
        })}
      </div>

      {(phase === "idle" || phase === "gameover") && (
        <button
          type="button"
          onClick={startGame}
          className="btn-gradient px-8 py-3 rounded-xl text-white font-display font-semibold tracking-wide"
        >
          {phase === "gameover" ? `Play Again (reached ${level})` : "Start Game"}
        </button>
      )}
    </div>
  );
}
