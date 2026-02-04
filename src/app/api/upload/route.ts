import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import sharp from "sharp";
import {
  ALLOWED_MIME,
  MAX_FILE_SIZE,
  MAX_FILES,
} from "@/lib/constants";
import { ensureDir, safeUnlink } from "@/lib/fs";
import { createPreview } from "@/lib/image";
import { originalDir, previewDir } from "@/lib/paths";
import {
  addImageToBatch,
  cleanupBatch,
  createBatch,
  persistBatch,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 415 }
    );
  }

  if (!req.body) {
    return NextResponse.json({ error: "Missing request body." }, { status: 400 });
  }

  const batch = createBatch();
  await ensureDir(originalDir(batch.id));
  await ensureDir(previewDir(batch.id));

  const errors: string[] = [];
  const filePromises: Promise<void>[] = [];
  let fileCount = 0;

  const bb = Busboy({
    headers: Object.fromEntries(req.headers.entries()),
    limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE },
  });

  bb.on("file", (name, file, info) => {
    fileCount += 1;
    const { filename, mimeType } = info;

    if (fileCount > MAX_FILES) {
      errors.push("Too many files in a single batch.");
      file.resume();
      return;
    }

    const ext = ALLOWED_MIME[mimeType];
    if (!ext) {
      errors.push(`Unsupported file type: ${mimeType}`);
      file.resume();
      return;
    }

    const id = nanoid();
    const originalPath = path.join(originalDir(batch.id), `${id}.${ext}`);
    const previewPath = path.join(previewDir(batch.id), `${id}.webp`);

    let size = 0;
    const writeStream = fs.createWriteStream(originalPath);

    file.on("data", (data) => {
      size += data.length;
    });

    file.on("error", (err) => {
      errors.push(err.message);
    });

    file.on("limit", () => {
      errors.push(`File ${filename} exceeds the 20 MB limit.`);
      file.unpipe(writeStream);
      writeStream.destroy();
      safeUnlink(originalPath);
    });

    const stored = new Promise<void>((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("close", resolve);
      writeStream.on("error", reject);
    });

    file.pipe(writeStream);

    const recordPromise = stored.then(async () => {
      if (errors.length) return;
      const metadata = await sharp(originalPath).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      await createPreview(originalPath, previewPath);
      addImageToBatch(batch.id, {
        id,
        originalName: filename || `image-${id}.${ext}`,
        originalPath,
        previewPath,
        originalSize: size,
        width,
        height,
        mime: mimeType,
        status: "uploaded",
      });
    });

    filePromises.push(recordPromise);
  });

  bb.on("filesLimit", () => {
    errors.push("You can upload up to 100 images at once.");
  });

  bb.on("error", (error) => {
    errors.push(error.message);
  });

  await new Promise<void>((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", reject);
    Readable.fromWeb(req.body as any).pipe(bb);
  });

  await Promise.allSettled(filePromises);

  if (errors.length) {
    await cleanupBatch(batch.id);
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  if (!batch.images.length) {
    await cleanupBatch(batch.id);
    return NextResponse.json(
      { error: "No valid files were uploaded." },
      { status: 400 }
    );
  }

  await persistBatch(batch);

  return NextResponse.json({
    batchId: batch.id,
    images: batch.images.map((img) => ({
      id: img.id,
      name: img.originalName,
      size: img.originalSize,
      width: img.width,
      height: img.height,
      mime: img.mime,
    })),
  });
}
