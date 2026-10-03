/**
 * Website copy in @scribe/content is written with placeholders. On the public
 * site there is no child yet, so {child} reads as "your child". {price} is
 * not decided (BRAND.md proof discipline), so the clause that names it is
 * dropped rather than inventing a number.
 */
export function fill(text: string): string {
  return text
    .replace(/, from \{price\},/g, ',')
    .replace(/\{child\}'s/g, "your child's")
    .replace(/\{child\}/g, 'your child');
}

/** Same, at the start of a sentence or a heading. */
export function fillCap(text: string): string {
  const t = fill(text);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
