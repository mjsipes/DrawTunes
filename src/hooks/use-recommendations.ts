import { useEffect, useRef } from 'react';
import { createClient } from "@/lib/supabase/client";
import type {RecommendationWithSong} from "@/contexts/CurrentDrawingContext"

const supabase = createClient();

export async function fetchRecommendations(
  drawingId: string,
  setRecommendations: (recs: RecommendationWithSong[]) => void
) {
  console.log("fetchRecommendations:");
  console.log("fetching recs for drawing id:", drawingId);
  
  const { data, error } = await supabase
    .from("recommendations")
    .select(`
      id,
      drawing_id,
      songs!inner (
        id, 
        full_track_data,
        last_updated
      )
    `)
    .eq("drawing_id", drawingId);

  if (error) {
    console.log("error fetching recommendations: ", error);
    return;
  }

  console.log("fetched recommendations: ", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log("No recommendations data found");
    setRecommendations([]);
    return;
  }

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

export function useRecommendations(
  currentDrawing: { drawing_id: string | null } | null,
  setRecommendations: (recs: RecommendationWithSong[]) => void
) {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentDrawing?.drawing_id) return;
    
    fetchRecommendations(currentDrawing.drawing_id, setRecommendations);

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
              if (currentDrawing.drawing_id) {
                fetchRecommendations(currentDrawing.drawing_id, setRecommendations);
              }
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
  }, [currentDrawing]);
}