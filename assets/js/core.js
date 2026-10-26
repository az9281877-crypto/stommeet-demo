// Ядро: хранилище демо-данных, даты, общие компоненты, модальные окна, роутер.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => PROGRAMS.find(p => p.id === id);
const teacherOf = p => TEACHERS.find(t => t.id === p.teacher);
const dirOf = id => DIRECTIONS.find(d => d.id === id);
const plural = (n, one, few, many) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many;
};
const nbsp = s => s.replace(/ /g, ' ');
const fmtPrice = n => n === 0 ? 'Бесплатно' : nbsp(n.toLocaleString('ru-RU')) + ' ₽';

// ---------- Даты (московское время) ----------
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MSK = 3 * 3600e3;
const LOADED_AT = Date.now();
const msk = d => new Date(d.getTime() + MSK);

function startOf(p) {
  if (p.liveNow) return new Date(Math.floor((LOADED_AT - 25 * 60e3) / 300e3) * 300e3);
  const now = msk(new Date(LOADED_AT));
  const [hh, mm] = (p.time || '19:00').split(':').map(Number);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + p.day, hh, mm) - MSK);
}
const fmtDate = d => { const m = msk(d); return m.getUTCDate() + ' ' + MONTHS[m.getUTCMonth()]; };
const fmtTime = d => { const m = msk(d); return String(m.getUTCHours()).padStart(2, '0') + ':' + String(m.getUTCMinutes()).padStart(2, '0'); };
const dayParts = d => { const m = msk(d); return { day: m.getUTCDate(), mon: MONTHS_SHORT[m.getUTCMonth()], wd: WEEKDAYS[m.getUTCDay()] }; };
const fmtMinutes = n => (n >= 60 ? Math.floor(n / 60) + ' ч' : '') + (n % 60 ? (n >= 60 ? ' ' : '') + n % 60 + ' мин' : '');
function fmtCountdown(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
  const hms = [Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
  return (d ? d + ' ' + plural(d, 'день', 'дня', 'дней') + ' ' : '') + hms;
}
const fmtClock = sec => {
  sec = Math.max(0, Math.floor(sec));
  return [Math.floor(sec / 3600), Math.floor(sec % 3600 / 60), sec % 60].map(n => String(n).padStart(2, '0')).join(':');
};
// «2 ч», «1 ч 30 мин», «1,5 ч» → минуты
function toMinutes(s) {
  const h = s.match(/([\d,]+)\s*ч/), m = s.match(/(\d+)\s*мин/);
  return Math.round((h ? parseFloat(h[1].replace(',', '.')) * 60 : 0) + (m ? +m[1] : 0));
}

function statusOf(p) {
  if (p.type === 'recording') return 'available';
  if (p.liveNow) return 'live';
  return startOf(p) > LOADED_AT ? 'upcoming' : 'available';
}
const upcomingLives = () => PROGRAMS.filter(p => p.type === 'live' && !p.liveNow).sort((a, b) => startOf(a) - startOf(b));
const pastLives = () => PROGRAMS.filter(p => p.fromLive).sort((a, b) => startOf(b) - startOf(a));

// ---------- Хранилище (только этот браузер) ----------
const STORE_KEY = 'stommeet-demo-v1';
function seedState() {
  const t = Date.now(), day = 864e5;
  return {
    profile: { name: '', email: '', specialty: '' },
    enrollments: [
      { programId: 'inlays', at: t - 12 * day, seed: true },
      { programId: 'past-splint', at: t - 8 * day, seed: true },
      { programId: 'live-mockup', at: t - 2 * day, seed: true },
    ],
    progress: { inlays: [0, 1] },
    questions: {},
  };
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.enrollments)) return s;
  } catch (e) { /* хранилище недоступно — работаем с демо-данными в памяти */ }
  return seedState();
}
let state = loadState();
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* без сохранения */ }
}
const isEnrolled = id => state.enrollments.some(e => e.programId === id);
const doneLessons = id => state.progress[id] || [];

// ---------- Иконки ----------
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M16 10l5 5M21 10l-5 5"/>',
  full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M12 19V6M6 11l6-6 6 6"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
};
const ico = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// ---------- Общие компоненты ----------
const mono = (t, cls = '') => `<span class="mono mono--${t.dir} ${cls}" aria-hidden="true">${t.initials}</span>`;

function typeLabel(p) {
  if (p.liveNow) return 'Идёт сейчас';
  if (p.fromLive) return 'Запись эфира';
  return TYPES[p.type].name;
}
function typeTag(p) {
  if (p.liveNow) return '<span class="tag tag--onair"><i></i>Идёт сейчас</span>';
  if (p.type === 'live') return '<span class="tag tag--live">Прямой вебинар</span>';
  return `<span class="tag">${typeLabel(p)}</span>`;
}
function metaOf(p) {
  if (p.type === 'course') return `${p.lessons} ${plural(p.lessons, 'занятие', 'занятия', 'занятий')} · ${p.duration} · старт ${fmtDate(startOf(p))}`;
  if (p.type === 'live') return p.liveNow ? `Сегодня · с ${fmtTime(startOf(p))} МСК · ${fmtMinutes(p.minutes)}` : `${fmtDate(startOf(p))} · ${fmtTime(startOf(p))} МСК · ${fmtMinutes(p.minutes)}`;
  if (p.fromLive) return `Эфир ${fmtDate(startOf(p))} · ${fmtMinutes(p.minutes)}`;
  return `${p.lessons} ${plural(p.lessons, 'урок', 'урока', 'уроков')} · ${p.duration} · доступна сразу`;
}
const cover = (p, cls) => coverSVG(p.art, p.seed, p.dir, cls);

function card(p, variant = '') {
  const t = teacherOf(p);
  return `<article class="card ${variant ? 'card--' + variant : ''}">
    <div class="card__cover">${cover(p)}<div class="card__tags">${typeTag(p)}</div></div>
    <div class="card__body">
      <p class="card__dir">${dirOf(p.dir).name}</p>
      <h3 class="card__title"><a href="#/course/${p.id}">${esc(p.title)}</a></h3>
      <p class="card__meta">${metaOf(p)}</p>
      <div class="card__foot">
        <span class="who">${mono(t)}<span>${t.name}</span></span>
        <span class="price">${fmtPrice(p.price)}</span>
      </div>
    </div>
  </article>`;
}

// Действие для программы: записаться, войти в эфир, открыть в кабинете.
function ctaFor(p, size = '', short = false) {
  const s = size ? ' btn--' + size : '';
  if (p.liveNow) return `<a class="btn btn--live${s}" href="#/room/${p.id}">${ico('play')}Войти в эфир</a>`;
  if (isEnrolled(p.id)) {
    if (p.type === 'live') return `<a class="btn btn--ghost${s}" href="#/room/${p.id}">${short ? 'Комната эфира' : ico('check') + 'Вы записаны · комната эфира'}</a>`;
    if (p.fromLive) return `<a class="btn btn--ghost${s}" href="#/room/${p.id}?state=recording">${ico('check')}Смотреть запись</a>`;
    return `<a class="btn btn--ghost${s}" href="#/learn/${p.id}/1">${ico('check')}Вы записаны · к урокам</a>`;
  }
  const label = p.type === 'course' ? 'Записаться на курс' : p.type === 'live' ? 'Записаться на эфир' : p.fromLive ? 'Получить запись' : 'Получить доступ';
  return `<button class="btn btn--primary${s}" type="button" data-enroll="${p.id}">${label}</button>`;
}

function scheduleRow(p) {
  const t = teacherOf(p), d = dayParts(startOf(p)), live = p.liveNow;
  return `<li class="srow${live ? ' srow--live' : ''}">
    <div class="srow__date">
      ${live ? '<span class="srow__day srow__day--now">Сейчас</span>' : `<span class="srow__day">${d.day}</span>`}
      <span class="srow__mon">${live ? 'в эфире' : d.mon + ', ' + d.wd}</span>
      <span class="srow__time">${live ? 'с ' : ''}${fmtTime(startOf(p))} МСК</span>
    </div>
    <div class="srow__main">
      <p class="srow__dir">${dirOf(p.dir).name} · ${fmtMinutes(p.minutes)}</p>
      <h3 class="srow__title"><a href="#/course/${p.id}">${esc(p.title)}</a></h3>
      <p class="who">${mono(t)}<span>${t.name}, ${t.spec.toLowerCase()}</span></p>
    </div>
    <div class="srow__act">
      ${live ? '<span class="status status--live"><i></i>Идёт сейчас</span>' : isEnrolled(p.id) ? '<span class="status status--ok">Вы записаны</span>' : `<span class="status">${fmtPrice(p.price)}</span>`}
      ${ctaFor(p, 'sm', true)}
    </div>
  </li>`;
}

function chipsDirs(selected, extra = '') {
  return `<div class="chips" role="group" aria-label="Направления" ${extra}>
    <button class="chip" type="button" data-dir="" aria-pressed="${selected.size === 0}">Все направления</button>
    ${DIRECTIONS.map(d => `<button class="chip" type="button" data-dir="${d.id}" aria-pressed="${selected.has(d.id)}">${d.name}</button>`).join('')}
  </div>`;
}

// ---------- Тосты ----------
let toastTimer;
function toast(msg) {
  const el = $('.toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3600);
}

// ---------- Модальное окно ----------
let modalOpener = null;
function openModal(html) {
  const m = $('.modal'), dlg = $('.modal__dialog', m);
  modalOpener = document.activeElement;
  dlg.innerHTML = `<button class="modal__close" type="button" data-close aria-label="Закрыть">${ico('close')}</button>` + html;
  m.hidden = false;
  document.body.classList.add('has-modal');
  requestAnimationFrame(() => (dlg.querySelector('input, select, [data-focus]') || dlg.querySelector('button')).focus());
}
function closeModal(silent) {
  const m = $('.modal');
  if (m.hidden) return;
  m.hidden = true;
  document.body.classList.remove('has-modal');
  if (!silent && modalOpener && document.contains(modalOpener)) modalOpener.focus();
}
document.addEventListener('keydown', e => {
  const m = $('.modal');
  if (m.hidden) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') {
    const f = $$('button, a[href], input, select, textarea', $('.modal__dialog')).filter(x => !x.disabled);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

function openEnroll(id) {
  const p = byId(id), t = teacherOf(p), pr = state.profile;
  const when = p.type === 'course' ? `Старт ${fmtDate(startOf(p))} · ${p.schedule}` : p.type === 'live' ? `${fmtDate(startOf(p))}, ${fmtTime(startOf(p))} МСК` : 'Доступ сразу после оформления';
  const title = p.type === 'course' ? 'Запись на курс' : p.type === 'live' ? 'Запись на эфир' : 'Доступ к записи';
  openModal(`
    <p class="eyebrow">${title}</p>
    <h2 id="modal-title" class="modal__title">${esc(p.title)}</h2>
    <p class="modal__sub">${when} · ${t.name}</p>
    <form class="form" novalidate data-enroll-form="${p.id}">
      <div class="field">
        <label for="f-name">Имя и фамилия</label>
        <input id="f-name" name="name" autocomplete="name" value="${esc(pr.name)}" required>
        <p class="field__err" id="e-name"></p>
      </div>
      <div class="field">
        <label for="f-email">Email</label>
        <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" value="${esc(pr.email)}" required>
        <p class="field__err" id="e-email"></p>
      </div>
      <div class="field">
        <label for="f-spec">Специализация</label>
        <select id="f-spec" name="specialty">${SPECIALTIES.map(s => `<option${s === pr.specialty ? ' selected' : ''}>${s}</option>`).join('')}</select>
      </div>
      <div class="field field--check">
        <input id="f-consent" name="consent" type="checkbox">
        <label for="f-consent">Согласен(на) на обработку персональных данных в соответствии с <a href="#/privacy" target="_blank" rel="noopener">политикой конфиденциальности</a></label>
        <p class="field__err" id="e-consent"></p>
      </div>
      <div class="form__total"><span>Стоимость <small>(условная)</small></span><strong>${fmtPrice(p.price)}</strong></div>
      <button class="btn btn--primary btn--lg btn--block" type="submit">Записаться (демо)</button>
      <p class="form__note">Демонстрация: данные никуда не отправляются, оплата не списывается. Запись сохранится только в этом браузере.</p>
    </form>`);
}

function submitEnroll(form) {
  const id = form.dataset.enrollForm, p = byId(id);
  const name = form.name.value.trim(), email = form.email.value.trim(), specialty = form.specialty.value, consent = form.consent.checked;
  const errs = {
    name: name.length < 2 ? 'Укажите имя и фамилию' : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Проверьте email: нужен адрес вида name@clinic.ru',
    consent: consent ? '' : 'Без согласия на обработку данных запись оформить нельзя',
  };
  let first = null;
  for (const k in errs) {
    const input = form[k], err = $('#e-' + k, form);
    err.textContent = errs[k];
    input.setAttribute('aria-invalid', errs[k] ? 'true' : 'false');
    if (errs[k]) input.setAttribute('aria-describedby', 'e-' + k); else input.removeAttribute('aria-describedby');
    if (errs[k] && !first) first = input;
  }
  if (first) { first.focus(); return; }
  state.profile = { name, email, specialty };
  if (!isEnrolled(id)) state.enrollments.push({ programId: id, at: Date.now() });
  saveState();
  const next = p.type === 'live' ? `<a class="btn btn--primary" href="#/room/${p.id}">Открыть комнату эфира</a>`
    : p.fromLive ? `<a class="btn btn--primary" href="#/room/${p.id}?state=recording">Смотреть запись</a>`
    : `<a class="btn btn--primary" href="#/cabinet">Перейти в личный кабинет</a>`;
  $('.modal__dialog').innerHTML = `
    <button class="modal__close" type="button" data-close aria-label="Закрыть">${ico('close')}</button>
    <div class="done-mark" aria-hidden="true">${ico('check')}</div>
    <h2 id="modal-title" class="modal__title" tabindex="-1" data-focus>Демо-запись оформлена</h2>
    <p class="modal__sub">${esc(p.title)}</p>
    <p>Это демонстрация: оплата не списывалась, письмо не отправлялось. В рабочей версии на этом шаге будет оплата и подтверждение на <strong>${esc(email)}</strong>.</p>
    <p>Программа уже появилась в личном кабинете — там же история демо-записей.</p>
    <div class="modal__actions">${next}<button class="btn btn--ghost" type="button" data-close>Продолжить выбор</button></div>`;
  $('[data-focus]').focus();
  refreshCtas();
}

// После записи обновляем кнопки на текущей странице без перерисовки.
function refreshCtas() {
  $$('[data-enroll]').forEach(b => {
    if (!isEnrolled(b.dataset.enroll)) return;
    if (b.hasAttribute('data-inline')) {
      b.outerHTML = `<p class="player__ok">${ico('check')}Вы записаны. В рабочей версии напомним о начале на email.</p>`;
      return;
    }
    const holder = document.createElement('div');
    holder.innerHTML = ctaFor(byId(b.dataset.enroll), b.classList.contains('btn--sm') ? 'sm' : b.classList.contains('btn--lg') ? 'lg' : '');
    const nb = holder.firstElementChild;
    if (b.classList.contains('btn--block')) nb.classList.add('btn--block');
    b.replaceWith(nb);
  });
}

// ---------- Делегирование событий ----------
document.addEventListener('click', e => {
  const enroll = e.target.closest('[data-enroll]');
  if (enroll) { e.preventDefault(); openEnroll(enroll.dataset.enroll); return; }
  if (e.target.closest('[data-close]')) { closeModal(); return; }
  if (e.target.closest('.burger')) { toggleMenu(); return; }
  const skip = e.target.closest('.skip');
  if (skip) { e.preventDefault(); $('#main').focus(); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-enroll-form]');
  if (f) { e.preventDefault(); submitEnroll(f); }
});

// ---------- Меню ----------
function toggleMenu(force) {
  const b = $('.burger'), m = $('#mobile-menu');
  const open = force !== undefined ? force : b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', open);
  b.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  m.hidden = !open;
  document.body.classList.toggle('has-menu', open);
}

// ---------- Роутер ----------
const ROUTES = [
  [/^\/$/, () => renderHome()],
  [/^\/catalog$/, (m, q) => renderCatalog(q)],
  [/^\/course\/([\w-]+)$/, m => renderProgram(m[1])],
  [/^\/webinars$/, (m, q) => renderWebinars(q)],
  [/^\/room\/([\w-]+)$/, (m, q) => renderRoom(m[1], q)],
  [/^\/teachers(?:\/([\w-]+))?$/, m => renderTeachers(m[1])],
  [/^\/cabinet(?:\/(\w+))?$/, m => renderCabinet(m[1])],
  [/^\/learn\/([\w-]+)\/(\d+)$/, m => renderLearn(m[1], +m[2])],
  [/^\/(privacy|offer|contacts)$/, m => renderDoc(m[1])],
  [/^\/guide$/, () => renderGuide()],
];
let pageCleanup = null;

// Строку параметров не декодируем заранее: URLSearchParams делает это сам, иначе «%26» из поиска превращается в разделитель «&»
function parseHash() {
  const [path, qs] = location.hash.slice(1).split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

function route() {
  const { path, query } = parseHash();
  if (pageCleanup) { pageCleanup(); pageCleanup = null; }
  toggleMenu(false);
  closeModal(true);
  let page = null;
  for (const [re, fn] of ROUTES) {
    const m = path.match(re);
    if (m) { page = fn(m, query); break; }
  }
  page = page || renderNotFound();
  // Страницы вешают обработчики на #main: новый пустой элемент на каждом переходе снимает обработчики прошлой страницы
  const main = $('#main').cloneNode(false);
  $('#main').replaceWith(main);
  main.innerHTML = page.html;
  document.title = (page.title ? page.title + ' — ' : '') + 'STOMMEET (демо)';
  document.body.dataset.page = page.page || '';
  $$('[data-nav]').forEach(a => a.dataset.nav === page.nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  window.scrollTo(0, 0);
  if (page.after) pageCleanup = page.after(main) || null;
  main.focus({ preventScroll: true });
}

function setQuery(path, query) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v)).toString();
  history.replaceState(null, '', '#' + path + (qs ? '?' + qs : ''));
}

function start() {
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  window.addEventListener('hashchange', route);
  route();
}
