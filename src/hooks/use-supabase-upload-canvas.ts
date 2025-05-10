// hooks/use-supabase-upload-canvas.ts
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Use your existing Supabase client or create a new instance
const supabase = createClient();

export function useSupabaseUploadCanvas(options: {
  bucketName: string;
  path: string;
  maxFileSize?: number;
}) {
  const { bucketName, path, maxFileSize = 10 * 1024 * 1024 } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const uploadCanvasImage = async (blob: Blob, fileName?: string) => {
    setIsUploading(true);
    setError(null);

    try {
      if (blob.size > maxFileSize) {
        throw new Error(
          `File size exceeds the ${maxFileSize / (1024 * 1024)}MB limit`
        );
      }

      const fileExt = "png";
      const finalFileName =
        fileName || `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${path ? path + "/" : ""}${finalFileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadedPath(data?.path || null);
      return data?.path || null;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload image";
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return data?.publicUrl;
  };

  return {
    isUploading,
    error,
    uploadedPath,
    uploadCanvasImage,
    getPublicUrl,
  };
}
