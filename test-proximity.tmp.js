const { parseHTML } = require('linkedom');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const { window, document } = parseHTML(html);

window.innerWidth = 1200; window.innerHeight = 800;
window.devicePixelRatio = 1;
window.matchMedia = () => ({ matches: false });
window.requestAnimationFrame = () => 1;
window.location = { search: '?debug=60', pathname: '/index.html', href: 'http://x/index.html', assign: (u)=>{ window.__assigned = u; } };
document.baseURI = 'http://x/index.html';
window.addEventListener = () => {};
const ctxStub = new Proxy({}, { get: (t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient') ? (() => ({ addColorStop(){} })) : (()=>{}) });
document.querySelectorAll('canvas').forEach(c => { c.getContext = () => ctxStub; });

const store = {};
const sessionStorage = { getItem: k => store[k] ?? null, setItem: (k,v) => { store[k]=v; } };

const sandbox = {
  window, document, location: window.location, sessionStorage,
  setInterval, clearInterval, setTimeout, clearTimeout, Date, Math, Number, String, JSON,
  console, requestAnimationFrame: window.requestAnimationFrame, URL,
  Element: window.Element, Node: window.Node,
};
sandbox.globalThis = sandbox;
const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('script.js','utf8'), context);

setTimeout(() => {
  const scene = document.querySelector('.scene');
  console.log('proximity:', scene.dataset.proximity);
  console.log('dust:', document.querySelectorAll('#dustMotes i').length);
  console.log('balloons:', document.querySelectorAll('.float-balloon').length);
  console.log('flags:', document.querySelectorAll('.flag').length);
  console.log('fireflies:', document.querySelectorAll('.firefly').length);
  console.log('border-on:', scene.classList.contains('party-border-on'));
  console.log('sec em:', document.querySelector('#seconds em').textContent, 'cls:', document.querySelector('#seconds em').getAttribute('class'));
  console.log('days em:', document.querySelector('#days em').textContent);
  console.log('subtitle:', document.querySelector('#subtitle').textContent);
  process.exit(0);
}, 5000);
