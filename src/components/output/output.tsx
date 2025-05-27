import { useState } from "react";
import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";
import { AISummary } from "./ai-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Output() {
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
    <div className="w-[450px] space-y-4">
      <Tabs defaultValue="audio">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="summary">AI Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="audio">
          <AudioPlayer
            currentSongIndex={currentSongIndex}
            onSkip={handleSkipSong}
            shouldPlay={shouldPlay}
          />
        </TabsContent>
        <TabsContent value="summary">
          <AISummary />
        </TabsContent>
      </Tabs>

      <RecommendationsTable
        currentSongIndex={currentSongIndex}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
}
