import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";
import { useEffect } from "react";



// Create a cache for our resources
const resourceCache = new Map();

// Helper to create a resource
function createResource(asyncFn: () => Promise<any>) {
    let status = "pending";
    let result: any;
    let suspender = asyncFn().then(
        (r) => {
            status = "success";
            result = r;
        },
        (e) => {
            status = "error";
            result = e;
        },
    );

    return {
        read() {
            if (status === "pending") {
                throw suspender;
            } else if (status === "error") {
                throw result;
            } else if (status === "success") {
                return result;
            }
        },
    };
}

// Helper to get or create a resource
function getResource(key: string, asyncFn: () => Promise<any>) {
    if (!resourceCache.has(key)) {
        resourceCache.set(key, createResource(asyncFn));
    }
    return resourceCache.get(key);
}

export function useMostRecentDrawing() {
    const user = useAuth();
    const supabase = createClient();

    const resource = getResource(
        `mostRecentDrawing-${user?.id}`,
        async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from("drawings")
                .select("drawing_id, ai_message")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            if (error) {
                console.error("Error fetching most recent drawing:", error);
                return null;
            }

            return data && data.length > 0 ? data[0].drawing_id : null;
        },
    );

    // Set up realtime subscription
    useEffect(() => {
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
                            // Invalidate the cache when new data arrives
                            resourceCache.delete(
                                `mostRecentDrawing-${user.id}`,
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

    return resource.read();
}

export function useRecommendations(activeDrawingId: string | null) {
    const supabase = createClient();

    const resource = getResource(
        `recommendations-${activeDrawingId}`,
        async () => {
            if (!activeDrawingId) return [];

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
                return [];
            }

            return data.map((item: any) => ({
                id: item.id,
                drawing_id: item.drawing_id,
                song: item.songs,
            }));
        },
    );

    // Set up realtime subscription
    useEffect(() => {
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
                    () => {
                        // Invalidate the cache when new data arrives
                        resourceCache.delete(
                            `recommendations-${activeDrawingId}`,
                        );
                    },
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [activeDrawingId]);

    return { recommendations: resource.read() };
}
