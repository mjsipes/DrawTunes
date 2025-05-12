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
    // Check if it's a POST request
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body to get title and artist
    const requestData = await req.json();
    const { title, artist } = requestData;

    if (!title || !artist) {
      return new Response(
        JSON.stringify({ error: "Title and artist parameters are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get access token
    const token = await getSpotifyToken();

    // Create search query
    const query = encodeURIComponent(`track:${title} artist:${artist}`);

    // Search for tracks
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=2`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      },
    );

    const searchResults = await searchResponse.json();

    // Return the search results
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
