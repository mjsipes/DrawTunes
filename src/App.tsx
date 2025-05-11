import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import TabsDemo from "@/components/input/tabsdemo";
import Music from "@/components/output/music";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

function App() {
  const supabase = createClient();
  console.log("supabase", supabase);

  useEffect(() => {
    const ensureAuthenticated = async () => {
      try {
        // First check if there's an existing user
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser();

        if (user) {
          console.log("Existing user found:", user.id);
          return; // Exit early if user exists
        }

        if (getUserError) {
          console.error("Error checking user:", getUserError);
        }

        // No existing user, create anonymous user
        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: { full_name: "guest" },
          },
        });

        if (error) {
          console.error("Anonymous authentication error:", error);
        } else {
          console.log("Created anonymous user:", data.user?.id);
        }
      } catch (e) {
        console.error("Authentication process failed:", e);
      }
    };

    ensureAuthenticated();
  }, [supabase]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="flex justify-center space-x-16 w-full">
        <div className="flex justify-end w-1/2 pr-4">
          <div className="max-w-md">
            <TabsDemo />
          </div>
        </div>
        <div className="flex justify-start w-1/2 pl-4 mt-11">
          <div className="max-w-md">
            <Music />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
