export type UploadImageInput = {
  buffer: Buffer;
  flowId: string;
  kind: "logo" | "background";
  mimeType: string;
};

export abstract class StorageService {
  abstract uploadImage(input: UploadImageInput): Promise<{ url: string }>;
  abstract delete(url: string | null | undefined): Promise<void>;
}
