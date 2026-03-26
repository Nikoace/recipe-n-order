// scripts/generate-icons.ts
// 从 public/icons/icon.svg 生成 PWA 用 PNG 图标
import sharp from "sharp"
import { mkdirSync } from "fs"

async function main() {
  mkdirSync("public/icons", { recursive: true })
  await sharp("public/icons/icon.svg").resize(192, 192).png().toFile("public/icons/icon-192.png")
  await sharp("public/icons/icon.svg").resize(512, 512).png().toFile("public/icons/icon-512.png")
  console.log("✅ Icons generated: public/icons/icon-192.png, public/icons/icon-512.png")
}

main()
