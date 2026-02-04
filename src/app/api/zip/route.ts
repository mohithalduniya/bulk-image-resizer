import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { findBatchByZipId, getBatchWithFallback, scheduleCleanup } from "@/lib/store";
import { fileExists } from "@/lib/fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zipId = searchParams.get("zipId");
  const batchId = searchParams.get("batchId");

  if (!zipId && !batchId) {
    return NextResponse.json(
      { error: "Missing zipId or batchId." },
      { status: 400 }
    );
  }

  const batch = batchId
    ? await getBatchWithFallback(batchId)
    : findBatchByZipId(zipId!);
  if (!batch?.zipPath) {
    return NextResponse.json({ error: "ZIP not found." }, { status: 404 });
  }

  if (!(await fileExists(batch.zipPath))) {
    return NextResponse.json({ error: "ZIP not ready." }, { status: 404 });
  }

  const stream = fs.createReadStream(batch.zipPath);
  scheduleCleanup(batch.id, 2 * 60 * 1000);

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="compressed-${batch.id}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
