"use client";

import { useEffect } from "react";

/**
 * The page behind an open overlay (side menu, sheet, modal, popover) must not
 * move when a finger drags on the overlay. An overlay opts in by carrying
 * `data-scroll-lock` while it is open; a number = only below that width in px
 * (e.g. "640": a popover that leaves the desktop page scrollable). On iPhone,
 * overflow:hidden on <body> alone does not stop touch scrolling, so the body is
 * pinned where it is (position: fixed at the current scroll) and put back after.
 * Mounted once in the root layout.
 */
export function ScrollLock() {
  useEffect(() => {
    let saved: { y: number; style: string } | null = null;

    const wanted = () =>
      [...document.querySelectorAll<HTMLElement>("[data-scroll-lock]")].some((el) => {
        const below = Number(el.dataset.scrollLock);
        return !below || window.innerWidth < below;
      });

    const unlock = () => {
      if (!saved) return;
      const { y, style } = saved;
      saved = null;
      document.body.setAttribute("style", style);
      window.scrollTo({ top: y, behavior: "instant" });
    };

    const sync = () => {
      const want = wanted();
      if (want && !saved) {
        const b = document.body;
        saved = { y: window.scrollY, style: b.getAttribute("style") ?? "" };
        Object.assign(b.style, { position: "fixed", top: `-${saved.y}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
      } else if (!want) {
        unlock();
      }
    };

    // body style changes are not watched (attributeFilter) — no feedback loop
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-scroll-lock"] });
    window.addEventListener("resize", sync);
    sync();
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", sync);
      unlock();
    };
  }, []);
  return null;
}
