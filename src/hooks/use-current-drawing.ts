// use-current-drawing.ts
import { useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useMusicStore } from "@/stores/music-store";
import type { Tables } from "@/lib/supabase/database.types";

const supabase = createClient();

export async function fetchCurrentDrawing(
  userId: string,
  setCurrentDrawing: (drawing: Tables<"drawings"> | null) => void
) {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching most recent drawing:", error);
    return;
  }

  console.log("currentDrawing: ", data);
  setCurrentDrawing(data && data.length > 0 ? data[0] : null);
}

export function useCurrentDrawing() {
  const user = useAuth();
  const setCurrentDrawing = useMusicStore(state => state.setCurrentDrawing);
  const setAllDrawings = useMusicStore(state => state.setAllDrawings);

  useEffect(() => {
    if (!user?.id) return;

    fetchCurrentDrawing(user.id, setCurrentDrawing);

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
            const newDrawing = payload.new as Tables<"drawings">;
            setCurrentDrawing(newDrawing);
            setAllDrawings((prev) => [newDrawing, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, setCurrentDrawing, setAllDrawings]);
}