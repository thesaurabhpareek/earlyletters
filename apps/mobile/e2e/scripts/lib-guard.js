// Shared guard for every script that talks to a backend (Maestro runScript,
// GraalJS sandbox: `http`, `json`, `output` and every shell variable whose name
// starts with MAESTRO_ are globals; there is no `require`).
//
// Loaded first with `runScript: ../scripts/lib-guard.js`; it stores helpers on
// `output.e2e` for the scripts that follow (Maestro docs, "Manage data and
// states": functions may be kept on the output object).
//
// It refuses anything that is not the dedicated e2e project or a local stack,
// so a mistyped variable can never read sign-in codes from production.

function readVar(name) {
  // typeof is the only safe test for an undeclared global in the sandbox.
  switch (name) {
    case 'MAESTRO_E2E_SUPABASE_URL':
      return typeof MAESTRO_E2E_SUPABASE_URL !== 'undefined' ? String(MAESTRO_E2E_SUPABASE_URL) : '';
    case 'MAESTRO_E2E_PROJECT_REF':
      return typeof MAESTRO_E2E_PROJECT_REF !== 'undefined' ? String(MAESTRO_E2E_PROJECT_REF) : '';
    case 'MAESTRO_E2E_SERVICE_KEY':
      return typeof MAESTRO_E2E_SERVICE_KEY !== 'undefined' ? String(MAESTRO_E2E_SERVICE_KEY) : '';
    case 'MAESTRO_PROD_PROJECT_REF':
      return typeof MAESTRO_PROD_PROJECT_REF !== 'undefined' ? String(MAESTRO_PROD_PROJECT_REF) : '';
    case 'MAESTRO_MAILPIT_URL':
      return typeof MAESTRO_MAILPIT_URL !== 'undefined' ? String(MAESTRO_MAILPIT_URL) : '';
    case 'MAESTRO_OTP_LENGTH':
      return typeof MAESTRO_OTP_LENGTH !== 'undefined' ? String(MAESTRO_OTP_LENGTH) : '';
    default:
      return '';
  }
}

function e2eBaseUrl() {
  var url = readVar('MAESTRO_E2E_SUPABASE_URL').replace(/\/+$/, '');
  var ref = readVar('MAESTRO_E2E_PROJECT_REF');
  var prod = readVar('MAESTRO_PROD_PROJECT_REF');
  if (!url) throw new Error('MAESTRO_E2E_SUPABASE_URL is not set');
  var local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url);
  if (!local) {
    if (!ref) throw new Error('refusing: set MAESTRO_E2E_PROJECT_REF to the e2e project ref');
    if (url !== 'https://' + ref + '.supabase.co') throw new Error('refusing: URL is not the e2e project');
  }
  if (prod && url.indexOf(prod) >= 0) throw new Error('refusing: that is the production project');
  return url;
}

function adminHeaders() {
  var key = readVar('MAESTRO_E2E_SERVICE_KEY');
  if (!key) throw new Error('MAESTRO_E2E_SERVICE_KEY is not set');
  var h = { apikey: key, 'Content-Type': 'application/json' };
  // Legacy service_role keys are JWTs and go in Authorization too; the newer
  // sb_secret_ keys are not JWTs and travel in apikey only (Assumption: Supabase
  // API keys guide; check once against the e2e project).
  if (key.indexOf('sb_secret_') !== 0) h.Authorization = 'Bearer ' + key;
  return h;
}

/** Busy wait: the sandbox has no timers. Only for short polls (a second at a time). */
function pause(ms) {
  var until = Date.now() + ms;
  while (Date.now() < until) {
    // spin
  }
}

output.e2e = {
  readVar: readVar,
  baseUrl: e2eBaseUrl,
  adminHeaders: adminHeaders,
  pause: pause,
};
