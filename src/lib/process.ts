import { createWriteStream, promises as fsp } from "fs";
import path from "path";
import archiver from "archiver";
import pLimit from "p-limit";
import { nanoid } from "nanoid";
import { PROCESS_CONCURRENCY } from "./constants";
import {
  formatToExt,
  formatToMime,
  mimeToFormat,
  processImageToFormat,
} from "./image";
import { ensureDir, safeUnlink, stripExtension, toSafeFileName } from "./fs";
import { processedDir, zipDir } from "./paths";
import { indexZip, persistBatch } from "./store";
import type { BatchRecord, ImageRecord } from "./types";

export async function processBatchImages(batch: BatchRecord, quality: number) {
  const limit = pLimit(PROCESS_CONCURRENCY);
  const tasks = batch.images.map((image) =>
    limit(async () => {
      await processSingleImage(batch, image, quality);
    })
  );
  await Promise.allSettled(tasks);
  batch.quality = quality;
  batch.processedAt = Date.now();
  await persistBatch(batch);
}

async function processSingleImage(
  batch: BatchRecord,
  image: ImageRecord,
  quality: number
) {
  if (image.status === "done") return;
  image.status = "processing";
  try {
    const outputDir = processedDir(batch.id);
    await ensureDir(outputDir);
    const safeBase = toSafeFileName(stripExtension(image.originalName));
    const format = mimeToFormat(image.mime);
    const ext = formatToExt(format);
    const outputPath = path.join(outputDir, `${safeBase}-${image.id}.${ext}`);
    await processImageToFormat(image.originalPath, outputPath, quality, format);
    const stat = await fsp.stat(outputPath);
    image.processedPath = outputPath;
    image.processedSize = stat.size;
    image.outputExt = ext;
    image.outputMime = formatToMime(format);
    image.status = "done";
    await safeUnlink(image.originalPath);
  } catch (error) {
    image.status = "failed";
    image.error = error instanceof Error ? error.message : "Processing failed";
  }
}

export async function createBatchZip(batch: BatchRecord) {
  const zipId = nanoid();
  const zipFolder = zipDir(batch.id);
  await ensureDir(zipFolder);
  const zipPath = path.join(zipFolder, `${zipId}.zip`);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    output.on("error", (err) => reject(err));
   archive.on("error", (err: Error) => reject(err));


    archive.pipe(output);

    batch.images
      .filter((img) => img.status === "done" && img.processedPath)
      .forEach((img) => {
        if (!img.processedPath) return;
        archive.file(img.processedPath, {
          name: path.basename(img.processedPath),
        });
      });

    archive.finalize();
  });

  batch.zipId = zipId;
  batch.zipPath = zipPath;
  indexZip(zipId, batch.id);
  await persistBatch(batch);

  return { zipId, zipPath };
}
