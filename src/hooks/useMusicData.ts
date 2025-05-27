import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";
import { useEffect, useState } from "react";

export function useMostRecentDrawing() {
    const user = useAuth();
    const supabase = createClient();
    const [mostRecentDrawing, setMostRecentDrawing] = useState<string | null>(
        null,
    );

    useEffect(() => {
        async function fetchMostRecentDrawing() {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from("drawings")
                .select("drawing_id, ai_message")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            if (error) {
                console.error("Error fetching most recent drawing:", error);
                return;
            }

            setMostRecentDrawing(
                data && data.length > 0 ? data[0].drawing_id : null,
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
                        if (payload.new && payload.new.drawing_id) {
                            setMostRecentDrawing(payload.new.drawing_id);
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
