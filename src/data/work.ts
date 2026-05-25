import workJson from "./work.json";
import { readProjects } from "../lib/projects";

export type WorkGallerySlide =
  | { kind: "image"; src: string; width: number; height: number; hidden?: boolean }
  | { kind: "video"; width: number; height: number; poster: string; src: string; autoplay?: boolean; autoplayLightbox?: boolean; hidden?: boolean };

export type WorkItem = {
  title: string;
  description: string;
  thumbAlt: string;
  hidden?: boolean;
  slides: WorkGallerySlide[];
};

const UPLOAD_IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

/** Smaller asset for grid thumbnails & carousel (full-res still used in lightbox). */
function thumbUrlForUpload(src: string): string {
  // Animated GIFs must use the original file; WebP thumbs are only first frame.
  if (/\.gif$/i.test(src)) return src;
  if (src.startsWith("/uploads/") && UPLOAD_IMAGE_EXT.test(src)) {
    return src.replace(UPLOAD_IMAGE_EXT, "-thumb.webp");
  }
  return src;
}

/** Grid preview URL for a slide (used when cycling thumbnails on the Work page). */
export function gridThumbSrc(slide: WorkGallerySlide): string {
  if (slide.kind === "video") {
    return thumbUrlForUpload(slide.poster);
  }
  const src = slide.src;
  if (/\/\d+\/\d+$/.test(src)) {
    const thumbW = 900;
    const thumbH = Math.round((slide.height / slide.width) * thumbW);
    return src.replace(/\/\d+\/\d+$/, `/${thumbW}/${thumbH}`);
  }
  return thumbUrlForUpload(src);
}

function normalizeWorkItems(data: WorkItem[]): WorkItem[] {
  return data
    .filter((item) => !item.hidden)
    .map((item) => ({
      ...item,
      slides: item.slides.filter((s) => !s.hidden),
    }));
}

/** Bundled snapshot (build-time). Prefer {@link loadWorkItems} for the live Work page. */
export const workItems: WorkItem[] = normalizeWorkItems(workJson as WorkItem[]);

/** Read work.json from disk so Admin saves show up without restarting the dev server. */
export function loadWorkItems(): WorkItem[] {
  return normalizeWorkItems(readProjects() as WorkItem[]);
}
