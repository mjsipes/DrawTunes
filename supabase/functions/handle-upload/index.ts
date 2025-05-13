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

    //========================= CONSTRUCT PUBLIC URL ==========================//
    const reqPayload = await req.json();
    const public_url = IMAGE_URL + reqPayload.record.bucket_id + "/" +
      reqPayload.record.name;

    console.log("reqPayload", reqPayload);
    console.log("bucket_id:", reqPayload.record.bucket_id);
    console.log("drawing_id:", reqPayload.record.id);
    console.log("owner_id:", reqPayload.record.owner_id);
    console.log("name:", reqPayload.record.name);
    console.log("public_url:", public_url);
    //========================= OPENAI ANALYSIS =========================//
    const { message, songs } = await generateMusicRecommendations(public_url);

    //add ai message for image to database
    {
      const { data, error } = await supabase
        .from("drawings")
        .insert([
          {
            drawing_id: reqPayload.record.id,
            user_id: reqPayload.record.owner_id,
            ai_message: message,
          },
        ])
        .select();

      console.log("insert_drawing_data: ", data);
      console.log("insert_drawing_error: ", error);
    }

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
    //====================== DATABASE STORAGE =======================//
    console.log("Processing track data for new schema");
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

        try {
          // Check if song already exists in songs table by matching track ID
          const { data: existingSong } = await supabase
            .from("songs")
            .select("id")
            .eq("full_track_data->id", trackData.id)
            .maybeSingle();

          let songId;

          if (existingSong) {
            // Song exists, use its ID
            songId = existingSong.id;
          } else {
            // Song doesn't exist, insert into songs table
            const { data: newSong, error: songError } = await supabase
              .from("songs")
              .insert([{
                full_track_data: trackData,
                last_updated: new Date().toISOString(),
              }])
              .select();

            if (songError) {
              console.error("Error inserting song:", songError);
              errors.push({
                track: trackData.name,
                error: songError,
              });
              continue;
            }

            songId = newSong[0].id;
          }

          // Now insert into recommendations table
          const { data: recData, error: recError } = await supabase
            .from("recommendations")
            .insert([{
              drawing_id: reqPayload.record.id,
              songs_id: songId,
            }])
            .select();

          if (recError) {
            console.error("Error creating recommendation:", recError);
            errors.push({
              track: trackData.name,
              error: recError,
            });
          } else {
            console.log(
              `Successfully created recommendation for: ${trackData.name}`,
            );
            insertions.push(recData[0]);
          }
        } catch (e) {
          console.error("Exception processing track:", e);
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
