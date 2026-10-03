/**
 * Compare rules-only vs rules+model edit passes on the same transcripts.
 *
 * Usage:
 *   npm run experiment:edits                                  rules only, sample transcripts
 *   npm run experiment:edits -- --transcripts results/transcripts.json
 *   npm run experiment:edits -- --model-url http://localhost:8080/v1 --model qwen3.5-2b
 *
 * --transcripts  JSON array of { file, raw, expected?, asr? }. `npm run experiment`
 *                writes results/transcripts.json from your recordings. Default:
 *                transcripts.example.json (fictional family "Asha").
 * --config       for the family dictionary (default config.local.json, else config.example.json)
 * --model-url    any OpenAI-compatible /v1 endpoint: llama.cpp `llama-server`, Ollama,
 *                or a hosted provider (ADR 0003). Key, if needed, from EDIT_MODEL_API_KEY.
 * --model        model name to send.
 * --level        clean (default) or verbatim.
 * --save-replies FILE  keep the model's raw replies (JSON, keyed by asr/file) to re-score later.
 * --replay FILE  re-score saved replies instead of calling a model: no endpoint, no key.
 *
 * Output: results/edits.md and results/edits.csv. Transcripts are sent only to
 * the endpoint you name; use a local server to keep everything on your Mac.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { DictionaryTerm, EditLevel, ModelCall } from '@scribe/core';
import { compareTranscript, recordingModel, replayModel, summarize, type EditRow, type Transcript } from './edits';

const ROOT = resolve(__dirname);
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const transcriptsPath = flag('transcripts') ?? join(ROOT, 'transcripts.example.json');
const configPath = flag('config') ?? [join(ROOT, 'config.local.json'), join(ROOT, 'config.example.json')].find(existsSync)!;
const resultsDir = flag('results') ?? join(ROOT, 'results');
const modelUrl = flag('model-url');
const modelName = flag('model') ?? 'default';
const level = (flag('level') ?? 'clean') as EditLevel;
const saveRepliesPath = flag('save-replies');
const replayPath = flag('replay');

const transcripts: Transcript[] = JSON.parse(readFileSync(transcriptsPath, 'utf8'));
const dictionary: DictionaryTerm[] = JSON.parse(readFileSync(configPath, 'utf8')).dictionary ?? [];

/** OpenAI-compatible chat call with JSON-schema constrained output. */
function openAICompatible(baseUrl: string, model: string): ModelCall {
  return async (req, signal) => {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        ...(process.env.EDIT_MODEL_API_KEY ? { authorization: `Bearer ${process.env.EDIT_MODEL_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'edits', strict: true, schema: req.schema } },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return body.choices?.[0]?.message?.content ?? '';
  };
}

async function main() {
  let currentId = '';
  const idOf = (t: Transcript) => `${t.asr ?? ''}/${t.file}`;
  const saved: Record<string, string> = {};
  let model: ModelCall | null = null;
  if (replayPath) model = replayModel(JSON.parse(readFileSync(replayPath, 'utf8')), () => currentId);
  else if (modelUrl) model = openAICompatible(modelUrl, modelName);
  if (model && saveRepliesPath && !replayPath) model = recordingModel(model, () => currentId, saved);
  const rows: EditRow[] = [];
  for (const t of transcripts) {
    currentId = idOf(t);
    const started = Date.now();
    const r = await compareTranscript(t, dictionary, model, { level, modelId: modelName });
    rows.push(...r);
    const m = r.find((x) => x.variant === 'rules+model');
    console.log(
      `${(t.asr ? `${t.asr}/` : '') + t.file}`.padEnd(36),
      `rules ${(r[0].changedWordRatio * 100).toFixed(0)}% words changed`,
      m ? `| +model ${(m.changedWordRatio * 100).toFixed(0)}%, ${m.rejectedTotal} rejected${m.error ? `, ${m.error}` : ''}` : '',
      `${((Date.now() - started) / 1000).toFixed(1)}s`,
    );
  }

  const pct = (n: number | null) => (n === null ? 'n/a' : `${(n * 100).toFixed(1)}%`);
  const fmt = (o: Record<string, number | undefined>) =>
    Object.entries(o)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ') || 'none';

  const md: string[] = [
    '# Edit pass comparison: rules only vs rules + model',
    '',
    `Generated ${new Date().toISOString()} from ${transcripts.length} transcripts (${transcriptsPath.split('/').pop()}).`,
    `Model: ${replayPath ? `saved replies from ${replayPath.split('/').pop()}` : model ? `${modelName} at ${modelUrl}` : 'none (pass --model-url to compare)'}. Level: ${level}.`,
    '',
    '| Variant | Transcripts | Words changed (avg) | Words changed (max) | Edits applied | Repeats offered | Verifier rejections | Malformed model items | Model failures | Word error after cleaning | Output differs from rules |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...summarize(rows).map(
      (s) =>
        `| ${s.variant} | ${s.transcripts} | ${pct(s.avgChangedWordRatio)} | ${pct(s.maxChangedWordRatio)} | ${s.totalApplied} | ${s.totalSuggested} | ${s.totalRejected} | ${s.totalInvalid} | ${s.errors} | ${pct(s.avgWerClean)} | ${s.differsFromRules ?? '-'} |`,
    ),
    '',
    'How to read this: "words changed" counts words removed or replaced (case and punctuation ignored); the verifier caps model changes at 15% of words per entry.',
    'Many rejections or malformed items mean the model keeps proposing things it may not do; that is the verifier working, but it also means the model is a poor fit.',
    'The model earns its place only if word error after cleaning drops and you prefer its output in the blind review.',
    '',
    '## Every transcript',
    '',
  ];
  for (const t of transcripts) {
    const mine = rows.filter((r) => r.file === t.file && r.asr === t.asr);
    md.push(`### ${(t.asr ? `${t.asr} / ` : '') + t.file}`, '', `- **Raw:** ${t.raw || '(nothing)'}`);
    if (t.expected) md.push(`- **You said:** ${t.expected}`);
    for (const r of mine) {
      md.push(
        `- **${r.variant}:** ${r.clean || '(nothing)'}`,
        `  - words changed ${pct(r.changedWordRatio)}; applied: ${fmt(r.applied)}${r.suggested ? `; repeats offered ${r.suggested}` : ''}; rejected: ${fmt(r.rejections)}${r.invalid ? `; malformed ${r.invalid}` : ''}${r.error ? `; failure ${r.error}` : ''}`,
      );
    }
    md.push('');
  }

  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(resultsDir, 'edits.md'), md.join('\n'));
  const csvEscape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  writeFileSync(
    join(resultsDir, 'edits.csv'),
    [
      ['asr', 'file', 'variant', 'raw', 'clean', 'changed_word_ratio', 'applied', 'rejected', 'rejections', 'invalid', 'error', 'wer_clean'].join(','),
      ...rows.map((r) =>
        [r.asr ?? '', r.file, r.variant, r.raw, r.clean, r.changedWordRatio.toFixed(4), JSON.stringify(r.applied), r.rejectedTotal, JSON.stringify(r.rejections), r.invalid, r.error ?? '', r.werClean === null ? '' : r.werClean.toFixed(4)]
          .map(csvEscape)
          .join(','),
      ),
    ].join('\n'),
  );
  if (saveRepliesPath && !replayPath) {
    writeFileSync(saveRepliesPath, JSON.stringify(saved, null, 2));
    console.log(`Saved ${Object.keys(saved).length} model replies to ${saveRepliesPath} (contains transcript text; keep it out of git).`);
  }
  console.log(`\nDone. Open ${join(resultsDir, 'edits.md')}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
