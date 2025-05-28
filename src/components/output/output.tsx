import { useState } from "react";
import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";
import { AISummary } from "./ai-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecommendationWithSong } from "@/contexts/CurrentDrawingContext";

// Extend the Window interface to include sharedMusicContext
declare global {
  interface Window {
    sharedMusicContext?: {
      recommendations: RecommendationWithSong[];
      // add other properties if needed
    };
  }
}

export default function Output() {
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [activeTab, setActiveTab] = useState("audio");

  const handleSkipSong = () => {
    setCurrentSongIndex((prevIndex) => {
      // Need to access recommendations to know the total number of songs
      const { recommendations } = window.sharedMusicContext || {
        recommendations: [],
      };
      const totalSongs = recommendations.length;

      // If we're at the last song or beyond, cycle back to the first song
      let nextIndex = prevIndex !== null ? prevIndex + 1 : 0;
      if (totalSongs > 0 && nextIndex >= totalSongs) {
        nextIndex = 0;
      }

      setShouldPlay(true);
      return nextIndex;
    });
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setShouldPlay(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="w-[450px] space-y-4">
      <Tabs defaultValue="audio" onValueChange={handleTabChange}>
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="audio">Audio Player</TabsTrigger>
            <TabsTrigger value="summary">AI Summary</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="audio">
          <AudioPlayer
            currentSongIndex={currentSongIndex}
            onSkip={handleSkipSong}
            shouldPlay={shouldPlay}
          />
        </TabsContent>
        <TabsContent value="summary">
          <AISummary />
          {/* Always render AudioPlayer but keep it invisible when on the summary tab */}
          <div
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              whiteSpace: "nowrap",
            }}
          >
            <AudioPlayer
              currentSongIndex={currentSongIndex}
              onSkip={handleSkipSong}
              shouldPlay={shouldPlay}
            />
          </div>
        </TabsContent>
      </Tabs>

      <RecommendationsTable
        currentSongIndex={currentSongIndex}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
}
