import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/database.types";

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

      console.log("Raw recommendation data:", data);

      // Process the data and handle both array and single object scenarios
      const processedData = data
        .map((item) => {
          // Make sure songs exists and has the expected structure
          if (!item.songs) {
            console.warn("Item missing songs data:", item);
            return null;
          }

          const song = Array.isArray(item.songs) ? item.songs[0] : item.songs;

          return {
            id: item.id,
            drawing_id: item.drawing_id,
            song: song,
          };
        })
        .filter(Boolean) as RecommendationWithSong[];

      console.log("Processed recommendations:", processedData);
      setRecommendations(processedData);
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
