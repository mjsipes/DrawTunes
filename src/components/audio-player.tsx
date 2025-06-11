import { Music, SkipForward, Pause, Play } from "lucide-react";
import { useState, useRef, useEffect, useCallback, useOptimistic } from "react"
import { motion } from 'motion/react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { GlowEffect } from '@/components/glow-effect';
import { useMusicStore } from '@/stores/music-store';

export function AudioPlayer() {

  const currentTrack = useMusicStore(state => state.currentTrack);
  const skipToNext = useMusicStore(state => state.skipToNext);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [optimisticPlaying, setOptimisticPlaying] = useOptimistic(
    isPlaying,
    (state, action: boolean) => action
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const play = () => {
    if (audioRef.current) {
      setOptimisticPlaying(true);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      });
    }
  };

  const pause = useCallback(() => {
    if (audioRef.current) {
      setOptimisticPlaying(false);
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [setOptimisticPlaying]);

  const togglePlayPause = () => {
    if (optimisticPlaying) {
      pause();
    } else {
      play();
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const loopAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  function startPlayback() {
    if (audioRef.current) {
      setOptimisticPlaying(true);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      });
      progressInterval.current = setInterval(updateProgress, 500);
    }
  }

  function stopPlayback() {
    if (audioRef.current) {
      setOptimisticPlaying(false);
      audioRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    }
  }

  function setupAudio() {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.previewUrl || '';
      audioRef.current.addEventListener('ended', loopAudio);
      
      // Sync optimistic state with actual audio events
      audioRef.current.addEventListener('play', () => setOptimisticPlaying(true));
      audioRef.current.addEventListener('pause', () => setOptimisticPlaying(false));
      audioRef.current.addEventListener('ended', () => setOptimisticPlaying(false));
    }
  }

  function cleanupAudio() {
    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', loopAudio);
      audioRef.current.removeEventListener('play', () => setOptimisticPlaying(true));
      audioRef.current.removeEventListener('pause', () => setOptimisticPlaying(false));
      audioRef.current.removeEventListener('ended', () => setOptimisticPlaying(false));
      audioRef.current.src = '';
    }
    setOptimisticPlaying(false);
  }

  useEffect(() => {
    if (currentTrack) {
      setupAudio();
      startPlayback();
    } else {
      cleanupAudio();
      stopPlayback();
    }
    return () => {
      cleanupAudio();
    };
  }, [currentTrack]);

  if (!currentTrack) return <AudioPlayerSkeleton />;

  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: optimisticPlaying ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      >
        <GlowEffect
          colors={['#0894FF', '#C959DD', '#FF2E54', '#FF9004']}
          mode='colorShift'
          blur='softest'
          duration={4}
          className="rounded-md"
        />
      </motion.div>

      <Card className="relative">
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
                  {optimisticPlaying ? (
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
    </div>
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