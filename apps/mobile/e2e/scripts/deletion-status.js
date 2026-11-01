// Reads the newest account deletion request for the signed-in test user from
// the e2e project and checks its status (public.deletion_requests, migration
// 20261002020000: status in scheduled, cancelled, held, executing, completed,
// failed). Run after lib-guard.js and fetch-otp.js (which set output.userId).
//
// Env: EXPECT_STATUS (for example "scheduled" or "cancelled").
// Skipped, with a log line, when the user id is unknown (Mailpit source).

var expect = typeof EXPECT_STATUS !== 'undefined' ? String(EXPECT_STATUS) : '';
if (!expect) throw new Error('EXPECT_STATUS is not set');

if (!output.userId) {
  console.log('deletion-status: no user id (OTP_SOURCE mailpit); server check skipped');
} else {
  var base = output.e2e.baseUrl();
  var url =
    base +
    '/rest/v1/deletion_requests?select=status,requested_at&kind=eq.account&profile_id=eq.' +
    encodeURIComponent(output.userId) +
    '&order=requested_at.desc&limit=1';
  var res = http.get(url, { headers: output.e2e.adminHeaders() });
  if (!res.ok) throw new Error('deletion_requests read failed: HTTP ' + res.status);
  var rows = json(res.body);
  var got = rows.length ? rows[0].status : 'none';
  if (got !== expect) throw new Error('deletion request status is ' + got + ', expected ' + expect);
}
