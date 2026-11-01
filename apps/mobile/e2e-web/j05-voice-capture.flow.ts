import { btn, firstRun, journey } from './support/app';
import { allowConsoleError, expect, test } from './support/journey';

const NOTE_WEB =
  'The web build records with the browser\'s fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone.';

test('[J05] speaking a letter: listening, pause, resume, finish', async ({ app, record }) => {
  const step = journey(record, 'J05', 'voice-capture', 1, 'J04-03');
  await firstRun(app);
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await step('happy', 'Listening', 'Full-screen and calm: who it is to, "Only you, until you add it to the book", a running clock and a glow that moves with the voice. Microphone permission was granted (on a phone iOS asks once, in its own alert, which a browser cannot show).');
  await app.waitForTimeout(2500);
  await btn(app, 'Pause').click();
  await expect(app.getByText('Paused', { exact: false }).first()).toBeVisible();
  await step('happy', 'Paused', 'Pause stops the clock and the glow. Keep talking continues the same recording.');
  await btn(app, 'Keep talking').click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(1500);
  await btn(app, 'Finish').click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await step('happy', 'Finished: Review opens at once', 'The take is kept first, then Review opens. It says it is writing down what was said. ' + NOTE_WEB);
});

test('[J05b] microphone permission denied', async ({ app, record }) => {
  const step = journey(record, 'J05', 'voice-capture', 4, 'J05-01');
  await firstRun(app);
  allowConsoleError(app, /NotAllowed|Permission|denied/i);
  await app.evaluate(() => {
    const deny = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: deny, configurable: true });
    const q = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (d: PermissionDescriptor) =>
      (d as { name: string }).name === 'microphone' ? Promise.resolve({ state: 'denied', onchange: null } as unknown as PermissionStatus) : q(d);
  });
  await btn(app, /^Speak/).click();
  await expect(app.getByRole('heading', { name: 'The microphone is off' })).toBeVisible();
  await expect(app.getByText('Turn it on in Settings, or type this one.')).toBeVisible();
  await expect(btn(app, /Type/).first()).toBeVisible();
  await step('unhappy', 'Microphone is off', 'One calm state with the microphone glyph: "The microphone is off". Type instead first, Open Settings quiet, Close at the top right. Only a refused permission lands here (S13). The browser denial is simulated by refusing getUserMedia; on a phone it is iOS\'s permission state, and "Open Settings" is native and does nothing on web.');
  await btn(app, /Type/).first().click();
  await expect(btn(app, /^Add to .*book/)).toBeVisible();
  await step('happy', 'Typing instead', 'The person lands on the Write page for the same prompt.');
});

test('[J05c] offline: airplane mode changes nothing about capture', async ({ app, context, record }) => {
  const step = journey(record, 'J05', 'voice-capture', 6, 'J05-01');
  await firstRun(app);
  allowConsoleError(app, /ERR_INTERNET_DISCONNECTED/);
  await context.setOffline(true);
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(2000);
  await step('unhappy', 'Listening with no connection', 'The device is offline. Nothing changes: recording, words and the book are all on the phone, and there is no "offline" banner anywhere in v1.0. ' + NOTE_WEB);
  await btn(app, 'Finish').click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await step('unhappy', 'Review with no connection', 'Review opens as usual; nothing waits on the network.');
});

test('[J05d] a take of under a second', async ({ app, record }) => {
  const step = journey(record, 'J05', 'voice-capture', 8, 'J05-01');
  await firstRun(app);
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await btn(app, 'Finish').click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await app.waitForTimeout(1500);
  await step('unhappy', 'Finished at once', 'Finish tapped straight after starting. The app keeps whatever was captured and opens Review; it does not refuse a short or empty take. ' + NOTE_WEB);
});

// Known failure on develop: #480 ("Array buffer allocation failed" at about 65 s on web), fixed by #532.
// Remove this fixme when #532 merges.
test.fixme('[J05e] a long take',async ({ app, record }) => {
  test.setTimeout(150_000);
  const step = journey(record, 'J05', 'voice-capture', 9, 'J05-01');
  await firstRun(app);
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(10_000);
  await app.waitForTimeout(55_000);
  await expect(app.getByText(/^1:0\d$/)).toBeVisible();
  await step('happy', 'Over a minute in', 'The clock keeps counting with no limit (here past a minute). If the level stays below speaking level for 8 seconds the line under the clock becomes a gentle "still here" (on web the fake microphone and the missing level meter make that unreliable, so it is not asserted). On a phone the elapsed time is announced to VoiceOver once a minute.');
  await btn(app, 'Finish').click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
});

test('[J05f] the microphone is in use', async ({ app, record }) => {
  const step = journey(record, 'J05', 'voice-capture', 10, 'J05-01');
  await firstRun(app);
  allowConsoleError(app, /NotReadable|in use|Could not start/i);
  // Permission is granted, but the audio device is held (on a phone: a call, Siri, an alarm or another app).
  await app.evaluate(() => {
    const busy = () => Promise.reject(new DOMException('Could not start audio source', 'NotReadableError'));
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: busy, configurable: true });
    const q = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (d: PermissionDescriptor) =>
      (d as { name: string }).name === 'microphone' ? Promise.resolve({ state: 'granted', onchange: null } as unknown as PermissionStatus) : q(d);
  });
  await btn(app, /^Speak/).click();
  await expect(app.getByRole('heading', { name: 'The microphone is in use' })).toBeVisible();
  await expect(app.getByText('The microphone is off')).toHaveCount(0);
  await expect(btn(app, 'Try again')).toBeVisible();
  await step('unhappy', 'The microphone is in use', 'A start that fails while permission is granted names the real cause: "The microphone is in use. A call or another app has it right now." Try again first, Type instead quiet. It never says the microphone is off, which Settings could not fix (S13).');
});

test('[J05g] Review while the words are on their way: read it back later', async ({ app, record }) => {
  test.setTimeout(60_000);
  const step = journey(record, 'J05', 'voice-capture', 11, 'J05-03');
  await firstRun(app);
  await btn(app, /^Speak/).click();
  await expect(app.getByText('Listening.')).toBeVisible();
  await app.waitForTimeout(1500);
  await btn(app, 'Finish').click();
  await expect(app.getByText('Writing down what you said.')).toBeVisible();
  await expect(app.getByText('Long recordings take a little more time.')).toBeVisible({ timeout: 12_000 });
  await expect(btn(app, 'Read it back later')).toBeVisible({ timeout: 12_000 });
  await step('happy', 'Read it back later', 'The moon breathes over "Writing down what you said." and the recording\'s length. After 8 seconds one line says long recordings take a little more time; after 15 seconds with no progress a quiet "Read it back later" appears (S14). ' + NOTE_WEB);
  await btn(app, 'Read it back later').click();
  await expect(app.getByText('A recording, waiting for its words.')).toBeVisible();
  await step('happy', 'Back on Tonight, waiting for its words', 'Review closes and the queue carries on. Tonight shows the recording as a card waiting for its words, with Open.');
});
