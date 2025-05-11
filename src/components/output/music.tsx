import Spotify from "./spotify";
import Loading from "./loading";
import { useState } from "react";
export default function Music() {
  const [loading, setLoading] = useState(true);

  return <>{loading ? <Loading /> : <Spotify />}</>;
}
