import { useState, useEffect, useCallback, useRef } from "react";
import { useSaveHighScore, useGetHighScore } from "../../hooks/useQueries";
import { toast } from "sonner";

const EMOJI_PAIRS = ["🎮", "🕹️", "⚡", "🌟", "🎯", "🔥", "💎", "🚀"];

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function createDeck(): MemoryCard[] {
  const emojis = [...EMOJI_PAIRS, ...EMOJI_PAIRS];
  return emojis
    .sort(() => Math.random() - 0.5)
    .map((emoji, id) => ({ id, emoji, isFlipped: false, isMatched: false }));
}

const TIMER_SECONDS = 60;

export default function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>(createDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: highScore = BigInt(0) } = useGetHighScore("memory");
  const saveScore = useSaveHighScore();

  // High score for memory is stored as "lowest moves" — we invert: score = 1000 - moves*10
  const computeScore = useCallback((m: number) => Math.max(0, 1000 - m * 10), []);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCards(createDeck());
    setFlipped([]);
    setMoves(0);
    setIsChecking(false);
    setGameComplete(false);
    setGameStarted(false);
    setTimeLeft(TIMER_SECONDS);
  }, []);

  const handleCardClick = useCallback(
    (id: number) => {
      if (isChecking || gameComplete) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.isFlipped || card.isMatched) return;
      if (!gameStarted) {
        setGameStarted(true);
        // Start countdown
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setGameComplete(true);
              toast.error("Time's up! Game over.");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      if (flipped.length === 1 && flipped[0] === id) return;

      const newFlipped = [...flipped, id];
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)),
      );

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsChecking(true);
        const [firstId, secondId] = newFlipped;
        const first = cards.find((c) => c.id === firstId)!;
        const second = cards.find((c) => c.id === secondId)!;

        if (first.emoji === second.emoji) {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c,
              ),
            );
            setFlipped([]);
            setIsChecking(false);
          }, 400);
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c,
              ),
            );
            setFlipped([]);
            setIsChecking(false);
          }, 900);
        }
      } else {
        setFlipped(newFlipped);
      }
    },
    [cards, flipped, isChecking, gameComplete, gameStarted],
  );

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Check win
  useEffect(() => {
    if (!gameStarted) return;
    const allMatched = cards.every((c) => c.isMatched);
    if (allMatched && !gameComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameComplete(true);
      const score = computeScore(moves);
      const prevBest = Number(highScore);
      if (score > prevBest) {
        saveScore.mutate({ gameName: "memory", score: BigInt(score) });
        toast.success(`New best! Score: ${score}`);
      } else {
        toast.success(`Completed in ${moves} moves! Score: ${score}`);
      }
      setBestMoves(moves);
    }
  }, [cards, gameStarted, gameComplete, moves, highScore, saveScore, computeScore]);

  const hsScore = Number(highScore);
  const hsDisplay = hsScore > 0 ? Math.round((1000 - hsScore) / 10) : null;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Stats row */}
      <div className="flex gap-4 text-center items-center">
        <div className="score-chip">
          <span className="score-label">Moves</span>
          <span className="score-value">{moves}</span>
        </div>
        <div className="score-chip">
          <span className="score-label">Time</span>
          <span className="score-value" style={{ color: timeLeft <= 10 ? "oklch(0.65 0.23 15)" : undefined }}>
            {timeLeft}s
          </span>
        </div>
        <div className="score-chip">
          <span className="score-label">Best</span>
          <span className="score-value gradient-text">
            {hsDisplay !== null ? `${hsDisplay}mv` : "—"}
          </span>
        </div>
        {gameStarted && !gameComplete && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-display tracking-wide border border-violet/30 text-violet-300 hover:bg-violet/10 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Board */}
      <div className="memory-board">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleCardClick(card.id)}
            className={`memory-card ${card.isFlipped || card.isMatched ? "flipped" : ""} ${card.isMatched ? "matched" : ""}`}
            aria-label={card.isFlipped || card.isMatched ? card.emoji : "Hidden card"}
          >
            <div className="memory-card-inner">
              <div className="memory-card-front">
                <span className="text-2xl">❓</span>
              </div>
              <div className="memory-card-back">
                <span className="text-2xl">{card.emoji}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Win state */}
      {gameComplete && (
        <div className="text-center animate-fade-in-up">
          <p className="font-display text-xl font-700 gradient-text mb-1">
            🎉 Complete!
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            Finished in {bestMoves} moves — Score: {computeScore(moves)}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-600 tracking-wide"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
