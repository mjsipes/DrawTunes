import { useState, useEffect, useRef, Suspense } from "react";
import { ExternalLink, Music, SkipForward, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMostRecentDrawing, useRecommendations } from "@/hooks/useMusicData";

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

// Skeleton components for loading states
const AudioPlayerSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-1 w-full" />
      </div>
    </CardContent>
  </Card>
);

const RecommendationsSkeleton = () => (
  <Card>
    <CardContent className="p-0">
      <ScrollArea className="h-[280px]">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead className="w-[180px]">Track</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
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
                    <Skeleton className="h-4 w-[120px]" />
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

// Main component content without loading state
function MusicContent() {
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use custom hooks for data fetching
  const activeDrawingId = useMostRecentDrawing();
  const { recommendations } = useRecommendations(activeDrawingId);

  // Audio player functions
  const playFirstSong = () => {
    if (recommendations.length > 0) {
      playSong(0);
    }
  };

  // Helper to get track URL from iTunes data structure
  const getTrackAudioUrl = (song: iTunesTrack): string | null => {
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

  const playSong = (index: number) => {
    if (index >= recommendations.length) return;

    stopAudio();

    setCurrentSongIndex(index);
    const song = recommendations[index]?.song?.full_track_data;
    const audioUrl = getTrackAudioUrl(song);

    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("ended", handleSongEnd);
      audioRef.current.addEventListener("error", () => {
        console.error("Error playing audio");
        handleSkipSong();
      });

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          startProgressTracking();
        })
        .catch((err: Error) => {
          console.error("Playback failed:", err);
          handleSkipSong();
        });
    } else {
      setIsPlaying(true);
      setTimeout(() => {
        handleSkipSong();
      }, 5000);
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const value =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(value) ? 0 : value);
      }
    }, 500);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", handleSongEnd);
      audioRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setProgress(0);
  };

  const handlePlayPause = () => {
    if (
      !audioRef.current &&
      currentSongIndex === null &&
      recommendations.length > 0
    ) {
      playFirstSong();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        audioRef.current.play();
        startProgressTracking();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipSong = () => {
    const currentIndex = currentSongIndex !== null ? currentSongIndex : 0;
    const nextIndex = (currentIndex + 1) % recommendations.length;
    playSong(nextIndex);
  };

  const handleSongEnd = () => {
    handleSkipSong();
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const currentSong =
    currentSongIndex !== null
      ? recommendations[currentSongIndex]?.song?.full_track_data
      : null;

  return (
    <div className="w-[450px]">
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
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

            <Progress value={progress} className="h-1 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[280px]">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead className="w-[180px]">Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead className="w-[80px] text-right">Action</TableHead>
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
                        onClick={() => playSong(index)}
                      >
                        <TableCell className="text-center text-sm">
                          {isCurrentSong ? (
                            <div className="flex justify-center">
                              <Music size={16} className="text-blue-500" />
                            </div>
                          ) : (
                            index + 1
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            {getArtworkUrl(trackData) && (
                              <img
                                src={getArtworkUrl(trackData)!}
                                alt={`${trackData.collectionName || ""} cover`}
                                className="w-8 h-8 rounded-sm object-cover shadow-sm"
                              />
                            )}
                            <span className="truncate">
                              {trackData.trackName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {trackData.artistName || "Unknown Artist"}
                        </TableCell>
                        <TableCell className="text-right">
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
