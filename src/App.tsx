import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Input from "@/components/input/input";
import Output from "@/components/output/output";
import { AuthProvider } from "@/lib/supabase/auth/AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { MusicLoadingProvider } from "@/contexts/MusicLoadingContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="synesthesia-ui-theme">
      <AuthProvider>
        <MusicLoadingProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <div className="container mx-auto p-4">
              <div className="flex justify-center mb-8">
                <a href="https://vite.dev" target="_blank">
                  <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                  <img
                    src={reactLogo}
                    className="logo react"
                    alt="React logo"
                  />
                </a>
              </div>

              <div className="flex justify-center gap-16 w-full">
                <div className="max-w-md">
                  <Input />
                </div>
                <div className="max-w-md ">
                  <Output />
                </div>
              </div>
            </div>
          </SidebarProvider>
        </MusicLoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
