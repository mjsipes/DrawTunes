import OpenAI from "jsr:@openai/openai";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getSpotifyToken, searchTrack } from "./spotify.ts";
const IMAGE_URL =
  "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/";

Deno.serve(async (req) => {
  try {
    console.log("hello from handle-upload function");

    //=========================== INITIALIZATION ===========================//
    // Initialize Supabase client with authenticationnn. can i be happy now?
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      },
    );

    //========================= EXTRACT PAYLOAD ==========================//
    // Extract image information from webhook payload
    const reqPayload = await req.json();
    const record = reqPayload.record;
    const bucket_id = record.bucket_id;
    const owner_id = record.owner_id;
    const drawing_id = record.id;
    const name = record.name;
    console.log("reqPayload", reqPayload);
    console.log("record:", record);
    console.log("bucket_id:", bucket_id);
    console.log("drawing_id:", drawing_id);
    console.log("owner_id:", owner_id);
    console.log("namee:", name);

    // Construct public URL for the uploaded image
    const public_url = IMAGE_URL + bucket_id + "/" + name;
    console.log("public_url:", public_url);
    //========================= OPENAI ANALYSIS =========================//
    // Initialize OpenAI client
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
              text: `Generate music recommendations in this EXACT JSON format:

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
            // {
            //   type: "input_image",
            //   image_url: public_url,
            //   detail: "auto",
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
      // Return error response
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI recommendations",
          details: e.message,
          response: cleanedResponse.substring(0, 200) + "...", // First 200 chars for debugging
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Extract the message and songs
    const message = responseData.message || "No reasoning provided";
    const songs = responseData.songs || [];

    console.log(`Found ${songs.length} song recommendations`);
    console.log("Message:", message.substring(0, 50) + "..."); // Show first 50 chars

    //========================= SPOTIFY LOOKUP ==========================//
    // Query Spotify API directly instead of using Supabase function
    let spotifyResults;
    try {
      // Get Spotify access token
      const token = await getSpotifyToken();

      // Search for each song in parallel
      const searchPromises = songs.map((song) =>
        searchTrack(token, song.title, song.artist)
      );

      // Wait for all searches to complete
      const results = await Promise.all(searchPromises);

      // Extract track IDs from successful searches
      const trackIds = results
        .filter((result) => result.success && result.track && result.track.id)
        .map((result) => result.track.id);

      // Get detailed tracks info if we have any IDs
      let detailedTracks = [];
      if (trackIds.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < trackIds.length; i += chunkSize) {
          const chunk = trackIds.slice(i, i + chunkSize);
          const idsParam = chunk.join(",");

          const tracksResponse = await fetch(
            `https://api.spotify.com/v1/tracks?ids=${idsParam}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            },
          );

          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json();
            if (tracksData.tracks) {
              detailedTracks = [...detailedTracks, ...tracksData.tracks];
            }
          }
        }
      }

      // Combine results with detailed track information
      const finalResults = results.map((result) => {
        if (result.success && result.track) {
          const detailedTrack = detailedTracks.find((t) =>
            t.id === result.track.id
          );
          return {
            query: result.query,
            success: true,
            track: detailedTrack || result.track,
          };
        }
        return result;
      });

      console.log("Spotify data retrieved successfully");
      spotifyResults = {
        totalRequested: songs.length,
        totalFound: trackIds.length,
        results: finalResults,
      };
    } catch (e) {
      console.error("Error processing Spotify request:", e);
      return new Response(
        JSON.stringify({
          error: "Failed to process Spotify request",
          details: e.message,
          aiRecommendations: responseData,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    //====================== DATABASE STORAGE =======================//
    // Store all found tracks in the database
    console.log("Inserting track data into recommendations table");
    const insertions = [];
    const errors = [];

    // Check if we have valid Spotify results
    if (
      spotifyResults && spotifyResults.results &&
      Array.isArray(spotifyResults.results)
    ) {
      // Process each track result
      for (const result of spotifyResults.results) {
        // Skip tracks that weren't found in Spotify
        if (!result.success || !result.track) {
          errors.push({
            query: result.query,
            error: result.error || "Track not found",
          });
          continue;
        }

        const trackData = result.track;

        // Insert the track into the database
        try {
          const { data: insertData, error: insertError } = await supabase
            .from("recommendations")
            .insert([
              {
                track_name: trackData.name,
                drawing_id: drawing_id,
                owner_id: owner_id,
                artist_name: trackData.artists && trackData.artists.length > 0
                  ? trackData.artists[0].name
                  : "Unknown Artist",
                preview_url: trackData.external_urls?.spotify ||
                  trackData.preview_url || null,
                full_track_data: trackData, // Store the complete track object as JSON
                ai_reasoning: message, // Store the AI reasoning
              },
            ])
            .select();

          if (insertError) {
            console.error("Error inserting track:", insertError);
            errors.push({
              track: trackData.name,
              error: insertError,
            });
          } else {
            console.log(`Successfully inserted track: ${trackData.name}`);
            insertions.push(insertData[0]);
          }
        } catch (e) {
          console.error("Exception inserting track:", e);
          errors.push({
            track: trackData.name,
            error: e.message,
          });
        }
      }
    }
    //---------------------- RETURN RESPONSE ------------------------//
    //                                                              //
    //                                                              //
    //                                                              //
    //                                                              //
    const reply = "hi";
    return new Response(reply, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    //---------------------- ERROR HANDLING -----------------------//
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
