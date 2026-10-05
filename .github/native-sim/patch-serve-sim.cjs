// native-sim-template-version: 23
/**
 * Patches @expo/serve-sim 0.4.0's input-socket admission, in place.
 *
 * serve-sim admits at most 8 input WebSockets per stream, shared by every
 * viewer, and never pings them — so a viewer that went away without a clean
 * TCP close (sleeping laptop, dropped tunnel, a tab the proxy lost track of)
 * holds its slot until the session ends. The stream page retries once a
 * second and shows "Simulator input failed: Simulator input unavailable;
 * retry after other clients disconnect" on every refusal, which reads as
 * "someone else is driving" when nobody is. The same message also covers a
 * capture session that is not running, which is a different problem.
 *
 * Three changes, each anchored on an exact string from the 0.4.0 bundle so a
 * serve-sim bump that moves the code fails this step loudly instead of
 * silently shipping unpatched:
 *   1. the per-stream cap goes from 8 to 64;
 *   2. every admitted input socket is pinged every 15s and terminated after
 *      a missed pong, the same pattern serve-sim already uses for its WebKit
 *      inspector sockets — a dead viewer frees its slot within ~30s;
 *   3. "capture not running" gets its own close reason.
 *
 * Usage: node patch-serve-sim.cjs <path to dist/serve-sim.js>
 */
const fs = require('node:fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: patch-serve-sim.cjs <dist/serve-sim.js>');
  process.exit(2);
}
let src = fs.readFileSync(file, 'utf8');

if (src.includes('/* native-sim: input sockets patched */')) {
  console.log('serve-sim already patched');
  process.exit(0);
}

// 1 + 2 + 3: the admission check. `$` is the socket parameter in the 0.4.0
// bundle; the regex captures whatever the minifier named it and the cap
// constant, so a rebuild with different names still matches as long as the
// shape is the same.
const admit = /attachHidSocket\((\$|\w+)\)\{if\(this\.phase!=="running"\|\|this\.hidSockets\.size>=(\$?\w+)\)\{\1\.close\(1013,"Simulator input unavailable; retry after other clients disconnect"\);return\}this\.hidSockets\.add\(\1\),this\.admittedHidSockets\.add\(\1\),/;
const m = src.match(admit);
if (!m) {
  console.error('patch-serve-sim: admission check not found — serve-sim changed, review the patch');
  process.exit(1);
}
const [, sock, cap] = m;
const heartbeat =
  `(()=>{let alive=!0;const timer=setInterval(()=>{if(!alive){try{${sock}.terminate()}catch{}return}alive=!1;try{${sock}.ping()}catch{}},15000);` +
  `${sock}.on("pong",()=>{alive=!0});${sock}.once("close",()=>clearInterval(timer))})(),`;
src = src.replace(
  admit,
  `attachHidSocket(${sock}){if(this.phase!=="running"){${sock}.close(1013,"Simulator capture is not running yet; retrying");return}` +
    `if(this.hidSockets.size>=${cap}){${sock}.close(1013,"Simulator input unavailable; retry after other clients disconnect");return}` +
    `this.hidSockets.add(${sock}),this.admittedHidSockets.add(${sock}),${heartbeat}`,
);

// 1: the cap itself. Declared in a `var` list as `<name>=8,`.
const capDecl = new RegExp(`([,\\s])${cap.replace('$', '\\$')}=8([,;])`);
if (!capDecl.test(src)) {
  console.error(`patch-serve-sim: cap constant ${cap}=8 not found — serve-sim changed, review the patch`);
  process.exit(1);
}
src = src.replace(capDecl, `$1${cap}=64$2`);

// Appended, not prepended: the bundle starts with a shebang line.
src = src + '\n/* native-sim: input sockets patched */\n';
fs.writeFileSync(file, src);
console.log(`serve-sim patched: input cap ${cap} 8 → 64, heartbeat on input sockets`);
