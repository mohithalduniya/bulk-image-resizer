import { nanoid } from "nanoid";
import { CLEANUP_TTL_MS } from "./constants";
import { safeRmDir } from "./fs";
import { batchDir } from "./paths";
import { loadBatchManifest, saveBatchManifest } from "./manifest";
import type { BatchRecord, ImageRecord } from "./types";

const batches = new Map<string, BatchRecord>();
const zipIndex = new Map<string, string>();
const cleanupTimers = new Map<string, NodeJS.Timeout>();

export function createBatch() {
  const id = nanoid();
  const batch: BatchRecord = {
    id,
    createdAt: Date.now(),
    images: [],
  };
  batches.set(id, batch);
  scheduleCleanup(id, CLEANUP_TTL_MS);
  return batch;
}

export function getBatch(batchId: string) {
  return batches.get(batchId);
}

export async function getBatchWithFallback(batchId: string) {
  const inMemory = batches.get(batchId);
  if (inMemory) return inMemory;
  const loaded = await loadBatchManifest(batchId);
  if (loaded) {
    batches.set(batchId, loaded);
  }
  return loaded ?? undefined;
}

export function addImageToBatch(batchId: string, image: ImageRecord) {
  const batch = batches.get(batchId);
  if (!batch) return;
  batch.images.push(image);
}

export function updateBatch(batch: BatchRecord) {
  batches.set(batch.id, batch);
}

export async function persistBatch(batch: BatchRecord) {
  batches.set(batch.id, batch);
  await saveBatchManifest(batch);
}

export function indexZip(zipId: string, batchId: string) {
  zipIndex.set(zipId, batchId);
}

export function findBatchByZipId(zipId: string) {
  const batchId = zipIndex.get(zipId);
  return batchId ? batches.get(batchId) : undefined;
}

export function scheduleCleanup(batchId: string, ttlMs: number) {
  const existing = cleanupTimers.get(batchId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    cleanupBatch(batchId);
  }, ttlMs);
  cleanupTimers.set(batchId, timer);
}

export async function cleanupBatch(batchId: string) {
  cleanupTimers.delete(batchId);
  const batch = batches.get(batchId);
  if (batch?.zipId) {
    zipIndex.delete(batch.zipId);
  }
  batches.delete(batchId);
  await safeRmDir(batchDir(batchId));
}

const sweepInterval = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, batch] of batches) {
    if (now - batch.createdAt > CLEANUP_TTL_MS) {
      cleanupBatch(id);
    }
  }
}, sweepInterval).unref();
