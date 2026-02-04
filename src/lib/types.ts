export type ImageStatus = "uploaded" | "processing" | "done" | "failed";

export type ImageRecord = {
  id: string;
  originalName: string;
  originalPath: string;
  previewPath: string;
  processedPath?: string;
  outputExt?: string;
  outputMime?: string;
  originalSize: number;
  processedSize?: number;
  width: number;
  height: number;
  mime: string;
  status: ImageStatus;
  error?: string;
};

export type BatchRecord = {
  id: string;
  createdAt: number;
  images: ImageRecord[];
  quality?: number;
  processedAt?: number;
  zipId?: string;
  zipPath?: string;
};
