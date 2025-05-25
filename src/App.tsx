import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import TabsDemo from "@/components/input/tabsdemo";
import Music from "@/components/output/music";
import { AuthProvider } from "@/lib/supabase/auth/AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="synesthesia-ui-theme">
      <AuthProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarTrigger />
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
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
