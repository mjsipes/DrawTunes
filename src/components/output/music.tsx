import { useState, Suspense } from "react";
import { ExternalLink, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMostRecentDrawing, useRecommendations } from "@/hooks/useMusicData";
import { AudioPlayer, AudioPlayerSkeleton } from "./audio-player";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Type definitions
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

export default function MusicRecommendations() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuth();

  const supabase = createClient();

  // Fetch most recent drawing ID whenever user changes
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
    const debouncedFetchRecommendations = (() => {
      let timeout: NodeJS.Timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fetchRecommendations();
        }, 200);
      };
    })();

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
          const formattedRecommendations: Recommendation[] = data.map(
            (item: any) => ({
              id: item.id,
              drawing_id: item.drawing_id,
              song: item.songs,
            })
          );

          setRecommendations(formattedRecommendations);

          // Reset audio state when recommendations change
          setCurrentSongIndex(null);
          setIsPlaying(false);
          stopAudio();
        }
      } catch (err) {
        console.error("Error in fetchRecommendations:", err);
      }

      setLoading(false);
    };

    debouncedFetchRecommendations();

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
            debouncedFetchRecommendations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeDrawingId]);

  // Audio player functions
  const playFirstSong = () => {
    if (recommendations.length > 0) {
      playSong(0);
    }
  };

  // Helper to get track URL from iTunes data structure
  const getTrackAudioUrl = (song: iTunesTrack): string | null => {
    // iTunes API provides previewUrl directly
    if (song?.previewUrl) {
      return song.previewUrl;
    }

    return null;
  };

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

// Main component content without loading state
function MusicContent() {
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);

  // Use custom hooks for data fetching
  const activeDrawingId = useMostRecentDrawing();
  const { recommendations } = useRecommendations(activeDrawingId);

  const handleSkipSong = () => {
    const currentIndex = currentSongIndex !== null ? currentSongIndex : 0;
    const nextIndex = (currentIndex + 1) % recommendations.length;
    setCurrentSongIndex(nextIndex);
    setShouldPlay(true);
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setShouldPlay(true);
  };

  const currentSong =
    currentSongIndex !== null
      ? recommendations[currentSongIndex]?.song?.full_track_data
      : null;

  return (
    <div className="w-[450px]">
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            {/* Current playing info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentSong ? (
                  <>
                    {getArtworkUrl(currentSong) ? (
                      <img
                        src={getArtworkUrl(currentSong)!}
                        alt={`${currentSong.collectionName || ""} cover`}
                        className="w-10 h-10 rounded-md object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center">
                        <Music size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">
                        {currentSong.trackName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentSong.artistName || "Unknown Artist"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Music size={20} className="text-slate-400" />
                    <span className="text-sm text-gray-500">
                      {recommendations.length > 0
                        ? "Select a song to play"
                        : "No tracks available"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={recommendations.length === 0}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkipSong}
                  disabled={recommendations.length === 0}
                >
                  <SkipForward size={18} />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={progress} className="h-1 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[280px]">
            <Table className="border-collapse table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px] text-center">#</TableHead>
                  <TableHead className="w-[180px]">Track</TableHead>
                  <TableHead className="w-[100px]">Artist</TableHead>
                  <TableHead className="w-[40px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Music size={32} className="text-slate-400" />
                        {activeDrawingId ? (
                          aiMessage ? (
                            <div className="text-center text-sm mt-4 max-w-[350px] mx-auto">
                              <p className="font-medium mb-2">AI Analysis:</p>
                              <p className="text-slate-600">{aiMessage}</p>
                            </div>
                          ) : (
                            <div className="space-y-2 mt-10">
                              <Skeleton className="h-4 w-[350px]" />
                              <Skeleton className="h-4 w-[250px]" />
                            </div>
                          )
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
                        onClick={() => handleSongSelect(index)}
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
                        <TableCell className="w-[40px] text-right">
                          {trackData?.trackViewUrl && (
                            <a
                              href={trackData.trackViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-500 hover:underline"
                            >
                              <ExternalLink size={16} />
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
    </div>
  );
}

// Main component with Suspense
export default function MusicRecommendations() {
  return (
    <Suspense
      fallback={
        <div className="w-[450px]">
          <AudioPlayerSkeleton />
          <RecommendationsSkeleton />
        </div>
      }
    >
      <MusicContent />
    </Suspense>
  );
}
