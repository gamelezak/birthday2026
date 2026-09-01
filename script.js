const DEFAULT_BIRTHDAY = '2026-09-27T00:00';

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

function getTargetDate() {
  let d = new Date(targetDate);
  if (Number.isNaN(d.getTime())) {
    targetDate = DEFAULT_BIRTHDAY;
    d = new Date(targetDate);
  }

  if (d <= new Date()) {
    d.setFullYear(d.getFullYear() + 1);
    targetDate = toLocalInput(d);
  }
  return d;
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(n, size = 2) {
  return String(Math.max(0, n)).padStart(size, '0');
}

function updateCountdown() {
  const now = new Date();
  const target = getTargetDate();
  const diff = Math.max(0, target - now);

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
  const elapsed = Math.min(total, Math.max(0, now - start));
  const p = Math.min(100, Math.max(0, elapsed / total * 100));

  progressBar.style.width = `${p.toFixed(1)}%`;
  percent.textContent = `${Math.round(p)}%`;
  subtitle.textContent = `Праздник наступит совсем скоро`;
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
updateCountdown();
setInterval(updateCountdown, 1000);
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
