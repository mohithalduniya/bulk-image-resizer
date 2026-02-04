import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getBatchWithFallback } from "@/lib/store";
import { fileExists } from "@/lib/fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const imageId = searchParams.get("imageId");
  const variant = searchParams.get("variant") ?? "original";

  if (!batchId || !imageId) {
    return NextResponse.json(
      { error: "Missing batchId or imageId." },
      { status: 400 }
    );
  }

  const batch = await getBatchWithFallback(batchId);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const image = batch.images.find((img) => img.id === imageId);
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const filePath =
    variant === "compressed" ? image.processedPath : image.previewPath;

  if (!filePath || !(await fileExists(filePath))) {
    return NextResponse.json({ error: "Image not ready." }, { status: 404 });
  }

  const contentType =
    variant === "compressed"
      ? image.outputMime || "application/octet-stream"
      : "image/webp";

  const stream = fs.createReadStream(filePath);
  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
