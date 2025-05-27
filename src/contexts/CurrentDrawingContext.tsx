import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/database.types";

interface CurrentDrawingContextType {
  currentDrawing: Tables<"drawings"> | null;
  clearCurrentDrawing: () => void;
}

const CurrentDrawingContext = createContext<
  CurrentDrawingContextType | undefined
>(undefined);

export function CurrentDrawingProvider({ children }: { children: ReactNode }) {
  const user = useAuth();
  const supabase = createClient();
  const [currentDrawing, setCurrentDrawing] =
    useState<Tables<"drawings"> | null>(null);

  const clearCurrentDrawing = () => {
    console.log("currentDrawing cleared");
    setCurrentDrawing(null);
    window.dispatchEvent(new CustomEvent("clearRecommendations"));
  };

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

  return (
    <CurrentDrawingContext.Provider
      value={{
        currentDrawing,
        clearCurrentDrawing,
      }}
    >
      {children}
    </CurrentDrawingContext.Provider>
  );
}

export function useCurrentDrawing() {
  const context = useContext(CurrentDrawingContext);
  if (context === undefined) {
    throw new Error(
      "useCurrentDrawing must be used within a CurrentDrawingProvider"
    );
  }
  return context;
}

export function useRecommendations(activeDrawingId: string | null) {
  const supabase = createClient();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!activeDrawingId) return;

      const { data, error } = await supabase
        .from("recommendations")
        .select(
          `
          id,
          drawing_id,
          songs:song_id (
            id,
            full_track_data,
            last_updated
          )
          `
        )
        .eq("drawing_id", activeDrawingId);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }
      console.log("fetched recommendations: ", data);

      setRecommendations(
        data.map((item: any) => ({
          id: item.id,
          drawing_id: item.drawing_id,
          song: item.songs,
        }))
      );
    }

    fetchRecommendations();

    if (activeDrawingId) {
      const channel = supabase
        .channel("recommendations-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "recommendations",
            filter: `drawing_id=eq.${activeDrawingId}`,
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
  }, [activeDrawingId]);

  useEffect(() => {
    const handleClearRecommendations = () => {
      setRecommendations([]);
    };

    window.addEventListener("clearRecommendations", handleClearRecommendations);
    return () => {
      window.removeEventListener(
        "clearRecommendations",
        handleClearRecommendations
      );
    };
  }, []);

  useEffect(() => {
    if (!activeDrawingId) {
      setRecommendations([]);
    }
  }, [activeDrawingId]);

  return { recommendations };
}
