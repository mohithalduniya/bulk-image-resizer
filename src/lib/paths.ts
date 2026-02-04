import path from "path";

export const TMP_ROOT = path.join(process.cwd(), "tmp");

export const batchDir = (batchId: string) => path.join(TMP_ROOT, batchId);
export const originalDir = (batchId: string) =>
  path.join(batchDir(batchId), "original");
export const previewDir = (batchId: string) =>
  path.join(batchDir(batchId), "preview");
export const processedDir = (batchId: string) =>
  path.join(batchDir(batchId), "processed");
export const zipDir = (batchId: string) => path.join(batchDir(batchId), "zip");
export const manifestPath = (batchId: string) =>
  path.join(batchDir(batchId), "manifest.json");
