// Timing helper for the Maestro timing flows (E2E-18, E2E-19). Content-free: it keeps one number and prints
// one line, `TIMING <name>=<ms>`, never a screen text, a letter, a name or a path.
//
// Env: TIMING_ACTION ("start" or "lap"), TIMING_NAME (for example "cold_start_ms").
var action = typeof TIMING_ACTION !== 'undefined' ? String(TIMING_ACTION) : '';
var name = typeof TIMING_NAME !== 'undefined' ? String(TIMING_NAME) : '';
if (!/^[a-z_]+_ms$/.test(name)) throw new Error('TIMING_NAME must look like cold_start_ms');
if (action === 'start') {
  output.timingStartedAt = Date.now();
} else if (action === 'lap') {
  if (typeof output.timingStartedAt !== 'number') throw new Error('timing lap before start');
  console.log('TIMING ' + name + '=' + (Date.now() - output.timingStartedAt));
} else {
  throw new Error('TIMING_ACTION must be start or lap');
}
