"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAX_FILES = 100;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const QUALITY_MIN = 60;
const QUALITY_MAX = 85;
const QUALITY_DEFAULT = 75;

type LocalFile = {
  file: File;
  id: string;
  previewUrl: string;
};

export default function CompressPage() {
  const router = useRouter();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [quality, setQuality] = useState(QUALITY_DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<LocalFile[]>([]);

  useEffect(() => {
    fileRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      fileRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + item.file.size, 0),
    [files]
  );

  function validateAndAdd(newFiles: File[]) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const cleanFiles: LocalFile[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      if (!allowed.includes(file.type)) {
        errors.push(`${file.name} has an unsupported type.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 20 MB.`);
        return;
      }
      cleanFiles.push({
        file,
        id: `${file.name}-${file.size}-${file.lastModified}`,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (files.length + cleanFiles.length > MAX_FILES) {
      errors.push("You can upload up to 100 images per batch.");
    }

    if (errors.length) {
      setError(errors[0]);
      return;
    }

    setFiles((prev) => [...prev, ...cleanFiles].slice(0, MAX_FILES));
    setError(null);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files);
    validateAndAdd(dropped);
  }

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files ? Array.from(event.target.files) : [];
    validateAndAdd(picked);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function handleCompress() {
    if (!files.length) {
      setError("Add at least one image to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((item) => formData.append("files", item.file));

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const payload = await uploadRes.json();
        throw new Error(payload.error || "Upload failed.");
      }

      const uploadData = await uploadRes.json();

      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: uploadData.batchId, quality }),
      });

      if (!processRes.ok) {
        const payload = await processRes.json();
        throw new Error(payload.error || "Processing failed.");
      }

      const processData = await processRes.json();
      sessionStorage.setItem(
        `batch-${uploadData.batchId}`,
        JSON.stringify(processData)
      );
      router.push(`/results/${uploadData.batchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="text-xs uppercase tracking-[0.3em] text-muted" href="/">
            BulkResizer
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Upload & compress</h1>
        </div>
        <div className="text-sm text-muted">
          {files.length} / {MAX_FILES} images ·{" "}
          {(totalSize / (1024 * 1024)).toFixed(2)} MB
        </div>
      </div>

      <section
        className="soft-border glass mt-8 rounded-3xl p-6 shadow-soft"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sun)]/20 text-2xl">
            +
          </div>
          <div>
            <p className="text-lg font-semibold">
              Drag & drop images to start
            </p>
            <p className="text-sm text-muted">
              JPG, PNG, or WebP · up to 20 MB each · max 100 images
            </p>
          </div>
          <label className="cursor-pointer rounded-full bg-[var(--ink)] px-6 py-2 text-sm font-semibold text-white">
            Select files
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePick}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="soft-border glass rounded-3xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Batch overview</h2>
          <p className="text-sm text-muted">
            Preview images and remove any that you do not want to compress.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {files.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-muted">
                No images added yet.
              </div>
            )}
            {files.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-32 w-full rounded-xl object-cover"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span className="max-w-[120px] truncate">
                    {item.file.name}
                  </span>
                  <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  className="mt-3 text-xs font-semibold text-[var(--sea)]"
                  onClick={() => removeFile(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-border glass rounded-3xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Compression quality</h2>
          <p className="text-sm text-muted">
            Smaller size ↔ Better quality
          </p>
          <div className="mt-6">
            <input
              type="range"
              min={QUALITY_MIN}
              max={QUALITY_MAX}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="w-full accent-[var(--sea)]"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{QUALITY_MIN}%</span>
              <span className="text-sm font-semibold text-[var(--ink)]">
                {quality}%
              </span>
              <span>{QUALITY_MAX}%</span>
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-white/80 p-4 text-xs text-muted">
            We keep the original format, strip metadata, and only resize when
            width exceeds 1920px.
          </div>
          {error && (
            <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
          )}
          <button
            className="mt-6 w-full rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-black shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleCompress}
            disabled={loading}
          >
            {loading ? "Processing..." : "Compress now"}
          </button>
          {loading && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--leaf)]" />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
