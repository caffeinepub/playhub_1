import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Video } from "../backend.d";

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<Video[]>({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Video[]>({
    queryKey: ["videos", "category", category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetAllCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      youtubeUrl: string;
      category: string;
      thumbnailUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addVideo(
        params.title,
        params.description,
        params.youtubeUrl,
        params.category,
        params.thumbnailUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useGetHighScore(gameName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["highscore", gameName],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return actor.getHighScore(gameName);
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!actor && !isFetching && !!gameName,
  });
}

export function useSaveHighScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { gameName: string; score: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveHighScore(params.gameName, params.score);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["highscore", vars.gameName] });
    },
  });
}
