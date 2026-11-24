/**
 * BL-480 point 1: one step id is one record. The recorder writes steps/<id>.json, so a second step with the same id
 * would silently overwrite the first and the journey map would lose a screen. Pure, so a Node test can drive it.
 * `seen` maps an id to the title of the step that used it first; the message names both titles and never file text.
 */
export function assertUniqueStepId(seen: Map<string, string>, id: string, title: string): void {
  const first = seen.get(id);
  if (first !== undefined) {
    throw new Error(`step id ${id} is used twice in one run: "${first}" and "${title}". Give one a new id (BL-480).`);
  }
  seen.set(id, title);
}
