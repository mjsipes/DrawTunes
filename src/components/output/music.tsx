import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

export default function Music() {
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

  return (
    <div className="w-full">
      <Table>
        <TableCaption>Your Music Recommendations</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Track</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Album</TableHead>
            <TableHead className="text-right">Play</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song) => (
            <TableRow key={song.id}>
              <TableCell className="font-medium">{song.track_name}</TableCell>
              <TableCell>{song.artist_name}</TableCell>
              <TableCell>{song.album_name || "-"}</TableCell>
              <TableCell className="text-right">
                {song.preview_url && (
                  <a
                    href={song.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Listen
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
