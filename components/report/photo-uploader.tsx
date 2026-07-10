"use client";

import * as React from "react";
import { Camera, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processPhotos } from "@/lib/image-processing";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 5;

interface PhotoUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
}

export function PhotoUploader({ value, onChange }: PhotoUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const previews = React.useMemo(() => value.map((f) => URL.createObjectURL(f)), [value]);

  React.useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setErrors([]);

    const incoming = Array.from(fileList).slice(0, MAX_PHOTOS - value.length);
    if (incoming.length === 0) {
      setErrors([`You can upload up to ${MAX_PHOTOS} photos.`]);
      return;
    }

    setIsProcessing(true);
    setProgress({ done: 0, total: incoming.length });

    const { processed, errors: processingErrors } = await processPhotos(incoming, (done, total) =>
      setProgress({ done, total })
    );

    onChange([...value, ...processed]);
    setErrors(processingErrors);
    setIsProcessing(false);
    setProgress(null);

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
        Photos are visible only to moderators, never shown publicly. Location
        and camera metadata is removed from every photo in your browser
        before it uploads.
      </p>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((src, i) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-input border border-border">
              {/* Local blob: URL preview of a just-picked file — next/image's
                  optimizer doesn't apply to blob URLs, so plain <img> is correct here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Upload preview ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_PHOTOS && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            capture="environment"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="sr-only"
            id="photo-upload-input"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isProcessing}
            onClick={() => inputRef.current?.click()}
            className={cn(isProcessing && "opacity-70")}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing {progress ? `${progress.done}/${progress.total}` : "…"}
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" aria-hidden="true" />
                Add photo{value.length > 0 ? "s" : " (optional)"}
              </>
            )}
          </Button>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="space-y-0.5">
          {errors.map((err) => (
            <li key={err} className="text-xs text-destructive">
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
