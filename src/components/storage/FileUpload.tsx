import { useCallback, useRef, useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { FileType, UploadResult } from "@/services/storage/types";

interface FileUploadProps {
  companyId: string;
  fileType: FileType;
  accept?: string;
  maxSizeMb?: number;
  onUploadComplete?: (result: UploadResult) => void;
  className?: string;
}

const ACCEPT_MAP: Record<FileType, string> = {
  imagem: "image/*",
  video: "video/*",
  documento: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
};

export function FileUpload({
  companyId,
  fileType,
  accept,
  maxSizeMb,
  onUploadComplete,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { upload, uploading, progress, error, reset } = useFileUpload({
    companyId,
    fileType,
    onSuccess: (result) => {
      setSelectedFile(null);
      onUploadComplete?.(result);
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        return;
      }
      setSelectedFile(file);
      reset();
    },
    [maxSizeMb, reset]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  const handleUpload = useCallback(() => {
    if (selectedFile) upload(selectedFile);
  }, [selectedFile, upload]);

  const effectiveAccept = accept || ACCEPT_MAP[fileType];

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors min-h-[120px]",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Arraste um arquivo ou clique para selecionar
        </p>
        {maxSizeMb && (
          <p className="text-xs text-muted-foreground">
            Máximo: {maxSizeMb}MB
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={effectiveAccept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              reset();
            }}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {uploading && <Progress value={progress} className="h-2" />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedFile && !uploading && (
        <Button onClick={handleUpload} className="w-full min-h-[44px]">
          <Upload className="h-4 w-4 mr-2" />
          Enviar arquivo
        </Button>
      )}
    </div>
  );
}
