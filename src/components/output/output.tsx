import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";
import { AISummary } from "./ai-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      : null;

  const handleSongSelect = (index: number) => {
    playAudio(index);
  };

  return (
    <div className="w-[450px] space-y-4">
      <Tabs defaultValue="audio">
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="audio">Audio Player</TabsTrigger>
            <TabsTrigger value="summary">AI Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="audio">
          <AudioPlayer
            currentSong={currentSong}
            isPlaying={audioState.isPlaying}
            progress={audioState.progress}
            onPlayPause={togglePlayPause}
            onSkip={skipToNext}
          />
        </TabsContent>

        <TabsContent value="summary">
          <AISummary />
        </TabsContent>
      </Tabs>

      <RecommendationsTable
        currentSongIndex={audioState.currentSongIndex}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
}
