import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sea)] text-white">
            BR
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">BulkResizer</p>
            <p className="text-xs text-muted">Batch image compression</p>
          </div>
        </div>
        <Link
          className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm font-semibold text-white shadow-soft"
          href="/compress"
        >
          Start compressing
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]">
            Minimal quality loss
          </div>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Resize and compress up to 100 images in one go.
          </h1>
          <p className="text-lg text-muted">
            Reduce large images from MB to web-friendly KB sizes, keep the
            original format, and preserve the details that matter. Designed for
            creators, teams, and product pages that need speed without harsh
            artifacts.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-black shadow-soft"
              href="/compress"
            >
              Upload images
            </Link>
            <a
              className="rounded-full border border-black/15 bg-white/70 px-6 py-3 text-sm font-semibold text-black"
              href="#features"
            >
              See how it works
            </a>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted">
            <span>Original format kept</span>
            <span>Up to 20 MB per file</span>
            <span>No login required</span>
          </div>
        </div>

        <div className="glass shadow-soft soft-border rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Real-world preview</p>
            <span className="rounded-full bg-[var(--leaf)]/10 px-3 py-1 text-xs text-[var(--leaf)]">
              Quality: 75%
            </span>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Original</span>
                <span className="text-muted">4.8 MB</span>
              </div>
              <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-[#fce8cf] to-[#f3c88b]" />
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Compressed image</span>
                <span className="text-muted">410 KB</span>
              </div>
              <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-[#d7f0e2] to-[#7cc4aa]" />
              <p className="mt-3 text-xs text-muted">
                Approx. 91% smaller with minimal visible loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 md:grid-cols-3"
      >
        {[
          {
            title: "Smart resizing",
            text: "Only images wider than 1920px are resized. Smaller files keep their original dimensions.",
          },
          {
            title: "Metadata stripped",
            text: "EXIF, GPS, and camera data are removed to reduce size and protect privacy.",
          },
          {
            title: "ZIP in one click",
            text: "Batch download all optimized images at once in their original formats.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="soft-border glass rounded-2xl p-6 shadow-soft"
          >
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-3 text-sm text-muted">{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="soft-border glass rounded-3xl p-8 shadow-soft md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Ready to compress?</h2>
              <p className="mt-2 text-sm text-muted">
                Upload your batch, pick a quality level, and download optimized
                files in minutes.
              </p>
            </div>
            <Link
              className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white"
              href="/compress"
            >
              Go to upload
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-12 text-xs text-muted">
        <p>
          Files are processed temporarily and auto-deleted. This tool prioritizes
          practical compression without misleading claims.
        </p>
      </footer>
    </main>
  );
}
