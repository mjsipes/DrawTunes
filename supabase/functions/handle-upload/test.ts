// import "https://deno.land/std@0.220.1/dotenv/load.ts";
// import { generateMusicRecommendations } from "./openai.ts";
// console.log("hello from handle-upload function");
// const result = await generateMusicRecommendations(
//     "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/drawings/drawings/drawing-1747250359245.png",
// );
// console.log(result);

import { searchTrack } from "./itunes.ts";
console.log("hi from test.ts");
const results = await searchTrack("Shape of You", "Ed Sheeran");
console.log(results);
