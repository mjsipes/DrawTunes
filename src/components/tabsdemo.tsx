import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DrawCard from "./drawcard";
import UploadCard from "./uploadcard";

export default function TabsDemo() {
  return (
    <Tabs defaultValue="draw" className="w-[500px]">
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
  );
}
