import { AudioPlayer } from "./audio-player";
import { RecommendationsTable } from "./recommendations-table";
import { AISummary } from "./ai-summary";

export default function Output() {


  return (
    <div className="w-[450px] space-y-2">
      <AudioPlayer/>
      <AISummary />
      <RecommendationsTable/>
    </div>
  );
}
