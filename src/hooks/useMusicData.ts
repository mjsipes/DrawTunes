import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";
import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Hook that fetches and tracks the most recent drawing data for the current user.
 * Sets up realtime subscription to update when new drawings are created.
 * Returns the entire drawing data row or null if none exists.
 */
export function useMostRecentDrawing() {
    const user = useAuth();
    const supabase = createClient();
    const [mostRecentDrawing, setMostRecentDrawing] = useState<
        Tables<"drawings"> | null
    >(null);

    useEffect(() => {
        async function fetchMostRecentDrawing() {
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

            console.log("mostRecentDrawing: ", data);

            setMostRecentDrawing(
                data && data.length > 0 ? data[0] : null,
            );
        }

        fetchMostRecentDrawing();

        // Set up realtime subscription
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
                        console.log(
                            "drawing subscription triggered: ",
                            payload,
                        );
                        if (payload.new) {
                            setMostRecentDrawing(
                                payload.new as Tables<"drawings">,
                            );
                        }
                    },
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id]);

    return mostRecentDrawing;
}

/**
 * Hook that fetches and tracks song recommendations for a given drawing.
 * Sets up realtime subscription to update when new recommendations are added.
 * Returns an array of recommendations with associated song data.
 */
export function useRecommendations(activeDrawingId: string | null) {
    const supabase = createClient();
    const [recommendations, setRecommendations] = useState<any[]>([]);

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
                    `,
                )
                .eq("drawing_id", activeDrawingId);

            if (error) {
                console.error("Error fetching recommendations:", error);
                return;
            }
            console.log("fetched recommendations: ", data);

            setRecommendations(data.map((item: any) => ({
                id: item.id,
                drawing_id: item.drawing_id,
                song: item.songs,
            })));
        }

        fetchRecommendations();

        // Set up realtime subscription
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
                            console.log(
                                "recommendation subscription triggered: ",
                                payload,
                            );
                            fetchRecommendations(); // Refetch all recommendations when new one is added
                        }
                    },
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [activeDrawingId]);

    return { recommendations };
}
