/** One part of the film as measured: where its top is on the page, how tall it is, and its rest fraction. */
export type SceneBox = { top: number; height: number; rest: number };

/**
 * Scroll positions where each part of the film is at rest. Pinned (normal) layout: its top plus its rest fraction of
 * the pinned range (height minus one screen). Reduced motion flows the parts like a plain page (Scene.module.css), with
 * no pinned range, so the rest position is simply the part's top. Pure, so it is tested alone (test/rest-tops.test.ts).
 */
export function restTopsFor(boxes: readonly SceneBox[], vh: number, reduced: boolean): number[] {
  return boxes.map((b) => (reduced ? b.top : b.top + b.rest * Math.max(0, b.height - vh)));
}
