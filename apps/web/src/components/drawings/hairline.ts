'use client';
/**
 * One weight of line at every size. `vector-effect: non-scaling-stroke` would do this, but Chromium then
 * measures pathLength dashes in screen space, so draw-on animations stop short on large drawings. Instead
 * the svg's stroke-width is set in its own units from its rendered width: px * viewBoxWidth / renderedWidth.
 * Written straight to the element on resize (no React state).
 */
import { useCallback, useRef } from 'react';

export function useHairline(viewBoxWidth: number, px: number) {
  const ro = useRef<ResizeObserver | null>(null);
  return useCallback(
    (svg: SVGSVGElement | null) => {
      ro.current?.disconnect();
      if (!svg) return;
      const apply = () => {
        const w = svg.getBoundingClientRect().width;
        if (w > 0) svg.setAttribute('stroke-width', String((px * viewBoxWidth) / w));
      };
      apply();
      ro.current = new ResizeObserver(apply);
      ro.current.observe(svg);
    },
    [viewBoxWidth, px],
  );
}
