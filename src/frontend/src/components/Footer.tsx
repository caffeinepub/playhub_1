import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-violet/10 py-8">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet/30 to-transparent" />
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 PlayHub. Built with{" "}
            <Heart className="inline w-3.5 h-3.5 text-violet-400 fill-violet-400 mx-0.5" />{" "}
            using{" "}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground text-xs tracking-wider font-display uppercase">
              Watch · Play · Win
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
