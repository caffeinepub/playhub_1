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
export interface ChatMessage {
    id: bigint;
    userMessage: string;
    assistantResponse: string;
    timestamp: Time;
}
export type Time = bigint;
export interface backendInterface {
    addVideo(title: string, description: string, youtubeUrl: string, category: string, thumbnailUrl: string): Promise<void>;
    clearChatHistory(): Promise<void>;
    generateVideoFrames(_prompt: string): Promise<Array<string>>;
    getAllCategories(): Promise<Array<string>>;
    getAllVideos(): Promise<Array<Video>>;
    getChatHistory(): Promise<Array<ChatMessage>>;
    getHighScore(gameName: string): Promise<bigint>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    saveHighScore(gameName: string, score: bigint): Promise<void>;
    sendMessage(userMessage: string): Promise<string>;
}
