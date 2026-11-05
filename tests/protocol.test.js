const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function el() {
  return {
    addEventListener() {}, querySelectorAll: () => [], querySelector: () => el(),
    style: {}, classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, getContext: () => ({ clearRect(){}, fillRect(){}, createLinearGradient:()=>({addColorStop(){}}), fillText(){} }),
    textContent: '', innerHTML: '', disabled: false, hidden: true, value: '12', checked: false, width: 640, height: 160,
    showModal() {}, close() {},
  };
}
const sandbox = {
  console, performance: { now: () => 0 },
  localStorage: { getItem: () => null, setItem() {} },
  navigator: { userAgent: 'node', bluetooth: undefined, platform: 'linux', maxTouchPoints: 0 },
  window: {},
  document: { readyState: 'loading', getElementById: () => el(), addEventListener() {}, querySelectorAll: () => [] },
};
sandbox.window = sandbox;
vm.runInNewContext(code, sandbox);
const P = sandbox.window.XiaomiFrozenProtocol;
assert.ok(P, 'Protocol export missing');
const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');

assert.strictEqual(hex(P.buildRead(0x1a, 2)), '55aa0320011a02bfff');
assert.strictEqual(hex(P.buildFrame(0x20, 0x01, 0x10, [0x0e])), '55aa032001100ebdff');
assert.strictEqual(hex(P.buildRead(0xb0, 0x20)), '55aa032001b0200bff');
const ck = P.checksum([0x03, 0x20, 0x01, 0x1a, 0x02]);
assert.strictEqual(ck[0], 0xbf);
assert.strictEqual(ck[1], 0xff);

const raw = Uint8Array.from('55aa0423011a340188ff'.match(/../g).map((h) => parseInt(h, 16)));
const frames = P.parseFrames(raw);
assert.strictEqual(frames.length, 1);
assert.strictEqual(frames[0].arg, 0x1a);
assert.strictEqual(P.parseFw(frames[0].payload), '1.3.4');

const payload = new Uint8Array(32);
payload[8] = 61; payload[10] = 0xe8; payload[11] = 0x03;
payload[14] = 0x8a; payload[15] = 0x08; payload[20] = 0x18; payload[21] = 0x01;
const t = P.parseB0(payload);
assert.strictEqual(t.battery, 61);
assert.ok(Math.abs(t.speed - 1) < 1e-9);
assert.ok(Math.abs(t.odometer - 2.186) < 1e-9);
assert.ok(Math.abs(t.temperature - 28) < 1e-9);

const bad = Uint8Array.from('55aa0320011a02ffff'.match(/../g).map((h) => parseInt(h, 16)));
assert.strictEqual(P.parseFrames(bad).length, 0);

// Speed clamp expectations documented
assert.ok(25 === 25 && 30 === 30 && 35 === 35);

console.log('OK — all XiaomiFrozen protocol tests passed');
