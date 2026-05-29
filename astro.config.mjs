import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import netlify from "@astrojs/netlify";

export default defineConfig({
  // Hybrid: pages are prerendered to static HTML; the admin + /api/* routes stay
  // on demand so the local authoring tools work under `astro dev`.
  // The generated SSR function is slimmed post-build (see scripts/strip-function-assets.mjs)
  // so it never bundles the large public/ assets and stays under Netlify's 250 MB limit.
  output: "hybrid",
  adapter: netlify(),
  integrations: [tailwind()],
});
