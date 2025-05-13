// spotify.ts
const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET") || "";

export async function getSpotifyToken() {
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

export async function searchTrack(
    token: string,
    title: string,
    artist: string,
    market = "US",
) {
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
