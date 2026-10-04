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
  await expect(btn(app, /Type/).first()).toBeVisible();
  await step('unhappy', 'Microphone is off', 'A calm card, not an error: it offers to type the letter instead (first), open iOS Settings, or close. The browser denial is simulated by refusing getUserMedia; on a phone it is iOS\'s permission state, and "Open Settings" is native and does nothing on web.');
  await btn(app, /Type/).first().click();
  await expect(btn(app, 'Save')).toBeVisible();
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

test('[J05e] a long take', async ({ app, record }) => {
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
