// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
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

// Function to search for a single track
async function searchTrack(token, title, artist, market = "US") {
  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const url =
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1&market=${market}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error:
        `Error searching for "${title}" by ${artist}: ${response.status} ${errorText}`,
      query: `track:${title} artist:${artist}`,
    };
  }

  const data = await response.json();

  if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
    return {
      success: true,
      query: `track:${title} artist:${artist}`,
      track: data.tracks.items[0],
    };
  } else {
    return {
      success: false,
      query: `track:${title} artist:${artist}`,
      error: `No results found for "${title}" by ${artist}`,
    };
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    const requestData = await req.json();

    // Get the list of songs
    const {
      songs = [], // Array of song objects with title and artist
      market = "US", // Market code
    } = requestData;

    // Validate songs array
    if (!Array.isArray(songs) || songs.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Please provide an array of songs in the format [{title: '...', artist: '...'}]",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if songs have required fields
    for (const song of songs) {
      if (!song.title || !song.artist) {
        return new Response(
          JSON.stringify({
            error: "Each song must have both 'title' and 'artist' fields",
            invalidSong: song,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Get access token
    const token = await getSpotifyToken();

    // Search for each song in parallel
    const searchPromises = songs.map((song) =>
      searchTrack(token, song.title, song.artist, market)
    );

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);

    // Extract track IDs from successful searches
    const trackIds = results
      .filter((result) => result.success && result.track && result.track.id)
      .map((result) => result.track.id);

    // If we have track IDs, fetch detailed information
    let detailedTracks = [];
    if (trackIds.length > 0) {
      // Split into chunks of 50 (Spotify API limit)
      const chunkSize = 50;
      for (let i = 0; i < trackIds.length; i += chunkSize) {
        const chunk = trackIds.slice(i, i + chunkSize);
        const idsParam = chunk.join(",");

        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/tracks?ids=${idsParam}&market=${market}`,
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

    // Combine search results with detailed track information
    const finalResults = results.map((result) => {
      if (result.success && result.track) {
        // Find the detailed track info if available
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

    // Return the results
    return new Response(
      JSON.stringify({
        totalRequested: songs.length,
        totalFound: trackIds.length,
        results: finalResults,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/spotify-rec' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
