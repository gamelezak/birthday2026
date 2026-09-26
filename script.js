const DEFAULT_BIRTHDAY = '2026-09-27T00:00';
const CONGRATS_PAGE = 'congrats.html';

/* Для быстрой проверки перехода: ?debug=10 — таймер ускорится в 10 раз,
   ?debug=60 — дождь обратного отсчёта за минуту до праздника */
const DEBUG_SPEED = (() => {
  const m = location.search.match(/[?&]debug=(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
})();

const DAY_START = 8;
const NIGHT_START = 18;
const THEME_CHECK_INTERVAL = 15000;
const BACKGROUND_FADE_DELAY = 3000;

const $ = (id) => document.getElementById(id);
const subtitle = $('subtitle');
const progressBar = $('progressBar');
const percent = $('percent');
const scene = document.querySelector('.scene');
const backgroundLayers = [
  document.querySelector('.background-day'),
  document.querySelector('.background-night')
];

let targetDate = DEFAULT_BIRTHDAY;
let activeBackground = 0;
let switchInProgress = false;
let currentTheme = null;
let fakeNowOffset = 0;
let finalCountdownActive = false;
let partyTriggered = false;

/* ======= УРОВНИ ПРИБЛИЖЕНИЯ ПРАЗДНИКА =======
   Чем меньше времени осталось, тем больше анимаций «просыпается»:
   L1 (≤30д) — золотая пыль; L2 (≤7д) — воздушные шары;
   L3 (≤сутки) — гирлянда флажков + праздничная рамка экрана;
   L4 (≤часа) — светлячки ночью + северное сияние;
   L5 (≤минуты) — бегущие огоньки на прогресс-баре, пульс карточки;
   L6 (≤10сек) — финальный отсчёт. */
const PROXIMITY_LEVELS = [
  { id: 1, until: 30 * 86400e3 },
  { id: 2, until: 7 * 86400e3 },
  { id: 3, until: 86400e3 },
  { id: 4, until: 3600e3 },
  { id: 5, until: 60e3 }
];
let proximityLevel = 0;

function getTargetDate() {
  let d = new Date(targetDate);
  if (Number.isNaN(d.getTime())) {
    targetDate = DEFAULT_BIRTHDAY;
    d = new Date(targetDate);
  }

  if (d <= now()) {
    d.setFullYear(d.getFullYear() + 1);
    targetDate = toLocalInput(d);
  }
  return d;
}

function now() {
  return new Date(Date.now() + fakeNowOffset);
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(n, size = 2) {
  return String(Math.max(0, n)).padStart(size, '0');
}

function updateCountdown() {
  if (partyTriggered) return;

  const current = now();
  const target = getTargetDate();
  const diff = Math.max(0, target - current);

  /* последние 10 секунд — финальный отсчёт с тряской и свечением */
  if (diff <= 10000 && !finalCountdownActive) startFinalCountdown();

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setDigit('days', pad(days, 3));
  setDigit('hours', pad(hours));
  setDigit('minutes', pad(minutes));
  setDigit('seconds', pad(seconds));

  const start = new Date(target);
  start.setFullYear(start.getFullYear() - 1);
  const total = Math.max(1, target - start);
  const elapsed = Math.min(total, Math.max(0, current - start));
  const p = Math.min(100, Math.max(0, elapsed / total * 100));

  progressBar.style.width = `${p.toFixed(1)}%`;
  percent.textContent = `${Math.round(p)}%`;

  if (finalCountdownActive) {
    subtitle.textContent = '🎇 СЕЙЧАС ПРОИЗОЙДЁТ ЧУДО... 🎇';
  } else if (diff <= 60000) {
    subtitle.textContent = 'Последняя минутка перед праздником!';
  } else {
    subtitle.textContent = `Праздник наступит совсем скоро`;
  }

  /* включаем анимации по мере приближения праздника */
  updateProximity(diff);

  /* таймер дошёл до нуля — запускаем party-переход.
     ВАЖНО: сравнение в целых секундах (totalSeconds), а не в миллисекундах,
     иначе из-за округления книзу diff остаётся ~999мс ещё целый такт,
     отсчёт «залипает» на 00:00 и переход никогда не срабатывает. */
  if (totalSeconds <= 0) triggerParty();
}

/* ======= ПЕРЕБОРКА ЦИФР: цифра «выкатывается» снизу вверх ======= */
const REDUCED_MOTION = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setDigit(id, value) {
  const el = $(id);
  if (!el) return;
  const cell = el.querySelector('em') || el;
  if (cell.textContent === value) return;
  cell.textContent = value;
  if (REDUCED_MOTION) return;
  /* перезапуск pop-анимации через reflow */
  cell.classList.remove('pop');
  void cell.offsetWidth;
  cell.classList.add('pop');
}

/* ======= АНИМАЦИИ ПО МЕРЕ ПРИБЛИЖЕНИЯ ПРАЗДНИКА ======= */
function levelForDiff(diffMs) {
  let lvl = 0;
  for (const l of PROXIMITY_LEVELS) {
    if (diffMs <= l.until) lvl = l.id;
  }
  return lvl;
}

function updateProximity(diffMs) {
  const lvl = levelForDiff(diffMs);
  if (lvl === proximityLevel) return;
  proximityLevel = lvl;
  scene.dataset.proximity = String(lvl);
  scene.classList.toggle('party-border-on', lvl >= 3);
  if (lvl >= 1) spawnDustMotes();
  if (lvl >= 2) startBalloons();
  if (lvl >= 3) buildBunting();
  if (lvl >= 4) spawnFireflies();
}

/* --- L1: парящая золотая пыль (появляется за месяц до) --- */
let dustSpawnTimer = null;
function spawnDustMotes() {
  const box = $('dustMotes');
  if (!box || REDUCED_MOTION) return;
  const add = () => {
    if (box.children.length > 26) return;
    const m = document.createElement('i');
    m.style.setProperty('--x', `${Math.random() * 100}%`);
    m.style.setProperty('--s', `${(2 + Math.random() * 3).toFixed(1)}px`);
    m.style.setProperty('--dur', `${(7 + Math.random() * 8).toFixed(1)}s`);
    m.style.setProperty('--drift', `${(-40 + Math.random() * 80).toFixed(0)}px`);
    m.style.animationDelay = `${(-Math.random() * 4).toFixed(1)}s`;
    box.appendChild(m);
    m.addEventListener('animationend', () => m.remove());
  };
  for (let i = 0; i < 10; i++) add();
  if (!dustSpawnTimer) dustSpawnTimer = setInterval(add, 1400);
}

/* --- L2: воздушные шары поднимаются снизу (за неделю до) --- */
let balloonTimer = null;
function startBalloons() {
  const rig = $('balloonRig');
  if (!rig || REDUCED_MOTION || balloonTimer) return;
  const colors = ['#ff6db3', '#ffd98a', '#7fc4ff', '#a86fe8', '#5ee8b7'];
  const launch = () => {
    if (rig.children.length > 6) return;
    const b = document.createElement('span');
    b.className = 'float-balloon';
    b.style.setProperty('--bx', `${(4 + Math.random() * 88).toFixed(1)}vw`);
    b.style.setProperty('--bs', `${(0.55 + Math.random() * 0.5).toFixed(2)}`);
    b.style.setProperty('--bdur', `${(13 + Math.random() * 9).toFixed(1)}s`);
    b.style.setProperty('--bsway', `${(18 + Math.random() * 30).toFixed(0)}px`);
    b.style.setProperty('--bc', colors[Math.floor(Math.random() * colors.length)]);
    rig.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  };
  for (let i = 0; i < 3; i++) setTimeout(launch, i * 900);
  balloonTimer = setInterval(launch, 4200);
}

/* --- L3: гирлянда флажков развешивается по верху экрана (за сутки до) --- */
let buntingBuilt = false;
function buildBunting() {
  const row = $('buntingRow');
  if (!row || buntingBuilt) return;
  buntingBuilt = true;
  const flags = Math.max(8, Math.round(window.innerWidth / 90));
  const frag = document.createDocumentFragment();
  for (let i = 0; i < flags; i++) {
    const f = document.createElement('i');
    f.className = 'flag';
    f.style.animationDelay = `${(i * 0.09).toFixed(2)}s`;
    f.style.setProperty('--frot', `${(-6 + Math.random() * 12).toFixed(0)}deg`);
    frag.appendChild(f);
  }
  row.appendChild(frag);
}

/* --- L4: светлячки (тёплые огоньки, порхающие по экрану) --- */
let firefliesBuilt = false;
function spawnFireflies() {
  const box = $('fireflies');
  if (!box || firefliesBuilt || REDUCED_MOTION) return;
  firefliesBuilt = true;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 16; i++) {
    const f = document.createElement('i');
    f.className = 'firefly';
    f.style.setProperty('--fx', `${Math.random() * 96}%`);
    f.style.setProperty('--fy', `${15 + Math.random() * 78}%`);
    f.style.setProperty('--fdur', `${(5 + Math.random() * 6).toFixed(1)}s`);
    f.style.setProperty('--fdel', `${(-Math.random() * 8).toFixed(1)}s`);
    f.style.setProperty('--famp', `${(12 + Math.random() * 34).toFixed(0)}px`);
    frag.appendChild(f);
  }
  box.appendChild(frag);
}

/* ========= ФИНАЛЬНЫЙ ОТСЧЁТ (последние 10 секунд) ========= */
function startFinalCountdown() {
  finalCountdownActive = true;
  const card = document.querySelector('.countdown-card');
  if (card) card.classList.add('final-shake');
  document.body.classList.add('final-mode');
}

/* ========= ПЕРЕХОД НА СТРАНИЦУ ПОЗДРАВЛЕНИЯ ========= */
function triggerParty() {
  if (partyTriggered) return;
  partyTriggered = true;

  sessionStorage.setItem('partyJustStarted', Date.now().toString());

  const timer = $('timer');
  if (timer) {
    ['days', 'hours', 'minutes', 'seconds'].forEach((id) => {
      const el = $(id);
      if (el) setDigit(id, id === 'days' ? '000' : '00');
    });
  }
  if (progressBar) progressBar.style.width = '100%';
  if (percent) percent.textContent = '100%';
  if (subtitle) subtitle.textContent = '✨ ПРАЗДНИК НАЧАЛСЯ! ✨';

  /* золотая вспышка + прощальная надпись поверх карточки */
  const flash = document.querySelector('.flash-overlay');
  if (!flash) {
    const f = document.createElement('div');
    f.className = 'flash-overlay';
    document.body.appendChild(f);
  }

  const boom = document.querySelector('.boom-text');
  if (boom) {
    boom.textContent = 'С ДНЁМ РОЖДЕНИЯ!';
    boom.classList.add('show');
  }

  document.body.classList.add('countdown-leaving');

  /* креативный переход: конфетти-салют + swirling-портал, засасывающий экран */
  launchTransitionConfetti();
  openPortal(() => {
    /* портал раскрылся — летим на страницу праздника
       (собираем URL так, чтобы работало и в корне, и в подпадке GitHub Pages) */
    location.assign(getCongratsUrl() + '?arrived=1');
  });
}

/* ======= КРЕАТИВНЫЙ ПЕРЕХОД: КОНФЕТТИ-САЛЮТ ======= */
function launchTransitionConfetti() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let layer = document.querySelector('.transition-confetti');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'transition-confetti';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    const colors = ['#ff6db3', '#ffd98a', '#7fc4ff', '#a86fe8', '#5ee8b7', '#ff8a5e', '#fff0f7'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('span');
      p.style.setProperty('--x', `${(Math.random() * 100).toFixed(2)}vw`);
      p.style.setProperty('--r', `${(Math.random() * 720 - 360).toFixed(0)}deg`);
      p.style.setProperty('--dur', `${(1.4 + Math.random() * 1.6).toFixed(2)}s`);
      p.style.setProperty('--dly', `${(Math.random() * 0.7).toFixed(2)}s`);
      p.style.background = colors[i % colors.length];
      if (i % 3 === 0) p.classList.add('round');
      frag.appendChild(p);
    }
    layer.appendChild(frag);
  } catch (e) { /* не критично для перехода */ }
}

/* ======= КРЕАТИВНЫЙ ПЕРЕХОД: MAGICAL SWIRLING PORTAL ======= */
/* Портал раскрывается от центра экрана спиралью из частиц; когда дыра
   закрывает весь экран, вызывается onOpen — в этот момент происходит
   навигация, и пользователь «проваливается» прямо в страницу праздника. */
function openPortal(onOpen) {
  const canvas = $('portalCanvas');
  const reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canvas || !canvas.getContext || reducedMotion) {
    window.setTimeout(onOpen, 1500);
    return;
  }

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  canvas.classList.add('is-open');

  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.hypot(cx, cy) * 1.15;
  const DURATION = 1600;
  const PALETTE = ['#ff6db3', '#ffd98a', '#7fc4ff', '#a86fe8', '#5ee8b7', '#ff8a5e'];

  /* витки спирали, вращающиеся вместе с раскрытием портала */
  const spiralPhase = Math.random() * Math.PI * 2;

  function draw(now) {
    const t = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    const R = maxR * eased;
    const rot = spiralPhase + now * 0.0028;

    ctx.clearRect(0, 0, W, H);

    /* ядро портала — затягивающая темнота с цветным свечением по кромке */
    const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    g.addColorStop(0, 'rgba(26, 8, 46, 1)');
    g.addColorStop(0.72, 'rgba(38, 12, 66, 0.96)');
    g.addColorStop(0.93, 'rgba(122, 62, 190, 0.9)');
    g.addColorStop(1, 'rgba(255, 109, 179, 0.15)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    /* спиральные рукава, закручивающиеся к краям экрана */
    ctx.lineCap = 'round';
    for (let s = 0; s < 3; s++) {
      ctx.strokeStyle = PALETTE[(s * 2 + 1) % PALETTE.length];
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = Math.max(2, R * 0.03);
      ctx.beginPath();
      const base = rot + (s * Math.PI * 2) / 3;
      for (let k = 0; k <= 40; k++) {
        const f = k / 40;
        const ang = base + f * 4.2;
        const rad = R * (0.12 + 0.88 * f);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* искры, разлетающиеся по кромке портала */
    const sparks = Math.round(26 + 60 * t);
    for (let i = 0; i < sparks; i++) {
      const seed = i * 12.9898;
      const a = rot * (i % 2 ? 1 : -1) + Math.sin(seed) * Math.PI;
      const rr = R * (0.85 + ((Math.sin(seed * 3.1 + now * 0.004) + 1) / 2) * 0.35);
      const size = 1.5 + (Math.sin(seed * 7.7) + 1) * 1.6;
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(seed + now * 0.006));
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (t < 1) {
      requestAnimationFrame(draw);
    } else if (!navigated) {
      navigated = true;
      onOpen();
    }
  }

  let start = null;
  let navigated = false;
  /* страховка: даже если rAF затормозит, переход всё равно случится */
  const safetyTimer = window.setTimeout(() => {
    if (!navigated) { navigated = true; onOpen(); }
  }, DURATION + 1200);
  canvas.addEventListener('remove', () => window.clearTimeout(safetyTimer));

  requestAnimationFrame((ts) => { start = ts; draw(ts); });
}

/* ======= Ссылка на страницу поздравления для GitHub Pages ======= */
/* Если сайт лежит в подпадке (username.github.io/repo/), относительный путь
   может резолвиться неверно из-за слэша в конце. Строим абсолютный URL
   от фактического расположения index.html. */
function getCongratsUrl() {
  try {
    return new URL(CONGRATS_PAGE, document.baseURI).href;
  } catch (e) {
    let base = location.pathname;
    if (/\/$/.test(base)) base += 'index.html';
    base = base.replace(/[^/]*$/, '');
    return base + CONGRATS_PAGE;
  }
}

function getTimeTheme(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const dayStart = DAY_START * 60;
  const nightStart = NIGHT_START * 60;
  return minutes >= nightStart || minutes < dayStart ? 'night' : 'day';
}

function applyTheme(theme, immediate = false) {
  const next = theme === 'night' ? 1 : 0;

  if (currentTheme === theme && !immediate) return;
  if (switchInProgress && !immediate) return;

  const previous = activeBackground;
  const changed = previous !== next;
  switchInProgress = true;

  scene.classList.toggle('theme-day', theme === 'day');
  scene.classList.toggle('theme-night', theme === 'night');
  scene.dataset.theme = theme;

  if (changed) {
    if (immediate) {
      backgroundLayers[previous].classList.remove('is-active');
      backgroundLayers[next].classList.add('is-active');
    } else {
      backgroundLayers[next].classList.add('is-active');
      window.setTimeout(() => {
        backgroundLayers[previous].classList.remove('is-active');
      }, BACKGROUND_FADE_DELAY);
    }
    activeBackground = next;
  }

  currentTheme = theme;
  window.setTimeout(() => {
    switchInProgress = false;
  }, immediate ? 50 : BACKGROUND_FADE_DELAY + 100);
}

function updateThemeByTime() {
  const theme = getTimeTheme();
  applyTheme(theme);
}

function createStars() {
  const box = $('stars');
  const count = 115;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (Math.random() > .88 ? ' big' : '');
    star.style.setProperty('--x', `${Math.random() * 100}%`);
    star.style.setProperty('--y', `${Math.random() * 76}%`);
    star.style.setProperty('--s', `${Math.random() > .88 ? 3 : 2}px`);
    star.style.setProperty('--d', `${1.4 + Math.random() * 4.5}s`);
    star.style.setProperty('--delay', `${-Math.random() * 5}s`);
    fragment.appendChild(star);
  }
  box.appendChild(fragment);
}

createStars();
applyTheme(getTimeTheme(), true);

/* если вернулись со страницы праздника — не перепрыгиваем сразу обратно */
if (location.search.includes('returning=1')) {
  partyTriggered = true;
  subtitle.textContent = 'Праздник уже здесь — но можно подождать ещё годик! 🎈';
}

updateCountdown();

/* отсчёт раз в секунду; с ?debug=N — N раз в секунду (ускорение таймера) */
setInterval(updateCountdown, Math.max(40, Math.round(1000 / DEBUG_SPEED)));

/* при ускоренной проверке догоняем "виртуальное время" */
if (DEBUG_SPEED > 1) {
  setInterval(() => { fakeNowOffset += 1000 * (DEBUG_SPEED - 1); }, 1000);
}

setInterval(updateThemeByTime, THEME_CHECK_INTERVAL);


const birdLayer = document.getElementById('birds');
const BIRD_SPAWN_INTERVAL = 6500;
let birdSpawnTimer = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function spawnBirdFlock() {
  if (!birdLayer || !scene.classList.contains('theme-day')) return;

  const count = Math.random() < 0.72 ? 1 : 2;
  const top = randomBetween(7, 42);
  /* часть стаи летит справа налево (класс flip включён в генераторе) */
  const directionFlip = Math.random() < 0.45;

  for (let i = 0; i < count; i++) {
    const bird = document.createElement('span');
    bird.className = 'bird' + (directionFlip ? ' flip' : '');
    bird.style.setProperty('--bird-y', `${top + i * randomBetween(2, 5)}vh`);
    bird.style.setProperty('--bird-scale', `${randomBetween(.58, .82).toFixed(2)}`);
    bird.style.setProperty('--bird-duration', `${randomBetween(15, 24).toFixed(1)}s`);
    bird.style.setProperty('--bird-delay', `${(i * .35).toFixed(2)}s`);
    /* чем ближе праздник — тем оживлённее полёт */
    const liveliness = 1 + proximityLevel * 0.18;
    bird.style.setProperty('--bird-flap', `${Math.max(.55, 1.45 / liveliness).toFixed(2)}s`);
    bird.style.setProperty('--bird-drift-a', `${randomBetween(-28, 24).toFixed(0)}px`);
    bird.style.setProperty('--bird-drift-b', `${randomBetween(-18, 28).toFixed(0)}px`);
    bird.style.setProperty('--bird-drift-c', `${randomBetween(-25, 30).toFixed(0)}px`);
    bird.style.setProperty('--bird-drift-d', `${randomBetween(-14, 14).toFixed(0)}px`);

    const sprite = document.createElement('span');
    sprite.className = 'bird-sprite';
    bird.appendChild(sprite);

    bird.addEventListener('animationend', (event) => {
      if (event.animationName.includes('flight')) bird.remove();
    });
    birdLayer.appendChild(bird);
  }
}

function syncBirds() {
  if (!birdLayer) return;
  if (scene.classList.contains('theme-night')) {
    birdLayer.innerHTML = '';
    return;
  }
  if (!birdSpawnTimer) {
    birdSpawnTimer = window.setInterval(spawnBirdFlock, BIRD_SPAWN_INTERVAL);
  }
  if (!birdLayer.children.length) {
    window.setTimeout(spawnBirdFlock, 900);
  }
}

syncBirds();
setInterval(syncBirds, THEME_CHECK_INTERVAL);

/* ======= ПАДАЮЩИЕ ЗВЁЗДЫ (canvas) — тем чаще, чем ближе праздник ======= */
(function shootingStars() {
  const cv = $('shootingStars');
  if (!cv || !cv.getContext || REDUCED_MOTION) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  const stars = [];
  /* базовая частота — раз в ~9 секунд; на каждом уровне приближения
     умножается пополам: у самого финиша звёзды сыплются каждые ~0.6с */
  function spawnChance() {
    return 0.0035 * Math.pow(1.7, proximityLevel);
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    /* ночью ярче, днём — полупрозрачные «ангелы-вестники» */
    const night = scene.classList.contains('theme-night');
    const boost = 1 + proximityLevel * 0.28;

    if (Math.random() < spawnChance() && stars.length < 4) {
      const fromLeft = Math.random() < 0.5;
      stars.push({
        x: fromLeft ? Math.random() * W * 0.4 : W * (0.5 + Math.random() * 0.45),
        y: H * (0.03 + Math.random() * 0.3),
        vx: (fromLeft ? 1 : -1) * (5.5 + Math.random() * 4),
        vy: 2.6 + Math.random() * 2.2,
        life: 0,
        max: 40 + Math.round(Math.random() * 22),
        hue: [ '#fff3c4', '#ffd98a', '#ffb8e0', '#bfe3ff' ][Math.floor(Math.random() * 4)]
      });
    }

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.life++;
      s.x += s.vx;
      s.y += s.vy;
      const a = Math.max(0, 1 - s.life / s.max);
      const tail = 9;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
      grad.addColorStop(0, s.hue);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = a * (night ? 0.95 : 0.45) * Math.min(1.6, boost);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
      ctx.stroke();
      /* ядро звезды */
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      if (s.life >= s.max) stars.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
