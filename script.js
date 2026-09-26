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

  $('days').textContent = pad(days, 3);
  $('hours').textContent = pad(hours);
  $('minutes').textContent = pad(minutes);
  $('seconds').textContent = pad(seconds);

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

  /* таймер дошёл до нуля — запускаем party-переход */
  if (diff <= 0) triggerParty();
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
      if (el) el.textContent = id === 'days' ? '000' : '00';
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

  /* через мгновение вспышки — летим на страницу праздника
     (собираем URL так, чтобы работало и в корне, и в подпадке GitHub Pages) */
  window.setTimeout(() => {
    location.assign(getCongratsUrl());
  }, 1500);
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
    return base + CONGRATS_PAGE + '?arrived=1';
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
  const directionFlip = Math.random() < 0.28;

  for (let i = 0; i < count; i++) {
    const bird = document.createElement('span');
    bird.className = 'bird' + (directionFlip ? ' flip' : '');
    bird.style.setProperty('--bird-y', `${top + i * randomBetween(2, 5)}vh`);
    bird.style.setProperty('--bird-scale', `${randomBetween(.58, .82).toFixed(2)}`);
    bird.style.setProperty('--bird-duration', `${randomBetween(15, 24).toFixed(1)}s`);
    bird.style.setProperty('--bird-delay', `${(i * .35).toFixed(2)}s`);
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
