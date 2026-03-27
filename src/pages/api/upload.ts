export const prerender = false;

import type { APIRoute } from "astro";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const RASTER_IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

const UPLOAD_DIR = join(process.cwd(), "public/uploads");

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File) || !file.name) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ext = extname(file.name).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mov"];
  if (!allowed.includes(ext)) {
    return new Response(
      JSON.stringify({ error: `File type ${ext} not allowed` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}-${safeName}`;

  mkdirSync(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const dest = join(UPLOAD_DIR, uniqueName);
  writeFileSync(dest, buffer);

  if (RASTER_IMAGE_EXT.test(uniqueName)) {
    const thumbName = uniqueName.replace(RASTER_IMAGE_EXT, "-thumb.webp");
    await sharp(buffer)
      .rotate()
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(UPLOAD_DIR, thumbName));
  }

  return new Response(
    JSON.stringify({ url: `/uploads/${uniqueName}` }),
    { headers: { "Content-Type": "application/json" } },
  );
};
