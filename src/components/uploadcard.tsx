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
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";

export default function UploadCard() {
  const props = useSupabaseUpload({
    bucketName: "test",
    path: "test",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10, // 10MB,
  });
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Upload for Music</CardTitle>
          <CardDescription>
            Upload something and we'll recommend Spotify tracks that match your
            art.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </CardContent>
      </Card>
    </>
  );
}
