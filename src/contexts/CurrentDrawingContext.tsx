import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/database.types";

// Window interface extended in vite-env.d.ts

// Type definitions moved to vite-env.d.ts

interface MusicContextType {
  currentDrawing: Tables<"drawings"> | null;
  clearCurrentDrawing: () => void;
  recommendations: RecommendationWithSong[];
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

  const clearCurrentDrawing = () => {
    console.log("currentDrawing cleared");
    setCurrentDrawing(null);
    setRecommendations([]);

    // Update shared music context
    if (!window.sharedMusicContext) {
      window.sharedMusicContext = { recommendations: [] };
    } else {
      window.sharedMusicContext.recommendations = [];
    }

    // Also clear audio state when clearing the drawing
    if (window.sharedAudioState) {
      if (window.sharedAudioState.audioElement) {
        window.sharedAudioState.audioElement.pause();
        window.sharedAudioState.audioElement = null;
      }
      if (window.sharedAudioState.progressInterval) {
        clearInterval(window.sharedAudioState.progressInterval);
        window.sharedAudioState.progressInterval = null;
      }
      window.sharedAudioState.isPlaying = false;
      window.sharedAudioState.currentUrl = "";
      window.sharedAudioState.currentTime = 0;
      window.sharedAudioState.progress = 0;
    }
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

      // Debug the query
      console.log(
        "Querying recommendations for drawing ID:",
        currentDrawing.drawing_id
      );

      // Try to query without specifying the foreign key column
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

      // Normalize data structure for consistent format
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

      // Update the shared music context
      if (!window.sharedMusicContext) {
        window.sharedMusicContext = { recommendations: normalizedData };
      } else {
        window.sharedMusicContext.recommendations = normalizedData;
      }
    }

    fetchRecommendations();

    if (currentDrawing?.drawing_id) {
      // Debug the shape of the data
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

  return (
    <MusicContext.Provider
      value={{
        currentDrawing,
        clearCurrentDrawing,
        recommendations,
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
