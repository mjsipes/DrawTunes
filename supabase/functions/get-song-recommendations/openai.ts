import OpenAI from "jsr:@openai/openai";


export async function get_song_recommendations_openai(imageUrl: string) {
  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  const response = await openai.responses.create({
    model: "gpt-5-nano",  // Your preferred GPT-5 variant
    input: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: [
          { type: "input_image", image_url: imageUrl, detail: "high" },
        ],
      },
    ],
    text: {
      format: { type: "text" },  // Raw text output
      // verbosity: "medium"  // NOTE: may cause error on some GPT-5 models :contentReference[oaicite:4]{index=4}
    },
    reasoning: {
      effort: "minimal",
      summary: "auto",
    },
  });

  console.log("Output text:", response.output_text);

  let data;
  try {
    data = JSON.parse(response.output_text);
  } catch (err) {
    throw new Error("Failed to parse JSON: " + err.message + "\nResponse was:\n" + response.output_text);
  }

  const { songs, message } = data;
  return { songs, message };
}

const num_songs = 5;
const prompt =
  `Analyze this image and choose ONE specific musical direction to focus on. Pick from these approaches:

1. If it's a person: Try to recognise if they are a famous person. If They are a famous musician, Choose either their most popular hits OR their deep cuts/B-sides OR similar artists in their genre. If they are famouse for another reason like sports, then focus your songs on something related to that sport. Sports are just one example, it can be any feild like art, science, etc.
2. If it's a scene/mood: Pick a specific genre that matches (indie folk, synthwave, jazz, etc.)
3. If it's an object/abstract: Pick an unexpected genre connection

COMMIT to your chosen direction and give ${num_songs} songs that are ALL from that specific angle. Don't mix approaches.

Examples of focused responses:
- Taylor Swift image → ALL deep cuts from Folklore/Evermore era
- Sunset image → ALL synthwave/retrowave tracks  
- Coffee shop → ALL indie acoustic singer-songwriter
- Neon lights → ALL 80s new wave classics

Return ONLY this JSON format:

{
"songs": [
{"title": "Song Name 1", "artist": "Artist Name 1"},
{"title": "Song Name 2", "artist": "Artist Name 2"},
{"title": "Song Name 3", "artist": "Artist Name 3"},
{"title": "Song Name 4", "artist": "Artist Name 4"},
{"title": "Song Name 5", "artist": "Artist Name 5"}
],
"message": "I focused on [your specific angle] because [detailed reasoning]"
}

RULES:
- No markdown formatting
- All ${num_songs} songs must fit your chosen theme
- Be bold and specific, not generic
- Valid JSON that works with JSON.parse()
- Be detailed in your reasoning, give a nice paragraph of 5-6 sentances. Go into depth about why you chose the songs you did. You can even share some fun facts about the songs you choose.`;
