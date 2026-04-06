import { supabase } from "@/integrations/supabase/client";
import type { StorageProvider, UploadParams, UploadResult } from "../types";

const BUCKET = "company-files";

export class SupabaseStorageProvider implements StorageProvider {
  async upload(params: UploadParams, onProgress?: (pct: number) => void): Promise<UploadResult> {
    const { file, companyId, fileType } = params;

    // 1. Get signed upload URL from edge function
    onProgress?.(5);

    const { data, error } = await supabase.functions.invoke("generate-upload-url", {
      body: {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        companyId,
        fileType,
      },
    });

    if (error || !data?.signedUrl) {
      throw new Error(data?.error || error?.message || "Failed to get upload URL");
    }

    onProgress?.(20);

    // 2. Upload file directly to signed URL
    const uploadRes = await fetch(data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.statusText}`);
    }

    onProgress?.(100);

    return {
      fileId: data.fileId,
      path: data.path,
    };
  }

  async getFileUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600); // 1h expiry

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Failed to generate URL");
    }

    return data.signedUrl;
  }

  async deleteFile(fileId: string, path: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (storageError) {
      throw new Error(storageError.message);
    }

    // Delete record from files table
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      throw new Error(dbError.message);
    }
  }
}
