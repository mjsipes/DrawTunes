export default function Spotify() {
  // const [playlistId, setPlaylistId] = useState("6Ceh7dashSY2Z9gl5N3Fvy");
  const playlistId = "6Ceh7dashSY2Z9gl5N3Fvy";
  return (
    <div className="border rounded-xl shadow-sm">
      <iframe
        title="Spotify Embed: Recommendation Playlist "
        src={`https://open.spotify.com/embed/playlist/6Ceh7dashSY2Z9gl5N3Fvy?utm_source=generator&theme=0`}
        width="100%"
        height="100%"
        style={{ height: "360px" }}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
