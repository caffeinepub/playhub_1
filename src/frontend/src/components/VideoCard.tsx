import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Video } from "../backend.d";

interface VideoCardProps {
  video: Video;
  index: number;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoCard({ video, index }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const youtubeId = getYouTubeId(video.youtubeUrl);
  const thumbnailSrc = video.thumbnailUrl ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <article
      className={`video-card animate-fade-in-up ${staggerClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail area */}
      <div className="video-card-thumb">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-1">
            <Play className="w-10 h-10 text-violet-400/40" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300"
          style={{ opacity: isHovered ? 0.8 : 0.55 }}
        />

        {/* Play button */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? "scale(1)" : "scale(0.8)" }}
        >
          <div className="w-14 h-14 rounded-full bg-violet/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_oklch(var(--violet)/0.6)]">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="text-[10px] font-display tracking-wider uppercase bg-black/50 backdrop-blur-sm border-violet/30 text-violet-300"
          >
            {video.category}
          </Badge>
        </div>

        {/* External link */}
        {video.youtubeUrl && (
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 transition-all duration-200 hover:bg-violet/30 hover:border-violet/50"
            style={{ opacity: isHovered ? 1 : 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5 text-white/80" />
          </a>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-display text-sm font-600 leading-snug mb-1.5 text-foreground line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {video.description}
          </p>
        )}
      </div>

      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0 }}
      />
    </article>
  );
}
