import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthProvider";
import Loading from "@/components/output/loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/types/supabase";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MusicRecommendations() {
  const [loading, setLoading] = useState(true);
  type Recommendation = Database["public"]["Tables"]["recommendations"]["Row"];
  const [songs, setSongs] = useState<Recommendation[]>([]);
  const { user } = useAuth();

  const supabase = createClient();

  // Fetch existing recommendations on load
  const fetchRecommendations = async () => {
    const { data, error } = await supabase.from("recommendations").select("*");

    if (data) {
      setSongs(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
    const channel = supabase
      .channel("recommendations-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "recommendations",
          // filter: `drawing_id=in.(select id from storage.objects where owner='${user?.id}')`,
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
        <ScrollArea className="h-[360px]">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Cover</TableHead>
                <TableHead className="w-[180px]">Track</TableHead>
                <TableHead>Artist</TableHead>
                {/* <TableHead>Album</TableHead> */}
                <TableHead className="text-right">Play</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Music size={32} className="text-slate-400" />
                      <span>No music recommendations yet</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                songs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="p-2">
                      <div className="flex justify-center items-center">
                        {song.full_track_data?.album?.images?.[0]?.url ? (
                          <img
                            src={song.full_track_data.album.images[0].url}
                            alt={`${
                              song.full_track_data?.album?.name || ""
                            } cover`}
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
                      {song.track_name}
                    </TableCell>
                    <TableCell>{song.artist_name}</TableCell>
                    {/* <TableCell>
                      {song.full_track_data?.album?.name || "-"}
                    </TableCell> */}
                    <TableCell className="text-right">
                      {song.full_track_data?.external_urls?.spotify && (
                        <a
                          href={song.full_track_data.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          <span>Listen</span>
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
