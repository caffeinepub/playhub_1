import { useState, useEffect, useCallback, useRef } from "react";

type Op = "+" | "−" | "×";

interface Question {
  text: string;
  answer: number;
  options: number[];
}

function genQuestion(): Question {
  const ops: Op[] = ["+", "−", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 12) + 1;
  if (op === "−" && b > a) [a, b] = [b, a];
  const correct = op === "+" ? a + b : op === "−" ? a - b : a * b;
  const text = `${a} ${op} ${b}`;

  const opts = new Set<number>([correct]);
  while (opts.size < 4) {
    const delta = Math.floor(Math.random() * 10) - 5;
    const candidate = correct + delta;
    if (candidate !== correct && candidate >= 0) opts.add(candidate);
  }
  const options = [...opts].sort(() => Math.random() - 0.5);
  return { text, answer: correct, options };
}

const TOTAL_QUESTIONS = 10;
const TIME_PER_Q = 10;

export default function MathBlaster() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [question, setQuestion] = useState<Question>(() => genQuestion());
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [bonus, setBonus] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const advance = useCallback(() => {
    stopTimer();
    setTimeout(() => {
      const next = qIdx + 1;
      if (next >= TOTAL_QUESTIONS) {
        setPhase("done");
      } else {
        setQIdx(next);
        setQuestion(genQuestion());
        setSelected(null);
        setCorrect(null);
        setFeedback(null);
        setBonus(false);
        setTimeLeft(TIME_PER_Q);
        startTimeRef.current = performance.now();
      }
    }, 900);
  }, [qIdx, stopTimer]);

  const handleAnswer = useCallback(
    (opt: number) => {
      if (feedback !== null) return;
      stopTimer();
      setSelected(opt);
      setCorrect(question.answer);
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const isBonus = elapsed < 3;
      const isCorrect = opt === question.answer;
      setBonus(isBonus && isCorrect);
      setFeedback(isCorrect ? "correct" : "wrong");
      if (isCorrect) {
        setScore((s) => s + (isBonus ? 2 : 1));
        streakRef.current++;
        setStreak(streakRef.current);
      } else {
        streakRef.current = 0;
        setStreak(0);
      }
      advance();
    },
    [feedback, question, stopTimer, advance]
  );

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFeedback("timeout");
          setCorrect(question.answer);
          advance();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer, question.answer, advance]);

  const startGame = useCallback(() => {
    setPhase("playing");
    setQIdx(0);
    setScore(0);
    setStreak(0);
    streakRef.current = 0;
    setQuestion(genQuestion());
    setSelected(null);
    setCorrect(null);
    setFeedback(null);
    setBonus(false);
    setTimeLeft(TIME_PER_Q);
  }, []);

  useEffect(() => {
    if (phase === "playing" && feedback === null) {
      startTimer();
    }
    return stopTimer;
  }, [phase, feedback, startTimer, stopTimer]);

  if (phase === "idle" || phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="text-6xl">🧮</div>
        {phase === "done" && (
          <>
            <h2 className="font-display text-2xl font-bold gradient-text">Round Complete!</h2>
            <div className="text-5xl font-display font-bold text-foreground">
              {score}<span className="text-muted-foreground text-2xl">/{TOTAL_QUESTIONS * 2}</span>
            </div>
            <p className="text-muted-foreground text-sm">Fast answers (under 3s) score 2× points!</p>
          </>
        )}
        {phase === "idle" && (
          <>
            <h2 className="font-display text-2xl font-bold text-foreground">Math Blaster</h2>
            <p className="text-muted-foreground text-sm">10 questions · 10 seconds each · bonus for speed!</p>
          </>
        )}
        <button
          type="button"
          onClick={startGame}
          className="btn-gradient px-8 py-3 rounded-xl text-white font-display font-semibold tracking-wide"
        >
          {phase === "done" ? "Play Again" : "Start"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 p-5 w-full max-w-sm mx-auto">
      {/* Progress + score */}
      <div className="flex items-center justify-between w-full text-sm">
        <span className="text-muted-foreground font-display">Q {qIdx + 1}/{TOTAL_QUESTIONS}</span>
        {streak >= 2 && <span className="text-yellow-300 font-display font-bold">🔥 {streak} streak!</span>}
        <span className="text-cyan-300 font-display font-bold">Score: {score}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${timeLeft > 5 ? "bg-green-400" : timeLeft > 2 ? "bg-yellow-400" : "bg-red-400"}`}
          style={{ width: `${(timeLeft / TIME_PER_Q) * 100}%` }}
        />
      </div>
      <div className="text-muted-foreground font-display text-sm">{timeLeft}s</div>

      {/* Question */}
      <div className="w-full rounded-2xl border border-cyan/20 bg-surface-2 p-6 text-center">
        <span className="font-display text-4xl font-bold text-foreground">{question.text} = ?</span>
        {bonus && feedback === "correct" && (
          <p className="text-yellow-300 font-display text-sm mt-2 animate-bounce">⚡ Speed Bonus! 2×</p>
        )}
      </div>

      {/* Answers */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {question.options.map((opt) => {
          let style = "border border-border/50 bg-surface-2 text-foreground hover:border-cyan/40 hover:bg-cyan/5";
          if (feedback !== null) {
            if (opt === correct) style = "border border-green-500/60 bg-green-500/10 text-green-300";
            else if (opt === selected && opt !== correct) style = "border border-red-500/60 bg-red-500/10 text-red-300";
            else style = "border border-border/30 bg-surface-2 text-muted-foreground opacity-50";
          }
          return (
            <button
              key={`math-opt-${opt}`}
              type="button"
              onClick={() => handleAnswer(opt)}
              disabled={feedback !== null}
              className={`py-4 rounded-xl font-display text-2xl font-bold transition-all duration-150 ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
