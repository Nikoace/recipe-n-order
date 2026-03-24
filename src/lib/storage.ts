import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { nanoid } from "nanoid"

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.R2_BUCKET_NAME ?? "recipe-images"
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN ?? ""

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = "recipes"
): Promise<string> {
  const ext = mimeType.split("/")[1] ?? "jpg"
  const key = `${folder}/${nanoid()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000",
    })
  )

  return `https://${PUBLIC_DOMAIN}/${key}`
}
