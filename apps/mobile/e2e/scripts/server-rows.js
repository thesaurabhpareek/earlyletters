// Counts what the signed-in test user has on the e2e server, to prove that
// nothing was claimed or uploaded (G-01: "No, sign out" on "Is this your
// account?" and a link from another phone must leave the server empty).
// Reads only ids, never letter text. Run after lib-guard.js and fetch-otp.js
// (admin source, which sets output.userId); skipped with a log line otherwise.
//
// Env: EXPECT_ENTRIES and EXPECT_CHILDREN (exact counts, usually "0").
// Tables: public.entries (author_id), public.child_members (profile_id),
// migration 20260930000000_scribe_core.sql.

var wantEntries = typeof EXPECT_ENTRIES !== 'undefined' ? parseInt(String(EXPECT_ENTRIES), 10) : 0;
var wantBooks = typeof EXPECT_CHILDREN !== 'undefined' ? parseInt(String(EXPECT_CHILDREN), 10) : 0;

function count(path) {
  var res = http.get(output.e2e.baseUrl() + '/rest/v1/' + path, {
    headers: Object.assign({}, output.e2e.adminHeaders(), { Prefer: 'count=exact', Range: '0-0' }),
  });
  if (!res.ok && res.status !== 206) throw new Error(path.split('?')[0] + ' read failed: HTTP ' + res.status);
  // PostgREST: Content-Range "0-0/<total>" or "*/0" (Assumption: Maestro's http exposes headers lower-cased).
  var range = (res.headers && (res.headers['content-range'] || res.headers['Content-Range'])) || '';
  var total = /\/(\d+)$/.exec(String(range));
  return total ? parseInt(total[1], 10) : json(res.body).length;
}

if (!output.userId) {
  console.log('server-rows: no user id (OTP_SOURCE mailpit); server check skipped');
} else {
  var uid = encodeURIComponent(output.userId);
  var entries = count('entries?select=id&author_id=eq.' + uid);
  var books = count('child_members?select=child_id&profile_id=eq.' + uid);
  if (entries !== wantEntries) throw new Error('server has ' + entries + ' letters for the test user, expected ' + wantEntries);
  if (books !== wantBooks) throw new Error('server has ' + books + ' book memberships for the test user, expected ' + wantBooks);
  console.log('server-rows: entries ' + entries + ', books ' + books);
}
