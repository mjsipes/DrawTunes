import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";
import { get_song_recommendations_openai } from "./openai.ts";
import { get_itunes_data } from "./itunes.ts";

await load({
  envPath: "../.env",
  export: true,
});
async function test1() {
  console.log("hello from handle-upload function");
  const result = await get_song_recommendations_openai(
    "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/drawings/drawings/drawing-1747250359245.png",
  );
  console.log(result);
}

async function test2() {
  console.log("hi from test.ts");
  const results = await get_itunes_data("Shape of You", "Ed Sheeran");
  console.log(results);
}

test1();
// test2();
