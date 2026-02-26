import { Gamepad2, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="relative z-20 border-b border-violet/10">
      {/* Thin gradient line at very top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet/30 to-cyan/20 border border-violet/30 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 rounded-xl blur-md bg-violet/20 -z-10" />
            </div>
            <div>
              <h1 className="font-display text-xl font-700 tracking-tight leading-none gradient-text">
                PlayHub
              </h1>
              <p className="text-muted-foreground text-[10px] tracking-widest uppercase font-500 mt-0.5">
                Watch · Play
              </p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet/10 border border-violet/20">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-xs font-display text-cyan-300 tracking-wide">LIVE ON ICP</span>
          </div>
        </div>
      </div>
    </header>
  );
}
