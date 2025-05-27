import OpenAI from "jsr:@openai/openai";

export async function generateMusicRecommendations(imageUrl: string) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const openai = new OpenAI({
        apiKey: apiKey,
    });

    const num_songs = 5; // Number of songs to recommend

    // Query GPT-4 for song recommendations based on image
    const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
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

Based on this image: Analyze the mood, setting, cultural context, and visual elements. Select ${num_songs} songs that match the emotional tone, colors, and themes shown. Include:
- A mix of mainstream hits (70%) and culturally significant tracks (30%)
- Diverse global representation (American, Latin, European, Asian, African)
- Songs in various languages (English, Spanish, French, Hindi, Korean, Arabic, etc.)
- Music that complements the scene's emotional atmosphere

IMPORTANT RESPONSE RULES:
1. Return ONLY valid JSON with no markdown formatting
2. Include EXACTLY ${num_songs} songs
3. Each song MUST have ONLY two fields: "title" and "artist"
4. Include a brief "message" field explaining your selections
5. Do not include ANY explanatory text outside the JSON
6. If no image is provided, return a diverse sample of ${num_songs} popular songs

The response must be parseable by JSON.parse() without any modifications.`,
                    },
                    // Uncomment the following block to include the image
                    // {
                    //     type: "input_image",
                    //     image_url: imageUrl,
                    //     detail: "auto",
                    // },
                ],
            },
        ],
    });

    console.log("OpenAI response received");

    // Remove markdown code block syntax if present
    let cleanedResponse = response.output_text.trim();
    if (cleanedResponse.startsWith("```json")) {
        // Remove opening ```json and closing ```
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(
            /\s*```$/,
            "",
        );
    }

    // Now parse the cleaned JSON
    let responseData;
    try {
        responseData = JSON.parse(cleanedResponse);
        console.log("Successfully parsed song recommendations");
    } catch (e) {
        console.error("Error parsing OpenAI response:", e);
        throw new Error(`Failed to parse AI recommendations: ${e.message}`);
    }

    // Extract the message and songs
    const message = responseData.message || "No reasoning provided";
    const songs = responseData.songs || [];

    console.log(`Found ${songs.length} song recommendations`);
    console.log("Message:", message.substring(0, 50) + "..."); // Show first 50 chars

    return { message, songs };
}
