import { useCallback, useEffect, useRef, useState } from "react";

const DICT = new Set([
  "CAT","DOG","RUN","SUN","BIG","HAT","BAT","RAT","MAT","SAT","FAT","PAT","TAP",
  "MAP","CAP","NAP","LAP","CUP","PUP","PUG","BUG","RUG","MUG","JUG","TUG","DUG",
  "CUT","BUT","HUT","NUT","GUT","HOP","TOP","MOP","POP","COP","HOP","LOT","DOT",
  "COT","HOT","POT","ROT","NOT","GOT","BOT","JOT","TIP","SIP","DIP","HIP","LIP",
  "RIP","ZIP","FIG","PIG","BIG","DIG","GIG","RIG","WIG","JIG","BIT","FIT","HIT",
  "KIT","PIT","SIT","WIT","BOX","FOX","BAN","CAN","FAN","MAN","PAN","RAN","TAN",
  "VAN","BED","FED","LED","RED","TED","WED","GEL","HEN","PEN","TEN","DEN","BET",
  "GET","JET","LET","MET","NET","PET","SET","VET","WET","AGE","APE","ATE","AWE",
  "AXE","EAR","EAT","ICE","OAK","OAR","ODD","ODE","OPT","OWE","OWL","OWN",
  "BEAR","BEER","BEEF","BEEN","BELT","BEST","BIRD","BOAT","BOLD","BONE","BORE",
  "BORN","BOTH","BUCK","BURN","CALL","CAME","CAPE","CARD","CARE","CART","CASE",
  "CASH","CAST","CAVE","CHAT","CHIP","CITY","CLAM","CLAP","CLAY","CLIP","CLUB",
  "COAL","COAT","CODE","COIL","COIN","COLD","COME","COOK","COOL","COPE","CORD",
  "CORK","CORN","COST","COZY","CRAB","CREW","CROP","CURE","CURL","DARE","DARK",
  "DART","DATA","DATE","DAWN","DAYS","DEAD","DEAF","DEAL","DEAR","DEBT","DECK",
  "DEED","DEEP","DEER","DEFT","DENY","DESK","DINE","DIRT","DISC","DISH","DISK",
  "DOCK","DOES","DOME","DONE","DOOM","DOOR","DOSE","DOVE","DOWN","DRAG","DRAW",
  "DRIP","DROP","DRUM","DUAL","DUEL","DUNG","DUSK","DUST","DUTY","EACH","EARL",
  "EARN","EASE","EAST","EDGE","EMIT","EPIC","EVEN","EVER","EVIL","EXAM","FACE",
]);

const FREQ = "ETAOINSHRDLCUMWFGYPBVKJXQZ";

function genBoard(): string[][] {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => FREQ[Math.floor(Math.pow(Math.random(), 2) * 16)])
  );
}

function adjacent(r1: number, c1: number, r2: number, c2: number) {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
}

function validateWord(word: string, board: string[][]): boolean {
  if (word.length < 3 || !DICT.has(word)) return false;
  const letters = word.split("");
  const tryPath = (idx: number, used: Set<string>, lastR: number, lastC: number): boolean => {
    if (idx === letters.length) return true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const key = `${r},${c}`;
        if (!used.has(key) && board[r][c] === letters[idx] && (idx === 0 || adjacent(lastR, lastC, r, c))) {
          used.add(key);
          if (tryPath(idx + 1, used, r, c)) return true;
          used.delete(key);
        }
      }
    }
    return false;
  };
  return tryPath(0, new Set(), -1, -1);
}

export default function BoggleGame() {
  const [board] = useState(genBoard);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = () => {
    setFound([]);
    setScore(0);
    setTimeLeft(90);
    setInput("");
    setFeedback("");
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setPhase("done"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const submitWord = useCallback(() => {
    const word = input.toUpperCase().trim();
    if (word.length < 3) { setFeedback("Too short"); setInput(""); return; }
    if (found.includes(word)) { setFeedback("Already found!"); setInput(""); return; }
    if (!validateWord(word, board)) { setFeedback("Invalid or not on board"); setInput(""); return; }
    const pts = word.length <= 4 ? 1 : word.length <= 6 ? 2 : 3;
    setFound(f => [...f, word]);
    setScore(s => s + pts);
    setFeedback(`+${pts} points!`);
    setInput("");
  }, [input, found, board]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submitWord();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🔤 Boggle</span>
        {phase === "playing" && <span className="font-mono text-yellow-300">⏱ {timeLeft}s | Score: {score}</span>}
      </div>

      {/* Board */}
      <div className="grid grid-cols-4 gap-2">
        {board.map((row, ri) =>
          row.map((letter, ci) => (
            <div
              key={`bg-${ri * 4 + ci}-${letter}`}
              className="w-14 h-14 flex items-center justify-center bg-zinc-800 border border-cyan-500/30 rounded-lg font-display text-2xl font-bold text-cyan-300"
            >
              {letter}
            </div>
          ))
        )}
      </div>

      {phase === "idle" && (
        <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
          Start Game
        </button>
      )}

      {phase === "playing" && (
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-zinc-800 border border-cyan-500/40 rounded-lg px-3 py-2 text-foreground font-display uppercase tracking-widest focus:outline-none focus:border-cyan-400"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              placeholder="Type a word..."
              maxLength={16}

            />
            <button type="button" onClick={submitWord} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display">
              Submit
            </button>
          </div>
          {feedback && <p className={`text-sm text-center ${feedback.startsWith("+") ? "text-green-400" : "text-red-400"}`}>{feedback}</p>}
          <div className="flex flex-wrap gap-1">
            {found.map(w => (
              <span key={w} className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">{w}</span>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-cyan-300 font-display text-2xl">Time's Up!</p>
          <p className="text-foreground">Words found: {found.length} | Score: <span className="text-green-400 font-bold">{score}</span></p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
