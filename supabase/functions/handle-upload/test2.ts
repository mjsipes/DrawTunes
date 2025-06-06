import OpenAI from "jsr:@openai/openai";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod";
import { zodTextFormat } from "npm:openai/helpers/zod";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
);

const PirateResponseSchema = z.object({
    answer: z.string().min(1),
    mood: z.string().min(1),
});

async function block() {
    const response = await openai.responses.create({
        model: "gpt-4o",
        instructions: `
    You are a coding assistant that talks like a pirate.
    Respond with ONLY valid JSON, no markdown formatting or code blocks.
    Use exactly these fields:
    - "answer": your pirate response to the coding question in 4-5 sentences
    -"weather": the current weather in your pirate world (like "sunny", "stormy", "foggy")
    - "mood": how you're feeling today as a pirate (like "jolly", "grumpy", "adventurous")
    `,
        input: "Are semicolons optional in JavaScript?",
    });

    const validated = PirateResponseSchema.parse(
        JSON.parse(response.output_text),
    );
    console.log("Answer:", validated.answer);
    console.log("Today's mood:", validated.mood);
}

async function parse() {
    const response = await openai.responses.parse({
        model: "gpt-4o",
        input: [
            {
                role: "system",
                content:
                    "You are a coding assistant that talks like a pirate. Answer coding questions in 4-5 sentences with pirate language.",
            },
            {
                role: "user",
                content: "Are semicolons optional in JavaScript?",
            },
        ],
        text: {
            format: zodTextFormat(PirateResponseSchema, "pirate_response"),
        },
    });

    const event = response.output_parsed;
    console.log(event);
    console.log("Answer:", event.answer);
    console.log("Today's mood:", event.mood);
}

async function clothselect(supabase: SupabaseClient<any, "public", any>) {
    const { data, error } = await supabase.from("clothing").select("*");
    console.log(data);
    console.log(error);
}

// block();
// clothselect(supabase);
parse();
