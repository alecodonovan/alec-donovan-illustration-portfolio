import PhotoSwipeLightbox from "photoswipe/lightbox";
import type { WorkGallerySlide } from "../data/work";
import "photoswipe/style.css";
import "../styles/photoswipe-custom.css";

export type LightboxProject = {
  projectTitle: string;
  projectDescription: string;
  slides: WorkGallerySlide[];
};

export type CarouselProject = {
  thumbs: string[];
};

function toDataSourceItem(
  slide: WorkGallerySlide,
  projectTitle: string,
  projectDescription: string,
) {
  const meta = { projectTitle, projectDescription };

  if (slide.kind === "image") {
    return {
      src: slide.src,
      width: slide.width,
      height: slide.height,
      alt: projectTitle,
      ...meta,
    };
  }

  const html = `<div class="pswp-html-slide"><video controls playsinline preload="metadata" poster="${slide.poster}" src="${slide.src}"></video></div>`;
  return {
    html,
    ...meta,
  };
}

function projectToDataSource(project: LightboxProject) {
  return project.slides.map((s) =>
    toDataSourceItem(s, project.projectTitle, project.projectDescription),
  );
}

function thumbPlaceholderSrc(el: HTMLElement | null): string {
  if (!el) return "";
  if (el instanceof HTMLImageElement) {
    return el.currentSrc || el.src || "";
  }
  const img = el.querySelector("img");
  return img?.currentSrc || img?.src || "";
}

/**
 * Binds one listener per control using capture + currentTarget so clicks on the
 * text inside `<button>&lt;</button>` still work (avoids Text-node / CSS columns quirks).
 */
export function initWorkPage(
  lightboxProjects: LightboxProject[],
  carouselProjects: CarouselProject[],
) {
  if (!Array.isArray(lightboxProjects) || !Array.isArray(carouselProjects)) {
    console.error("[work-page] Invalid project data from the page.");
    return;
  }

  console.log("[work-page] initWorkPage called", {
    lightboxProjects: lightboxProjects.length,
    carouselProjects: carouselProjects.length,
  });

  const bind = () => {
    const workMain = document.querySelector("#work-grid");
    if (!workMain) return;

    console.log("[work-page] init bind");

    let thumbEl: HTMLElement | null = null;
    let lightbox: PhotoSwipeLightbox | null = null;

    try {
      lightbox = new PhotoSwipeLightbox({
        dataSource: [],
        pswpModule: () => import("photoswipe"),
        loop: true,
        bgOpacity: 1,
        showHideAnimationType: "zoom",
        imageClickAction: "zoom-or-close",
        padding: { top: 112, bottom: 140, left: 20, right: 20 },
        preload: [1, 2],
      });

      lightbox.addFilter("thumbEl", () => thumbEl);
      lightbox.addFilter("placeholderSrc", () => thumbPlaceholderSrc(thumbEl));

      lightbox.on("uiRegister", () => {
        const pswp = lightbox?.pswp;
        if (!pswp) return;

        pswp.ui.registerElement({
          name: "ad-close",
          className: "pswp__button pswp__button--ad-close",
          order: 0,
          isButton: true,
          ariaLabel: "Close",
          appendTo: "root",
          html: "Close",
          onClick: () => {
            pswp.close();
          },
        });

        pswp.ui.registerElement({
          name: "ad-caption",
          className: "pswp__ad-caption",
          order: 11,
          isButton: false,
          appendTo: "root",
          html: '<div class="pswp__ad-caption-inner"><p class="pswp__ad-caption-title"></p><p class="pswp__ad-caption-desc"></p></div>',
          onInit: (el, instance) => {
            const titleEl = el.querySelector<HTMLElement>(".pswp__ad-caption-title");
            const descEl = el.querySelector<HTMLElement>(".pswp__ad-caption-desc");

            const sync = () => {
              const data = instance.currSlide?.data as
                | { projectTitle?: string; projectDescription?: string }
                | undefined;
              if (titleEl) titleEl.textContent = data?.projectTitle ?? "";
              if (descEl) descEl.textContent = data?.projectDescription ?? "";
            };

            instance.on("change", sync);
            instance.on("openingAnimationEnd", sync);
            sync();
          },
        });
      });

      lightbox.init();
    } catch (err) {
      console.error("[work-page] PhotoSwipe failed to initialize:", err);
    }

    const carouselControls = workMain.querySelectorAll(
      "[data-carousel-prev], [data-carousel-next]",
    );
    console.log("[work-page] carousel controls found:", carouselControls.length);
    carouselControls.forEach((node) => {
      node.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();

          const control = event.currentTarget as HTMLElement;
          const article = control.closest<HTMLElement>("[data-project-index]");
          if (!article) return;

          const pIdx = Number.parseInt(article.dataset.projectIndex ?? "-1", 10);
          const cProject = carouselProjects[pIdx];
          if (!cProject || cProject.thumbs.length <= 1) return;

          const len = cProject.thumbs.length;
          let idx = Number.parseInt(article.dataset.carouselIndex ?? "0", 10);
          if (!Number.isFinite(idx)) idx = 0;
          idx = Math.min(Math.max(0, idx), len - 1);

          console.log("[work-page] carousel click", {
            projectIndex: pIdx,
            prev: control.hasAttribute("data-carousel-prev"),
            currentCarouselIndex: idx,
            total: len,
          });

          if (control.hasAttribute("data-carousel-prev")) {
            idx = (idx - 1 + len) % len;
          } else {
            idx = (idx + 1) % len;
          }

          article.dataset.carouselIndex = String(idx);

          const img = article.querySelector<HTMLImageElement>("[data-project-thumb]");
          if (img) img.src = cProject.thumbs[idx];

          const curEl = article.querySelector("[data-carousel-current]");
          if (curEl) curEl.textContent = String(idx + 1);
        },
        { capture: true },
      );
    });

    const pswpTriggers = workMain.querySelectorAll("[data-pswp-project]");
    console.log("[work-page] pswp triggers found:", pswpTriggers.length);
    pswpTriggers.forEach((node) => {
      node.addEventListener(
        "click",
        (event) => {
          if (!lightbox) {
            console.warn("[work-page] Lightbox unavailable (init failed).");
            return;
          }
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

          event.preventDefault();
          event.stopPropagation();

          const trigger = event.currentTarget as HTMLElement;
          const raw = trigger.dataset.pswpProject;
          if (raw === undefined) return;

          const pIdx = Number.parseInt(raw, 10);
          const project = lightboxProjects[pIdx];
          if (!project || project.slides.length === 0) return;

          const article = trigger.closest<HTMLElement>("[data-project-index]");
          let slideIndex = Number.parseInt(article?.dataset.carouselIndex ?? "0", 10);
          if (!Number.isFinite(slideIndex)) slideIndex = 0;
          slideIndex = Math.min(
            Math.max(0, slideIndex),
            project.slides.length - 1,
          );

          const img = article?.querySelector<HTMLElement>("[data-project-thumb]");
          thumbEl = img ?? trigger;

          console.log("[work-page] open lightbox", {
            projectIndex: pIdx,
            slideIndex,
            totalSlides: project.slides.length,
          });

          const ok = lightbox.loadAndOpen(slideIndex, projectToDataSource(project));
          if (!ok) {
            console.warn("[work-page] loadAndOpen returned false (already open?)");
          }
        },
        { capture: true },
      );
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
}

declare global {
  interface Window {
    __WORK_LIGHTBOX_PROJECTS__?: LightboxProject[];
    __WORK_CAROUSEL_PROJECTS__?: CarouselProject[];
  }
}

function bootFromWindow() {
  const w = window as Window;
  const lp = w.__WORK_LIGHTBOX_PROJECTS__;
  const cp = w.__WORK_CAROUSEL_PROJECTS__;

  if (!Array.isArray(lp) || !Array.isArray(cp)) return;

  initWorkPage(lp, cp);

  const badge = document.getElementById("work-script-debug-badge");
  if (badge) badge.textContent = "init done";
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootFromWindow, { once: true });
} else {
  bootFromWindow();
}

// Note: initWorkPage is called from `src/pages/index.astro`.
