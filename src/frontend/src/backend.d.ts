import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Video {
    id: bigint;
    title: string;
    thumbnailUrl: string;
    description: string;
    category: string;
    youtubeUrl: string;
}
export interface backendInterface {
    addVideo(title: string, description: string, youtubeUrl: string, category: string, thumbnailUrl: string): Promise<void>;
    getAllCategories(): Promise<Array<string>>;
    getAllVideos(): Promise<Array<Video>>;
    getHighScore(gameName: string): Promise<bigint>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    saveHighScore(gameName: string, score: bigint): Promise<void>;
}
