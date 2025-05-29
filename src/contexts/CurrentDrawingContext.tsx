import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/database.types";

interface AudioState {
  currentSongIndex: number | null;
  isPlaying: boolean;
  progress: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  progressIntervalRef: React.RefObject<NodeJS.Timeout | undefined>;
}

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

interface RecommendationWithSong {
  id: string;
  drawing_id: string | null;
  song: {
    id: string;
    full_track_data: iTunesTrack;
    last_updated: string | null;
  };
}

interface MusicContextType {
  currentDrawing: Tables<"drawings"> | null;
  clearCurrentDrawing: () => void;
  recommendations: RecommendationWithSong[];
  // Audio state and controls
  audioState: AudioState;
  playAudio: (songIndex: number) => void;
  togglePlayPause: () => void;
  skipToNext: () => void;
  setProgress: (progress: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const user = useAuth();
  const supabase = createClient();
  const [currentDrawing, setCurrentDrawing] =
    useState<Tables<"drawings"> | null>(null);
  const [recommendations, setRecommendations] = useState<
    RecommendationWithSong[]
  >([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Audio state
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const audioState: AudioState = {
    currentSongIndex,
    isPlaying,
    progress,
    audioRef,
    progressIntervalRef,
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const value =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(value) ? 0 : value);
      }
    }, 500);
  };

  const playAudio = async (songIndex: number) => {
    const song = recommendations[songIndex]?.song?.full_track_data;
    if (!song?.previewUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(song.previewUrl);
    setCurrentSongIndex(songIndex);
    setProgress(0);

    audioRef.current.addEventListener("ended", skipToNext);
    audioRef.current.addEventListener("error", skipToNext);

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      startProgressTracking();
    } catch (err) {
      console.error("Playback failed:", err);
      skipToNext();
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) {
      if (currentSongIndex !== null) {
        playAudio(currentSongIndex);
      } else if (recommendations.length > 0) {
        playAudio(0);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else {
      audioRef.current.play();
      startProgressTracking();
    }
    setIsPlaying(!isPlaying);
  };

  const skipToNext = () => {
    const nextIndex = currentSongIndex !== null ? currentSongIndex + 1 : 0;
    if (nextIndex >= recommendations.length) {
      playAudio(0);
    } else {
      playAudio(nextIndex);
    }
  };

  const clearCurrentDrawing = () => {
    console.log("currentDrawing cleared");
    setCurrentDrawing(null);
    setRecommendations([]);

    // Clear audio state
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
    setCurrentSongIndex(null);
    setIsPlaying(false);
    setProgress(0);
  };

  // Fetch current drawing
  useEffect(() => {
    async function fetchCurrentDrawing() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching most recent drawing:", error);
        return;
      }

      console.log("currentDrawing: ", data);
      setCurrentDrawing(data && data.length > 0 ? data[0] : null);
    }

    fetchCurrentDrawing();

    if (user?.id) {
      const channel = supabase
        .channel("drawings-latest-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "drawings",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("drawing subscription triggered: ", payload);
            if (payload.new) {
              setCurrentDrawing(payload.new as Tables<"drawings">);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  // Fetch recommendations when drawing changes
  useEffect(() => {
    async function fetchRecommendations() {
      if (!currentDrawing?.drawing_id) return;

      console.log(
        "Querying recommendations for drawing ID:",
        currentDrawing.drawing_id
      );

      const { data, error } = await supabase
        .from("recommendations")
        .select(
          `
          id,
          drawing_id,
          songs!inner (
            id, 
            full_track_data,
            last_updated
          )
        `
        )
        .eq("drawing_id", currentDrawing.drawing_id);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }
      console.log("fetched recommendations: ", data);

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log("No recommendations data found");
        setRecommendations([]);
        return;
      }

      console.log("Recommendations data:", data);

      const normalizedData = data
        .map((item) => {
          if (!item.songs) {
            console.warn("Item missing songs data:", item);
            return null;
          }

          return {
            id: item.id,
            drawing_id: item.drawing_id,
            song: Array.isArray(item.songs) ? item.songs[0] : item.songs,
          };
        })
        .filter(Boolean) as RecommendationWithSong[];

      setRecommendations(normalizedData);
    }

    fetchRecommendations();

    if (currentDrawing?.drawing_id) {
      console.log("Current drawing:", currentDrawing);

      const channel = supabase
        .channel("recommendations-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "recommendations",
            filter: `drawing_id=eq.${currentDrawing.drawing_id}`,
          },
          (payload) => {
            if (payload.new) {
              console.log("recommendation subscription triggered: ", payload);
              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }
              debounceTimer.current = setTimeout(() => {
                fetchRecommendations();
              }, 500);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [currentDrawing?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentDrawing,
        clearCurrentDrawing,
        recommendations,
        audioState,
        playAudio,
        togglePlayPause,
        skipToNext,
        setProgress,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
