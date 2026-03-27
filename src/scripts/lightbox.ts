type Slide =
  | { kind: "image"; src: string; width: number; height: number }
  | { kind: "video"; src: string; poster: string; width: number; height: number; autoplayLightbox?: boolean };

type LightboxProject = {
  projectTitle: string;
  projectDescription: string;
  slides: Slide[];
};

type CarouselProject = {
  thumbs: string[];
};

declare global {
  interface Window {
    __WORK_LIGHTBOX_PROJECTS__?: LightboxProject[];
    __WORK_CAROUSEL_PROJECTS__?: CarouselProject[];
  }
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

const THUMB_CLASS =
  "absolute inset-0 z-[2] w-full h-full object-cover object-left-top work-thumb-media";

function bindWorkThumbFrame(frame: HTMLElement) {
  const media = frame.querySelector<HTMLImageElement | HTMLVideoElement>(
    "[data-project-thumb]",
  );
  const skeleton = frame.querySelector("[data-work-thumb-skeleton]");
  if (!media || !skeleton) return;

  const markReady = () => {
    frame.classList.add("is-thumb-ready");
  };

  if (media instanceof HTMLVideoElement) {
    if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markReady();
    } else {
      media.addEventListener("loadeddata", markReady, { once: true });
      media.addEventListener("error", markReady, { once: true });
    }
    return;
  }

  const img = media;
  if (typeof img.decode === "function") {
    void img.decode().then(markReady).catch(markReady);
    return;
  }
  if (img.complete && img.naturalWidth > 0) {
    markReady();
    return;
  }
  img.addEventListener("load", markReady, { once: true });
  img.addEventListener("error", markReady, { once: true });
}

function init() {
  const projects = window.__WORK_LIGHTBOX_PROJECTS__;
  const carousels = window.__WORK_CAROUSEL_PROJECTS__;
  if (!Array.isArray(projects) || !projects.length) return;
  if (!Array.isArray(carousels)) return;

  const overlay = document.getElementById("lightbox");
  const slidesEl = document.getElementById("lightbox-slides");
  const titleEl = document.getElementById("lightbox-title");
  const descEl = document.getElementById("lightbox-desc");
  const closeBtn = document.getElementById("lightbox-close");
  const scrollWrap = document.getElementById("lightbox-scroll");
  const bodyWrap = document.getElementById("lightbox-body");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");
  const grid = document.getElementById("work-grid");
  if (!overlay || !slidesEl || !titleEl || !descEl || !closeBtn || !scrollWrap || !bodyWrap || !prevBtn || !nextBtn || !grid) return;

  let currentProjectIndex = 0;

  for (const cp of carousels) {
    for (let i = 1; i < cp.thumbs.length; i++) {
      const pre = new Image();
      pre.src = cp.thumbs[i];
    }
  }

  grid.querySelectorAll<HTMLElement>("[data-carousel-frame]").forEach((frame) => {
    bindWorkThumbFrame(frame);
  });

  function createGutter(): HTMLElement {
    const el = document.createElement("div");
    el.className = "lightbox-gutter";
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  /** Filled Material Symbol (lime); ligature name as text content. */
  function msIcon(name: string, extraClass = ""): HTMLSpanElement {
    const s = document.createElement("span");
    s.className = `material-symbols-outlined ${extraClass}`.trim();
    s.textContent = name;
    s.setAttribute("aria-hidden", "true");
    return s;
  }

  function videoHasAudioTrack(v: HTMLVideoElement): boolean {
    try {
      const at = v.audioTracks;
      if (at && at.length > 0) return true;
      if (at && at.length === 0) return false;
    } catch {
      /* ignore */
    }
    const moz = (v as HTMLVideoElement & { mozHasAudio?: boolean }).mozHasAudio;
    if (typeof moz === "boolean" && !moz) return false;
    return true;
  }

  function createVideoSlide(slide: Extract<Slide, { kind: "video" }>) {
    const wrap = document.createElement("div");
    wrap.className = isDesktop()
      ? "lightbox-video-wrap h-full shrink-0"
      : "lightbox-video-wrap w-full shrink-0";
    wrap.style.aspectRatio = `${slide.width} / ${slide.height}`;

    const shouldAutoplay = slide.autoplayLightbox === true;

    const shimmer = document.createElement("div");
    shimmer.className = "lb-shimmer-dark";
    shimmer.setAttribute("aria-hidden", "true");

    const video = document.createElement("video");
    video.src = slide.src;
    video.poster = slide.poster;
    video.playsInline = true;
    video.preload = shouldAutoplay ? "auto" : "metadata";
    video.className = "h-full w-full object-contain";

    const revealLbVideo = () => {
      wrap.classList.add("is-lb-media-ready");
    };
    video.addEventListener("loadeddata", revealLbVideo, { once: true });
    video.addEventListener("error", revealLbVideo, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      revealLbVideo();
    }
    if (shouldAutoplay) {
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
    }

    const controls = document.createElement("div");
    controls.className = "lightbox-video-controls";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "lb-play";
    const playGlyph = msIcon("play_arrow");
    playBtn.appendChild(playGlyph);
    playBtn.setAttribute("aria-label", "Play");

    const volBtn = document.createElement("button");
    volBtn.type = "button";
    volBtn.className = "lb-volume";
    const volGlyph = msIcon("volume_up");
    volBtn.appendChild(volGlyph);
    volBtn.setAttribute("aria-label", "Mute");
    let hasAudio = true;

    const scrub = document.createElement("div");
    scrub.className = "lb-scrub";
    scrub.setAttribute("role", "slider");
    scrub.setAttribute("aria-valuemin", "0");
    scrub.setAttribute("aria-valuemax", "1000");
    scrub.setAttribute("aria-valuenow", "0");
    scrub.setAttribute("aria-label", "Seek");
    scrub.tabIndex = 0;

    const scrubTrack = document.createElement("div");
    scrubTrack.className = "lb-scrub-track";
    const scrubFill = document.createElement("div");
    scrubFill.className = "lb-scrub-fill";
    const scrubThumb = document.createElement("div");
    scrubThumb.className = "lb-scrub-thumb";
    scrubThumb.appendChild(msIcon("circle"));
    scrubTrack.appendChild(scrubFill);
    scrubTrack.appendChild(scrubThumb);
    scrub.appendChild(scrubTrack);

    const timeDisplay = document.createElement("span");
    timeDisplay.className = "lb-time";
    timeDisplay.textContent = "0:00";

    controls.appendChild(playBtn);
    controls.appendChild(volBtn);
    controls.appendChild(scrub);
    controls.appendChild(timeDisplay);

    const playOverlay = document.createElement("div");
    playOverlay.className = "lb-play-overlay";
    const overlayIcon = msIcon("play_circle", "lb-overlay-play-icon");
    playOverlay.appendChild(overlayIcon);

    wrap.appendChild(shimmer);
    wrap.appendChild(video);
    wrap.appendChild(playOverlay);
    wrap.appendChild(controls);

    let scrubPointerActive = false;
    let scrubActiveId: number | null = null;

    function scrubPctFromClientX(clientX: number): number {
      const rect = scrubTrack.getBoundingClientRect();
      if (rect.width < 1) return 0;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * 1000;
    }

    function setScrubVisual(p1000: number) {
      const p = Math.max(0, Math.min(1000, p1000));
      const pct = p / 10;
      scrubFill.style.width = `${pct}%`;
      scrubThumb.style.left = `${pct}%`;
      scrub.setAttribute("aria-valuenow", String(Math.round(p)));
    }

    function syncVolUi() {
      if (!hasAudio) {
        volGlyph.textContent = "no_sound";
        volBtn.setAttribute("aria-label", "No audio");
        volBtn.disabled = true;
        return;
      }
      volBtn.disabled = false;
      if (video.muted) {
        volGlyph.textContent = "volume_off";
        volBtn.setAttribute("aria-label", "Unmute");
      } else {
        volGlyph.textContent = "volume_up";
        volBtn.setAttribute("aria-label", "Mute");
      }
    }

    function syncPlayUi() {
      if (video.paused) {
        playGlyph.textContent = "play_arrow";
        playBtn.setAttribute("aria-label", "Play");
        wrap.classList.remove("is-playing");
      } else {
        playGlyph.textContent = "pause";
        playBtn.setAttribute("aria-label", "Pause");
        wrap.classList.add("is-playing");
      }
    }

    const togglePlay = () => {
      if (video.paused) {
        void video.play().finally(() => syncPlayUi());
      } else {
        video.pause();
        syncPlayUi();
      }
    };

    if (shouldAutoplay) {
      playGlyph.textContent = "pause";
      playBtn.setAttribute("aria-label", "Pause");
      wrap.classList.add("is-playing");
    }

    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlay();
    });

    volBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!hasAudio || volBtn.disabled) return;
      video.muted = !video.muted;
      syncVolUi();
    });

    playOverlay.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlay();
    });

    video.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlay();
    });

    video.addEventListener("timeupdate", () => {
      if (!video.duration || scrubPointerActive) return;
      const p = (video.currentTime / video.duration) * 1000;
      setScrubVisual(p);
      timeDisplay.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    });

    video.addEventListener("loadedmetadata", () => {
      hasAudio = videoHasAudioTrack(video);
      syncVolUi();
      timeDisplay.textContent = `0:00 / ${fmt(video.duration)}`;
      setScrubVisual(0);
    });

    video.addEventListener("volumechange", () => {
      syncVolUi();
    });

    function applyScrubClientX(clientX: number) {
      if (!video.duration) return;
      const p = scrubPctFromClientX(clientX);
      setScrubVisual(p);
      video.currentTime = (p / 1000) * video.duration;
      timeDisplay.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    }

    scrub.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      scrubPointerActive = true;
      scrubActiveId = e.pointerId;
      try {
        scrub.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      applyScrubClientX(e.clientX);
    });

    scrub.addEventListener(
      "pointermove",
      (e) => {
        if (!scrubPointerActive || e.pointerId !== scrubActiveId) return;
        e.preventDefault();
        applyScrubClientX(e.clientX);
      },
      { passive: false },
    );

    const endScrub = (e: PointerEvent) => {
      if (e.pointerId !== scrubActiveId) return;
      scrubPointerActive = false;
      scrubActiveId = null;
      try {
        scrub.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    scrub.addEventListener("pointerup", endScrub);
    scrub.addEventListener("pointercancel", endScrub);
    scrub.addEventListener("lostpointercapture", endScrub);

    scrub.addEventListener("keydown", (e) => {
      if (!video.duration) return;
      const step = (10 / video.duration) * 1000;
      let p = parseFloat(scrub.getAttribute("aria-valuenow") || "0");
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        p = Math.max(0, p - step);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        p = Math.min(1000, p + step);
      } else {
        return;
      }
      setScrubVisual(p);
      video.currentTime = (p / 1000) * video.duration;
      timeDisplay.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    });

    video.addEventListener("ended", () => {
      if (video.duration) setScrubVisual(1000);
      syncPlayUi();
    });

    return wrap;
  }

  // ── Lightbox ──

  function open(projectIndex: number) {
    const project = projects[projectIndex];
    if (!project) return;

    currentProjectIndex = projectIndex;

    slidesEl!.querySelectorAll("video").forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
    slidesEl!.innerHTML = "";

    const desktop = isDesktop();

    slidesEl!.appendChild(createGutter());

    for (const slide of project.slides) {
      if (slide.kind === "image") {
        const wrap = document.createElement("div");
        wrap.className = desktop
          ? "lightbox-slide-img-wrap relative h-full shrink-0"
          : "lightbox-slide-img-wrap relative w-full shrink-0";

        const skel = document.createElement("div");
        skel.className = "lb-shimmer-dark";
        skel.setAttribute("aria-hidden", "true");

        const img = document.createElement("img");
        img.src = slide.src;
        img.width = slide.width;
        img.height = slide.height;
        img.alt = project.projectTitle;
        img.className = desktop
          ? "h-full w-auto max-w-none shrink-0"
          : "w-full h-auto";
        img.loading = "eager";
        img.draggable = false;

        const revealLbImg = () => {
          wrap.classList.add("is-lb-media-ready");
        };
        if (typeof img.decode === "function") {
          void img.decode().then(revealLbImg).catch(revealLbImg);
        } else {
          img.addEventListener("load", revealLbImg, { once: true });
          img.addEventListener("error", revealLbImg, { once: true });
          if (img.complete && img.naturalWidth > 0) revealLbImg();
        }

        wrap.appendChild(skel);
        wrap.appendChild(img);
        slidesEl!.appendChild(wrap);
      } else {
        slidesEl!.appendChild(createVideoSlide(slide));
      }
    }

    slidesEl!.appendChild(createGutter());

    titleEl!.textContent = project.projectTitle;
    descEl!.textContent = project.projectDescription;
    scrollWrap!.scrollLeft = 0;
    bodyWrap!.scrollTop = 0;

    document.body.classList.add("lightbox-open");
    overlay!.classList.add("is-open");
  }

  function close() {
    overlay!.classList.remove("is-open");

    slidesEl!.querySelectorAll("video").forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });

    setTimeout(() => {
      document.body.classList.remove("lightbox-open");
    }, 300);
  }

  closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (!overlay!.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft" && e.altKey) {
      open((currentProjectIndex - 1 + projects.length) % projects.length);
    }
    if (e.key === "ArrowRight" && e.altKey) {
      open((currentProjectIndex + 1) % projects.length);
    }
  });

  prevBtn.addEventListener("click", () => {
    open((currentProjectIndex - 1 + projects.length) % projects.length);
  });
  nextBtn.addEventListener("click", () => {
    open((currentProjectIndex + 1) % projects.length);
  });

  // ── Lightbox drag-to-scroll (desktop only) ──

  let pointerDown = false;
  let isDragging = false;
  let didDrag = false;
  let dragStartX = 0;
  let dragScrollStart = 0;
  let activePointerId: number | null = null;

  function resetLightboxDrag() {
    pointerDown = false;
    if (isDragging) {
      isDragging = false;
      scrollWrap.classList.remove("is-dragging");
    }
    if (activePointerId !== null) {
      try { scrollWrap.releasePointerCapture(activePointerId); } catch {}
    }
    activePointerId = null;
  }

  scrollWrap.addEventListener("pointerdown", (e) => {
    // Touch pointers use button -1 per spec; mouse must be primary button.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!isDesktop()) return;
    if ((e.target as Element).closest(".lightbox-video-controls, .lb-play-overlay")) return;

    pointerDown = true;
    isDragging = false;
    dragStartX = e.clientX;
    dragScrollStart = scrollWrap.scrollLeft;
    activePointerId = e.pointerId;
  });

  scrollWrap.addEventListener("pointermove", (e) => {
    if (!pointerDown || e.pointerId !== activePointerId) return;
    const dx = e.clientX - dragStartX;

    if (!isDragging && Math.abs(dx) > 5) {
      isDragging = true;
      didDrag = true;
      scrollWrap.classList.add("is-dragging");
      scrollWrap.setPointerCapture(e.pointerId);
    }

    if (isDragging) {
      e.preventDefault();
      scrollWrap.scrollLeft = dragScrollStart - dx;
    }
  });

  const endLightboxDrag = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    resetLightboxDrag();
  };

  scrollWrap.addEventListener("pointerup", endLightboxDrag);
  scrollWrap.addEventListener("pointercancel", endLightboxDrag);
  scrollWrap.addEventListener("lostpointercapture", endLightboxDrag);

  scrollWrap.addEventListener(
    "click",
    (e) => {
      if (didDrag) {
        e.stopPropagation();
        e.preventDefault();
        didDrag = false;
      }
    },
    { capture: true },
  );

  // ── Grid carousel — arrow button advance ──

  const transitioning = new Set<HTMLElement>();

  function advanceCarousel(article: HTMLElement, direction: 1 | -1) {
    if (transitioning.has(article)) return;

    const pIdx = parseInt(article.dataset.projectIndex || "-1", 10);
    const cp = carousels[pIdx];
    if (!cp || cp.thumbs.length <= 1) return;

    const len = cp.thumbs.length;
    let idx = parseInt(article.dataset.carouselIndex || "0", 10);
    if (!Number.isFinite(idx)) idx = 0;

    idx = direction === -1 ? (idx - 1 + len) % len : (idx + 1) % len;
    article.dataset.carouselIndex = String(idx);

    const cur = article.querySelector("[data-carousel-current]");
    if (cur) cur.textContent = String(idx + 1);

    const frame = article.querySelector<HTMLElement>("[data-carousel-frame]");
    const currentThumb = article.querySelector<HTMLElement>("[data-project-thumb]");
    if (!frame || !currentThumb) return;

    frame.classList.remove("is-thumb-ready");

    transitioning.add(article);

    const newImg = document.createElement("img");
    newImg.src = cp.thumbs[idx];
    newImg.className = THUMB_CLASS;
    newImg.draggable = false;
    newImg.alt = currentThumb.getAttribute("alt") || "";
    newImg.style.transform = `translateX(calc(${direction * 100}% - ${direction}px))`;
    frame.appendChild(newImg);

    void newImg.offsetWidth;

    currentThumb.style.transition = "transform 0.3s ease";
    newImg.style.transition = "transform 0.3s ease";
    currentThumb.style.transform = `translateX(calc(${direction * -100}% + ${direction}px))`;
    newImg.style.transform = "translateX(0)";

    setTimeout(() => {
      currentThumb.remove();
      newImg.setAttribute("data-project-thumb", "");
      newImg.style.transition = "";
      newImg.style.transform = "";
      bindWorkThumbFrame(frame);
      transitioning.delete(article);
    }, 300);
  }

  // ── Grid carousel — real-time drag with snap ──

  let cdActive = false;
  let cdDecided = false;
  let cdHorizontal = false;
  let cdStartX = 0;
  let cdStartY = 0;
  let cdArticle: HTMLElement | null = null;
  let cdFrame: HTMLElement | null = null;
  let cdCurrentThumb: HTMLElement | null = null;
  let cdPrevImg: HTMLImageElement | null = null;
  let cdNextImg: HTMLImageElement | null = null;
  let cdFrameW = 0;
  let cdPointerId: number | null = null;
  let cdTouchId: number | null = null;
  let cdDidDrag = false;

  function cdSetupImages() {
    const article = cdArticle!;
    const frame = article.querySelector<HTMLElement>("[data-carousel-frame]");
    const currentThumb = article.querySelector<HTMLElement>("[data-project-thumb]");
    if (!frame || !currentThumb) {
      cdActive = false;
      return;
    }

    cdFrame = frame;
    cdCurrentThumb = currentThumb;
    cdFrameW = frame.getBoundingClientRect().width;

    const pIdx = parseInt(article.dataset.projectIndex || "-1", 10);
    const cp = carousels[pIdx];
    if (!cp) return;

    const len = cp.thumbs.length;
    let idx = parseInt(article.dataset.carouselIndex || "0", 10);
    if (!Number.isFinite(idx)) idx = 0;

    const prevIdx = (idx - 1 + len) % len;
    const nextIdx = (idx + 1) % len;
    const altText = currentThumb.getAttribute("alt") || "";

    cdPrevImg = document.createElement("img");
    cdPrevImg.className = THUMB_CLASS;
    cdPrevImg.src = cp.thumbs[prevIdx];
    cdPrevImg.draggable = false;
    cdPrevImg.alt = altText;
    cdPrevImg.style.transform = "translateX(calc(-100% + 1px))";
    frame.appendChild(cdPrevImg);

    cdNextImg = document.createElement("img");
    cdNextImg.className = THUMB_CLASS;
    cdNextImg.src = cp.thumbs[nextIdx];
    cdNextImg.draggable = false;
    cdNextImg.alt = altText;
    cdNextImg.style.transform = "translateX(calc(100% - 1px))";
    frame.appendChild(cdNextImg);
  }

  function cdCleanup() {
    cdTouchId = null;
    if (cdFrame) cdFrame.classList.remove("carousel-horizontal-drag");
    if (cdPrevImg) { cdPrevImg.remove(); cdPrevImg = null; }
    if (cdNextImg) { cdNextImg.remove(); cdNextImg = null; }
    if (cdCurrentThumb) {
      cdCurrentThumb.style.transition = "";
      cdCurrentThumb.style.transform = "";
    }
    if (cdPointerId !== null) {
      try { grid.releasePointerCapture(cdPointerId); } catch {}
    }
    cdFrame = null;
    cdCurrentThumb = null;
    cdArticle = null;
    cdPointerId = null;
  }

  function cdSnapTo(direction: 1 | -1) {
    const article = cdArticle!;
    const winImg = direction === 1 ? cdNextImg! : cdPrevImg!;
    const loseImg = direction === 1 ? cdPrevImg : cdNextImg;

    const dur = "0.2s";
    cdCurrentThumb!.style.transition = `transform ${dur} ease`;
    cdCurrentThumb!.style.transform = `translateX(calc(${direction * -100}% + ${direction}px))`;

    winImg.style.transition = `transform ${dur} ease`;
    winImg.style.transform = "translateX(0)";

    if (loseImg) {
      loseImg.style.transition = `transform ${dur} ease`;
    }

    transitioning.add(article);

    const pIdx = parseInt(article.dataset.projectIndex || "-1", 10);
    const cp = carousels[pIdx];
    if (!cp) return;

    const len = cp.thumbs.length;
    let idx = parseInt(article.dataset.carouselIndex || "0", 10);
    if (!Number.isFinite(idx)) idx = 0;
    idx = direction === 1 ? (idx + 1) % len : (idx - 1 + len) % len;
    article.dataset.carouselIndex = String(idx);

    const counter = article.querySelector("[data-carousel-current]");
    if (counter) counter.textContent = String(idx + 1);

    setTimeout(() => {
      if (cdFrame) cdFrame.classList.remove("carousel-horizontal-drag");
      cdCurrentThumb!.remove();
      if (loseImg) loseImg.remove();
      winImg.setAttribute("data-project-thumb", "");
      winImg.style.transition = "";
      winImg.style.transform = "";
      const frameEl = article.querySelector<HTMLElement>("[data-carousel-frame]");
      if (frameEl) bindWorkThumbFrame(frameEl);
      cdFrame = null;
      cdCurrentThumb = null;
      cdPrevImg = null;
      cdNextImg = null;
      cdArticle = null;
      cdPointerId = null;
      transitioning.delete(article);
    }, 200);
  }

  function cdSnapBack() {
    const dur = "0.2s";
    cdCurrentThumb!.style.transition = `transform ${dur} ease`;
    cdCurrentThumb!.style.transform = "translateX(0)";

    if (cdPrevImg) {
      cdPrevImg.style.transition = `transform ${dur} ease`;
      cdPrevImg.style.transform = "translateX(calc(-100% + 1px))";
    }
    if (cdNextImg) {
      cdNextImg.style.transition = `transform ${dur} ease`;
      cdNextImg.style.transform = "translateX(calc(100% - 1px))";
    }

    setTimeout(() => {
      cdCleanup();
    }, 200);
  }

  grid.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Touch uses dedicated touch* listeners (iOS is unreliable for drag inside interactive targets).
    if (e.pointerType === "touch") return;
    if ((e.target as Element).closest("[data-carousel-prev], [data-carousel-next]")) return;

    const article = (e.target as Element).closest<HTMLElement>("[data-project-index]");
    if (!article) return;
    if (transitioning.has(article)) return;

    const pIdx = parseInt(article.dataset.projectIndex || "-1", 10);
    const cp = carousels[pIdx];
    if (!cp || cp.thumbs.length <= 1) return;

    cdActive = true;
    cdDecided = false;
    cdHorizontal = false;
    cdStartX = e.clientX;
    cdStartY = e.clientY;
    cdArticle = article;
    cdDidDrag = false;
    cdPointerId = e.pointerId;
  });

  grid.addEventListener("pointermove", (e) => {
    if (!cdActive || e.pointerId !== cdPointerId) return;

    const dx = e.clientX - cdStartX;
    const dy = e.clientY - cdStartY;

    if (!cdDecided) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        cdDecided = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          cdHorizontal = true;
          cdSetupImages();
          if (!cdFrame) { cdActive = false; return; }
          cdFrame.classList.add("carousel-horizontal-drag");
          grid.setPointerCapture(e.pointerId);
        } else {
          cdActive = false;
          return;
        }
      }
      return;
    }

    if (!cdHorizontal || !cdFrame) return;

    e.preventDefault();
    cdDidDrag = true;

    const clampedDx = Math.max(-cdFrameW, Math.min(cdFrameW, dx));
    const pct = (clampedDx / cdFrameW) * 100;

    cdCurrentThumb!.style.transform = `translateX(${pct}%)`;
    if (cdPrevImg) cdPrevImg.style.transform = `translateX(calc(${pct - 100}% + 1px))`;
    if (cdNextImg) cdNextImg.style.transform = `translateX(calc(${pct + 100}% - 1px))`;
  }, { passive: false });

  grid.addEventListener("pointerup", (e) => {
    if (!cdActive || e.pointerId !== cdPointerId) return;
    cdActive = false;

    if (!cdHorizontal || !cdDidDrag || !cdFrame) {
      cdCleanup();
      return;
    }

    const dx = e.clientX - cdStartX;
    const pct = (dx / cdFrameW) * 100;
    const threshold = 25;

    if (pct < -threshold) {
      cdSnapTo(1);
    } else     if (pct > threshold) {
      cdSnapTo(-1);
    } else {
      cdSnapBack();
    }
  });

  // ── Grid carousel — touch (iOS / iPad): pointer capture + move often fail for finger drags ──

  grid.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const target = e.target as Element;
      if (target.closest("[data-carousel-prev], [data-carousel-next]")) return;

      const article = target.closest<HTMLElement>("[data-project-index]");
      if (!article || transitioning.has(article)) return;

      const pIdx = parseInt(article.dataset.projectIndex || "-1", 10);
      const cp = carousels[pIdx];
      if (!cp || cp.thumbs.length <= 1) return;

      cdActive = true;
      cdDecided = false;
      cdHorizontal = false;
      cdStartX = t.clientX;
      cdStartY = t.clientY;
      cdArticle = article;
      cdDidDrag = false;
      cdPointerId = null;
      cdTouchId = t.identifier;
    },
    { passive: true },
  );

  function cdTouchMove(e: TouchEvent) {
    if (!cdActive || cdTouchId === null) return;
    const t = [...e.touches].find((x) => x.identifier === cdTouchId);
    if (!t) return;

    const dx = t.clientX - cdStartX;
    const dy = t.clientY - cdStartY;

    if (!cdDecided) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        cdDecided = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          cdHorizontal = true;
          cdSetupImages();
          if (!cdFrame) {
            cdActive = false;
            cdTouchId = null;
            return;
          }
          cdFrame.classList.add("carousel-horizontal-drag");
        } else {
          cdActive = false;
          cdTouchId = null;
          return;
        }
      }
      return;
    }

    if (!cdHorizontal || !cdFrame) return;

    e.preventDefault();
    cdDidDrag = true;

    const clampedDx = Math.max(-cdFrameW, Math.min(cdFrameW, dx));
    const pct = (clampedDx / cdFrameW) * 100;

    cdCurrentThumb!.style.transform = `translateX(${pct}%)`;
    if (cdPrevImg) cdPrevImg.style.transform = `translateX(calc(${pct - 100}% + 1px))`;
    if (cdNextImg) cdNextImg.style.transform = `translateX(calc(${pct + 100}% - 1px))`;
  }

  function cdTouchEnd(e: TouchEvent) {
    if (cdTouchId === null) return;
    const lifted = [...e.changedTouches].some((x) => x.identifier === cdTouchId);
    if (!lifted) return;

    const t = [...e.changedTouches].find((x) => x.identifier === cdTouchId);
    if (!t) return;

    cdActive = false;
    cdTouchId = null;

    if (!cdHorizontal || !cdDidDrag || !cdFrame) {
      cdCleanup();
      return;
    }

    const dx = t.clientX - cdStartX;
    const pct = (dx / cdFrameW) * 100;
    const threshold = 25;

    if (pct < -threshold) {
      cdSnapTo(1);
    } else if (pct > threshold) {
      cdSnapTo(-1);
    } else {
      cdSnapBack();
    }
  }

  window.addEventListener("touchmove", cdTouchMove, { passive: false });
  window.addEventListener("touchend", cdTouchEnd, { passive: true });
  window.addEventListener("touchcancel", cdTouchEnd, { passive: true });

  grid.addEventListener("pointercancel", (e) => {
    if (e.pointerId !== cdPointerId) return;
    cdActive = false;
    if (cdFrame) {
      cdSnapBack();
    } else {
      cdCleanup();
    }
  });

  grid.addEventListener("lostpointercapture", (e) => {
    if (e.pointerId !== cdPointerId) return;
    if (!cdActive) return;
    cdActive = false;
    if (cdFrame) {
      cdSnapBack();
    } else {
      cdCleanup();
    }
  });

  // ── Grid click handler ──

  grid.addEventListener(
    "click",
    (e) => {
      if (cdDidDrag) {
        e.preventDefault();
        e.stopPropagation();
        cdDidDrag = false;
        return;
      }

      const target = e.target as Element;

      const control = target.closest<HTMLElement>(
        "[data-carousel-prev], [data-carousel-next]",
      );
      if (control) {
        e.preventDefault();
        e.stopPropagation();

        const article = control.closest<HTMLElement>("[data-project-index]");
        if (!article) return;

        const direction: 1 | -1 = control.hasAttribute("data-carousel-prev") ? -1 : 1;
        advanceCarousel(article, direction);
        return;
      }

      const trigger = target.closest<HTMLElement>("[data-pswp-project]");
      if (trigger) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        e.stopPropagation();

        const idx = parseInt(trigger.dataset.pswpProject || "-1", 10);
        if (idx >= 0) open(idx);
      }
    },
    { capture: true },
  );

  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const trigger = (e.target as Element).closest<HTMLElement>("[data-pswp-project]");
    if (!trigger || !grid.contains(trigger)) return;
    if (trigger.tagName === "BUTTON") return;
    e.preventDefault();
    const idx = parseInt(trigger.dataset.pswpProject || "-1", 10);
    if (idx >= 0) open(idx);
  });

  // ── Global fallback for stuck drags ──

  window.addEventListener("pointerup", () => {
    if (cdTouchId !== null) return;
    if (cdActive) {
      cdActive = false;
      if (cdFrame) cdSnapBack(); else cdCleanup();
    }
    if (pointerDown) resetLightboxDrag();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (cdTouchId !== null) cdTouchId = null;
      if (cdActive) {
        cdActive = false;
        if (cdFrame) cdSnapBack(); else cdCleanup();
      }
      if (pointerDown) resetLightboxDrag();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
