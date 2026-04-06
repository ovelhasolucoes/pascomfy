import { useState, useCallback } from "react";
import { storageService } from "@/services/storage/StorageService";
import type { FileType, UploadResult } from "@/services/storage/types";
import { toast } from "sonner";

interface UseFileUploadOptions {
  companyId: string;
  fileType: FileType;
  onSuccess?: (result: UploadResult) => void;
}

export function useFileUpload({ companyId, fileType, onSuccess }: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await storageService.upload(
        { file, companyId, fileType },
        setProgress
      );
      toast.success("Arquivo enviado com sucesso!");
      onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar arquivo";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, [companyId, fileType, onSuccess]);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
  }, []);

  return { upload, uploading, progress, error, reset };
}
