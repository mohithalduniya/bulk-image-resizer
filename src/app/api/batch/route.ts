import { NextRequest, NextResponse } from "next/server";
import { getBatchWithFallback } from "@/lib/store";
import { formatKB, percentSaved } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId." }, { status: 400 });
  }

  const batch = await getBatchWithFallback(batchId);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  return NextResponse.json({
    batchId: batch.id,
    zipId: batch.zipId,
    quality: batch.quality,
    images: batch.images.map((img) => ({
      id: img.id,
      name: img.originalName,
      status: img.status,
      outputExt: img.outputExt,
      originalSize: img.originalSize,
      processedSize: img.processedSize ?? 0,
      savedPercent: percentSaved(img.originalSize, img.processedSize ?? 0),
      compressedLabel: img.processedSize
        ? formatKB(img.processedSize)
        : null,
      error: img.error,
    })),
  });
}
