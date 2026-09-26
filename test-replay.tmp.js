const { parseHTML } = require('linkedom');
const fs = require('fs');
const vm = require('vm');

function makeEnv(opts) {
  const html = fs.readFileSync('index.html', 'utf8');
  const { window, document } = parseHTML(html);
  window.innerWidth = 1200; window.innerHeight = 800;
  window.devicePixelRatio = 1;
  window.matchMedia = () => ({ matches: false });
  let rafCbs = [];
  window.requestAnimationFrame = (cb) => { rafCbs.push(cb); return rafCbs.length; };
  window.cancelAnimationFrame = (id) => { if (rafCbs[id-1]) rafCbs[id-1] = null; };
  window.location = { search: opts.search || '', pathname: '/index.html', href: 'http://x/index.html', assign: (u) => { window.__assigned = u; } };
  try { document.baseURI = 'http://x/index.html'; } catch(e) {}
  try { window.addEventListener = () => {}; } catch(e) {}
  const ctxStub = new Proxy({}, { get: (t,p) => (p==='createLinearGradient'||p==='createRadialGradient') ? (()=>({addColorStop(){}})) : (()=>{}) });
  document.querySelectorAll('canvas').forEach(c => { c.getContext = () => ctxStub; });

  // fake clock shared with script sandbox
  const clock = { T: opts.now };
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a){ if (a.length===0) super(clock.T); else super(...a); }
    static now(){ return clock.T; }
  }
  // timers driven by the fake clock
  const timers = [];
  let timerId = 1;
  function setTimer(fn, ms, repeat) { const id = timerId++; timers.push({id, fn, due: clock.T + (ms||0), repeat, ms}); return id; }
  const setTimeoutS = (fn, ms) => setTimer(fn, ms, false);
  const setIntervalS = (fn, ms) => setTimer(fn, ms, true);
  const clearTimeoutS = (id) => { const t = timers.find(t=>t.id===id); if (t) t.cancelled = true; };
  const clearIntervalS = clearTimeoutS;
  function runFrames() {
    const cbs = rafCbs; rafCbs = [];
    cbs.forEach(cb => { try { cb(clock.T); } catch(e) { console.log('rAF error:', e.message); } });
  }
  function advance(ms) {
    const target = clock.T + ms;
    while (clock.T < target) {
      timers.sort((a,b)=>a.due-b.due);
      const t = timers.find(x => !x.cancelled && x.due <= target);
      const next = Math.min(target, t ? t.due : target, clock.T + 50);
      clock.T = next;
      runFrames();
      if (t && t.due <= clock.T) {
        try { t.fn(); } catch(e) { console.log('timer error:', e.message); }
        if (t.repeat) t.due = clock.T + t.ms; else t.cancelled = true;
      }
    }
    runFrames();
  }

  const store = Object.assign({}, opts.session || {});
  const sessionStorage = { getItem: k => store[k] ?? null, setItem: (k,v)=>{store[k]=String(v);} };

  const sandbox = {
    window, document, location: window.location, sessionStorage,
    setInterval: setIntervalS, clearInterval: clearIntervalS,
    setTimeout: setTimeoutS, clearTimeout: clearTimeoutS,
    Date: FakeDate, Math, Number, String, JSON, console,
    requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: window.cancelAnimationFrame,
    URL, Element: window.Element, Node: window.Node,
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('script.js','utf8'), context);
  // copy API out of the vm realm so closures execute inside their realm
  globalThis.__copyApi = function (obj) {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = () => obj[k]();
    return out;
  };
  const api = vm.runInContext('typeof window.birthdayCountdown !== "undefined" ? __copyApi(window.birthdayCountdown) : null', context);
  return { window, document, sandbox, api, advance, clock };
}

const listeners = new WeakMap();
function click(el) {
  const ev = { type: 'click', target: el, currentTarget: el, stopPropagation(){}, preventDefault(){} };
  try { el.dispatchEvent(ev); } catch(e) {}
  let fired = false;
  try { fired = ev.eventPhase !== 0 && ev.type === 'click'; } catch(e) {}
  if (!fired) {
    const fns = listeners.get(el) || [];
    fns.forEach(f => f(ev));
  }
}

const BIRTH = new Date(2025, 8, 27, 0, 0, 0, 0).getTime(); // 27.09.2025 local
let fails = 0;
function assert(cond, msg) { console.log((cond ? 'PASS' : 'FAIL') + ': ' + msg); if (!cond) fails++; }

// ---------- Scenario A: within 7 days after birthday ----------
{
  const env = makeEnv({ now: BIRTH + 3*86400e3 });
  const doc = env.document;
  const btn = doc.getElementById('replayBtn');
  assert(btn.style.display !== 'none', 'A: button visible on load (in 7-day window)');
  env.advance(1300); // auto replay starts at 1200ms
  assert(env.api.isReplayRunning(), 'A: auto replay started');
  assert(btn.style.display === 'none', 'A: button hidden while replay runs');
  const sec = () => doc.querySelector('#seconds em').textContent;
  console.log('A: seconds right after start:', sec());
  assert(sec() !== '00', 'A: countdown shows running seconds (not frozen 00)');
  assert(!env.window.__assigned, 'A: NO navigation during replay');
  env.advance(10000);
  assert(!env.window.__assigned, 'A: still no navigation mid-replay');
  console.log('A: seconds after 10s:', sec());
  env.advance(30000); // total ~41s real -> replay (~24s) finished
  assert(!!doc.getElementById('replayBanner'), 'A: banner appeared after replay finished');
  assert(!env.window.__assigned, 'A: no forced navigation — banner waits for user');
  // click "go to party"
  const toParty = doc.getElementById('replayToParty');
  assert(!!toParty, 'A: banner has party-transition button');
  click(toParty);
  env.advance(5000);
  console.log('A: assigned url:', env.window.__assigned);
  assert(env.window.__assigned && env.window.__assigned.includes('congrats.html'), 'A: clicking party button navigates to congrats.html');
}

// ---------- Scenario B: outside window — button hidden, ?replay=1 works manually ----------
{
  const env = makeEnv({ now: BIRTH - 30*86400e3 }); // month before birthday
  const doc = env.document;
  const btn = doc.getElementById('replayBtn');
  assert(btn.style.display === 'none', 'B: button hidden outside 7-day window');
  env.advance(3000);
  assert(!env.api.isReplayRunning(), 'B: no auto replay outside window');
  assert(!env.window.__assigned, 'B: no navigation');
}
{
  const env = makeEnv({ now: BIRTH - 30*86400e3, search: '?replay=1' });
  const doc = env.document;
  const btn = doc.getElementById('replayBtn');
  assert(btn.style.display !== 'none', 'B2: ?replay=1 shows button even outside window');
  click(btn);
  assert(env.api.isReplayRunning(), 'B2: manual click on button STARTS replay');
  env.advance(40000);
  assert(!!doc.getElementById('replayBanner'), 'B2: replay completes and shows banner');
  // "ещё разок" restarts
  click(doc.getElementById('replayAgain'));
  env.advance(500);
  assert(env.api.isReplayRunning(), 'B2: "Ещё разок" restarts replay');
  // close via "Спасибо, я всё видела"
  env.advance(40000);
  const closeBtn = doc.getElementById('replayClose');
  if (closeBtn) click(closeBtn);
  assert(!env.api.isReplayRunning(), 'B2: close stops replay');
  assert(btn.style.display !== 'none', 'B2: button visible again after closing (replay=1)');
}

console.log(fails ? ('FAILURES: ' + fails) : 'ALL TESTS PASSED');
process.exit(fails ? 1 : 0);
