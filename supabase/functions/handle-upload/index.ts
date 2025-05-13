import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateMusicRecommendations } from "./openai.ts";
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
    console.log("name:", name);

    // Construct public URL for the uploaded image
    const public_url = IMAGE_URL + bucket_id + "/" + name;
    console.log("public_url:", public_url);
    //========================= OPENAI ANALYSIS =========================//
    const { message, songs } = await generateMusicRecommendations(public_url);
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
