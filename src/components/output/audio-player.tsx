import { useState, useRef, useEffect, Suspense } from "react";
import { Music, SkipForward, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMostRecentDrawing, useRecommendations } from "@/hooks/useMusicData";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  currentSongIndex: number | null;
  onSkip: () => void;
  shouldPlay: boolean;
  className?: string;
}

function AudioPlayerSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-[280px]">
              <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
                <Music size={20} className="text-slate-400" />
              </div>
              <div className="min-w-0 space-y-1">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-4 w-[100px]" />
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

function AudioPlayerContent({
  currentSongIndex,
  onSkip,
  shouldPlay,
  className,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);

  const activeDrawingId = useMostRecentDrawing();
  const { recommendations } = useRecommendations(activeDrawingId);

  const currentSong =
    currentSongIndex !== null
      ? recommendations[currentSongIndex]?.song?.full_track_data
      : null;

  const updateProgress = (timestamp: number) => {
    if (!audioRef.current) return;

    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    const currentProgress = (currentTime / duration) * 100;

    // Only update the actual progress if it's significantly different
    if (Math.abs(currentProgress - lastProgressRef.current) > 0.1) {
      lastProgressRef.current = currentProgress;
      lastUpdateTimeRef.current = timestamp;
      setProgress(isNaN(currentProgress) ? 0 : currentProgress);
    }

    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const startProgressTracking = () => {
    if (audioRef.current) {
      lastUpdateTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame((timestamp) =>
        updateProgress(timestamp)
      );
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", onSkip);
      audioRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setProgress(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (!audioRef.current && currentSong?.previewUrl) {
      audioRef.current = new Audio(currentSong.previewUrl);
      audioRef.current.addEventListener("ended", onSkip);
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
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        audioRef.current.play();
        startProgressTracking();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (shouldPlay && currentSong?.previewUrl) {
      stopAudio();
      audioRef.current = new Audio(currentSong.previewUrl);
      audioRef.current.addEventListener("ended", onSkip);
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
  }, [currentSong, shouldPlay]);

  if (!currentSong) {
    return <AudioPlayerSkeleton className={className} />;
  }

  return (
    <Card className={cn(className)}>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-[280px]">
              {currentSong.artworkUrl100 ? (
                <img
                  src={currentSong.artworkUrl100.replace(
                    "100x100bb.jpg",
                    "300x300bb.jpg"
                  )}
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
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-md"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-md"
                onClick={onSkip}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AudioPlayer(props: AudioPlayerProps) {
  return (
    <Suspense fallback={<AudioPlayerSkeleton className={props.className} />}>
      <AudioPlayerContent {...props} />
    </Suspense>
  );
}
