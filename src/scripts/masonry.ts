function layoutMasonry() {
  const grid = document.getElementById("work-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll<HTMLElement>(".work-card"));
  if (!cards.length) return;

  const desktop = window.matchMedia("(min-width: 768px)").matches;

  if (!desktop) {
    grid.style.position = "";
    grid.style.height = "";
    cards.forEach((c) => {
      c.style.position = "";
      c.style.top = "";
      c.style.left = "";
      c.style.width = "";
    });
    grid.classList.add("masonry-ready");
    return;
  }

  // Reset every card to grid flow so we can measure natural heights.
  // The grid has md:items-start so cards won't stretch to match row neighbours.
  grid.style.position = "";
  grid.style.height = "";
  cards.forEach((c) => {
    c.style.position = "";
    c.style.top = "";
    c.style.left = "";
    c.style.width = "";
  });

  const numCols = 3;
  const gridWidth = grid.clientWidth;
  if (gridWidth < 1) return;
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 32;
  const colWidth = (gridWidth - gap * (numCols - 1)) / numCols;

  // Measure each card's natural content height
  const heights = cards.map((c) => c.getBoundingClientRect().height);

  // Absolutely position each card, stacking within its column
  const colTops = new Array(numCols).fill(0);

  cards.forEach((card, i) => {
    const col = i % numCols;
    card.style.position = "absolute";
    card.style.width = `${colWidth}px`;
    card.style.left = `${col * (colWidth + gap)}px`;
    card.style.top = `${colTops[col]}px`;
    colTops[col] += heights[i];
  });

  grid.style.position = "relative";
  grid.style.height = `${Math.max(...colTops)}px`;
  grid.classList.add("masonry-ready");
}

/** Avoid downloading every grid MP4 at once; load + play only when the card nears the viewport. */
function kickstartLazyGridVideos() {
  const grid = document.getElementById("work-grid");
  if (!grid) return;

  const videos = grid.querySelectorAll<HTMLVideoElement>("video[data-grid-video-src]");
  if (!videos.length) return;

  const start = (video: HTMLVideoElement) => {
    const url = video.dataset.gridVideoSrc;
    if (!url) return;
    video.removeAttribute("data-grid-video-src");
    video.src = url;
    video.muted = true;
    video.play().catch(() => {});
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const v = e.target as HTMLVideoElement;
        io.unobserve(v);
        start(v);
      }
    },
    { root: null, rootMargin: "180px", threshold: 0.01 },
  );

  videos.forEach((v) => io.observe(v));
}

async function initMasonry() {
  await document.fonts.ready;
  layoutMasonry();
  kickstartLazyGridVideos();

  const grid = document.getElementById("work-grid");
  if (!grid) return;

  let lastWidth = 0;
  new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    if (Math.abs(w - lastWidth) < 1) return;
    lastWidth = w;
    layoutMasonry();
  }).observe(grid);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initMasonry(), {
    once: true,
  });
} else {
  initMasonry();
}
