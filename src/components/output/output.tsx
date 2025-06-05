import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";
import { AISummary } from "./ai-summary";
import { useMusic } from "@/contexts/CurrentDrawingContext";

export default function Output() {
  const {
    recommendations,
    audioState,
    playAudio,
    togglePlayPause,
    skipToNext,
  } = useMusic();

  const currentSong =
    audioState.currentSongIndex !== null
      ? recommendations[audioState.currentSongIndex]?.song?.full_track_data
      : recommendations[0]?.song?.full_track_data; // Add this fallback

  const handleSongSelect = (index: number) => {
    playAudio(index);
  };

  return (
    <div className="w-[450px] space-y-2">
      <AudioPlayer
        currentSong={currentSong}
        isPlaying={audioState.isPlaying}
        progress={audioState.progress}
        onPlayPause={togglePlayPause}
        onSkip={skipToNext}
      />
      <AISummary />

      <RecommendationsTable
        currentSongIndex={audioState.currentSongIndex}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
}
