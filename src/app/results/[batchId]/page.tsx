"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ImageResult = {
  id: string;
  name: string;
  status: "uploaded" | "processing" | "done" | "failed";
  originalSize: number;
  processedSize: number;
  savedPercent: number;
  compressedLabel: string | null;
  error?: string;
};

type BatchResult = {
  batchId: string;
  zipId?: string;
  quality?: number;
  images: ImageResult[];
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(bytes / 1024, 0.01).toFixed(2)} KB`;
}

export default function ResultsPage() {
  const params = useParams<{ batchId: string }>();
  const batchId = params?.batchId;
  const [data, setData] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    const cached = sessionStorage.getItem(`batch-${batchId}`);
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch {
        // ignore
      }
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/batch?batchId=${batchId}`);
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload.error || "Failed to load batch.");
        }
        const payload = await res.json();
        setData(payload);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load results.");
        setLoading(false);
      }
    };

    load();
  }, [batchId]);

  const summary = useMemo(() => {
    if (!data) return null;
    const totalOriginal = data.images.reduce(
      (sum, img) => sum + (img.originalSize || 0),
      0
    );
    const totalCompressed = data.images.reduce(
      (sum, img) => sum + (img.processedSize || 0),
      0
    );
    return { totalOriginal, totalCompressed };
  }, [data]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="text-xs uppercase tracking-[0.3em] text-muted" href="/">
            BulkResizer
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Results</h1>
        </div>
        <Link
          className="rounded-full border border-black/10 bg-white/70 px-5 py-2 text-sm font-semibold"
          href="/compress"
        >
          New batch
        </Link>
      </div>

      {loading && (
        <div className="soft-border glass mt-10 rounded-3xl p-6 shadow-soft">
          <p className="text-sm text-muted">Loading results...</p>
        </div>
      )}

      {error && (
        <div className="soft-border glass mt-10 rounded-3xl p-6 shadow-soft">
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}

      {data && summary && (
        <>
          <section className="soft-border glass mt-8 rounded-3xl p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Batch summary</p>
                <p className="text-xl font-semibold">
                  {data.images.length} images · Quality {data.quality}%
                </p>
              </div>
              {data.zipId && (
                <a
                  className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-black shadow-soft"
                  href={`/api/zip?batchId=${data.batchId}`}
                >
                  Download ZIP
                </a>
              )}
            </div>
            <div className="mt-4 grid gap-4 text-sm text-muted sm:grid-cols-3">
              <div>
                <span className="block text-xs uppercase tracking-[0.2em]">
                  Original total
                </span>
                <span className="text-base font-semibold text-[var(--ink)]">
                  {formatBytes(summary.totalOriginal)}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-[0.2em]">
                  Compressed total
                </span>
                <span className="text-base font-semibold text-[var(--ink)]">
                  {formatBytes(summary.totalCompressed)}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-[0.2em]">
                  Output format
                </span>
                <span className="text-base font-semibold text-[var(--ink)]">
                  Original formats
                </span>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            {data.images.map((img) => (
              <div
                key={img.id}
                className="soft-border glass rounded-3xl p-5 shadow-soft"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{img.name}</span>
                  <span className="text-muted">
                    {img.savedPercent}% saved
                  </span>
                </div>
                {img.status === "failed" ? (
                  <p className="mt-4 text-sm text-red-600">
                    {img.error || "Processing failed."}
                  </p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted">Original</p>
                      <img
                        src={`/api/preview?batchId=${data.batchId}&imageId=${img.id}&variant=original`}
                        alt={`Original ${img.name}`}
                        className="mt-2 h-40 w-full rounded-2xl object-cover"
                      />
                      <p className="mt-2 text-xs text-muted">
                        {formatBytes(img.originalSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Compressed</p>
                      <img
                        src={`/api/preview?batchId=${data.batchId}&imageId=${img.id}&variant=compressed`}
                        alt={`Compressed ${img.name}`}
                        className="mt-2 h-40 w-full rounded-2xl object-cover"
                      />
                      <p className="mt-2 text-xs text-muted">
                        {img.compressedLabel || "Processing..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
