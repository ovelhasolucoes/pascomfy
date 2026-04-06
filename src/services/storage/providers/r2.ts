import type { StorageProvider, UploadParams, UploadResult } from "../types";

export class R2StorageProvider implements StorageProvider {
  async upload(_params: UploadParams, _onProgress?: (pct: number) => void): Promise<UploadResult> {
    throw new Error("R2 provider not implemented yet. Configure VITE_STORAGE_PROVIDER=supabase.");
  }

  async getFileUrl(_path: string): Promise<string> {
    throw new Error("R2 provider not implemented yet.");
  }

  async deleteFile(_fileId: string, _path: string): Promise<void> {
    throw new Error("R2 provider not implemented yet.");
  }
}
