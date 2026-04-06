export type FileType = 'imagem' | 'video' | 'documento';

export interface UploadParams {
  file: File;
  companyId: string;
  fileType: FileType;
}

export interface UploadResult {
  fileId: string;
  path: string;
}

export interface StorageProvider {
  upload(params: UploadParams, onProgress?: (pct: number) => void): Promise<UploadResult>;
  getFileUrl(path: string): Promise<string>;
  deleteFile(fileId: string, path: string): Promise<void>;
}
