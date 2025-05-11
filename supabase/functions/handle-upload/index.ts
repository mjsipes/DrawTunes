import OpenAI from "jsr:@openai/openai";
import { createClient } from "jsr:@supabase/supabase-js@2";
const IMAGE_URL =
  "https://efaxdvjankrzmrmhbpxr.supabase.co/storage/v1/object/public/";
Deno.serve(async (req) => {
  try {
    //create supabase client
    const supabaseClient = createClient(
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
    //get the request payload
    const reqPayload = await req.json();
    const record = reqPayload.record;
    const bucket_id = record.bucket_id;
    const name = record.name;
    console.log(reqPayload);
    console.log("record:", record);
    console.log("bucket_id:", bucket_id);
    console.log("namee:", name);

    //construct url manually
    const public_url = IMAGE_URL + bucket_id + "/" + name;
    console.log("public_url:", public_url);
    //openai
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    //exp
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
    //exp
    //query spotify:
    const { data, error } = await supabaseClient.functions.invoke("spotify", {
      body: {
        "title": "Bohemian Rhapsody",
        "artist": "Queen",
      },
    });
    console.log("spotify data:", data);
    console.log("spotify error:", error);

    const reply = "hi";
    return new Response(reply, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
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
