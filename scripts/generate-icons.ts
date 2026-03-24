// scripts/generate-icons.ts
// 生成简单的橙色占位 PNG 图标（正式版本请替换为真实设计图标）
import { writeFileSync, mkdirSync } from "fs"
import { deflateSync } from "zlib"

function createOrangePNG(size: number): Buffer {
  // 最小有效 PNG：单色橙色 (f97316) 正方形
  const width = size
  const height = size

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // color type: RGB
  ihdrData[10] = 0  // compression
  ihdrData[11] = 0  // filter
  ihdrData[12] = 0  // interlace
  const ihdr = makeChunk("IHDR", ihdrData)

  // IDAT chunk: raw pixel data (orange #f97316 = RGB 249,115,22)
  const rowSize = width * 3 + 1  // filter byte + RGB per pixel
  const rawData = Buffer.alloc(height * rowSize)
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize
    rawData[offset] = 0  // filter: None
    for (let x = 0; x < width; x++) {
      rawData[offset + 1 + x * 3] = 249  // R
      rawData[offset + 2 + x * 3] = 115  // G
      rawData[offset + 3 + x * 3] = 22   // B
    }
  }

  // Use zlib to compress
  const compressed = deflateSync(rawData)
  const idat = makeChunk("IDAT", compressed)

  // IEND chunk
  const iend = makeChunk("IEND", Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBytes = Buffer.from(type, "ascii")
  const crc = crc32(Buffer.concat([typeBytes, data]))
  const crcBytes = Buffer.alloc(4)
  crcBytes.writeUInt32BE(crc >>> 0, 0)
  return Buffer.concat([len, typeBytes, data, crcBytes])
}

function crc32(buf: Buffer): number {
  const table = makeCRCTable()
  let crc = 0xffffffff
  for (const byte of buf) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeCRCTable(): number[] {
  const table: number[] = []
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table.push(c)
  }
  return table
}

mkdirSync("public/icons", { recursive: true })
writeFileSync("public/icons/icon-192.png", createOrangePNG(192))
writeFileSync("public/icons/icon-512.png", createOrangePNG(512))
console.log("✅ Icons generated: public/icons/icon-192.png, public/icons/icon-512.png")
