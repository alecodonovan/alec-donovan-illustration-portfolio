import PhotoSwipeLightbox from "photoswipe/lightbox";
import type { WorkGallerySlide } from "../data/work";
import "photoswipe/style.css";
import "../styles/photoswipe-custom.css";

type WorkProject = {
  projectTitle: string;
  projectDescription: string;
  slides: WorkGallerySlide[];
};

declare global {
  interface Window {
    __WORK_LIGHTBOX_PROJECTS__?: WorkProject[];
  }
}

function toDataSourceItem(slide: WorkGallerySlide, meta: { projectTitle: string; projectDescription: string }) {
  if (slide.kind === "image") {
    return {
      src: slide.src,
      width: slide.width,
      height: slide.height,
      alt: meta.projectTitle,
      projectTitle: meta.projectTitle,
      projectDescription: meta.projectDescription,
    };
  }

  return {
    html: `<div class="pswp-html-slide"><video controls playsinline preload="metadata" poster="${slide.poster}" src="${slide.src}"></video></div>`,
    projectTitle: meta.projectTitle,
    projectDescription: meta.projectDescription,
  };
}

function projectToDataSource(project: WorkProject) {
  return project.slides.map((s) =>
    toDataSourceItem(s, {
      projectTitle: project.projectTitle,
      projectDescription: project.projectDescription,
    }),
  );
}

export function initWorkPageClient() {
  const badge = document.getElementById("work-script-debug-badge");
  if (badge) badge.textContent = "work-client init start";

  const projects = window.__WORK_LIGHTBOX_PROJECTS__;
  if (!Array.isArray(projects) || projects.length === 0) {
    if (badge) badge.textContent = "work-client missing projects";
    return;
  }

  let thumbEl: HTMLElement | null = null;

  const lightbox = new PhotoSwipeLightbox({
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

  lightbox.addFilter("placeholderSrc", () => {
    if (!thumbEl) return "";
    if (thumbEl instanceof HTMLImageElement) {
      return thumbEl.currentSrc || thumbEl.src || "";
    }
    const img = thumbEl.querySelector("img");
    return img?.currentSrc || img?.src || "";
  });

  lightbox.on("uiRegister", () => {
    const pswp = lightbox.pswp;
    if (!pswp) return;

    pswp.ui.registerElement({
      name: "ad-close",
      className: "pswp__button pswp__button--ad-close",
      order: 0,
      isButton: true,
      ariaLabel: "Close",
      appendTo: "root",
      html: "Close",
      onClick: () => pswp.close(),
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

  const workMain = document.querySelector<HTMLElement>("#work-grid");
  if (!workMain) {
    if (badge) badge.textContent = "work-client missing #work-grid";
    return;
  }

  const clickHandler = (event: MouseEvent) => {
    const rawTarget = event.target as unknown;
    const targetEl =
      rawTarget instanceof Element ? rawTarget : rawTarget instanceof Node ? rawTarget.parentElement : null;
    if (!targetEl) return;

    const trigger = targetEl.closest<HTMLElement>("[data-pswp-project]");
    if (!trigger) return;

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const pIdxRaw = trigger.dataset.pswpProject;
    if (pIdxRaw === undefined) return;
    const pIdx = Number.parseInt(pIdxRaw, 10);
    const project = projects[pIdx];
    if (!project) return;

    event.preventDefault();
    event.stopPropagation();

    const article = trigger.closest<HTMLElement>("[data-project-index]");
    const slideIndexRaw = article?.dataset.carouselIndex ?? "0";
    let slideIndex = Number.parseInt(slideIndexRaw, 10);
    if (!Number.isFinite(slideIndex)) slideIndex = 0;
    slideIndex = Math.min(Math.max(0, slideIndex), project.slides.length - 1);

    thumbEl = article?.querySelector<HTMLElement>("[data-project-thumb]") ?? trigger;

    lightbox.loadAndOpen(slideIndex, projectToDataSource(project));
  };

  workMain.addEventListener("click", clickHandler, { capture: true });

  if (badge) badge.textContent = "work-client init done";
}

initWorkPageClient();

