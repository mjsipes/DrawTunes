import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import TabsDemo from "@/components/tabsdemo.tsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <TabsDemo />
    </>
  );
}

export default App;
