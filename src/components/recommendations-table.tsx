import { Music } from "lucide-react";
import { FaApple } from "react-icons/fa";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusic } from "@/contexts/CurrentDrawingContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// iTunes API track type
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

interface RecommendationWithSong {
  id: string;
  drawing_id: string | null;
  song: {
    id: string;
    full_track_data: iTunesTrack;
    last_updated: string | null;
  };
}

const getArtworkUrl = (song: iTunesTrack, size = 100): string | null => {
  const artworkKey = `artworkUrl${size}` as keyof iTunesTrack;
  if (song?.[artworkKey]) {
    return (song[artworkKey] as string).replace(
      `${size}x${size}bb.jpg`,
      "300x300bb.jpg"
    );
  }
  return null;
};


export function RecommendationsTable() {
    const {
    playAudio,
    audioState,
    recommendations
  } = useMusic();



  const skeletonRowsCount = Math.max(0, 5 - recommendations.length);

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <Table className="border-collapse table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px] text-center">#</TableHead>
              <TableHead className="w-[180px]">Track</TableHead>
              <TableHead className="w-[100px]">Artist</TableHead>
              <TableHead className="w-[30px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.map(
              (rec: RecommendationWithSong, index: number) => {
                const trackData = rec.song?.full_track_data;
                if (!trackData) return null;

                const isCurrentSong = audioState.currentSongIndex === index;

                return (
                  <TableRow
                    key={rec.id}
                    className={`cursor-pointer hover:bg-muted ${
                      isCurrentSong ? "bg-accent" : ""
                    }`}
                    onClick={() => playAudio(index)}
                  >
                    <TableCell className="w-[30px] text-center text-sm">
                      {isCurrentSong ? (
                        <div className="flex justify-center">
                          <Music size={16} className="text-blue-500" />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell className="w-[180px] font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {getArtworkUrl(trackData) && (
                          <img
                            src={getArtworkUrl(trackData)!}
                            alt={`${trackData.collectionName || ""} cover`}
                            className="w-8 h-8 rounded-sm object-cover shadow-sm flex-shrink-0"
                          />
                        )}
                        <span className="truncate">{trackData.trackName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px] text-sm truncate">
                      {trackData.artistName || "Unknown Artist"}
                    </TableCell>
                    <TableCell className="w-[30px] text-right">
                      {trackData?.trackViewUrl && (
                        <div className="flex justify-end pr-2">
                          <a
                            href={trackData.trackViewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-red-500 hover:underline"
                          >
                            <FaApple size={16} />
                          </a>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }
            )}
            {Array.from({ length: skeletonRowsCount }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-sm" />
                    <Skeleton className="h-4 w-[130px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end pr-2">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
