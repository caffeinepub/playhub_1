import { useState, useEffect, useCallback, useRef } from "react";
import {
  Film,
  Clapperboard,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ImagePlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useActor } from "../hooks/useActor";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────

const FRAME_DURATION_MS = 2500;

const EXAMPLE_PROMPTS = [
  "A rocket launching into space",
  "An underwater coral reef at dawn",
  "A city street in the rain at night",
  "A forest fire viewed from above",
];

// ─── Frame Icons ────────────────────────────────────────────────────────────

const FRAME_SCENE_ICONS = ["🌅", "🎬", "✨", "🌊", "🔥"];

const LOADER_STRIPS = ["a", "b", "c", "d", "e", "f", "g"] as const;

// ─── Cinematic Loader ────────────────────────────────────────────────────────

function CinematicLoader() {
  return (
    <div className="video-studio-loader">
      <div className="loader-inner">
        <div className="loader-film-icon">
          <Film className="w-10 h-10 text-violet-300 animate-pulse" />
        </div>
        <div className="loader-strip">
          {LOADER_STRIPS.map((id, i) => (
            <div
              key={id}
              className="loader-strip-frame"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
        <p className="loader-text">Generating your video…</p>
        <p className="loader-subtext">Composing cinematic frames</p>
      </div>
    </div>
  );
}

// ─── Frame Player ────────────────────────────────────────────────────────────

interface FramePlayerProps {
  frames: string[];
}

function FramePlayer({ frames }: FramePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToFrame = useCallback(
    (index: number) => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 250);
    },
    []
  );

  const goNext = useCallback(() => {
    goToFrame((currentIndex + 1) % frames.length);
  }, [currentIndex, frames.length, goToFrame]);

  const goPrev = useCallback(() => {
    goToFrame((currentIndex - 1 + frames.length) % frames.length);
  }, [currentIndex, frames.length, goToFrame]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(goNext, FRAME_DURATION_MS);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, goNext]);

  const progress = ((currentIndex + 1) / frames.length) * 100;
  const icon = FRAME_SCENE_ICONS[currentIndex] ?? "🎬";

  return (
    <div className="frame-player">
      {/* Main frame display */}
      <div className={`frame-display ${isTransitioning ? "frame-exit" : "frame-enter"}`}>
        {/* Frame number badge */}
        <div className="frame-number-badge">
          <Film className="w-3 h-3" />
          <span>Frame {currentIndex + 1} of {frames.length}</span>
        </div>

        {/* Scene icon */}
        <div className="frame-scene-icon">{icon}</div>

        {/* Scene description */}
        <p className="frame-scene-text">{frames[currentIndex]}</p>
      </div>

      {/* Progress bar */}
      <div className="frame-progress-area">
        <Progress value={progress} className="frame-progress-bar" />
        <div className="frame-dots">
          {frames.map((frame, i) => (
            <button
              key={frame}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                goToFrame(i);
              }}
              className={`frame-dot ${i === currentIndex ? "frame-dot-active" : ""}`}
              aria-label={`Go to frame ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="frame-controls">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          className="frame-control-btn"
          aria-label="Previous frame"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPlaying((p) => !p)}
          className="frame-control-btn frame-play-btn"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          className="frame-control-btn"
          aria-label="Next frame"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="video-studio-empty">
      <div className="empty-icon-wrap">
        <ImagePlay className="w-10 h-10 text-violet-300" />
      </div>
      <p className="empty-title">Your video will appear here</p>
      <p className="empty-subtitle">Enter a prompt above and hit Generate</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIVideoStudioTab() {
  const { actor, isFetching } = useActor();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<string[] | null>(null);
  const isActorReady = !!actor && !isFetching;

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating || !actor) return;

    setIsGenerating(true);
    setFrames(null);

    try {
      const result = await actor.generateVideoFrames(trimmed);
      if (result.length === 0) {
        toast.error("No frames were generated. Try a different prompt.");
      } else {
        setFrames(result);
      }
    } catch {
      toast.error("Failed to generate video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, actor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <section className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="video-studio-header-icon">
          <Clapperboard className="w-5 h-5 text-cyan-300" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-700 gradient-text">AI Video Studio</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Describe a scene and watch it come to life
          </p>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Try an example
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              className="suggestion-chip text-left"
              onClick={() => handleExampleClick(example)}
            >
              <span className="mr-1.5 opacity-60">🎬</span>
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Input + Generate */}
      <div className="video-studio-input-area">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. a dragon flying over snow-capped mountains at sunset"
          disabled={isGenerating || !isActorReady}
          rows={3}
          className="ai-chat-input resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-muted-foreground/40 text-[11px]">
            Press Enter to generate · Shift+Enter for new line
          </p>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !isActorReady}
            className="ai-send-button gap-2 px-5 h-10 w-auto"
          >
            {isGenerating ? (
              <>
                <Film className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Video Output Area */}
      <div className="video-studio-output">
        {isGenerating ? (
          <CinematicLoader />
        ) : frames && frames.length > 0 ? (
          <FramePlayer frames={frames} />
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
