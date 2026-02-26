import { useState } from "react";
import { Search, Filter, Video as VideoIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllVideos, useGetAllCategories } from "../hooks/useQueries";
import VideoCard from "../components/VideoCard";
import AddVideoDialog from "../components/AddVideoDialog";

export default function VideosTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: videos = [], isLoading: videosLoading } = useGetAllVideos();
  const { data: categories = [] } = useGetAllCategories();

  const allCategories = ["All", ...categories];

  const filteredVideos = videos.filter((v) => {
    const matchesCategory = activeCategory === "All" || v.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="space-y-6 animate-fade-in-up">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-700 gradient-text">Video Library</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {videos.length} video{videos.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <AddVideoDialog />
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos..."
          className="pl-10 input-premium bg-surface-1 border-violet/15 focus:border-violet/40"
        />
      </div>

      {/* Category filter pills */}
      {allCategories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`category-pill px-3 py-1 rounded-full text-xs font-display tracking-wide ${
                activeCategory === cat
                  ? "active text-foreground"
                  : "text-muted-foreground bg-surface-1"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {videosLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((id) => (
            <div key={id} className="rounded-xl overflow-hidden bg-surface-1 border border-violet/10">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video, i) => (
            <VideoCard key={String(video.id)} video={video} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <VideoIcon className="w-8 h-8 text-violet-400/50" />
          </div>
          <h3 className="font-display text-base text-muted-foreground mt-3">
            {searchQuery || activeCategory !== "All" ? "No videos match your filters" : "No videos yet"}
          </h3>
          <p className="text-muted-foreground/60 text-sm mt-1">
            {searchQuery || activeCategory !== "All"
              ? "Try adjusting your search or category filter."
              : "Add your first video to get started."}
          </p>
        </div>
      )}
    </section>
  );
}
