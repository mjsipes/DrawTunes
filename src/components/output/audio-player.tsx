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


// Initialize shared state on the window object if it doesn't exist
if (!window.sharedAudioState) {
  window.sharedAudioState = {
    audioElement: null,
    progressInterval: null,
    currentUrl: "",
    currentTime: 0,
    isPlaying: false,
    progress: 0
  };
}

export function AudioPlayer({
  currentSongIndex,
  onSkip,
  shouldPlay,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(window.sharedAudioState?.isPlaying || false);
  const [progress, setProgress] = useState(window.sharedAudioState?.progress || 0);
  const audioRef = useRef<HTMLAudioElement | null>(window.sharedAudioState?.audioElement || null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(window.sharedAudioState?.progressInterval || null);

  const { currentDrawing, recommendations } = useMusic();
  
  // Update shared music context with recommendations
  if (!window.sharedMusicContext) {
    window.sharedMusicContext = { recommendations };
  } else {
    window.sharedMusicContext.recommendations = recommendations;
  }

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
        const progressValue = isNaN(value) ? 0 : value;
        
        // Update both local and shared state
        setProgress(progressValue);
        
        if (window.sharedAudioState) {
          window.sharedAudioState.progress = progressValue;
          window.sharedAudioState.currentTime = audioRef.current.currentTime;
        }
      }
    }, 500);
    
    // Update shared state with progress interval
    if (window.sharedAudioState) {
      window.sharedAudioState.progressInterval = progressIntervalRef.current;
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", onSkip);
      audioRef.current = null;
      
      if (window.sharedAudioState) {
        window.sharedAudioState.audioElement = null;
      }
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
      
      if (window.sharedAudioState) {
        window.sharedAudioState.progressInterval = null;
      }
    }

    setProgress(0);
    setIsPlaying(false);
    
    if (window.sharedAudioState) {
      window.sharedAudioState.isPlaying = false;
      window.sharedAudioState.currentUrl = "";
      window.sharedAudioState.currentTime = 0;
      window.sharedAudioState.progress = 0;
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current && currentSong?.previewUrl) {
      audioRef.current = new Audio(currentSong.previewUrl);
      
      if (window.sharedAudioState) {
        window.sharedAudioState.audioElement = audioRef.current;
        window.sharedAudioState.currentUrl = currentSong.previewUrl;
      }
      
      audioRef.current.addEventListener("ended", onSkip);
      audioRef.current.addEventListener("error", () => {
        console.error("Error playing audio");
        onSkip();
      });

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (window.sharedAudioState) {
            window.sharedAudioState.isPlaying = true;
          }
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
        
        if (window.sharedAudioState) {
          window.sharedAudioState.currentTime = audioRef.current.currentTime;
          window.sharedAudioState.isPlaying = false;
        }
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          if (window.sharedAudioState) {
            window.sharedAudioState.progressInterval = null;
          }
        }
      } else {
        audioRef.current.play();
        
        if (window.sharedAudioState) {
          window.sharedAudioState.isPlaying = true;
        }
        
        startProgressTracking();
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
    if (window.sharedAudioState?.audioElement && window.sharedAudioState.isPlaying) {
      audioRef.current = window.sharedAudioState.audioElement;
      setIsPlaying(true);
      
      // Update progress based on current playback
      if (window.sharedAudioState?.progress) {
        setProgress(window.sharedAudioState.progress);
      } else {
        const updateCurrentProgress = () => {
          if (audioRef.current) {
            const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            const progressValue = isNaN(value) ? 0 : value;
            setProgress(progressValue);
            
            if (window.sharedAudioState) {
              window.sharedAudioState.progress = progressValue;
            }
          }
        };
        
        // Update progress immediately
        updateCurrentProgress();
      }
      
      // Start tracking if not already tracking
      if (!progressIntervalRef.current) {
        startProgressTracking();
      }
    }
  }, []);

  useEffect(() => {
    if (shouldPlay && currentSong?.previewUrl) {
      // Check if we already have an active audio element with the same URL
      if (window.sharedAudioState?.audioElement && window.sharedAudioState.currentUrl === currentSong.previewUrl) {
        // Update local ref to point to the shared audio element
        audioRef.current = window.sharedAudioState.audioElement;
        
        // If it's paused, resume it
        if (!window.sharedAudioState.isPlaying) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              if (window.sharedAudioState) {
                window.sharedAudioState.isPlaying = true;
              }
              startProgressTracking();
            })
            .catch((err: Error) => {
              console.error("Playback failed on resume:", err);
            });
        } else {
          // It's already playing, just update local state
          setIsPlaying(true);
          if (window.sharedAudioState.progress) {
            setProgress(window.sharedAudioState.progress);
          }
        }
      } else {
        // Either no audio element exists or it's playing something else
        // Clean up any existing audio
        if (window.sharedAudioState?.audioElement) {
          window.sharedAudioState.audioElement.pause();
          window.sharedAudioState.audioElement.removeEventListener("ended", onSkip);
        }
        
        if (progressIntervalRef.current || window.sharedAudioState?.progressInterval) {
          clearInterval(progressIntervalRef.current || window.sharedAudioState?.progressInterval || null);
          progressIntervalRef.current = null;
          if (window.sharedAudioState) {
            window.sharedAudioState.progressInterval = null;
          }
        }
        
        // Create a new audio element
        audioRef.current = new Audio(currentSong.previewUrl);
        if (window.sharedAudioState) {
          window.sharedAudioState.audioElement = audioRef.current;
          window.sharedAudioState.currentUrl = currentSong.previewUrl;
          window.sharedAudioState.progress = 0;
        }
        
        setProgress(0);
        
        audioRef.current.addEventListener("ended", onSkip);
        audioRef.current.addEventListener("error", () => {
          console.error("Error playing audio");
          onSkip();
        });

        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            if (window.sharedAudioState) {
              window.sharedAudioState.isPlaying = true;
            }
            startProgressTracking();
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