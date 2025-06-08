import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";
import { AISummary } from "./ai-summary";
import { useMusic } from "@/contexts/CurrentDrawingContext";

export default function Output() {
  const {
    playAudio,
    audioState
  } = useMusic();


  const handleSongSelect = (index: number) => {
    playAudio(index);
  };

  return (
    <div className="w-[450px] space-y-2">
      <AudioPlayer/>
      <AISummary />

      <RecommendationsTable
        currentSongIndex={audioState.currentSongIndex}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
}
