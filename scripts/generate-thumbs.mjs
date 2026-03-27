/**
 * Builds WebP thumbnails (max 900px wide) for every /uploads/ image referenced in
 * work.json and about.json. Skips existing -thumb.webp files. Run before astro build.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const MAX_W = 900;
const QUALITY = 82;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

/** @param {unknown} obj @param {Set<string>} set */
function collectPaths(obj, set) {
  if (typeof obj === "string") {
    if (obj.startsWith("/uploads/") && IMAGE_EXT.test(obj)) set.add(obj);
    return;
  }
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) obj.forEach((x) => collectPaths(x, set));
    else Object.values(obj).forEach((x) => collectPaths(x, set));
  }
}

const paths = new Set();
collectPaths(JSON.parse(readFileSync(join(root, "src/data/work.json"), "utf8")), paths);
collectPaths(JSON.parse(readFileSync(join(root, "src/data/about.json"), "utf8")), paths);

for (const url of paths) {
  const srcPath = join(publicDir, url.replace(/^\//, ""));
  const thumbUrl = url.replace(IMAGE_EXT, "-thumb.webp");
  const thumbPath = join(publicDir, thumbUrl.replace(/^\//, ""));

  if (!existsSync(srcPath)) {
    console.warn("[generate-thumbs] missing source:", srcPath);
    continue;
  }
  if (existsSync(thumbPath)) continue;

  mkdirSync(dirname(thumbPath), { recursive: true });

  await sharp(srcPath)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(thumbPath);

  console.log("[generate-thumbs] wrote", thumbUrl);
}
