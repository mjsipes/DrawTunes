import { Suspense } from "react";
import { Music } from "lucide-react";
import { FaApple } from "react-icons/fa";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMostRecentDrawing, useRecommendations } from "@/hooks/useMusicData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface RecommendationsTableProps {
  currentSongIndex: number | null;
  onSongSelect: (index: number) => void;
}

// Helper to get artwork URL with higher resolution
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

function RecommendationsSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] text-center">#</TableHead>
                <TableHead className="w-[200px]">Track</TableHead>
                <TableHead className="w-[130px]">Artist</TableHead>
                <TableHead className="w-[40px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
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
                    <Skeleton className="h-4 w-4 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RecommendationsTableContent({
  currentSongIndex,
  onSongSelect,
}: RecommendationsTableProps) {
  const activeDrawingId = useMostRecentDrawing();
  const { recommendations } = useRecommendations(activeDrawingId);

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
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
              {recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
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
                recommendations.map((rec, index) => {
                  const trackData = rec.song?.full_track_data;
                  if (!trackData) return null;

                  const isCurrentSong = currentSongIndex === index;

                  return (
                    <TableRow
                      key={rec.id}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        isCurrentSong ? "bg-slate-100" : ""
                      }`}
                      onClick={() => onSongSelect(index)}
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
                          <span className="truncate">
                            {trackData.trackName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px] text-sm truncate">
                        {trackData.artistName || "Unknown Artist"}
                      </TableCell>
                      <TableCell className="w-[30px] text-right">
                        {trackData?.trackViewUrl && (
                          <a
                            href={trackData.trackViewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-red-500 hover:underline"
                          >
                            <FaApple size={16} />
                          </a>
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
  );
}

export function RecommendationsTable(props: RecommendationsTableProps) {
  return (
    <Suspense fallback={<RecommendationsSkeleton />}>
      <RecommendationsTableContent {...props} />
    </Suspense>
  );
}
