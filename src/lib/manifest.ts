import { promises as fsp } from "fs";
import { ensureDir } from "./fs";
import { batchDir, manifestPath } from "./paths";
import type { BatchRecord } from "./types";

export async function saveBatchManifest(batch: BatchRecord) {
  await ensureDir(batchDir(batch.id));
  const path = manifestPath(batch.id);
  await fsp.writeFile(path, JSON.stringify(batch, null, 2), "utf-8");
}

export async function loadBatchManifest(batchId: string) {
  try {
    const raw = await fsp.readFile(manifestPath(batchId), "utf-8");
    return JSON.parse(raw) as BatchRecord;
  } catch {
    return null;
  }
}
