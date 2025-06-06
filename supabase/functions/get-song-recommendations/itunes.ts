// iTunes API search function
export async function get_itunes_data(title: string, artist: string) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const url =
    `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    return {
      success: false,
      error: `iTunes search failed: ${response.status}`,
      query: `${title} ${artist}`,
    };
  }

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return {
      success: true,
      query: `${title} ${artist}`,
      track: data.results[0],
    };
  } else {
    return {
      success: false,
      query: `${title} ${artist}`,
      error: `No results found for "${title}" by ${artist}`,
    };
  }
}
