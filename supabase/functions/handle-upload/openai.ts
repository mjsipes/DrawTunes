import OpenAI from "jsr:@openai/openai";

export async function generateMusicRecommendations(imageUrl: string) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const openai = new OpenAI({
        apiKey: apiKey,
    });

    const num_songs = 5;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text:
                            `Generate music recommendations in this EXACT JSON format:

{
  "songs": [
    {"title": "Song Name 1", "artist": "Artist Name 1"},
    {"title": "Song Name 2", "artist": "Artist Name 2"}
    ...
  ],
  "message": "Brief reasoning for these selections"
}


IMPORTANT RESPONSE RULES:
1. Return ONLY valid JSON with no markdown formatting
2. Include EXACTLY ${num_songs} songs
3. Each song MUST have ONLY two fields: "title" and "artist"
4. Include a brief "message" field explaining your selections
5. Do not include ANY explanatory text outside the JSON
6. If no image is provided, return a diverse sample of ${num_songs} popular songs

The response must be parseable by JSON.parse() without any modifications.`,
                    },
                    // {
                    //     type: "image_url",
                    //     image_url: { url: imageUrl },
                    // },
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
