// Gets the sign-in code for E2E_EMAIL and puts it in output.otp (and the
// link's token hash in output.tokenHash, and the user id in output.userId when
// the source returns one). Run after lib-guard.js, once the app shows "Check
// your email" (the app has already asked for the email by then).
//
// Two sources, chosen with OTP_SOURCE:
//
// - "admin" (default; hosted e2e project, CI): GoTrue admin generate_link with
//   type magiclink. It returns email_otp and hashed_token and sends no email
//   (V-code: @supabase/auth-js 2.117.2 GenerateLinkProperties: "email_otp: The
//   raw email OTP"; endpoint POST /admin/generate_link). It replaces the token
//   in the email the app just requested, so the code typed is the newest one.
//   Proves the app's code path, not email delivery (delivery is device test
//   S1-08 in docs/qa/DEVICE_TEST_PLAN.md).
// - "mailpit" (local Supabase stack, a Mac with Docker): reads the real email
//   from Mailpit's API (default http://127.0.0.1:54324; GET /api/v1/messages and
//   /api/v1/message/{ID}). Proves the template too. Field names ID, To,
//   Address, Text, HTML: Assumption from the Mailpit API v1; check on first run.
//
// The code length follows MAESTRO_OTP_LENGTH (default 6, AUTH_SETUP 4.4).

var email = typeof E2E_EMAIL !== 'undefined' ? String(E2E_EMAIL) : '';
var source = typeof OTP_SOURCE !== 'undefined' && OTP_SOURCE ? String(OTP_SOURCE) : 'admin';
var otpLength = parseInt(output.e2e.readVar('MAESTRO_OTP_LENGTH') || '6', 10);
if (!email) throw new Error('E2E_EMAIL is not set');

function codeFrom(text) {
  var re = new RegExp('(?:^|\\D)(\\d{' + otpLength + '})(?:\\D|$)');
  var m = re.exec(text || '');
  return m ? m[1] : null;
}

if (source === 'admin') {
  var base = output.e2e.baseUrl();
  var res = http.post(base + '/auth/v1/admin/generate_link', {
    headers: output.e2e.adminHeaders(),
    body: JSON.stringify({ type: 'magiclink', email: email }),
  });
  if (!res.ok) throw new Error('generate_link failed: HTTP ' + res.status);
  var d = json(res.body);
  // The raw GoTrue response carries the link fields at the top level next to the user;
  // supabase-js moves them under `properties`. Accept both shapes.
  var props = d.properties || d;
  output.otp = String(props.email_otp || '');
  output.tokenHash = String(props.hashed_token || '');
  output.userId = String((d.user && d.user.id) || d.id || '');
  if (output.otp.length !== otpLength) throw new Error('generate_link returned no ' + otpLength + '-digit code');
} else if (source === 'mailpit') {
  var mp = (output.e2e.readVar('MAESTRO_MAILPIT_URL') || 'http://127.0.0.1:54324').replace(/\/+$/, '');
  var found = null;
  for (var attempt = 0; attempt < 20 && !found; attempt++) {
    var list = http.get(mp + '/api/v1/messages?limit=50');
    if (list.ok) {
      var msgs = json(list.body).messages || [];
      for (var i = 0; i < msgs.length && !found; i++) {
        var to = msgs[i].To || [];
        for (var j = 0; j < to.length; j++) {
          if (String(to[j].Address).toLowerCase() === email.toLowerCase()) {
            found = msgs[i];
            break;
          }
        }
      }
    }
    if (!found) output.e2e.pause(1000);
  }
  if (!found) throw new Error('no email for the test address in Mailpit after 20 s');
  var msg = http.get(mp + '/api/v1/message/' + found.ID);
  if (!msg.ok) throw new Error('Mailpit message read failed: HTTP ' + msg.status);
  var body = json(msg.body);
  output.otp = codeFrom(body.Text) || codeFrom(body.HTML) || '';
  var link = /token_hash=([^&"'\s]+)/.exec(body.HTML || body.Text || '');
  output.tokenHash = link ? link[1] : '';
  output.userId = '';
  if (!output.otp) throw new Error('no ' + otpLength + '-digit code in the email');
} else {
  throw new Error('OTP_SOURCE must be admin or mailpit');
}
