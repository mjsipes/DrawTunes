import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";
import Loading from "@/components/output/loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MusicRecommendations() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const user = useAuth();

  const supabase = createClient();

  // Fetch most recent drawing ID whenever user changes
  useEffect(() => {
    const fetchMostRecentDrawing = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("drawings")
          .select("drawing_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching most recent drawing:", error);
        } else if (data && data.length > 0) {
          setActiveDrawingId(data[0].drawing_id);
        }
      } catch (err) {
        console.error("Error in fetchMostRecentDrawing:", err);
      }
    };

    fetchMostRecentDrawing();

    // Subscribe to changes in the drawings table for this user
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
            // Set the active drawing ID to the newly inserted one
            if (payload.new && payload.new.drawing_id) {
              setActiveDrawingId(payload.new.drawing_id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  // Fetch recommendations for the active drawing
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!activeDrawingId) return;

      setLoading(true);

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
          `
          )
          .eq("drawing_id", activeDrawingId);

        if (error) {
          console.error("Error fetching recommendations:", error);
        } else if (data) {
          console.log(
            "Fetched recommendations for drawing:",
            activeDrawingId,
            data
          );
          // Transform data to match expected format
          const formattedRecommendations = data.map((item) => ({
            id: item.id,
            drawing_id: item.drawing_id,
            song: item.songs,
          }));

          setRecommendations(formattedRecommendations);
        }
      } catch (err) {
        console.error("Error in fetchRecommendations:", err);
      }

      setLoading(false);
    };

    fetchRecommendations();

    // Subscribe to new recommendations for this drawing
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
            // Fetch updated recommendations for this drawing
            fetchRecommendations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeDrawingId]);

  if (loading) {
    return (
      <div className="w-[450px] h-[360px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[360px]">
      <Card>
        <CardContent>
          <ScrollArea className="h-[360px]">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Cover</TableHead>
                  <TableHead className="w-[180px]">Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead className="text-right">Play</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Music size={32} className="text-slate-400" />
                        {activeDrawingId ? (
                          <div className="space-y-2 mt-10">
                            <Skeleton className="h-4 w-[350px]" />
                            <Skeleton className="h-4 w-[250px]" />
                          </div>
                        ) : (
                          <span>No music recommendations yet</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  recommendations.map((rec) => {
                    const trackData = rec.song?.full_track_data;
                    if (!trackData) return null;

                    return (
                      <TableRow key={rec.id}>
                        <TableCell className="p-2">
                          <div className="flex justify-center items-center">
                            {trackData?.album?.images?.[0]?.url ? (
                              <img
                                src={trackData.album.images[0].url}
                                alt={`${trackData.album?.name || ""} cover`}
                                className="w-8 h-8 rounded-md object-cover shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-200 rounded-md flex items-center justify-center">
                                <Music size={20} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {trackData.name}
                        </TableCell>
                        <TableCell>
                          {trackData.artists?.[0]?.name || "Unknown Artist"}
                        </TableCell>
                        <TableCell className="text-right">
                          {trackData?.preview_url ? (
                            <audio controls className="w-full">
                              <source
                                src={trackData.preview_url}
                                type="audio/mpeg"
                              />
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            trackData?.external_urls?.spotify && (
                              <a
                                href={trackData.external_urls.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                              >
                                <span>Listen</span>
                                <ExternalLink size={16} />
                              </a>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
