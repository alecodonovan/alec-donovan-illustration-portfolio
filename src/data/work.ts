import workData from "./work.json";

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

export const workItems: WorkItem[] = (workData as WorkItem[])
  .filter((item) => !item.hidden)
  .map((item) => ({
    ...item,
    slides: item.slides.filter((s) => !s.hidden),
  }));
