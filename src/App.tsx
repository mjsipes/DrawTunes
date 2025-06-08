import Input from "@/components/input/input";
import Header from "@/components/header";
import { AuthProvider } from "@/lib/supabase/AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { MusicProvider } from "@/contexts/CurrentDrawingContext";
import { AudioPlayer } from "@/components/audio-player";
import { RecommendationsTable } from "@/components/recommendations-table";
import { AISummary } from "@/components/ai-summary";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="synesthesia-ui-theme">
      <AuthProvider>
        <MusicProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <div className="container mx-auto p-4">
              <Header />

              <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 w-full">
                <div className="max-w-md">
                  <Input />
                </div>
                <div className="max-w-md">
                  <div className="w-[450px] space-y-2">
                    <AudioPlayer />
                    <AISummary />
                    <RecommendationsTable />
                  </div>
                </div>
              </div>
            </div>
          </SidebarProvider>
        </MusicProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
