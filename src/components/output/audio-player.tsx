import { useState, useRef, useEffect } from "react";
import { Music, SkipForward, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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

interface AudioPlayerProps {
  currentSong: iTunesTrack | null;
  onSkip: () => void;
  recommendationsLength: number;
  shouldPlay?: boolean;
}

export function AudioPlayer({
  currentSong,
  onSkip,
  recommendationsLength,
  shouldPlay = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    setIsPlaying(false);
  };

  const playSong = () => {
    if (!currentSong) return;

    stopAudio();
    const audioUrl = getTrackAudioUrl(currentSong);
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("ended", handleSongEnd);
      audioRef.current.addEventListener("error", () => {
        console.error("Error playing audio");
        onSkip();
      });

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          startProgressTracking();
        })
        .catch((err: Error) => {
          console.error("Playback failed:", err);
          onSkip();
        });
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current && currentSong) {
      playSong();
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

  const handleSongEnd = () => {
    onSkip();
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (shouldPlay && currentSong) {
      playSong();
    }
  }, [currentSong, shouldPlay]);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-[280px]">
              {currentSong ? (
                <>
                  {getArtworkUrl(currentSong) ? (
                    <img
                      src={getArtworkUrl(currentSong)!}
                      alt={`${currentSong.collectionName || ""} cover`}
                      className="w-10 h-10 rounded-md object-cover shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
                      <Music size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div className="overflow-hidden min-w-0">
                    <p className="font-medium text-sm truncate">
                      {currentSong.trackName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentSong.artistName || "Unknown Artist"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 h-10">
                  <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
                    <Music size={20} className="text-slate-400" />
                  </div>
                  <span className="text-sm text-gray-500">
                    {recommendationsLength > 0
                      ? "Select a song to play"
                      : "No tracks available"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                disabled={recommendationsLength === 0}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSkip}
                disabled={recommendationsLength === 0}
              >
                <SkipForward size={18} />
              </Button>
            </div>
          </div>

          <Progress value={progress} className="h-1 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton component for loading state
export function AudioPlayerSkeleton() {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-[280px]">
              <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
              <div className="space-y-2 min-w-0">
                <Skeleton className="h-4 w-[130px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Skeleton className="w-8 h-8 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-1 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
