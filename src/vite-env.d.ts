/// <reference types="vite/client" />
import type { RecommendationWithSong } from "./contexts/CurrentDrawingContext";

interface SharedAudioState {
  audioElement: HTMLAudioElement | null;
  progressInterval: NodeJS.Timeout | null;
  currentUrl: string;
  currentTime: number;
  isPlaying: boolean;
  progress: number;
}

interface SharedMusicContext {
  recommendations: RecommendationWithSong[];
}

declare global {
  interface Window {
    sharedAudioState?: SharedAudioState;
    sharedMusicContext?: SharedMusicContext;
  }
}
