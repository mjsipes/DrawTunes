import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth/AuthProvider";
import Loading from "@/components/output/loading";
import { ScrollArea } from "@/components/ui/scroll-area";
// import type { Database } from "@/lib/supabase/database.types";

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
  const user = useAuth();

  const supabase = createClient();

  // Fetch existing recommendations on load
  const fetchRecommendations = async () => {
    if (!user?.id) return;

    try {
      // First, get all drawings that belong to the user
      const { data: userDrawings, error: drawingsError } = await supabase
        .from("drawings")
        .select("drawing_id")
        .eq("user_id", user.id);

      if (drawingsError) {
        console.error("Error fetching user drawings:", drawingsError);
        setLoading(false);
        return;
      }

      if (!userDrawings || userDrawings.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Extract drawing IDs
      const drawingIds = userDrawings.map((d) => d.drawing_id);

      // Now fetch recommendations for these drawings
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
        .in("drawing_id", drawingIds);

      if (error) {
        console.error("Error fetching recommendations:", error);
      } else if (data) {
        console.log("Fetched recommendations:", data);
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

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();

      // Set up realtime subscription
      const channel = supabase
        .channel("recommendations-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "recommendations",
          },
          (payload) => {
            console.log("New recommendation received!", payload);
            fetchRecommendations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [supabase, user?.id]);

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
                        <span>No music recommendations yet</span>
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
