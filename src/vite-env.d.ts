/// <reference types="vite/client" />

interface SharedAudioState {
  audioElement: HTMLAudioElement | null;
  progressInterval: NodeJS.Timeout | null;
  currentUrl: string;
  currentTime: number;
  isPlaying: boolean;
  progress: number;
}

interface SharedMusicContext {
  recommendations: any[];
}

declare global {
  interface Window {
    sharedAudioState?: SharedAudioState;
    sharedMusicContext?: SharedMusicContext;
  }
}
