import { AuthProvider } from "@/lib/supabase/AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AudioPlayer } from "@/components/audio-player";
import { RecommendationsTable } from "@/components/recommendations-table";
import { AISummary } from "@/components/ai-summary";
import DrawCard from "@/components/drawcard";
import UploadCard from "@/components/uploadcard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataProvider } from "@/lib/supabase/DataProvider";
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (

    <ThemeProvider defaultTheme="system" storageKey="synesthesia-ui-theme">
      <AuthProvider>
        <DataProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger className="hidden sm:block"/>
            <Analytics/>
            <div className="container mx-auto p-4 justify-center items-center">
              <div className="text-center sm:mb-6">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
                  DrawTunes
                </h1>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-4 w-full">
                <div className="flex justify-center">
                  <Tabs defaultValue="draw" className="w-[350px] sm:w-[450px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="draw">Draw</TabsTrigger>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="draw">
                      <DrawCard />
                    </TabsContent>
                    <TabsContent value="upload">
                      <UploadCard />
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="flex justify-center">
                  <div className="w-[350px] sm:w-[450px] space-y-2">
                    <AudioPlayer />
                    <AISummary />
                    <RecommendationsTable />
                  </div>
                </div>
              </div>
            </div>
          </SidebarProvider>
          </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
