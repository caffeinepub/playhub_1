import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getStreak(): number {
  try {
    const raw = localStorage.getItem("playhub_streak");
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function recordCompletion(): number {
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const lastCompleted = localStorage.getItem("playhub_last_completed") ?? "";
  let streak = getStreak();

  if (lastCompleted === todayKey) return streak; // already counted
  if (lastCompleted === yesterdayKey) {
    streak += 1;
  } else {
    streak = 1;
  }

  localStorage.setItem("playhub_streak", String(streak));
  localStorage.setItem("playhub_last_completed", todayKey);
  return streak;
}

function hasCompletedToday(): boolean {
  return localStorage.getItem("playhub_last_completed") === getTodayKey();
}

// ─── Trivia Data ──────────────────────────────────────────────────────────────

const TRIVIA_QUESTIONS = [
  { q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1 },
  { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: 2 },
  { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: 1 },
  { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Da Vinci", "Botticelli"], answer: 2 },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
  { q: "What is the speed of light (approx)?", options: ["150,000 km/s", "300,000 km/s", "500,000 km/s", "1,000,000 km/s"], answer: 1 },
  { q: "What year did the first iPhone launch?", options: ["2005", "2006", "2007", "2008"], answer: 2 },
  { q: "What is the smallest prime number?", options: ["0", "1", "2", "3"], answer: 2 },
  { q: "Which country invented pizza?", options: ["Greece", "France", "Spain", "Italy"], answer: 3 },
  { q: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"], answer: 2 },
  { q: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], answer: 1 },
  { q: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"], answer: 2 },
  { q: "Who wrote Romeo and Juliet?", options: ["Charles Dickens", "Shakespeare", "Hemingway", "Tolkien"], answer: 1 },
  { q: "What is 7 × 8?", options: ["54", "56", "58", "60"], answer: 1 },
  { q: "What is the largest continent?", options: ["Africa", "North America", "Asia", "Europe"], answer: 2 },
  { q: "What is the currency of Brazil?", options: ["Peso", "Real", "Dollar", "Euro"], answer: 1 },
  { q: "How many strings does a standard guitar have?", options: ["4", "5", "6", "7"], answer: 2 },
  { q: "Which element has the atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], answer: 1 },
  { q: "What sport is played at Wimbledon?", options: ["Cricket", "Golf", "Tennis", "Badminton"], answer: 2 },
  { q: "What is the longest river in the world?", options: ["Amazon", "Yangtze", "Nile", "Mississippi"], answer: 2 },
  { q: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], answer: 2 },
  { q: "What is the hardest natural substance?", options: ["Quartz", "Steel", "Diamond", "Titanium"], answer: 2 },
  { q: "Who developed the theory of relativity?", options: ["Newton", "Tesla", "Einstein", "Bohr"], answer: 2 },
  { q: "What is the national animal of Australia?", options: ["Koala", "Platypus", "Kangaroo", "Wombat"], answer: 2 },
  { q: "How many planets are in the solar system?", options: ["7", "8", "9", "10"], answer: 1 },
  { q: "What is the smallest country in the world?", options: ["Monaco", "Liechtenstein", "Vatican City", "San Marino"], answer: 2 },
  { q: "What language has the most native speakers?", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], answer: 2 },
  { q: "What is H₂O commonly known as?", options: ["Hydrogen Peroxide", "Water", "Salt Water", "Heavy Water"], answer: 1 },
  { q: "Which programming language was created first?", options: ["C", "FORTRAN", "COBOL", "Pascal"], answer: 1 },
  { q: "What is the freezing point of water in Celsius?", options: ["-1°C", "0°C", "1°C", "32°C"], answer: 1 },
  { q: "Who is known as the father of computers?", options: ["Alan Turing", "Charles Babbage", "John von Neumann", "Ada Lovelace"], answer: 1 },
  { q: "How many letters are in the English alphabet?", options: ["24", "25", "26", "27"], answer: 2 },
];

// ─── Word Scramble Data ───────────────────────────────────────────────────────

const SCRAMBLE_WORDS = [
  "RAINBOW", "ELEPHANT", "QUANTUM", "GALAXY", "PUZZLE",
  "THUNDER", "CRYSTAL", "PHOENIX", "DRAGON", "VOLCANO",
  "HORIZON", "LANTERN", "TURBOJET", "ECLIPSE", "WHISPER",
  "MARVEL", "NEBULA", "FUSION", "PRISM", "CIPHER",
  "TEMPEST", "VORTEX", "ZENITH", "LABYRINTH", "MIRAGE",
];

function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  // Ensure it's actually scrambled
  return result === word && word.length > 1 ? scramble(word) : result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ChallengePhase = "intro" | "playing" | "result";

// ── Trivia Challenge ──────────────────────────────────────────────────────────

function TriviaChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const day = getDayOfYear();
  const question = TRIVIA_QUESTIONS[day % TRIVIA_QUESTIONS.length];
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => onComplete(selected === question.answer ? 1 : 0), 1200);
  };

  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground leading-snug">{question.q}</p>
      <div className="grid gap-2.5">
        {question.options.map((opt, i) => {
          let cls = "w-full text-left px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 ";
          if (!submitted) {
            cls += selected === i
              ? "border-violet-500 bg-violet-500/20 text-white shadow-[0_0_12px_oklch(var(--violet)/0.4)]"
              : "border-white/10 bg-white/5 text-foreground hover:border-violet-400/40 hover:bg-violet-500/10";
          } else {
            if (i === question.answer) {
              cls += "border-emerald-400 bg-emerald-500/20 text-emerald-300";
            } else if (i === selected) {
              cls += "border-red-400 bg-red-500/20 text-red-300";
            } else {
              cls += "border-white/10 bg-white/5 text-muted-foreground opacity-50";
            }
          }
          return (
            <button
              key={opt}
              type="button"
              className={cls}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
            >
              <span className="mr-2 text-muted-foreground font-mono text-xs">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full btn-gradient text-white font-bold py-2.5"
        >
          Submit Answer
        </Button>
      )}
    </div>
  );
}

// ── Reflex Challenge ──────────────────────────────────────────────────────────

type ReflexPhase = "countdown" | "waiting" | "ready" | "clicked" | "too-early";

const TARGET_COLORS = [
  { bg: "oklch(0.72 0.19 195)", label: "Cyan" },
  { bg: "oklch(0.62 0.22 290)", label: "Violet" },
  { bg: "oklch(0.75 0.22 140)", label: "Green" },
  { bg: "oklch(0.80 0.18 50)", label: "Amber" },
  { bg: "oklch(0.65 0.23 15)", label: "Red" },
];

function ReflexChallenge({ onComplete }: { onComplete: (ms: number) => void }) {
  const [phase, setPhase] = useState<ReflexPhase>("countdown");
  const [count, setCount] = useState(3);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [targetColor] = useState(() => TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "countdown") {
      if (count > 0) {
        timerRef.current = setTimeout(() => setCount((c) => c - 1), 1000);
      } else {
        // Random wait 1-3s before showing target
        const wait = 1000 + Math.random() * 2000;
        timerRef.current = setTimeout(() => {
          setTargetPos({
            x: 10 + Math.random() * 75,
            y: 10 + Math.random() * 70,
          });
          startTimeRef.current = Date.now();
          setPhase("ready");
        }, wait);
        setPhase("waiting");
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [count, phase]);

  const handleTargetClick = () => {
    const ms = Date.now() - startTimeRef.current;
    setPhase("clicked");
    setTimeout(() => onComplete(ms), 800);
  };

  const handleEarlyClick = () => {
    if (phase === "waiting") {
      setPhase("too-early");
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimeout(() => {
        setCount(3);
        setPhase("countdown");
      }, 1500);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{ height: 260, background: "oklch(0.09 0.018 270)" }}
        onClick={handleEarlyClick}
        onKeyDown={(e) => e.key === "Enter" && handleEarlyClick()}
      >
        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold text-7xl"
              style={{
                fontFamily: "Oxanium, sans-serif",
                background: "linear-gradient(135deg, oklch(var(--violet)), oklch(var(--cyan)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {count}
            </span>
          </div>
        )}
        {phase === "waiting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Wait for it…
            </p>
          </div>
        )}
        {phase === "ready" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleTargetClick(); }}
            className="absolute w-14 h-14 rounded-full transition-transform active:scale-90 animate-pulse"
            style={{
              left: `${targetPos.x}%`,
              top: `${targetPos.y}%`,
              transform: "translate(-50%, -50%)",
              background: targetColor.bg,
              boxShadow: `0 0 28px ${targetColor.bg}`,
            }}
          />
        )}
        {phase === "clicked" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-bounce">⚡</span>
          </div>
        )}
        {phase === "too-early" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-400 text-sm font-semibold tracking-wide">Too early! Restarting…</p>
          </div>
        )}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        {phase === "waiting" ? "Don't click yet — wait for the target!" : "Click the target as fast as you can."}
      </p>
    </div>
  );
}

// ── Word Scramble Challenge ───────────────────────────────────────────────────

function WordScrambleChallenge({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const day = getDayOfYear();
  const word = SCRAMBLE_WORDS[day % SCRAMBLE_WORDS.length];
  const [scrambled] = useState(() => scramble(word));
  const scrambledLetters = scrambled.split("").map((letter, i) => ({ letter, id: `pos-${i}` }));
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const handleSubmit = () => {
    if (!input.trim()) return;
    const isCorrect = input.trim().toUpperCase() === word.toUpperCase();
    if (isCorrect) {
      setCorrect(true);
      setSubmitted(true);
      setTimeout(() => onComplete(true), 1000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setSubmitted(true);
        setCorrect(false);
        setTimeout(() => onComplete(false), 1200);
      } else {
        setInput("");
      }
    }
  };

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  return (
    <div className="space-y-5">
      <div className="text-center py-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Unscramble this word</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {scrambledLetters.map(({ letter, id }) => (
            <span
              key={id}
              className="inline-flex w-10 h-10 items-center justify-center rounded-lg text-lg font-bold"
              style={{
                fontFamily: "Oxanium, sans-serif",
                background: "linear-gradient(135deg, oklch(var(--violet)/0.2), oklch(var(--cyan)/0.12))",
                border: "1px solid oklch(var(--violet)/0.35)",
                color: "oklch(var(--foreground))",
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {!submitted && (
        <div className="space-y-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type your answer…"
            className="text-center text-lg font-bold tracking-widest uppercase"
            style={{
              background: "oklch(var(--surface-1))",
              borderColor: "oklch(var(--violet)/0.25)",
            }}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
            </span>
            <Progress value={(attempts / MAX_ATTEMPTS) * 100} className="w-24 h-1.5" />
          </div>
          <Button onClick={handleSubmit} disabled={!input.trim()} className="w-full btn-gradient text-white font-bold">
            Check Answer
          </Button>
        </div>
      )}

      {submitted && (
        <div
          className="text-center py-3 rounded-xl"
          style={{
            background: correct ? "oklch(0.75 0.22 140/0.12)" : "oklch(0.65 0.23 15/0.12)",
            border: `1px solid ${correct ? "oklch(0.75 0.22 140/0.3)" : "oklch(0.65 0.23 15/0.3)"}`,
          }}
        >
          <p className={`font-semibold ${correct ? "text-emerald-400" : "text-red-400"}`}>
            {correct ? "✓ Correct!" : `The word was: ${word}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────

type ChallengeType = "trivia" | "reflex" | "scramble";

interface ResultProps {
  type: ChallengeType;
  score: number | boolean | number; // trivia=0/1, reflex=ms, scramble=boolean
  streak: number;
  onClose: () => void;
}

function ResultScreen({ type, score, streak, onClose }: ResultProps) {
  const getLabel = () => {
    if (type === "trivia") {
      return score === 1 ? "Correct! 🎯" : "Better luck tomorrow! 💪";
    }
    if (type === "reflex") {
      const ms = score as number;
      if (ms < 200) return "Incredible! ⚡";
      if (ms < 400) return "Great reflexes! 🚀";
      return "Good effort! 👍";
    }
    return score ? "Unscrambled! 🔤" : "Nice try! 🔤";
  };

  const getSubtext = () => {
    if (type === "reflex") return `${score}ms reaction time`;
    if (type === "trivia") return score === 1 ? "You got it right!" : "The correct answer was highlighted";
    return score ? "You cracked the scramble!" : "Keep practicing your word skills!";
  };

  const isWin = type === "trivia" ? score === 1 : type === "reflex" ? (score as number) < 400 : Boolean(score);

  return (
    <div className="text-center space-y-6 py-2 animate-fade-in-up">
      <div className="flex justify-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: isWin
              ? "linear-gradient(135deg, oklch(var(--violet)/0.25), oklch(var(--cyan)/0.15))"
              : "oklch(var(--surface-2))",
            border: `2px solid ${isWin ? "oklch(var(--violet)/0.5)" : "oklch(var(--muted-foreground)/0.2)"}`,
            boxShadow: isWin ? "0 0 40px oklch(var(--violet)/0.3)" : "none",
          }}
        >
          {isWin ? "🏆" : "😤"}
        </div>
      </div>

      <div>
        <h3
          className="text-2xl font-bold mb-1"
          style={{
            fontFamily: "Oxanium, sans-serif",
            background: "linear-gradient(135deg, oklch(var(--violet)), oklch(var(--cyan)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {getLabel()}
        </h3>
        <p className="text-muted-foreground text-sm">{getSubtext()}</p>
      </div>

      <div
        className="flex items-center justify-center gap-3 py-3 px-5 rounded-2xl mx-auto w-fit"
        style={{
          background: "oklch(var(--surface-2))",
          border: "1px solid oklch(var(--violet)/0.2)",
        }}
      >
        <span className="text-2xl">🔥</span>
        <div className="text-left">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Daily Streak</p>
          <p
            className="text-xl font-bold"
            style={{
              fontFamily: "Oxanium, sans-serif",
              background: "linear-gradient(135deg, oklch(var(--violet)), oklch(var(--cyan)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {streak} day{streak !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground text-xs tracking-wide">
        Come back tomorrow for a new challenge! ✨
      </p>

      <Button onClick={onClose} className="w-full btn-gradient text-white font-bold py-2.5">
        Close
      </Button>
    </div>
  );
}

// ── Already Completed Screen ──────────────────────────────────────────────────

function AlreadyCompletedScreen({ onClose }: { onClose: () => void }) {
  const streak = getStreak();
  return (
    <div className="text-center space-y-5 py-2 animate-fade-in-up">
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: "linear-gradient(135deg, oklch(var(--violet)/0.2), oklch(var(--cyan)/0.12))",
            border: "1px solid oklch(var(--violet)/0.35)",
          }}
        >
          ✅
        </div>
      </div>
      <div>
        <h3
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "Oxanium, sans-serif", color: "oklch(var(--foreground))" }}
        >
          Already done today!
        </h3>
        <p className="text-muted-foreground text-sm">You've completed today's challenge.</p>
      </div>
      <div
        className="flex items-center justify-center gap-3 py-3 px-5 rounded-2xl mx-auto w-fit"
        style={{
          background: "oklch(var(--surface-2))",
          border: "1px solid oklch(var(--violet)/0.2)",
        }}
      >
        <span className="text-2xl">🔥</span>
        <div className="text-left">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Current Streak</p>
          <p
            className="text-xl font-bold"
            style={{
              fontFamily: "Oxanium, sans-serif",
              background: "linear-gradient(135deg, oklch(var(--violet)), oklch(var(--cyan)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {streak} day{streak !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">Come back tomorrow for a new challenge! ✨</p>
      <Button onClick={onClose} className="w-full btn-gradient text-white font-bold">Close</Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DailyChallengeProps {
  open: boolean;
  onClose: () => void;
}

type ScoreValue = number | boolean;

export default function DailyChallenge({ open, onClose }: DailyChallengeProps) {
  const day = getDayOfYear();
  const challengeType: ChallengeType = (["trivia", "reflex", "scramble"] as ChallengeType[])[day % 3];

  const [phase, setPhase] = useState<ChallengePhase>("intro");
  const [score, setScore] = useState<ScoreValue>(0);
  const [streak, setStreak] = useState(0);
  const alreadyDone = hasCompletedToday();

  const CHALLENGE_META: Record<ChallengeType, { emoji: string; name: string; desc: string }> = {
    trivia: { emoji: "🧠", name: "Trivia", desc: "Answer today's multiple-choice question." },
    reflex: { emoji: "⚡", name: "Reflex Test", desc: "Click the target as fast as you can!" },
    scramble: { emoji: "🔤", name: "Word Scramble", desc: "Unscramble the hidden word." },
  };

  const meta = CHALLENGE_META[challengeType];

  const handleComplete = useCallback((result: ScoreValue) => {
    setScore(result);
    const newStreak = recordCompletion();
    setStreak(newStreak);
    setPhase("result");
  }, []);

  // Reset to intro when modal re-opens (but already-done screen persists)
  useEffect(() => {
    if (open && !alreadyDone) setPhase("intro");
  }, [open, alreadyDone]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg w-full mx-auto rounded-2xl p-0 overflow-hidden"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--violet)/0.25)",
          boxShadow: "0 0 60px oklch(var(--violet)/0.2), 0 24px 64px oklch(0 0 0/0.6)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{
            background: "linear-gradient(160deg, oklch(var(--violet)/0.12), oklch(var(--cyan)/0.06))",
            borderBottom: "1px solid oklch(var(--violet)/0.12)",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{
                  background: "linear-gradient(135deg, oklch(var(--violet)/0.3), oklch(var(--cyan)/0.18))",
                  border: "1px solid oklch(var(--violet)/0.4)",
                  boxShadow: "0 0 16px oklch(var(--violet)/0.25)",
                }}
              >
                🏆
              </div>
              <div>
                <DialogTitle
                  className="text-base font-bold leading-tight"
                  style={{ fontFamily: "Oxanium, sans-serif" }}
                >
                  Daily Challenge
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
            </div>
          </DialogHeader>

          {/* Challenge type badge */}
          {!alreadyDone && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                style={{
                  background: "linear-gradient(135deg, oklch(var(--violet)/0.2), oklch(var(--cyan)/0.12))",
                  border: "1px solid oklch(var(--violet)/0.3)",
                  color: "oklch(var(--foreground))",
                  fontFamily: "Oxanium, sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                <span>{meta.emoji}</span>
                {meta.name} Challenge
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {alreadyDone && <AlreadyCompletedScreen onClose={onClose} />}

          {!alreadyDone && phase === "intro" && (
            <div className="space-y-5 animate-fade-in-up">
              <div className="text-center py-2">
                <div className="text-5xl mb-3">{meta.emoji}</div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{
                    fontFamily: "Oxanium, sans-serif",
                    background: "linear-gradient(135deg, oklch(var(--violet)), oklch(var(--cyan)))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Today's {meta.name}
                </h3>
                <p className="text-muted-foreground text-sm">{meta.desc}</p>
              </div>

              <div
                className="rounded-xl p-4 space-y-1.5"
                style={{
                  background: "oklch(var(--surface-2))",
                  border: "1px solid oklch(var(--violet)/0.15)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Today's stats</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current streak</span>
                  <span className="text-sm font-bold flex items-center gap-1" style={{ fontFamily: "Oxanium, sans-serif" }}>
                    🔥 {getStreak()} day{getStreak() !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Challenge type</span>
                  <span className="text-sm font-semibold" style={{ fontFamily: "Oxanium, sans-serif" }}>{meta.emoji} {meta.name}</span>
                </div>
              </div>

              <Button
                onClick={() => setPhase("playing")}
                className="w-full btn-gradient text-white font-bold py-3 text-base"
              >
                Start Challenge →
              </Button>
            </div>
          )}

          {!alreadyDone && phase === "playing" && (
            <div className="animate-fade-in-up">
              {challengeType === "trivia" && (
                <TriviaChallenge onComplete={(s) => handleComplete(s)} />
              )}
              {challengeType === "reflex" && (
                <ReflexChallenge onComplete={(ms) => handleComplete(ms)} />
              )}
              {challengeType === "scramble" && (
                <WordScrambleChallenge onComplete={(correct) => handleComplete(correct)} />
              )}
            </div>
          )}

          {!alreadyDone && phase === "result" && (
            <ResultScreen
              type={challengeType}
              score={score}
              streak={streak}
              onClose={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
