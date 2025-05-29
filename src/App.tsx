import Input from "@/components/input/input";
import Output from "@/components/output/output";
import Header from "@/components/header";
import { AuthProvider } from "@/lib/supabase/AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { MusicProvider } from "@/contexts/CurrentDrawingContext";

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
                  <Output />
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
