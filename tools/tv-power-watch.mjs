#!/usr/bin/env node
// Open the launcher whenever the TV is switched on. "Autorun Last App" reopens whatever was in
// front at power-off (often Netflix or iPlayer), so this watches the TV's unauthenticated status
// endpoint and, on an off -> on change, launches PhewTvHome.Home over the developer connection.
// The first reading is only a baseline, and the TV must be off for OFF_MS first, so a network blip
// while someone is watching never interrupts them.
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function isOn(info) {
  if (!info || !info.device) { return false; }
  return info.device.PowerState === undefined || info.device.PowerState === 'on';
}

// step(on, now) -> true when the launcher should be opened.
export function createWatch({ offMs }) {
  let offSince = null;
  let armed = false;
  return {
    step(on, now) {
      if (!on) {
        if (offSince === null) { offSince = now; }
        if (now - offSince >= offMs) { armed = true; }
        return false;
      }
      const fire = armed;
      offSince = null;
      armed = false;
      return fire;
    },
  };
}

const sh = (cmd, args) => new Promise((resolve) => {
  execFile(cmd, args, { timeout: 20000 }, (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout) + String(stderr) }));
});

async function readInfo(ip) {
  try {
    const res = await fetch(`http://${ip}:8001/api/v2/`, { signal: AbortSignal.timeout(2500) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

// sdb can take a while to come up after power-on, so retry for about a minute.
async function launch(host, appId, log) {
  for (let i = 0; i < 12; i++) {
    await sh('sdb', ['connect', host]);
    const r = await sh('sdb', ['-s', host, 'shell', '0', 'was_execute', appId]);
    if (r.ok && /launched/.test(r.out)) { log(`launched ${appId}`); return; }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  log(`gave up launching ${appId}`);
}

async function main() {
  const host = process.env.TV_HOST;
  if (!host) { throw new Error('TV_HOST is required'); }
  const ip = host.split(':')[0];
  const appId = process.env.LAUNCHER_APP_ID || 'PhewTvHome.Home';
  const pollMs = Number(process.env.POLL_MS || 3000);
  const settleMs = Number(process.env.SETTLE_MS || 4000);
  const log = (m) => console.log(`${new Date().toISOString()} ${m}`);
  const watch = createWatch({ offMs: Number(process.env.OFF_MS || 30000) });
  let last = null;
  log(`watching ${ip} for power-on; launcher ${appId}`);
  for (;;) {
    const on = isOn(await readInfo(ip));
    if (on !== last) { log(on ? 'TV on' : 'TV off or unreachable'); last = on; }
    if (watch.step(on, Date.now())) {
      // Let Autorun Last App finish first so the launcher ends up in front.
      await new Promise((resolve) => setTimeout(resolve, settleMs));
      await launch(host, appId, log);
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
