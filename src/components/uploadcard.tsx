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

export default function UploadCard() {
  return (
    <>
      hi
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
    </>
  );
}
