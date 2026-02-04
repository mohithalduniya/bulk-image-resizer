import { NextRequest, NextResponse } from "next/server";
import {
  QUALITY_DEFAULT,
  QUALITY_MAX,
  QUALITY_MIN,
} from "@/lib/constants";
import { createBatchZip, processBatchImages } from "@/lib/process";
import { getBatchWithFallback } from "@/lib/store";
import { formatKB, percentSaved } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const batchId = body?.batchId as string | undefined;
  const quality = Number(body?.quality ?? QUALITY_DEFAULT);

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId." }, { status: 400 });
  }

  if (Number.isNaN(quality) || quality < QUALITY_MIN || quality > QUALITY_MAX) {
    return NextResponse.json(
      { error: `Quality must be between ${QUALITY_MIN} and ${QUALITY_MAX}.` },
      { status: 400 }
    );
  }

  const batch = await getBatchWithFallback(batchId);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  if (batch.processedAt && batch.quality !== quality) {
    return NextResponse.json(
      { error: "This batch was already processed with a different quality." },
      { status: 409 }
    );
  }

  if (!batch.processedAt) {
    await processBatchImages(batch, quality);
  }

  if (!batch.zipId) {
    await createBatchZip(batch);
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
      savedPercent: img.processedSize
        ? percentSaved(img.originalSize, img.processedSize)
        : 0,
      compressedLabel: img.processedSize
        ? formatKB(img.processedSize)
        : null,
      error: img.error,
    })),
  });
}
