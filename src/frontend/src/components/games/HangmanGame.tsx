import { useCallback, useState } from "react";

type Category = "Animals" | "Countries" | "Movies" | "Tech" | "All";

const WORD_BANKS: Record<Exclude<Category, "All">, string[]> = {
  Animals: [
    "DOLPHIN", "CHEETAH", "ELEPHANT", "GIRAFFE", "PENGUIN", "JAGUAR", "PARROT",
    "GORILLA", "FLAMINGO", "CROCODILE", "HEDGEHOG", "KANGAROO", "PLATYPUS", "WOLVERINE",
  ],
  Countries: [
    "BRAZIL", "FRANCE", "GERMANY", "ICELAND", "JORDAN", "KENYA", "MEXICO",
    "NORWAY", "POLAND", "SWEDEN", "TURKEY", "UKRAINE", "VIETNAM", "ZAMBIA",
  ],
  Movies: [
    "AVATAR", "JAWS", "ALIEN", "GREASE", "ROCKY", "SHREK", "FROZEN",
    "INCEPTION", "INTERSTELLAR", "GLADIATOR", "BRAVEHEART", "CASABLANCA",
  ],
  Tech: [
    "JAVASCRIPT", "PYTHON", "DOCKER", "GITHUB", "KERNEL", "BROWSER", "NETWORK",
    "ALGORITHM", "DATABASE", "COMPILER", "TYPESCRIPT", "FRAMEWORK", "TERMINAL",
  ],
};

const ALL_WORDS = Object.values(WORD_BANKS).flat();

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function HangmanSVG({ wrong }: { wrong: number }) {
  return (
    <svg width="160" height="180" viewBox="0 0 160 180" className="my-2">
      <title>Hangman drawing</title>
      {/* Gallows */}
      <line x1="20" y1="170" x2="140" y2="170" stroke="#6b7280" strokeWidth="3" />
      <line x1="60" y1="170" x2="60" y2="20" stroke="#6b7280" strokeWidth="3" />
      <line x1="60" y1="20" x2="110" y2="20" stroke="#6b7280" strokeWidth="3" />
      <line x1="110" y1="20" x2="110" y2="40" stroke="#6b7280" strokeWidth="3" />
      {/* Head */}
      {wrong >= 1 && <circle cx="110" cy="55" r="15" stroke="#f87171" strokeWidth="2" fill="none" />}
      {/* Body */}
      {wrong >= 2 && <line x1="110" y1="70" x2="110" y2="120" stroke="#f87171" strokeWidth="2" />}
      {/* Left arm */}
      {wrong >= 3 && <line x1="110" y1="80" x2="85" y2="105" stroke="#f87171" strokeWidth="2" />}
      {/* Right arm */}
      {wrong >= 4 && <line x1="110" y1="80" x2="135" y2="105" stroke="#f87171" strokeWidth="2" />}
      {/* Left leg */}
      {wrong >= 5 && <line x1="110" y1="120" x2="85" y2="150" stroke="#f87171" strokeWidth="2" />}
      {/* Right leg */}
      {wrong >= 6 && <line x1="110" y1="120" x2="135" y2="150" stroke="#f87171" strokeWidth="2" />}
      {/* Face X */}
      {wrong >= 7 && <>
        <line x1="103" y1="49" x2="109" y2="55" stroke="#f87171" strokeWidth="2" />
        <line x1="109" y1="49" x2="103" y2="55" stroke="#f87171" strokeWidth="2" />
        <line x1="112" y1="49" x2="118" y2="55" stroke="#f87171" strokeWidth="2" />
        <line x1="118" y1="49" x2="112" y2="55" stroke="#f87171" strokeWidth="2" />
      </>}
    </svg>
  );
}

function pickWord(cat: Category): string {
  const pool = cat === "All" ? ALL_WORDS : WORD_BANKS[cat];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function HangmanGame() {
  const [category, setCategory] = useState<Category>("All");
  const [word, setWord] = useState(() => pickWord("All"));
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");

  const wrong = [...guessed].filter(l => !word.includes(l)).length;

  const guess = useCallback((letter: string) => {
    if (phase !== "playing" || guessed.has(letter)) return;
    const next = new Set([...guessed, letter]);
    setGuessed(next);
    const newWrong = [...next].filter(l => !word.includes(l)).length;
    if (newWrong >= 7) { setPhase("lost"); return; }
    if (word.split("").every(l => next.has(l))) { setPhase("won"); }
  }, [guessed, word, phase]);

  const reset = (cat?: Category) => {
    const c = cat ?? category;
    setWord(pickWord(c));
    setGuessed(new Set());
    setPhase("playing");
  };

  const changeCategory = (cat: Category) => {
    setCategory(cat);
    reset(cat);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🪢 Hangman</span>
        <span className="text-sm text-muted-foreground">Wrong: {wrong}/7</span>
      </div>

      {/* Category selector */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {(["All", "Animals", "Countries", "Movies", "Tech"] as Category[]).map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => changeCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-display transition-colors ${
              category === cat
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-muted-foreground hover:bg-violet-700/40 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <HangmanSVG wrong={wrong} />

      {/* Word display */}
      <div className="flex gap-2">
        {word.split("").map((letter, i) => (
          <div key={`letter-${i}-${letter}`} className="flex flex-col items-center">
            <span className={`font-display text-2xl font-bold w-8 text-center ${guessed.has(letter) ? "text-foreground" : "text-transparent"}`}>
              {letter}
            </span>
            <div className="h-0.5 w-8 bg-zinc-500 mt-1" />
          </div>
        ))}
      </div>

      {phase === "won" && <p className="text-green-400 font-display text-xl animate-bounce">You won! 🎉</p>}
      {phase === "lost" && <p className="text-red-400 font-display text-xl">The word was: <span className="font-bold">{word}</span></p>}

      {/* Keyboard */}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
        {ALPHABET.map(letter => (
          <button
            key={letter}
            type="button"
            onClick={() => guess(letter)}
            disabled={guessed.has(letter) || phase !== "playing"}
            className={`w-9 h-9 rounded font-display font-bold text-sm transition-colors ${
              guessed.has(letter)
                ? word.includes(letter)
                  ? "bg-green-600 text-white"
                  : "bg-zinc-700 text-zinc-500"
                : "bg-zinc-800 hover:bg-violet-600 text-foreground"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {phase !== "playing" && (
        <button type="button" onClick={() => reset()} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-display transition-colors">
          New Game
        </button>
      )}
    </div>
  );
}
