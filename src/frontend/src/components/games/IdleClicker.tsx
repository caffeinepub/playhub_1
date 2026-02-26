import { useEffect, useRef, useState } from "react";

type Upgrade = { id: string; name: string; desc: string; cost: number; owned: number; cps: number; multiplier: number };

const BASE_UPGRADES: Omit<Upgrade, "owned">[] = [
  { id: "auto", name: "Auto Clicker", desc: "+1 coin/sec", cost: 15, cps: 1, multiplier: 1 },
  { id: "double", name: "Double Click", desc: "×2 per click", cost: 100, cps: 0, multiplier: 2 },
  { id: "mega", name: "Mega Click", desc: "+10 coins/sec", cost: 500, cps: 10, multiplier: 1 },
  { id: "factory", name: "Coin Factory", desc: "+50 coins/sec", cost: 2000, cps: 50, multiplier: 1 },
  { id: "bank", name: "Gold Bank", desc: "+200 coins/sec", cost: 8000, cps: 200, multiplier: 1 },
];

export default function IdleClicker() {
  const [coins, setCoins] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(
    BASE_UPGRADES.map(u => ({ ...u, owned: 0 }))
  );
  const coinsRef = useRef(0);
  const upgradesRef = useRef(upgrades);

  useEffect(() => { upgradesRef.current = upgrades; }, [upgrades]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);

  const clickValue = upgrades
    .filter(u => u.multiplier > 1)
    .reduce((acc, u) => acc * (u.multiplier ** u.owned), 1);

  const cps = upgrades.reduce((acc, u) => acc + u.cps * u.owned, 0) * clickValue;

  useEffect(() => {
    const interval = setInterval(() => {
      const earned = upgradesRef.current.reduce((acc, u) => acc + u.cps * u.owned, 0) *
        upgradesRef.current.filter(u => u.multiplier > 1).reduce((acc, u) => acc * (u.multiplier ** u.owned), 1) / 10;
      if (earned > 0) {
        setCoins(c => c + earned);
        setTotalEarned(t => t + earned);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setCoins(c => c + clickValue);
    setTotalEarned(t => t + clickValue);
  };

  const buyUpgrade = (id: string) => {
    const up = upgrades.find(u => u.id === id);
    if (!up || coinsRef.current < up.cost * (up.owned + 1)) return;
    const actualCost = up.cost * (up.owned + 1);
    setCoins(c => c - actualCost);
    setUpgrades(prev => prev.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u));
  };

  const fmt = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return Math.floor(n).toString();
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="font-display text-violet-300 text-lg">🍪 Idle Clicker</span>
        <span className="font-mono text-yellow-300 text-sm">{fmt(cps)} CPS</span>
      </div>

      <div className="text-center">
        <div className="font-display text-4xl text-yellow-300 mb-1">{fmt(coins)} 🪙</div>
        <div className="text-muted-foreground text-xs">Total earned: {fmt(totalEarned)}</div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="w-36 h-36 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 active:scale-95 transition-all shadow-lg shadow-yellow-500/30 text-6xl"
        title="Click to earn coins"
      >
        🍪
      </button>
      <p className="text-yellow-400 text-sm font-display">+{fmt(clickValue)} per click</p>

      <div className="w-full space-y-2">
        <h3 className="font-display text-violet-300 text-sm uppercase tracking-widest">Upgrades</h3>
        {upgrades.map(u => {
          const cost = u.cost * (u.owned + 1);
          const canAfford = coins >= cost;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => buyUpgrade(u.id)}
              disabled={!canAfford}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                canAfford
                  ? "border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20 cursor-pointer"
                  : "border-zinc-700 bg-zinc-900/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div>
                <div className="font-display text-sm text-foreground">{u.name} <span className="text-zinc-500 text-xs">×{u.owned}</span></div>
                <div className="text-muted-foreground text-xs">{u.desc}</div>
              </div>
              <div className="font-mono text-yellow-300 text-sm">{fmt(cost)} 🪙</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
