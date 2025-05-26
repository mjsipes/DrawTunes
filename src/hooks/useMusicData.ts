import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";

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

interface Song {
    id: string;
    full_track_data: iTunesTrack;
    last_updated: string;
}

interface Recommendation {
    id: string;
    drawing_id: string;
    song: Song;
}

export function useMostRecentDrawing() {
    const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
    const user = useAuth();
    const supabase = createClient();

    useEffect(() => {
        const fetchMostRecentDrawing = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from("drawings")
                    .select("drawing_id, ai_message")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (error) {
                    console.error("Error fetching most recent drawing:", error);
                } else if (data && data.length > 0) {
                    setActiveDrawingId(data[0].drawing_id);
                    console.log(data[0].ai_message);
                }
            } catch (err) {
                console.error("Error in fetchMostRecentDrawing:", err);
            }
        };

        fetchMostRecentDrawing();

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
                        console.log("New drawing inserted:", payload);
                        if (payload.new && payload.new.drawing_id) {
                            setActiveDrawingId(payload.new.drawing_id);
                        }
                    },
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id]);

    return activeDrawingId;
}

export function useRecommendations(activeDrawingId: string | null) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>(
        [],
    );
    const supabase = createClient();

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!activeDrawingId) return;

            try {
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
                } else if (data) {
                    console.log(
                        "Fetched recommendations for drawing:",
                        activeDrawingId,
                        data,
                    );
                    const formattedRecommendations: Recommendation[] = data.map(
                        (item: any) => ({
                            id: item.id,
                            drawing_id: item.drawing_id,
                            song: item.songs,
                        }),
                    );

                    setRecommendations(formattedRecommendations);
                }
            } catch (err) {
                console.error("Error in fetchRecommendations:", err);
            }
        };

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
                        console.log("New recommendation received:", payload);
                        fetchRecommendations();
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
