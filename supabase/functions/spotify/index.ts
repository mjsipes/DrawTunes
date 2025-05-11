import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Environment variables for your Spotify API credentials
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
    // Get access token
    const token = await getSpotifyToken();
    // Example: search for tracks
    const { query } = await req.json();
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/artists/0Y5tJX1MQlPlqiwlOH1tJY`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      },
    );
    const searchResults = await searchResponse.json();
    return new Response(JSON.stringify(searchResults), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
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
