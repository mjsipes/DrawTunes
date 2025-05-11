import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Music } from "lucide-react";

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
  const [songs, setSongs] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    // Fetch existing recommendations on load
    const fetchRecommendations = async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*");

      if (data) {
        setSongs(data);
      }

      setLoading(false);
    };

    fetchRecommendations();

    // Subscribe to new inserts
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
          console.log("New song received!", payload);
          setSongs((prevSongs) => [...prevSongs, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        Loading music recommendations...
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableCaption>Your Music Recommendations</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead className="w-[300px]">Track</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Album</TableHead>
            <TableHead className="text-right">Play</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No music recommendations yet
              </TableCell>
            </TableRow>
          ) : (
            songs.map((song) => (
              <TableRow key={song.id}>
                <TableCell>
                  {song.album_cover_url ? (
                    <img
                      src={song.album_cover_url}
                      alt={`${song.album_name} cover`}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-md flex items-center justify-center">
                      <Music size={20} className="text-slate-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{song.track_name}</TableCell>
                <TableCell>{song.artist_name}</TableCell>
                <TableCell>{song.album_name || "-"}</TableCell>
                <TableCell className="text-right">
                  {song.preview_url && (
                    <a
                      href={song.preview_url}
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
    </div>
  );
}
