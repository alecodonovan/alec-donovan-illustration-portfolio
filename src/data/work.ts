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

/** Grid preview URL for a slide (used when cycling thumbnails on the Work page). */
export function gridThumbSrc(slide: WorkGallerySlide): string {
  if (slide.kind === "video") {
    return slide.poster;
  }
  const thumbW = 900;
  const thumbH = Math.round((slide.height / slide.width) * thumbW);
  return slide.src.replace(/\/\d+\/\d+$/, `/${thumbW}/${thumbH}`);
}

export const workItems: WorkItem[] = (workData as WorkItem[])
  .filter((item) => !item.hidden)
  .map((item) => ({
    ...item,
    slides: item.slides.filter((s) => !s.hidden),
  }));
