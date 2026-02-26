import { useState } from "react";
import { Plus, Loader2, Link, Tag, FileText, Film } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAddVideo } from "../hooks/useQueries";

export default function AddVideoDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    category: "",
    thumbnailUrl: "",
  });

  const addVideo = useAddVideo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.youtubeUrl || !form.category) {
      toast.error("Title, YouTube URL and category are required.");
      return;
    }
    try {
      await addVideo.mutateAsync(form);
      toast.success("Video added successfully!");
      setOpen(false);
      setForm({ title: "", description: "", youtubeUrl: "", category: "", thumbnailUrl: "" });
    } catch {
      toast.error("Failed to add video. Please try again.");
    }
  };

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-display font-600 tracking-wide">
          <Plus className="w-4 h-4" />
          Add Video
        </button>
      </DialogTrigger>
      <DialogContent className="dialog-premium sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg gradient-text">Add New Video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Film className="w-3 h-3" /> Title *
            </Label>
            <Input
              value={form.title}
              onChange={handleChange("title")}
              placeholder="Enter video title..."
              className="input-premium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Link className="w-3 h-3" /> YouTube URL *
            </Label>
            <Input
              value={form.youtubeUrl}
              onChange={handleChange("youtubeUrl")}
              placeholder="https://youtube.com/watch?v=..."
              className="input-premium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Category *
            </Label>
            <Input
              value={form.category}
              onChange={handleChange("category")}
              placeholder="e.g. Music, Gaming, Tech..."
              className="input-premium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Link className="w-3 h-3" /> Thumbnail URL
            </Label>
            <Input
              value={form.thumbnailUrl}
              onChange={handleChange("thumbnailUrl")}
              placeholder="https://... (optional)"
              className="input-premium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Description
            </Label>
            <Textarea
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Brief description..."
              className="input-premium resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={addVideo.isPending}
              className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-display font-600 tracking-wide disabled:opacity-50"
            >
              {addVideo.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {addVideo.isPending ? "Adding..." : "Add Video"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
