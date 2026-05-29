// Post-build cleanup for the Netlify SSR function.
//
// Astro's Netlify adapter traces the server entry with @vercel/nft, which
// conservatively copies the entire `public/` directory (all uploads + videos)
// into the generated serverless function. That static content is served by
// Netlify's CDN, never by the function, but it pushes the function past
// Netlify's 250 MB upload limit and makes deploys fail.
//
// The on-demand routes that remain (the local-only /api/* authoring endpoints)
// only read small JSON files from src/data, so it's safe to remove the bundled
// public assets from the function before deploy.
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const functionDir = join(process.cwd(), ".netlify", "v1", "functions", "ssr");

if (!existsSync(functionDir)) {
  console.log("[strip-function-assets] No SSR function found; nothing to do.");
  process.exit(0);
}

// Directories the function never needs at runtime.
const removable = ["public"];

let removedAny = false;
for (const name of removable) {
  const target = join(functionDir, name);
  if (existsSync(target)) {
    const bytes = dirSize(target);
    rmSync(target, { recursive: true, force: true });
    removedAny = true;
    console.log(
      `[strip-function-assets] Removed ${name}/ from SSR function (${formatMB(bytes)}).`,
    );
  }
}

if (!removedAny) {
  console.log("[strip-function-assets] Nothing to strip.");
}

function dirSize(path) {
  let total = 0;
  const stack = [path];
  while (stack.length) {
    const current = stack.pop();
    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(current)) stack.push(join(current, entry));
    } else {
      total += stats.size;
    }
  }
  return total;
}

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
