/// <reference types="node" />
/**
 * QE-04 (S3, QE hunt of 8 Nov 2026): the export schema's `$id` (https://earlyletters.com/export-format/v1.schema.json)
 * answered 404. DELETION_AND_EXPORT_SPEC (risk table, "Export format drifts") says the schema is published on the
 * website, and schema.ts says anything published at the `$id` URL must be the newest v1 minor. So the website serves
 * a copy at exactly that path from `apps/web/public`, and this test fails if the copy and the app's schema ever differ.
 *
 * To refresh the copy after a schema change: write `JSON.stringify(exportJsonSchema, null, 2)` plus a newline to the
 * path below (the same bytes the export writes to `schema/export-v1.schema.json`, build.logic.ts).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { EXPORT_SCHEMA_VERSION, exportJsonSchema } from '../src/lib/export/schema';

const ROOT = join(__dirname, '..', '..', '..');
const id = new URL(exportJsonSchema.$id);
const published = join(ROOT, 'apps', 'web', 'public', ...id.pathname.split('/').filter(Boolean));

describe('the export schema is published at its $id (QE-04)', () => {
  it('the $id is on the website origin, under /export-format/, and names the format major', () => {
    expect(id.origin).toBe(brand.web.origin);
    expect(id.pathname).toBe(`/export-format/v${EXPORT_SCHEMA_VERSION.split('.')[0]}.schema.json`);
  });

  it('the website serves a file at that path', () => {
    expect(existsSync(published), published).toBe(true);
  });

  it('the published copy is the newest v1 minor: the app\'s schema, byte for byte as the export writes it', () => {
    expect(readFileSync(published, 'utf8')).toBe(`${JSON.stringify(exportJsonSchema, null, 2)}\n`);
  });
});
