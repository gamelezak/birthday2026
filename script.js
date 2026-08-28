// ==============================
// НАСТРОЙКА СЧЁТЧИКА
// ==============================
// Укажи нужную дату в формате YYYY-MM-DDTHH:MM.
// Сейчас стоит пример: 1 сентября 2026, 00:00.
const DEFAULT_BIRTHDAY = '2026-09-27T00:00';

const $ = (id) => document.getElementById(id);
const subtitle = $('subtitle');
const progressBar = $('progressBar');
const percent = $('percent');

let targetDate = DEFAULT_BIRTHDAY;
let previousYearStart = null;


function nextBirthdayFrom(base) {
  const d = new Date(base);
  const now = new Date();
  d.setFullYear(now.getFullYear());
  if (d.getTime() <= now.getTime()) d.setFullYear(now.getFullYear() + 1);
  return d;
}

function getTargetDate() {
  let d = new Date(targetDate);
  if (Number.isNaN(d.getTime())) {
    targetDate = DEFAULT_BIRTHDAY;
    d = new Date(targetDate);
  }
  // После наступления праздника автоматически переносим дату на следующий год.
  if (d <= new Date()) {
    d.setFullYear(d.getFullYear() + 1);
    targetDate = toLocalInput(d);
  }
  return d;
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(n, size = 2) { return String(Math.max(0, n)).padStart(size, '0'); }

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

function launchMeteor() {
  const layer = $('meteors');
  const meteor = document.createElement('span');
  meteor.className = 'meteor';
  meteor.style.setProperty('--x', `${10 + Math.random() * 70}%`);
  meteor.style.setProperty('--y', `${3 + Math.random() * 30}%`);
  meteor.addEventListener('animationend', () => meteor.remove());
  layer.appendChild(meteor);
}

createStars();
updateCountdown();
setInterval(updateCountdown, 1000);
setInterval(() => {
  if (document.visibilityState === 'visible' && Math.random() > .25) launchMeteor();
}, 9000);
