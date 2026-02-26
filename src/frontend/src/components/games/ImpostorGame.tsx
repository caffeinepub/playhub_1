import { useCallback, useState } from "react";

const NAMES = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];
const COLORS = ["🔴", "🔵", "🟢", "🟡", "🟣"];

type Crewmate = {
  name: string;
  color: string;
  taskSpeed: number;
  movement: string;
  reportedBodies: number;
  isImpostor: boolean;
};

function generateRound(): Crewmate[] {
  const impostorIdx = Math.floor(Math.random() * 5);
  return NAMES.map((name, i) => {
    const isImpostor = i === impostorIdx;
    return {
      name,
      color: COLORS[i],
      taskSpeed: isImpostor ? Math.floor(Math.random() * 30) : 60 + Math.floor(Math.random() * 40),
      movement: isImpostor
        ? ["Erratic", "Suspicious", "Wandering"][Math.floor(Math.random() * 3)]
        : ["Efficient", "Steady", "Normal"][Math.floor(Math.random() * 3)],
      reportedBodies: isImpostor ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2),
      isImpostor,
    };
  });
}

export default function ImpostorGame() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [round, setRound] = useState(1);
  const [crewmates, setCrewmates] = useState<Crewmate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<{ name: string; correct: boolean; impostor: string }[]>([]);
  const [revealed, setRevealed] = useState(false);

  const startGame = useCallback(() => {
    setRound(1);
    setScore(0);
    setHistory([]);
    setSelected(null);
    setRevealed(false);
    setCrewmates(generateRound());
    setPhase("playing");
  }, []);

  const submitGuess = useCallback(() => {
    if (!selected || revealed) return;
    const impostor = crewmates.find(c => c.isImpostor)!;
    const correct = selected === impostor.name;
    if (correct) setScore(s => s + 10);
    setHistory(h => [...h, { name: selected, correct, impostor: impostor.name }]);
    setRevealed(true);
  }, [selected, revealed, crewmates]);

  const nextRound = useCallback(() => {
    if (round >= 10) { setPhase("done"); return; }
    setRound(r => r + 1);
    setSelected(null);
    setRevealed(false);
    setCrewmates(generateRound());
  }, [round]);

  const impostor = crewmates.find(c => c.isImpostor);

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-cyan-300 text-lg">🔍 Impostor</span>
        {phase === "playing" && (
          <div className="flex gap-4">
            <span className="font-mono text-cyan-200 text-sm">Round {round}/10</span>
            <span className="font-mono text-green-300 text-sm">Score: {score}</span>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="text-center space-y-4 py-8">
          <p className="text-muted-foreground max-w-xs text-sm">Analyze 5 crewmates' stats and deduce who the impostor is. 10 rounds!</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
            Start Investigation
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full space-y-3">
          <p className="text-muted-foreground text-xs text-center">Analyze the stats — who is acting suspicious?</p>
          <div className="grid grid-cols-1 gap-2">
            {crewmates.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => !revealed && setSelected(c.name)}
                disabled={revealed}
                className={`p-3 rounded-lg border transition-all text-left ${
                  revealed && c.isImpostor
                    ? "border-red-500 bg-red-500/20"
                    : selected === c.name
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-zinc-700 bg-zinc-900 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-foreground">{c.color} {c.name}</span>
                  {revealed && c.isImpostor && <span className="text-red-400 text-xs font-bold">IMPOSTOR!</span>}
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Task speed: <span className="text-foreground">{c.taskSpeed}%</span></span>
                  <span>Movement: <span className="text-foreground">{c.movement}</span></span>
                  <span>Reports: <span className="text-foreground">{c.reportedBodies}</span></span>
                </div>
              </button>
            ))}
          </div>

          {!revealed ? (
            <button
              type="button"
              onClick={submitGuess}
              disabled={!selected}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-display transition-colors"
            >
              {selected ? `Vote out ${selected}` : "Select a suspect"}
            </button>
          ) : (
            <div className="space-y-2">
              <p className={`text-center font-display text-lg ${history[history.length - 1]?.correct ? "text-green-400" : "text-red-400"}`}>
                {history[history.length - 1]?.correct ? "✓ Correct! +10 points" : `✗ Wrong! It was ${impostor?.name}`}
              </p>
              <button type="button" onClick={nextRound} className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-display transition-colors">
                {round < 10 ? "Next Round →" : "See Results"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-3 py-4">
          <p className="text-cyan-300 font-display text-2xl">Investigation Complete!</p>
          <p className="text-foreground text-xl">Score: <span className="text-green-400 font-bold">{score}/100</span></p>
          <p className="text-muted-foreground text-sm">Correct: {history.filter(h => h.correct).length}/10 rounds</p>
          <button type="button" onClick={startGame} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-display transition-colors">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
