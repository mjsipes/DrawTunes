import OpenAI from "jsr:@openai/openai";

export async function generateMusicRecommendations(imageUrl: string) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const openai = new OpenAI({
        apiKey: apiKey,
    });

    const num_songs = 5;

    const prompt =
        `Analyze this image and choose ONE specific musical direction to focus on. Pick from these approaches:

1. If it's a person: Choose either their most popular hits OR their deep cuts/B-sides OR similar artists in their genre
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
  "message": "I focused on [your specific angle] because [brief reasoning]"
}

RULES:
- No markdown formatting
- All ${num_songs} songs must fit your chosen theme
- Be bold and specific, not generic
- Valid JSON that works with JSON.parse()`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt,
                    },
                    {
                        type: "image_url",
                        image_url: { url: imageUrl },
                    },
                ],
            },
        ],
    });

    let cleanedResponse = response.choices[0].message.content!.trim();
    if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(
            /\s*```$/,
            "",
        );
    }

    let responseData;
    responseData = JSON.parse(cleanedResponse);

    const message = responseData.message || "No reasoning provided";
    const songs = responseData.songs || [];

    return { message, songs };
}
