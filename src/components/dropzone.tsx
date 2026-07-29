import { useCallback, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DroppedFile = { name: string; size: string; pages?: number };

export function Dropzone({
  files,
  onAdd,
  onRemove,
  hint = "PDF, DOCX up to 25 MB",
  className,
}: {
  files: DroppedFile[];
  onAdd: (files: DroppedFile[]) => void;
  onRemove: (name: string) => void;
  hint?: string;
  className?: string;
}) {
  const [over, setOver] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      onAdd(
        Array.from(list).map((f) => ({
          name: f.name,
          size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        })),
      );
    },
    [onAdd],
  );

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
        <span className="gradient-primary grid h-11 w-11 place-items-center rounded-full text-primary-foreground">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-foreground">
          Drag & drop files here, or click to browse
        </span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="animate-rise flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{f.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {f.size}
                  {f.pages ? ` · ${f.pages} pages` : ""} · Indexed
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(f.name)}
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
