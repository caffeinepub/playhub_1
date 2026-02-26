import { useState, useEffect, useRef, useCallback } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

const HOLES = 9;
const GAME_DURATION = 30;

type GameState = "idle" | "playing" | "gameover";

export default function WhackAMole() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [whackedHole, setWhackedHole] = useState<number | null>(null);
  const [missedHole, setMissedHole] = useState<number | null>(null);

  const { data: highScore = BigInt(0) } = useGetHighScore("whackamole");
  const saveScore = useSaveHighScore();

  const moleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const showNextMole = useCallback(() => {
    const hole = Math.floor(Math.random() * HOLES);
    setActiveMole(hole);
    const duration = 600 + Math.random() * 300;
    moleTimerRef.current = setTimeout(() => {
      setActiveMole(prev => {
        if (prev === hole) setMissedHole(hole);
        return null;
      });
      setTimeout(() => setMissedHole(null), 250);
      showNextMole();
    }, duration);
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setActiveMole(null);
    setWhackedHole(null);
    setMissedHole(null);
    setGameState("playing");

    showNextMole();

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimers();
          setActiveMole(null);
          setGameState("gameover");
          const s = scoreRef.current;
          if (s > Number(highScore)) {
            saveScore.mutate({ gameName: "whackamole", score: BigInt(s) });
            toast.success(`New high score: ${s}!`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimers, showNextMole, highScore, saveScore]);

  const whackMole = useCallback((hole: number) => {
    if (gameState !== "playing" || activeMole !== hole) return;
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    setActiveMole(null);
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setWhackedHole(hole);
    setTimeout(() => {
      setWhackedHole(null);
      showNextMole();
    }, 200);
  }, [gameState, activeMole, showNextMole]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft > 10 ? "oklch(0.72 0.19 195)" : "oklch(0.65 0.23 15)";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Stats */}
      <div className="flex gap-4 text-center w-full max-w-xs justify-between">
        <div className="score-chip flex-1">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-chip flex-1">
          <span className="score-label">Time</span>
          <span className="score-value" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>
        <div className="score-chip flex-1">
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">{Number(highScore)}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.16 0.020 270)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${timerPct}%`, background: `linear-gradient(90deg, ${timerColor}, oklch(0.62 0.22 290))` }}
        />
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-4">
        {(["h1","h2","h3","h4","h5","h6","h7","h8","h9"] as const).map((holeId, i) => {
          const isActive = activeMole === i;
          const isWhacked = whackedHole === i;
          const isMissed = missedHole === i;
          return (
            <button
              key={holeId}
              type="button"
              onClick={() => whackMole(i)}
              className="relative w-24 h-24 rounded-xl overflow-hidden select-none"
              style={{ background: "oklch(0.13 0.018 270)", border: "2px solid oklch(0.20 0.025 270)" }}
              disabled={gameState !== "playing"}
            >
              {/* Hole */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: 60, height: 20,
                  background: "oklch(0.07 0.01 270)",
                  boxShadow: "inset 0 4px 8px oklch(0 0 0 / 0.5)"
                }}
              />
              {/* Mole */}
              <div
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-150 select-none"
                style={{
                  bottom: isActive ? 12 : -50,
                  fontSize: 44,
                  lineHeight: 1,
                  filter: isWhacked ? "brightness(2)" : isMissed ? "brightness(0.5)" : "none",
                  transform: `translateX(-50%) ${isWhacked ? "scale(1.3)" : "scale(1)"}`,
                }}
              >
                {isWhacked ? "💫" : "🐹"}
              </div>
              {/* Hit flash */}
              {isWhacked && (
                <div className="absolute inset-0 rounded-xl" style={{ background: "oklch(0.62 0.22 290 / 0.3)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Game Over or Idle state */}
      {gameState === "gameover" && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-2xl font-bold gradient-text mb-1">Time&apos;s Up!</p>
          <p className="text-muted-foreground text-sm mb-4">You whacked {score} moles!</p>
          <button type="button" onClick={startGame}
            className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
            Play Again
          </button>
        </div>
      )}

      {gameState === "idle" && (
        <button type="button" onClick={startGame}
          className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide">
          Start Game
        </button>
      )}
    </div>
  );
}
