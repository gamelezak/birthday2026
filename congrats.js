/* ======= Страница поздравления ======= */

/* если открыли congrats.html напрямую без index — фиксируем старт праздника,
   чтобы index не «перепрыгивал» обратно бесконечно */
try {
  if (!sessionStorage.getItem('partyJustStarted')) {
    sessionStorage.setItem('partyJustStarted', Date.now().toString());
  }
} catch (e) { /* приватный режим — не страшно */ }

const $ = (id) => document.getElementById(id);
const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const PARTY_COLORS = ['#ff6db3', '#ffd98a', '#7fc4ff', '#a86fe8', '#5ee8b7', '#ff8a5e', '#fff0f7'];

/* ---------- звёзды + падающие звёзды на отдельном canvas ---------- */
const sky = document.createElement('canvas');
sky.className = 'sky-canvas';
sky.setAttribute('aria-hidden', 'true');
const sceneEl = $('partyScene');
sceneEl.insertBefore(sky, sceneEl.firstChild);
const sctx = sky.getContext('2d');
let bgStars = [];
let shooters = [];

function resizeSky() {
  sky.width = window.innerWidth;
  sky.height = window.innerHeight;
  bgStars = [];
  const n = Math.round(sky.width * sky.height / 9000);
  for (let i = 0; i < n; i++) {
    bgStars.push({
      x: Math.random() * sky.width,
      y: Math.random() * sky.height * .75,
      r: Math.random() > .9 ? 1.8 : 1,
      ph: rand(0, Math.PI * 2),
      sp: rand(.6, 2.2)
    });
  }
}
resizeSky();

function skyFrame(t) {
  sctx.clearRect(0, 0, sky.width, sky.height);
  const tsec = t / 1000;
  for (const s of bgStars) {
    const a = .35 + .65 * Math.abs(Math.sin(tsec * s.sp + s.ph));
    sctx.globalAlpha = a;
    sctx.fillStyle = '#fff8db';
    sctx.fillRect(s.x, s.y, s.r, s.r);
  }
  sctx.globalAlpha = 1;

  if (Math.random() < .004 && shooters.length < 2) {
    shooters.push({
      x: rand(sky.width * .1, sky.width * .9),
      y: rand(10, sky.height * .3),
      vx: rand(-6, -3.4) * (Math.random() > .5 ? -1 : 1),
      vy: rand(2.4, 4),
      life: 46, age: 0
    });
  }
  for (let i = shooters.length - 1; i >= 0; i--) {
    const sh = shooters[i];
    sh.age++;
    sh.x += sh.vx; sh.y += sh.vy;
    const alpha = Math.max(0, 1 - sh.age / sh.life);
    const grad = sctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 7, sh.y - sh.vy * 7);
    grad.addColorStop(0, `rgba(255,244,200,${alpha})`);
    grad.addColorStop(1, 'rgba(255,244,200,0)');
    sctx.strokeStyle = grad;
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(sh.x, sh.y);
    sctx.lineTo(sh.x - sh.vx * 7, sh.y - sh.vy * 7);
    sctx.stroke();
    if (sh.age >= sh.life) shooters.splice(i, 1);
  }
  requestAnimationFrame(skyFrame);
}
requestAnimationFrame(skyFrame);

/* ---------- печатающееся пожелание ---------- */
const WISHES = [
  'Сегодня твой день! Пусть сбывается всё, во что ты веришь...',
  'Год назад ты ждал этого момента — и вот он наступил!',
  'Пусть этот год будет полон приключений, смеха и чудес!'
];

function typeWish() {
  const el = $('typedWish');
  if (!el) return;
  const text = WISHES.join(' ');
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, 42);
    else el.classList.add('done');
  };
  setTimeout(tick, 1600);
}
typeWish();

/* ---------- конфетти (canvas, с «бумажной» 3D-круткой) ---------- */
const confCanvas = document.createElement('canvas');
confCanvas.className = 'confetti-canvas';
confCanvas.setAttribute('aria-hidden', 'true');
sceneEl.appendChild(confCanvas);
const cctx = confCanvas.getContext('2d');
let confPieces = [];

function resizeConf() {
  confCanvas.width = window.innerWidth;
  confCanvas.height = window.innerHeight;
}
resizeConf();

function spawnConfetti(n) {
  for (let i = 0; i < n; i++) {
    confPieces.push({
      x: rand(0, confCanvas.width),
      y: rand(-60, -8),
      w: rand(5, 11), h: rand(7, 14),
      vx: rand(-.6, .6), vy: rand(1.4, 3.4),
      rot: rand(0, Math.PI * 2), vr: rand(-.12, .12),
      ph: rand(0, Math.PI * 2), spin: rand(2, 5),
      color: pick(PARTY_COLORS),
      round: Math.random() > .65
    });
  }
}
spawnConfetti(90);
/* волна салюта, когда буквы заголовка «приземляются» */
setTimeout(() => burstConfetti(50), 1600);

function confFrame(t) {
  cctx.clearRect(0, 0, confCanvas.width, confCanvas.height);
  const tsec = t / 1000;
  for (let i = confPieces.length - 1; i >= 0; i--) {
    const p = confPieces[i];
    p.y += p.vy;
    p.x += p.vx + Math.sin(tsec * 1.6 + p.ph) * .8;
    p.rot += p.vr;
    if (p.y > confCanvas.height + 30) {
      if (confPieces.length > 160) { confPieces.splice(i, 1); continue; }
      p.y = rand(-40, -8); p.x = rand(0, confCanvas.width);
    }
    const scaleY = Math.cos(tsec * p.spin + p.ph);   // эффект переворота листочка
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.scale(1, Math.max(.15, Math.abs(scaleY)));
    cctx.fillStyle = p.color;
    if (p.round) {
      cctx.beginPath();
      cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      cctx.fill();
    } else {
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    cctx.restore();
  }
  requestAnimationFrame(confFrame);
}
requestAnimationFrame(confFrame);

function burstConfetti(count = 60) { spawnConfetti(count); }
setInterval(() => burstConfetti(12), 4200);

/* ---------- воздушные шары (canvas, с бликом, ниткой и «хвостиком») ---------- */
const ballCanvas = document.createElement('canvas');
ballCanvas.className = 'balloon-canvas';
ballCanvas.setAttribute('aria-hidden', 'true');
sceneEl.appendChild(ballCanvas);
const bctx = ballCanvas.getContext('2d');
let balloonsArr = [];

function resizeBalls() {
  ballCanvas.width = window.innerWidth;
  ballCanvas.height = window.innerHeight;
}
resizeBalls();

function spawnBalloon() {
  if (balloonsArr.length > 9) return;
  const r = rand(26, 46);
  balloonsArr.push({
    x: rand(30, ballCanvas.width - 30),
    y: ballCanvas.height + r * 2 + 80,
    r,
    vy: rand(.5, .95),
    ph: rand(0, Math.PI * 2),
    sway: rand(14, 40),
    color: pick(PARTY_COLORS),
    alpha: 0
  });
}
for (let i = 0; i < 5; i++) setTimeout(spawnBalloon, i * 700);
setInterval(spawnBalloon, 2600);

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, v + amt)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function balloonFrame(t) {
  bctx.clearRect(0, 0, ballCanvas.width, ballCanvas.height);
  const tsec = t / 1000;
  for (let i = balloonsArr.length - 1; i >= 0; i--) {
    const b = balloonsArr[i];
    b.y -= b.vy;
    b.alpha = Math.min(1, b.alpha + .02);
    if (b.y < -b.r * 3.4) { balloonsArr.splice(i, 1); continue; }
    const x = b.x + Math.sin(tsec * .8 + b.ph) * b.sway;
    const { r } = b;
    bctx.save();
    bctx.globalAlpha = b.alpha;

    // нитка — волнистая линия
    bctx.strokeStyle = 'rgba(255, 240, 247, .55)';
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.moveTo(x, b.y + r * 1.12);
    for (let s = 1; s <= 6; s++) {
      const yy = b.y + r * 1.12 + s * 12;
      const xx = x + Math.sin(tsec * 2 + b.ph + s * .9) * 4;
      bctx.lineTo(xx, yy);
    }
    bctx.stroke();

    // тело шара
    const grad = bctx.createRadialGradient(x - r * .35, b.y - r * .45, r * .15, x, b.y, r * 1.15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(.28, b.color);
    grad.addColorStop(1, shade(b.color, -70));
    bctx.fillStyle = grad;
    bctx.beginPath();
    bctx.ellipse(x, b.y, r * .85, r, 0, 0, Math.PI * 2);
    bctx.fill();

    // хвостик-узелок
    bctx.fillStyle = shade(b.color, -40);
    bctx.beginPath();
    bctx.moveTo(x - 5, b.y + r * .95);
    bctx.lineTo(x + 5, b.y + r * .95);
    bctx.lineTo(x, b.y + r * 1.18);
    bctx.closePath();
    bctx.fill();

    // блик
    bctx.fillStyle = 'rgba(255, 255, 255, .65)';
    bctx.beginPath();
    bctx.ellipse(x - r * .32, b.y - r * .38, r * .16, r * .26, -.5, 0, Math.PI * 2);
    bctx.fill();

    bctx.restore();
  }
  requestAnimationFrame(balloonFrame);
}
requestAnimationFrame(balloonFrame);

/* ---------- фейерверки на canvas ---------- */
const canvas = $('fireworks');
const ctx = canvas.getContext('2d');
let particles = [];
let rockets = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

window.addEventListener('resize', () => { resizeSky(); resizeCanvas(); resizeConf(); resizeBalls(); });

function explode(x, y, color) {
  const n = 46;
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + rand(-.1, .1);
    const speed = rand(1.6, 5.4);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(50, 90),
      age: 0,
      color,
      size: rand(1.5, 3.2)
    });
  }
}

function launchRocket() {
  rockets.push({
    x: rand(canvas.width * .1, canvas.width * .9),
    y: canvas.height + 10,
    vy: -rand(7.5, 11),
    targetY: rand(canvas.height * .12, canvas.height * .45),
    color: pick(PARTY_COLORS)
  });
}

function frame() {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.y += r.vy;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    if (r.y <= r.targetY) {
      explode(r.x, r.y, r.color);
      rockets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += .045;
    p.vx *= .985;
    p.vy *= .985;
    const alpha = Math.max(0, 1 - p.age / p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    if (p.age >= p.life) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let autoFw = setInterval(launchRocket, 1300);
setTimeout(launchRocket, 400);
setTimeout(launchRocket, 700);

function fireworksSalvo(n = 6, every = 260) {
  for (let i = 0; i < n; i++) setTimeout(launchRocket, i * every);
}

/* ---------- торт: задуть свечи ---------- */
const cake = document.querySelector('.cake');
const cakeWrap = document.querySelector('.cake-wrap');
const blowHint = $('blowHint');
const wishScroll = $('wishScroll');

function blowCandles() {
  if (cake.classList.contains('blown')) return;
  cake.classList.add('blown');
  cakeWrap.classList.add('no-glow');
  // дым из пиксельных «дымовых точек» над погашенными свечами
  document.querySelectorAll('.smoke-spot').forEach((spot) => {
    for (let i = 0; i < 3; i++) {
      const smoke = document.createElement('span');
      smoke.className = 'smoke';
      smoke.style.animationDelay = (i * 260) + 'ms';
      spot.appendChild(smoke);
      setTimeout(() => smoke.remove(), 1700 + i * 260);
    }
  });
  blowHint.textContent = '✨ Желание загадано... ✨';
  setTimeout(() => {
    wishScroll.classList.remove('hidden');
    fireworksSalvo(8, 200);
    burstConfetti(120);
  }, 700);
}

function relightCandles() {
  cake.classList.remove('blown');
  cakeWrap.classList.remove('no-glow');
  wishScroll.classList.add('hidden');
  blowHint.textContent = '★ Кликни по торту — задумай желание и задуй свечи ★';
}

cake.addEventListener('click', blowCandles);
$('relightBtn').addEventListener('click', relightCandles);

/* ---------- супер-сюрприз: коробка с подарком ---------- */
const SURPRISE_MESSAGES = [
  ['🦄', 'Ты — легендарный герой этого дня!'],
  ['🌈', 'Пусть жизнь будет яркой, как радуга!'],
  ['🚀', 'В этом году — только вверх, к звёздам!'],
  ['🎮', 'Новый год жизни: уровень повышен, все бонусы открыты!'],
  ['🍭', 'Сладости сегодня — без ограничений!']
];

$('surpriseBtn').addEventListener('click', () => {
  const overlay = document.createElement('div');
  overlay.className = 'surprise-overlay';
  overlay.innerHTML = `
    <div class="surprise-box" role="button" tabindex="0" aria-label="Открыть подарок">
      <img class="gift-img" src="assets/gift-box.png" alt="" draggable="false" />
      <div class="surprise-caption">нажми на коробочку...</div>
      <div class="surprise-msg"></div>
    </div>`;
  document.body.appendChild(overlay);

  const box = overlay.querySelector('.surprise-box');
  const msg = overlay.querySelector('.surprise-msg');

  const open = () => {
    if (box.classList.contains('open')) return;
    box.classList.add('open');
    overlay.querySelector('.surprise-caption').style.display = 'none';
    const [emoji, text] = pick(SURPRISE_MESSAGES);
    fireworksSalvo(10, 150);
    burstConfetti(150);
    setTimeout(() => {
      msg.innerHTML = `<div><span class="big-emoji">${emoji}</span>${text}<br/>
        <button class="btn surprise-close">ЗАКРЫТЬ</button></div>`;
      msg.classList.add('show');
      msg.querySelector('.surprise-close').addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.remove();
      });
    }, 450);
  };

  box.addEventListener('click', open);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
});

/* ---------- возврат на страницу ожидания ---------- */
$('backBtn').addEventListener('click', () => {
  sessionStorage.setItem('visitedParty', Date.now().toString());
  // добавляем ?returning=1, но сохраняем уже имеющиеся query-параметры (например ?debug=)
  const params = new URLSearchParams(location.search);
  params.set('returning', '1');
  location.href = 'index.html?' + params.toString();
});

/* лёгкая автосалва через пару секунд */
setTimeout(() => fireworksSalvo(4, 350), 2000);
