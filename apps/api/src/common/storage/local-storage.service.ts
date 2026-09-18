import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import { parseLocalFlowAssetPath } from "./storage-url";
import { StorageService, type UploadImageInput } from "./storage.service";

const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
} as const;

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly publicDir = resolve(
    process.env.LOCAL_STORAGE_PUBLIC_DIR ?? resolve(process.cwd(), "../web/public")
  );
  private readonly baseUrl = process.env.LOCAL_STORAGE_BASE_URL ?? "";

  async uploadImage(input: UploadImageInput): Promise<{ url: string }> {
    const extension = MIME_EXTENSIONS[input.mimeType as keyof typeof MIME_EXTENSIONS];
    const relativePath = join(
      "uploads",
      "flows",
      input.flowId,
      `${input.kind}-${randomUUID()}${extension}`
    );
    const absolutePath = this.toAbsolutePath(relativePath);

    await mkdir(resolve(absolutePath, ".."), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      url: `${this.baseUrl}/${relativePath.replaceAll("\\", "/")}`
    };
  }

  async delete(url: string | null | undefined): Promise<void> {
    if (!url || !parseLocalFlowAssetPath(url)) {
      return;
    }

    const relativePath = url.replace(/^\//, "");
    const absolutePath = this.toAbsolutePath(relativePath);

    await rm(absolutePath, { force: true });
  }

  private toAbsolutePath(relativePath: string) {
    const absolutePath = resolve(this.publicDir, relativePath);
    const normalizedPublicDir = normalize(this.publicDir);

    if (!absolutePath.startsWith(normalizedPublicDir)) {
      throw new Error("Invalid storage path.");
    }

    return absolutePath;
  }
}
