// Global type definitions for the application

// iTunes API track type
interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl?: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
}

// Music recommendation type with song data
interface RecommendationWithSong {
  id: string;
  drawing_id: string | null;
  song: {
    id: string;
    full_track_data: iTunesTrack;
    last_updated: string | null;
  };
}

// Audio state shared across components
interface SharedAudioState {
  audioElement: HTMLAudioElement | null;
  progressInterval: NodeJS.Timeout | null;
  currentUrl: string;
  currentTime: number;
  isPlaying: boolean;
  progress: number;
}

// Music context shared across components
interface SharedMusicContext {
  recommendations: RecommendationWithSong[];
}

// Extend Window interface to include our shared state
interface Window {
  sharedAudioState?: SharedAudioState;
  sharedMusicContext?: SharedMusicContext;
}
