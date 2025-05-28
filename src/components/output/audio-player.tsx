import { useState, useRef, useEffect} from "react";
import { Music, SkipForward, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusic } from "@/contexts/CurrentDrawingContext";

interface AudioPlayerProps {
  currentSongIndex: number | null;
  onSkip: () => void;
  shouldPlay: boolean;
  className?: string;
}


// Shared state across all AudioPlayer instances
const sharedAudioState = {
  audioElement: null as HTMLAudioElement | null,
  progressInterval: null as NodeJS.Timeout | null,
  currentUrl: "",
  currentTime: 0,
  isPlaying: false
};

export function AudioPlayer({
  currentSongIndex,
  onSkip,
  shouldPlay,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(sharedAudioState.isPlaying);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(sharedAudioState.audioElement);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(sharedAudioState.progressInterval);

  const { currentDrawing, recommendations } = useMusic();

  const currentSong =
    currentSongIndex !== null
      ? recommendations[currentSongIndex]?.song?.full_track_data
      : null;

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const value =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(value) ? 0 : value);
        // Update shared state with current time
        sharedAudioState.currentTime = audioRef.current.currentTime;
      }
    }, 500);
    
    // Update shared state with progress interval
    sharedAudioState.progressInterval = progressIntervalRef.current;
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", onSkip);
      audioRef.current = null;
      sharedAudioState.audioElement = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
      sharedAudioState.progressInterval = null;
    }

    setProgress(0);
    setIsPlaying(false);
    sharedAudioState.isPlaying = false;
    sharedAudioState.currentUrl = "";
    sharedAudioState.currentTime = 0;
  };

  const handlePlayPause = () => {
    if (!audioRef.current && currentSong?.previewUrl) {
      audioRef.current = new Audio(currentSong.previewUrl);
      sharedAudioState.audioElement = audioRef.current;
      sharedAudioState.currentUrl = currentSong.previewUrl;
      
      audioRef.current.addEventListener("ended", onSkip);
      audioRef.current.addEventListener("error", () => {
        console.error("Error playing audio");
        onSkip();
      });

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          sharedAudioState.isPlaying = true;
          startProgressTracking();
          sharedAudioState.progressInterval = progressIntervalRef.current;
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
        sharedAudioState.currentTime = audioRef.current.currentTime;
        sharedAudioState.isPlaying = false;
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          sharedAudioState.progressInterval = null;
        }
      } else {
        audioRef.current.play();
        sharedAudioState.isPlaying = true;
        startProgressTracking();
        sharedAudioState.progressInterval = progressIntervalRef.current;
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      // Don't stop audio on unmount to allow audio to continue playing when switching tabs
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Sync with shared state on mount
  useEffect(() => {
    if (sharedAudioState.audioElement && sharedAudioState.isPlaying) {
      audioRef.current = sharedAudioState.audioElement;
      setIsPlaying(true);
      
      // Update progress based on current playback
      const updateCurrentProgress = () => {
        if (audioRef.current) {
          const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(isNaN(value) ? 0 : value);
        }
      };
      
      // Update progress immediately
      updateCurrentProgress();
      
      // Start tracking if not already tracking
      if (!progressIntervalRef.current) {
        startProgressTracking();
      }
    }
  }, []);

  useEffect(() => {
    if (shouldPlay && currentSong?.previewUrl) {
      // Check if we already have an active audio element with the same URL
      if (sharedAudioState.audioElement && sharedAudioState.currentUrl === currentSong.previewUrl) {
        // Update local ref to point to the shared audio element
        audioRef.current = sharedAudioState.audioElement;
        
        // If it's paused, resume it
        if (!sharedAudioState.isPlaying) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              sharedAudioState.isPlaying = true;
              startProgressTracking();
              sharedAudioState.progressInterval = progressIntervalRef.current;
            })
            .catch((err: Error) => {
              console.error("Playback failed on resume:", err);
            });
        }
      } else {
        // Either no audio element exists or it's playing something else
        // Clean up any existing audio
        if (sharedAudioState.audioElement) {
          sharedAudioState.audioElement.pause();
          sharedAudioState.audioElement.removeEventListener("ended", onSkip);
        }
        
        if (progressIntervalRef.current || sharedAudioState.progressInterval) {
          clearInterval(progressIntervalRef.current || sharedAudioState.progressInterval);
          progressIntervalRef.current = null;
          sharedAudioState.progressInterval = null;
        }
        
        // Create a new audio element
        audioRef.current = new Audio(currentSong.previewUrl);
        sharedAudioState.audioElement = audioRef.current;
        sharedAudioState.currentUrl = currentSong.previewUrl;
        
        audioRef.current.addEventListener("ended", onSkip);
        audioRef.current.addEventListener("error", () => {
          console.error("Error playing audio");
          onSkip();
        });

        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            sharedAudioState.isPlaying = true;
            startProgressTracking();
            sharedAudioState.progressInterval = progressIntervalRef.current;
          })
          .catch((err: Error) => {
            console.error("Playback failed:", err);
            onSkip();
          });
      }
    }
  }, [currentSong, shouldPlay]);

  if (!currentSong) {
    return <AudioPlayerSkeleton />;
  }

  return (
    <Card >
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

function AudioPlayerSkeleton() {
  return (
    <Card >
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