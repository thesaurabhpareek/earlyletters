// Makes sure the test account E2E_EMAIL exists and is confirmed in the e2e
// project, so the app's "Continue with email" takes the known-address path
// (Magic Link template; AUTH_SETUP section 6). Run after lib-guard.js.
//
// Env (runScript env): E2E_EMAIL. Skipped when OTP_SOURCE is "mailpit" (the
// local stack creates the user on first send) or NEW_USER is "1" (the flow
// wants the brand-new-address path).
//
// GoTrue admin API: POST /auth/v1/admin/users with email_confirm true. 422 means
// the address is already registered, which is fine. (Admin create-user call is
// standard GoTrue; Assumption until the first run against the e2e project.)

var email = typeof E2E_EMAIL !== 'undefined' ? String(E2E_EMAIL) : '';
var source = typeof OTP_SOURCE !== 'undefined' && OTP_SOURCE ? String(OTP_SOURCE) : 'admin';
var fresh = typeof NEW_USER !== 'undefined' && String(NEW_USER) === '1';

if (!email) throw new Error('E2E_EMAIL is not set');
if (!/@resend\.dev$|@example\.test$|@localhost$/.test(email)) {
  // Test inboxes only: Resend test addresses, or reserved names for a local Mailpit.
  throw new Error('refusing: E2E_EMAIL must be a test address (delivered+label@resend.dev)');
}

if (source === 'admin' && !fresh) {
  var base = output.e2e.baseUrl();
  var res = http.post(base + '/auth/v1/admin/users', {
    headers: output.e2e.adminHeaders(),
    body: JSON.stringify({ email: email, email_confirm: true }),
  });
  if (!res.ok && res.status !== 422) throw new Error('admin create user failed: HTTP ' + res.status);
}
output.signin = { email: email };
