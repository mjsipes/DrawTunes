import { useState } from "react";
import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";

export default function MusicRecommendations() {
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);

  const handleSkipSong = () => {
    setCurrentSongIndex((prevIndex) => {
      const nextIndex = prevIndex !== null ? prevIndex + 1 : 0;
      setShouldPlay(true);
      return nextIndex;
    });
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setShouldPlay(true);
  };

  return (
    <div className="w-[450px]">
      <AudioPlayer
        currentSongIndex={currentSongIndex}
        onSkip={handleSkipSong}
        shouldPlay={shouldPlay}
      />
      <RecommendationsTable
        currentSongIndex={currentSongIndex}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
}
