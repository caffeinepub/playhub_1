import { useState } from "react";

interface Question {
  question: string;
  options: [string, string, string, string];
  answer: number;
}

const QUESTIONS: Question[] = [
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: 2,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answer: 1,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
    answer: 2,
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answer: 3,
  },
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2,
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Diamond", "Iron", "Quartz"],
    answer: 1,
  },
  {
    question: "Which country has the most natural lakes?",
    options: ["Russia", "USA", "Brazil", "Canada"],
    answer: 3,
  },
  {
    question: "What is the speed of light in a vacuum (approx.)?",
    options: ["100,000 km/s", "200,000 km/s", "300,000 km/s", "400,000 km/s"],
    answer: 2,
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    answer: 2,
  },
  {
    question: "Which programming language was created by Brendan Eich?",
    options: ["Python", "Java", "C++", "JavaScript"],
    answer: 3,
  },
];

const GRADES: { min: number; label: string }[] = [
  { min: 10, label: "Perfect! 🏆" },
  { min: 8, label: "Brilliant! 🌟" },
  { min: 6, label: "Good job! 👍" },
  { min: 4, label: "Keep practicing! 📚" },
  { min: 0, label: "Better luck next time! 💪" },
];

const LABELS = ["A", "B", "C", "D"];

export default function TriviaQuiz() {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"playing" | "answered" | "done">("playing");

  const q = QUESTIONS[qIdx];

  const handleAnswer = (idx: number) => {
    if (phase !== "playing") return;
    setSelected(idx);
    if (idx === q.answer) setScore((s) => s + 1);
    setPhase("answered");
  };

  const handleNext = () => {
    if (qIdx + 1 >= QUESTIONS.length) {
      setPhase("done");
    } else {
      setQIdx((i) => i + 1);
      setSelected(null);
      setPhase("playing");
    }
  };

  const restart = () => {
    setQIdx(0);
    setScore(0);
    setSelected(null);
    setPhase("playing");
  };

  const grade = GRADES.find((g) => score >= g.min)?.label ?? "";

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto text-center">
        <div className="text-6xl mb-2">🧩</div>
        <h2 className="font-display text-2xl font-bold gradient-text">Quiz Complete!</h2>
        <div className="text-5xl font-display font-bold text-foreground">
          {score}<span className="text-muted-foreground text-2xl">/{QUESTIONS.length}</span>
        </div>
        <p className="text-violet-300 font-display text-lg">{grade}</p>
        <button
          type="button"
          onClick={restart}
          className="btn-gradient px-8 py-3 rounded-xl text-white font-display font-semibold tracking-wide"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 max-w-md mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-display">
          Question {qIdx + 1} of {QUESTIONS.length}
        </span>
        <span className="text-cyan-300 font-display font-bold">Score: {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${((qIdx + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-violet/20 bg-surface-2 p-5">
        <p className="font-display text-base font-semibold text-foreground leading-relaxed">
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt, idx) => {
          let style =
            "border border-border/50 bg-surface-2 text-foreground hover:border-violet/40 hover:bg-violet/5";
          if (phase === "answered") {
            if (idx === q.answer) {
              style = "border border-green-500/60 bg-green-500/10 text-green-300";
            } else if (idx === selected && idx !== q.answer) {
              style = "border border-red-500/60 bg-red-500/10 text-red-300";
            } else {
              style = "border border-border/30 bg-surface-2 text-muted-foreground opacity-60";
            }
          }
          return (
            <button
              key={`opt-${LABELS[idx]}`}
              type="button"
              onClick={() => handleAnswer(idx)}
              disabled={phase === "answered"}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${style}`}
            >
              <span className="font-display font-bold text-sm w-6 shrink-0 opacity-70">
                {LABELS[idx]}
              </span>
              <span className="font-display text-sm">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {phase === "answered" && (
        <button
          type="button"
          onClick={handleNext}
          className="btn-gradient px-6 py-2.5 rounded-xl text-white font-display font-semibold tracking-wide self-center"
        >
          {qIdx + 1 >= QUESTIONS.length ? "See Results" : "Next Question →"}
        </button>
      )}
    </div>
  );
}
