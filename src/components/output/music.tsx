import Spotify from "./spotify";
import Loading from "./loading";
import { useState } from "react";
export default function Music() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <div className="w-[450px] h-[360px]">
        {loading ? <Loading /> : <Spotify />}
      </div>
    </>
  );
}
