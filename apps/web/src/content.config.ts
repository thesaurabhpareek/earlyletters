import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Legal pages. L1 owns the Markdown in src/content/legal/*.md; this site only
 * renders it. File name = URL: terms.md -> /terms.
 * Only lowercase file names are published (see pattern below).
 * Frontmatter: title, effectiveDate, status ("draft" shows the review banner
 * and adds noindex). Extra keys are allowed and ignored.
 */
const legal = defineCollection({
  // Lowercase file names only: publishable documents are terms.md, privacy.md
  // and so on; working files like REVIEW_NOTES.md or README.md never render.
  loader: glob({ base: './src/content/legal', pattern: ['[a-z]*.md', '!*[A-Z]*.md', '!_*.md'] }),
  schema: z.looseObject({
    title: z.string(),
    effectiveDate: z.union([z.string(), z.date()]).optional(),
    lastUpdated: z.union([z.string(), z.date()]).optional(),
    status: z.string().default('draft'),
    description: z.string().optional(),
    summary: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { legal };
