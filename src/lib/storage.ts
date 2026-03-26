export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = "recipes"
): Promise<string> {
  if (process.env.STORAGE_PROVIDER === "local") {
    const { uploadImage: upload } = await import("./storage-local")
    return upload(buffer, mimeType, folder)
  }
  const { uploadImage: upload } = await import("./storage-r2")
  return upload(buffer, mimeType, folder)
}
