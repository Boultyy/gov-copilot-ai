import { useCallback, useState } from "react";
import { FileText, UploadCloud, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DroppedFile = { 
  id?: string;
  name: string; 
  size: string; 
  pages?: number | null; 
  status?: string | null;
  error?: string | null;
  file?: File;
};

export function Dropzone({
  files,
  onAdd,
  onRemove,
  hint = "PDF, DOCX up to 25 MB",
  className,
}: {
  files: DroppedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (file: DroppedFile) => void;
  hint?: string;
  className?: string;
}) {
  const [over, setOver] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      onAdd(Array.from(list));
    },
    [onAdd],
  );

  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'ready': return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
      case 'processing': return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />;
      case 'failed': return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
      default: return <FileText className="h-4 w-4 shrink-0 text-primary" />;
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'ready': return "text-success";
      case 'failed': return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-9 text-center transition-all duration-300",
          over && "border-primary bg-accent/60 scale-[1.01]",
        )}
      >
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-foreground">
          Drag & drop files here, or click to browse
        </span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, idx) => (
            <li
              key={f.id || `${f.name}-${idx}`}
              className="animate-rise flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
            >
              {getStatusIcon(f.status)}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{f.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {f.size}
                  {f.pages ? ` · ${f.pages} pages` : ""} 
                  <span className={cn("capitalize ml-1 font-semibold", getStatusColor(f.status))}>
                    · {f.status || 'Uploading...'}
                  </span>
                </span>
                {f.error && (
                  <span className="block text-[10px] text-destructive truncate mt-0.5">
                    {f.error}
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(f)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
