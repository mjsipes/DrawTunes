import { Music, SkipForward, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusic } from "@/contexts/CurrentDrawingContext";
import { useState, useRef, useEffect } from "react"



export function AudioPlayer() {
  const { currentTrack, pause, togglePlayPause, skipToNext, isPlaying } = useMusic();
  const [progress, setProgress] = useState(50);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const updateProgress = () => {
    if (audioRef.current) {
      const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(newProgress);
    }
  };

  // Effect 1: Handle track loading
  useEffect(() => {
    if (audioRef.current) {
      if (currentTrack) {
        audioRef.current.src = currentTrack.previewUrl || '';
      } else {
        audioRef.current.src = '';
      }
    }
  }, [currentTrack]);

  // Effect 2: Handle play/pause and progress tracking
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
        progressInterval.current = setInterval(updateProgress, 500);
      } else {
        audioRef.current.pause();
        // clearInterval(progressInterval.current);
      }
    }

    return () => clearInterval(progressInterval.current);
  }, [isPlaying]);


  if (!currentTrack) return <AudioPlayerSkeleton />;

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-[280px]">
              {currentTrack.artworkUrl100 ? (
                <img
                  src={currentTrack.artworkUrl100.replace(
                    "100x100bb.jpg",
                    "300x300bb.jpg"
                  )}
                  alt={`${currentTrack.collectionName || ""} cover`}
                  className="w-10 h-10 rounded-md object-cover shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
                  <Music size={20} className="text-slate-400" />
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <p className="font-medium text-sm truncate">
                  {currentTrack.trackName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentTrack.artistName || "Unknown Artist"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-md"
                onClick={togglePlayPause}
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
                onClick={skipToNext}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1 w-full" />
          <audio ref={audioRef} style={{ display: "none" }} />
        </div>
      </CardContent>
    </Card>
  );
}










function AudioPlayerSkeleton() {
  return (
    <Card>
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
