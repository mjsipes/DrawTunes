// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "jsr:@supabase/supabase-js@2";
import { get_song_recommendations_openai } from "./openai.ts";
import { get_itunes_data } from "./itunes.ts";
const IMAGE_URL =
  "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/";

Deno.serve(async (req) => {
  try {
    console.log("hello from get-song-recommendations function");

    //=========================== INITIALIZATION ===========================//
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
    const { message, songs } = await get_song_recommendations_openai(
      public_url,
    );

    //========================= ITUNES LOOKUP ==========================//
    let itunesResults;
    try {
      // Define the type for a song object
      type Song = { title: string; artist: string };

      // Search for each song in parallel
      const searchPromises = (songs as Song[]).map((song: Song) =>
        get_itunes_data(song.title, song.artist)
      );

      // Wait for all searches to complete
      const results = await Promise.all(searchPromises);

      console.log("iTunes data retrieved successfully");
      itunesResults = {
        totalRequested: songs.length,
        totalFound: results.filter((r) => r.success).length,
        results: results,
      };
    } catch (e) {
      console.error("Error processing iTunes request:", e);
      return new Response(
        JSON.stringify({
          error: "Failed to process iTunes request",
          details: typeof e === "object" && e !== null && "message" in e
            ? (e as { message: string }).message
            : String(e),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    //====================== DATABASE STORAGE =======================//
        //add ai message for image to database
    {
      const { data, error } = await supabase
        .from("drawings")
        .insert([
          {
            drawing_id: reqPayload.record.id,
            drawing_url: public_url,
            user_id: reqPayload.record.owner_id,
            ai_message: message,
            created_at: reqPayload.record.created_at,
          },
        ])
        .select();

      console.log("insert_drawing_data: ", data);
      console.log("insert_drawing_error: ", error);
    }
    
    console.log("Processing track data for new schema");
    const insertions = [];
    const errors = [];

    if (
      itunesResults && itunesResults.results &&
      Array.isArray(itunesResults.results)
    ) {
      for (const result of itunesResults.results) {
        if (!result.success || !result.track) {
          errors.push({
            query: result.query,
            error: result.error || "Track not found",
          });
          continue;
        }

        const trackData = result.track;

        try {
          // Check if song already exists in songs table by matching trackId
          const { data: existingSong } = await supabase
            .from("songs")
            .select("id")
            .eq("full_track_data->trackId", trackData.trackId)
            .maybeSingle();

          let songId;

          if (existingSong) {
            songId = existingSong.id;
          } else {
            // Insert new song with iTunes track data
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
                track: trackData.trackName,
                error: songError,
              });
              continue;
            }

            songId = newSong[0].id;
          }



          // Insert into recommendations table
          const { data: recData, error: recError } = await supabase
            .from("recommendations")
            .insert([{
              drawing_id: reqPayload.record.id,
              song_id: songId,
            }])
            .select();

          if (recError) {
            console.error("Error creating recommendation:", recError);
            errors.push({
              track: trackData.trackName,
              error: recError,
            });
          } else {
            console.log(
              `Successfully created recommendation for: ${trackData.trackName}`,
            );
            insertions.push(recData[0]);
          }
        } catch (e) {
          console.error("Exception processing track:", e);
          errors.push({
            track: trackData.trackName,
            error: e && typeof e === "object" && "message" in e
              ? (e as { message: string }).message
              : String(e),
          });
        }
      }
    }

    //---------------------- RETURN RESPONSE ------------------------//
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-song-recommendations' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
