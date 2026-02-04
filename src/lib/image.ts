import { promises as fsp } from "fs";
import path from "path";
import sharp from "sharp";
import { MAX_WIDTH, PREVIEW_WIDTH } from "./constants";

type OutputFormat = "jpeg" | "png" | "webp";

export function mimeToFormat(mime: string): OutputFormat {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpeg";
}

export function formatToExt(format: OutputFormat) {
  if (format === "png") return "png";
  if (format === "webp") return "webp";
  return "jpg";
}

export function formatToMime(format: OutputFormat) {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "image/jpeg";
}

export async function createPreview(inputPath: string, previewPath: string) {
  await fsp.mkdir(path.dirname(previewPath), { recursive: true });
  await sharp(inputPath)
    .rotate()
    .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(previewPath);
}

export async function processImageToFormat(
  inputPath: string,
  outputPath: string,
  quality: number,
  format: OutputFormat
) {
  const image = sharp(inputPath).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const pipeline =
    width > MAX_WIDTH
      ? image.resize({ width: MAX_WIDTH, withoutEnlargement: true })
      : image;

  if (format === "png") {
    const compressionLevel = Math.max(
      0,
      Math.min(9, Math.round((100 - quality) / 10))
    );
    await pipeline.png({ compressionLevel, adaptiveFiltering: true }).toFile(outputPath);
    return;
  }

  if (format === "webp") {
    await pipeline.webp({ quality }).toFile(outputPath);
    return;
  }

  await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outputPath);
}
