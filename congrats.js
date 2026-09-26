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
  'Сегодня ТОТ САМЫЙ день! Пусть сбывается всё, во что ты веришь, и даже то, во что уже не верилось, c 19 летием лапочка это твой день^^',
  'Пусть этот год будет как лучший плейлист: любимые люди на репите, тревоги в удалённых, а счастье без ограничений! Счастливого дня рожденияы Лизонька^^',
  'Желаю тебе года, где утро начинается с любимого занятия(в твоём случае сна xD), вечера с тёплым пледом и смешными сериалами, а рядом всегда будут, родные и блмзкие тебе люди^^',
  'С 19-летием! Желаю тебе счастья, здаравья, говорить «да» приятным занятиям и «нет» тому, что высасывает энергию^^',
  'Здоровья, чтобы планы совпадали с силами, денег, чтобы мечты стоили меньше, чем возможности, и счастья  такого, которое не нужно объяснять! Обнимаю тебя ангелочек^^'
];

function typeWish() {
  const el = $('typedWish');
  if (!el) return;
  const text = pick(WISHES);
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
    /* «теневая» сторона при обороте — бумажный объём */
    cctx.fillStyle = scaleY < -.25 ? shade(p.color, -75) : p.color;
    if (p.round) {
      cctx.beginPath();
      cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      cctx.fill();
      /* блик на «лицевой» стороне кружка */
      if (scaleY > .45) {
        cctx.fillStyle = 'rgba(255,255,255,.5)';
        cctx.beginPath();
        cctx.arc(-p.w * .16, -p.w * .16, p.w * .18, 0, Math.PI * 2);
        cctx.fill();
      }
    } else {
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      /* светлая кромка-фаска у прямоугольных конфеттинок */
      cctx.fillStyle = 'rgba(255,255,255,.28)';
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, Math.max(1.5, p.h * .18));
    }
    cctx.restore();
  }
  requestAnimationFrame(confFrame);
}
requestAnimationFrame(confFrame);

function burstConfetti(count = 60) { spawnConfetti(count); }
setInterval(() => burstConfetti(12), 4200);

/* ---------- шарики с поздравления убраны: ночная тема — без шариков ---------- */

/* ---------- фейерверки на canvas ---------- */
const canvas = $('fireworks');
const ctx = canvas.getContext('2d');
let particles = [];
let rockets = [];
let shockwaves = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

window.addEventListener('resize', () => { resizeSky(); resizeCanvas(); resizeConf(); });

function explode(x, y, color) {
  const n = 46;
  /* «первое вспышечное ядро» — короткая белая сердцевина взрыва */
  for (let i = 0; i < 6; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(.2, 1.1);
    particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: rand(8, 14), age: 0, color: '#fffbe8', size: rand(3, 5)
    });
  }
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
      size: rand(1.5, 3.2),
      tw: Math.random() > .7 ? rand(6, 12) : 0   /* часть искр мерцает */
    });
  }
  shockwaves.push({ x, y, r: 6, max: rand(70, 110), alpha: .5 });
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
    /* лёгкий зигзаг — ракета «виляет», как настоящая */
    r.x += Math.sin(r.y * .045) * .7;
    r.y += r.vy;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    /* искристый хвост */
    ctx.fillStyle = 'rgba(255, 236, 180, .8)';
    for (let tr = 1; tr <= 3; tr++) {
      ctx.globalAlpha = .5 / tr;
      ctx.beginPath();
      ctx.arc(r.x - Math.sin((r.y + tr * 6) * .045) * tr, r.y + tr * 7, 1.6 - tr * .35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (r.y <= r.targetY) {
      explode(r.x, r.y, r.color);
      rockets.splice(i, 1);
    }
  }

  /* расходящиеся кольца ударной волны */
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const wv = shockwaves[i];
    wv.r += (wv.max - wv.r) * .12 + 1.2;
    wv.alpha *= .9;
    ctx.strokeStyle = `rgba(255, 244, 210, ${Math.max(0, wv.alpha)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
    ctx.stroke();
    if (wv.alpha < .02 || wv.r >= wv.max - 2) shockwaves.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += .045;
    p.vx *= .985;
    p.vy *= .985;
    let alpha = Math.max(0, 1 - p.age / p.life);
    /* мерцающие искры: затухание с синусоидальными «вспышками» */
    if (p.tw) alpha *= .55 + .45 * Math.abs(Math.sin(p.age / p.tw * Math.PI));
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

/* ---------- торт: живой огонь, искры, дым, розыгрыш ---------- */
const cake = document.querySelector('.cake');
const cakeWrap = document.querySelector('.cake-wrap');
const blowHint = $('blowHint');
const wishScroll = $('wishScroll');
const reduceMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const HINT_DEFAULT = 'Торт твой. Загадай самое заветное желание и задуй свечи';
const candleSpots = Array.from(document.querySelectorAll('.smoke-spot'));
let prankUsed = false;   /* розыгрыш «свеча снова ожила» — ровно один раз */

/* язычки пламени поверх пиксельных свечей на спрайте торта */
if (!reduceMotion) {
  candleSpots.forEach((spot, i) => {
    const flame = document.createElement('span');
    flame.className = 'flame';
    flame.style.setProperty('--fd', (i * 0.27 + Math.random() * 0.15).toFixed(2) + 's');
    spot.appendChild(flame);
  });
}

/* sparks — маленький залп искр из точки (x, y в % от торта) */
function spawnSparks(x, y, n = 9) {
  for (let i = 0; i < n; i++) {
    const sp = document.createElement('span');
    sp.className = 'c-spark';
    const a = rand(-Math.PI * .85, -Math.PI * .15);      /* вверх веером */
    const d = rand(18, 46);
    sp.style.left = x + '%';
    sp.style.top = y + '%';
    sp.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
    sp.style.setProperty('--dy', (Math.sin(a) * d).toFixed(0) + 'px');
    sp.style.animationDelay = (i * 22) + 'ms';
    cake.appendChild(sp);
    setTimeout(() => sp.remove(), 800 + i * 22);
  }
}

function puffSmoke(spot, times = 3) {
  for (let i = 0; i < times; i++) {
    const smoke = document.createElement('span');
    smoke.className = 'smoke';
    smoke.style.animationDelay = (i * 260) + 'ms';
    spot.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1700 + i * 260);
  }
}

function extinguish(spot) {
  const flame = spot.querySelector('.flame');
  if (flame) {
    flame.classList.add('out');
    setTimeout(() => flame.remove(), 600);
  }
  const cx = spot.classList.contains('s0') ? 40.6 : spot.classList.contains('s2') ? 59.4 : 50;
  const cy = spot.classList.contains('s1') ? 17.2 : 21.9;
  spawnSparks(cx, cy);
  puffSmoke(spot, 2);
}

function blowCandles() {
  if (cake.classList.contains('blown')) return maybePrankRelight();
  cake.classList.add('blown');
  cakeWrap.classList.add('no-glow');
  cake.classList.remove('joy-jiggle');
  /* гасим свечи по очереди — слева направо, с задержкой */
  candleSpots.forEach((spot, i) => setTimeout(() => extinguish(spot), i * 170));
  blowHint.textContent = 'Запечатано и принято в работу!';
  blowHint.classList.add('hint-flash');
  setTimeout(() => {
    wishScroll.classList.remove('hidden');
    fireworksSalvo(10, 170);
    burstConfetti(150);
    if (!reduceMotion) {
      cake.classList.add('joy-jiggle');
      setTimeout(() => cake.classList.remove('joy-jiggle'), 1600);
    }
  }, 700);
  return undefined;
}

/* розыгрыш: после того как всё задуты, одна свеча «оживает» — ровно 1 раз */
function maybePrankRelight() {
  if (prankUsed || reduceMotion) return false;
  prankUsed = true;
  const spot = candleSpots[1] || candleSpots[0];
  const flame = document.createElement('span');
  flame.className = 'flame relit';
  flame.style.setProperty('--fd', '0s');
  spot.appendChild(flame);
  cakeWrap.classList.remove('no-glow');
  blowHint.textContent = 'Странно... свеча ожила! Давай ещё раз, теперь наверняка';
  blowHint.classList.add('hint-flash');
  setTimeout(() => {
    flame.classList.add('out');
    setTimeout(() => flame.remove(), 600);
    puffSmoke(spot, 1);
  }, 2600);
  return true;
}

function relightCandles() {
  cake.classList.remove('blown', 'joy-jiggle');
  cakeWrap.classList.remove('no-glow');
  wishScroll.classList.add('hidden');
  blowHint.textContent = HINT_DEFAULT;
  blowHint.classList.remove('hint-flash');
  if (!reduceMotion) {
    candleSpots.forEach((spot, i) => {
      spot.querySelectorAll('.flame, .smoke').forEach((el) => el.remove());
      const flame = document.createElement('span');
      flame.className = 'flame';
      flame.style.setProperty('--fd', (i * 0.27 + Math.random() * 0.15).toFixed(2) + 's');
      spot.appendChild(flame);
    });
  }
}

cake.addEventListener('click', blowCandles);
$('relightBtn').addEventListener('click', relightCandles);

/* автоподсказки: ротация текстов + мигание при бездействии */
const HINT_ROTATION = [
  'Кликни по торту, загадай желание и задуй свечи',
  'Можно и свайпом: резко проведи пальцем по торту, задует все свечи разом.',
  'Говорят, желания под салют сбываются быстрее... но сначала их надо загадать!'
];
let hintIdx = 0;
setInterval(() => {
  if (cake.classList.contains('blown')) return;   /* показываем только «горящие» подсказки */
  hintIdx = (hintIdx + 1) % HINT_ROTATION.length;
  blowHint.textContent = HINT_ROTATION[hintIdx];
}, 8000);
let idleTimer = null;
function armIdleNudge() {
  clearTimeout(idleTimer);
  blowHint.classList.remove('hint-nudge');
  idleTimer = setInterval(() => {
    if (!cake.classList.contains('blown')) blowHint.classList.add('hint-nudge');
  }, 12000);
}
['click', 'pointerdown', 'keydown'].forEach((ev) =>
  cake.addEventListener(ev, () => {
    blowHint.classList.remove('hint-nudge');
    armIdleNudge();
  }));
armIdleNudge();

/* ---------- супер-сюрприз: многослойная «матрёшка» подарков ---------- */
/* финальные послания гранд-финала (выбирается случайное) */
const SURPRISE_MESSAGES = [
  ['assets/gift-trophy.png', 'Кубок чемпиона праздника — твой! Ты дошла до самого сердца сюрприза. Знай: где-то прямо сейчас кто-то очень рад, что ты есть. С 19-летием Лизонька ^^'],
  ['assets/gift-trophy.png', 'Это не просто подарок — это орден «За пройденные ожидания и выдержанные отсчёты». Носи с гордостью, ты заслужила лапочка^^'],
  ['assets/gift-trophy.png', 'Внутри была пустая коробочка? Нет! Внутри было вот это: ты лучший человек этого года. И точка.'],
  ['assets/gift-trophy.png', 'Финальный лут легендарной редкости: +100 к счастью, +50 к удаче, пассивка «желания сбываются». С 19-летием Лизонька^^']
];

/* промежуточные слои матрёшки — спрайты вместо эмодзи + реплики-тикеры */
const NESTED_GIFTS = [
  { sprite: 'assets/gift-bear.png', alt: 'Медвежонок',
    tease: 'Ой! Это был только первый слой. Медвежонок передаёт: капай дальше!' },
  { sprite: 'assets/gift-candy.png', alt: 'Конфетка',
    tease: 'Почти! Конфетка — это взятка, чтобы ты не закрыла страницу ;) Дёрни крышку ещё раз!' },
  { sprite: 'assets/gift-sparkle.png', alt: 'Светящаяся коробочка.',
    tease: 'Светится! Чувствуешь жар из-под крышки? Остался один слой, и всё!' }
];

/* финальный залп — усиленный салют прямо из центра экрана */
function grandSalvo() {
  try {
    /* залп ракет из нижней кромки по всей ширине */
    fireworksSalvo(14, 120);
    /* несколько мгновенных взрывов в центре — эффект «баха!» */
    for (let i = 0; i < 6; i++) {
      explode(canvas.width / 2 + rand(-canvas.width * .3, canvas.width * .3),
              canvas.height * rand(.2, .5), pick(PARTY_COLORS));
    }
    burstConfetti(260);
  } catch (e) { /* не критично */ }
}

/* замирание экрана перед главным открытием (build-up → drop) */
function screenDrop(cb) {
  const scene = $('partyScene');
  if (!scene || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    setTimeout(cb, 100);
    return;
  }
  scene.classList.add('drop-charge');
  setTimeout(() => {
    scene.classList.remove('drop-charge');
    scene.classList.add('drop-shake');
    setTimeout(cb, 260);
  }, 900);
}

$('surpriseBtn').addEventListener('click', () => {
  /* счётчик повторных нажатий — чем дальше, тем эпичнее */
  let revealCount = parseInt(sessionStorage.getItem('surpriseReveals') || '0', 10);
  const totalLayers = NESTED_GIFTS.length + 1;

  const overlay = document.createElement('div');
  overlay.className = 'surprise-overlay';
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="surprise-progress" aria-hidden="true">
      ${Array.from({ length: totalLayers }, () => '<i></i>').join('')}
    </div>
    <div class="surprise-box" role="button" tabindex="0" aria-label="Открыть подарок">
      <div class="gift-stack">
        <img class="gift-lid" src="assets/gift-box.png" alt="" draggable="false" aria-hidden="true" />
        <img class="gift-base" src="assets/gift-box.png" alt="" draggable="false" />
      </div>
      <div class="gift-glow" aria-hidden="true"></div>
      <div class="surprise-caption">Дёрни крышку, она не кусается...</div>
      <div class="surprise-burst" aria-hidden="true"></div>
      <div class="surprise-msg"></div>
    </div>`;
  document.body.appendChild(overlay);
  /* на мобильных: блокируем прокрутку страницы под оверлеем,
     чтобы содержимое сюрприза не «уезжало» за экран */
  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('surprise-open');

  const box = overlay.querySelector('.surprise-box');
  const msg = overlay.querySelector('.surprise-msg');
  const caption = overlay.querySelector('.surprise-caption');
  const burst = overlay.querySelector('.surprise-burst');
  const giftStack = overlay.querySelector('.gift-stack');
  const pips = overlay.querySelectorAll('.surprise-progress i');
  let layer = 0;
  let animating = false;

  function markPip() {
    if (pips[layer]) pips[layer].classList.add('lit');
    layer++;
  }

  function sparkleBurst(n = 18) {
    burst.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = pick(['●', '○', '◆', '▪']);
      const a = rand(0, Math.PI * 2);
      const d = rand(46, 130);
      s.style.setProperty('--dx', `${(Math.cos(a) * d).toFixed(0)}px`);
      s.style.setProperty('--dy', `${(Math.sin(a) * d - 30).toFixed(0)}px`);
      s.style.color = pick(PARTY_COLORS);
      s.style.animationDelay = `${rand(0, .18).toFixed(2)}s`;
      frag.appendChild(s);
    }
    burst.appendChild(frag);
    setTimeout(() => { burst.innerHTML = ''; }, 1100);
  }

  function resetBox(scaleClass) {
    box.classList.remove('open', 'teasing', 'final-open');
    if (scaleClass) box.classList.add(scaleClass);
    msg.classList.remove('show');
    msg.innerHTML = '';
  }

  function showTease(sprite, alt, text, nextLabel) {
    msg.innerHTML = `<div class="tease-plate">
        <img class="big-sprite" src="${sprite}" alt="" draggable="false" />
        <p>${text}</p>
        <button class="btn surprise-next">${nextLabel}</button>
      </div>`;
    /* для скринридеров — реплика текстом, спрайт декоративный */
    msg.setAttribute('aria-label', alt + ': ' + text);
    msg.classList.add('show');
    msg.querySelector('.surprise-next').addEventListener('click', (e) => {
      e.stopPropagation();
      /* следующая коробочка «выпрыгивает» из-под крышки */
      resetBox(box.className.includes('small') ? 'small' : '');
      caption.textContent = 'И снова дёрни крышку!';
      caption.style.display = '';
      box.classList.add('teasing');
      setTimeout(() => box.classList.remove('teasing'), 900);
    });
  }

  const open = () => {
    if (animating || box.classList.contains('open')) return;
    animating = true;
    box.classList.add('open');           /* CSS-анимация прыжка крышки */
    caption.style.display = 'none';
    sparkleBurst(layer === 0 ? 18 : 26);

    const isFinal = layer >= NESTED_GIFTS.length;

    if (isFinal) {
      /* ГРАНД-ФИНАЛ: экран «падает» вниз и раскрывает главный подарок */
      box.classList.add('final-open');
      revealCount++;
      try { sessionStorage.setItem('surpriseReveals', String(revealCount)); } catch (e) {}
      markPip();
      screenDrop(() => {
        grandSalvo();
        const [sprite, text] = pick(SURPRISE_MESSAGES);
        const bonus = revealCount > 1
          ? `<div class="surprise-bonus">Ты открыла сюрприз ${revealCount}-й раз ты Принцесса этого праздника</div>`
          : '';
        msg.innerHTML = `<div class="grand-reveal">
            <div class="grand-rays" aria-hidden="true"></div>
            <img class="big-sprite grand-sprite" src="${sprite}" alt="" draggable="false" />
            <div class="grand-title">Главный подарок для тебя</div>
            <div class="grand-text">${text}</div>${bonus}
            <button class="btn surprise-close">ЗАКРЫТЬ</button>
          </div>`;
        msg.classList.add('show');
        msg.querySelector('.surprise-close').addEventListener('click', (e) => {
          e.stopPropagation();
          closeOverlay();
        });
        animating = false;
      });
    } else {
      const gift = NESTED_GIFTS[layer];
      markPip();
      fireworksSalvo(3 + layer * 2, 220);
      burstConfetti(40 + layer * 30);
      setTimeout(() => {
        showTease(gift.sprite, gift.alt, gift.tease,
          layer === NESTED_GIFTS.length - 1 ? 'ПОСЛЕДНИЙ СЛОЙ: держись!' : 'Копать дальше →');
        animating = false;
      }, 520);
    }
  };

  function closeOverlay() {
    overlay.classList.add('closing');
    document.body.style.overflow = prevBodyOverflow || '';
    document.body.classList.remove('surprise-open');
    setTimeout(() => overlay.remove(), 350);
  }

  box.addEventListener('click', open);
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
});

/* ---------- возврат на страницу ожидания ---------- */
/* кнопка убрана со страницы поздравления — обработчик защищён проверкой наличия кнопки */
const backBtn = $('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    sessionStorage.setItem('visitedParty', Date.now().toString());
    // добавляем ?returning=1, но сохраняем уже имеющиеся query-параметры (например ?debug=)
    const params = new URLSearchParams(location.search);
    params.set('returning', '1');
    location.href = 'index.html?' + params.toString();
  });
}

/* лёгкая автосалва через пару секунд */
setTimeout(() => fireworksSalvo(4, 350), 2000);
