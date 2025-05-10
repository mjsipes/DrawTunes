import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TabsDemo() {
  return (
    <Tabs defaultValue="draw" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="draw">draw</TabsTrigger>
        <TabsTrigger value="upload">upload</TabsTrigger>
      </TabsList>
      <TabsContent value="draw">
        <Card>
          <CardHeader>
            <CardTitle>draw</CardTitle>
            <CardDescription>
              Make changes to your draw here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>upload</CardTitle>
            <CardDescription>
              Change your upload here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current upload</Label>
              <Input id="current" type="upload" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New upload</Label>
              <Input id="new" type="upload" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New upload</Label>
              <Input id="new" type="upload" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save upload</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
