import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";

export async function ensureDir(dirPath: string) {
  await fsp.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function safeUnlink(filePath: string) {
  try {
    await fsp.unlink(filePath);
  } catch {
    // ignore missing
  }
}

export async function safeRmDir(dirPath: string) {
  try {
    await fsp.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore missing
  }
}

export function toSafeFileName(name: string) {
  return name.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
}

export function stripExtension(name: string) {
  return path.parse(name).name;
}
