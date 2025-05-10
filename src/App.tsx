import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import TabsDemo from "@/components/tabsdemo.tsx";

function App() {
  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <div className="flex justify-center mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="w-full">
        <TabsDemo />
      </div>
    </div>
  );
}

export default App;
