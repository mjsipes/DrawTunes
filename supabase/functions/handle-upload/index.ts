import OpenAI from "jsr:@openai/openai";
import { createClient } from "jsr:@supabase/supabase-js@2";
const IMAGE_URL =
  "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/";

Deno.serve(async (req) => {
  try {
    //=========================== INITIALIZATION ===========================//
    // Initialize Supabase client with authentication
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
                "You are a song recomender. I will give you an image. I want you to think about the image and then come up with three songs with similar vibe. give me a couple sentance explanation of why you pick teh songs.",
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
    console.log(response.output_text);

    //========================= SPOTIFY LOOKUP ==========================//
    // Query Spotify API for song details (hardcoded example)
    const { data, error } = await supabase.functions.invoke("spotify", {
      body: {
        "title": "Bohemian Rhapsody",
        "artist": "Queen",
      },
    });
    console.log("spotify data:", data);
    console.log("spotify error:", error);

    // Extract track information
    const track1name = data.tracks.items[0].name;
    const track1artist = data.tracks.items[0].artists[0].name;
    const track1url = data.tracks.items[0].external_urls.spotify;
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
