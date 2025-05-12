import OpenAI from "jsr:@openai/openai";
import { createClient } from "jsr:@supabase/supabase-js@2";
const IMAGE_URL =
  "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/";
const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET") || "";

// Function to get access token
async function getSpotifyToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });
  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
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
                `generate music suggestions based on this image: Describe the mood, setting, and cultural context, and suggest music styles, artists, or songs from various languages that would enhance the scene. Consider genres and artists from popular global music scenes, including American, Latin, European, Asian, and African influences, with options in languages like English, Spanish, French, Hindi, Korean, Arabic, and more. Base your suggestions on the image's emotional tone, colors, and visual themes, aligning music choices with the ambiance and cultural diversity reflected. Make sure to include both mainstream popular songs, as well as more obscure songs from underground/cultural audiences. try to prioritize more popular songs. List 10 songs in JSON format, with a key "songs" which contains an array, each array element matches the format of a key "artist" which contains the artists name, and the key "title" which contains the songs title. Do not add any other text to your response, only the JSON format specified. If you would like, you can place exactly why you picked these songs in a new value on the JSON object titled "reasoning", but the overall structure of your response should be purely JSON.`,
            },
            {
              type: "input_image",
              image_url: public_url,
              detail: "auto",
            },
          ],
        },
      ],
    });
    // console.log("response: ", response.output_text);
    // const responseData = JSON.parse(response.output_text);
    // console.log("responseData:", responseData);
    // const reasoning = responseData.reasoning;
    // const firstSongArtist = responseData.songs[0].artist;
    // const firstSongTitle = responseData.songs[0].title;

    // console.log("Reasoning:", reasoning);
    // console.log("First Song Artist:", firstSongArtist);
    // console.log("First Song Title:", firstSongTitle);
    console.log("response: ", response.output_text);

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
    const responseData = JSON.parse(cleanedResponse);
    console.log("responseData:", responseData);

    // Extract the reasoning and first song
    const reasoning = responseData.reasoning;
    const firstSongArtist = responseData.songs[0].artist;
    const firstSongTitle = responseData.songs[0].title;

    console.log("Reasoning:", reasoning.substring(0, 50) + "..."); // Show first 50 chars
    console.log("First Song:", firstSongArtist, "-", firstSongTitle);

    //========================= SPOTIFY LOOKUP ==========================//
    // Query Spotify API for song details (hardcoded example)
    // const { data, error } = await supabase.functions.invoke("spotify", {
    //   body: {
    //     "title": firstSongTitle,
    //     "artist": firstSongArtist,
    //   },
    // });
    // console.log("spotify data:", data);
    // console.log("spotify error:", error);

    const token = await getSpotifyToken();
    const query = encodeURIComponent(
      `track:${firstSongTitle} artist:${firstSongArtist}`,
    );
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=2`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      },
    );
    const searchResults = await searchResponse.json();

    // Extract track information
    const track1name = searchResults.tracks.items[0].name;
    const track1artist = searchResults.tracks.items[0].artists[0].name;
    const track1url = searchResults.tracks.items[0].external_urls.spotify;
    console.log("track1name:", track1name);
    console.log("track1artist:", track1artist);
    console.log("track1url:", track1url);

    //====================== DATABASE STORAGE =======================//
    // TODO: Store data in database
    {
      console.log("inserting data into recommendations table");
      const { data, error } = await supabase
        .from("recommendations")
        .insert([
          {
            track_name: track1name,
            drawing_id: drawing_id,
            artist_name: track1artist,
            preview_url: track1url,
          },
        ])
        .select();
      console.log("insertdata:", data);
      console.log("inserterror:", error);
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
