// Страницы сайта. Каждая возвращает { html, title, nav, after(main) → cleanup }.

const crumbs = items => `<nav class="crumbs" aria-label="Навигационная цепочка">${items.map(([href, label], i) =>
  i === items.length - 1 ? `<span aria-current="page">${label}</span>` : `<a href="${href}">${label}</a>`).join('<span aria-hidden="true">/</span>')}</nav>`;

const sectionHead = (eyebrow, title, link) => `<div class="section-head">
  <div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>
  ${link ? `<a class="link-arrow" href="${link[0]}">${link[1]}${ico('arrow')}</a>` : ''}
</div>`;

// ---------- Главная ----------
// Карточки «Курсы» и «Вебинары» для выбранного направления: фото, главная программа, короткая подпись.
// Число в подписи совпадает с тем, что покажет ссылка: онлайн-курсы направления в каталоге,
// предстоящие эфиры в расписании или, если их нет, записи прошедших эфиров.
function dirCards(d) {
  const list = PROGRAMS.filter(p => p.dir === d.id);
  const courses = list.filter(p => p.type === 'course');
  const lives = list.filter(p => p.type === 'live').sort((a, b) => !!b.liveNow - !!a.liveNow || startOf(a) - startOf(b));
  const recs = list.filter(p => p.fromLive);
  const course = courses.find(p => p.featured) || courses[0];
  const web = lives[0] || recs[0];
  const short = p => esc(p.shortTitle || p.title.split(':')[0]);
  const webMeta = !lives.length ? `${recs.length} ${plural(recs.length, 'запись эфира', 'записи эфиров', 'записей эфиров')}`
    : `${web.liveNow ? 'идёт сейчас' : `${fmtDate(startOf(web))}, ${fmtTime(startOf(web))} МСК`} · ${lives.length} ${plural(lives.length, 'эфир', 'эфира', 'эфиров')}`;
  const one = (kind, label, href, photo, title, meta) => `<a class="dir-card" href="${href}" data-kind="${kind}">
      <img class="dir-card__img" src="assets/img/${photo[0]}.jpg" alt="${photo[1]}" style="object-position:${photo[2]}" width="1400" height="933" loading="lazy">
      <span class="dir-card__label">${label}</span>
      <span class="dir-card__body">
        <span><span class="dir-card__title">${title}</span><span class="dir-card__meta">${meta}</span></span>
        <span class="dir-card__go" aria-hidden="true">${ico('arrow')}</span>
      </span>
    </a>`;
  return one('courses', 'Курсы', `#/catalog?type=course&dir=${d.id}`, d.photos.courses, short(course),
      `${courses.length} ${plural(courses.length, 'курс', 'курса', 'курсов')} · старт ${fmtDate(startOf(course))}`)
    + one('webinars', 'Вебинары', `#/webinars?dir=${d.id}${lives.length ? '' : '&tab=past'}`, d.photos.webinars, short(web), webMeta);
}

function renderHome() {
  const live = PROGRAMS.find(p => p.liveNow);
  const lead = byId('ortho-modern');
  const startList = ['occlusion', 'implant-prosth', 'aesthetic-direct'].map(byId);
  const sched = [live, ...upcomingLives().slice(0, 3)];

  const html = `
  <section class="hero">
    <figure class="hero__media">
      <picture>
        <source media="(max-width: 760px)" srcset="assets/img/stommeet-clinical-hero-mobile.jpg" width="1000" height="941">
        <img class="hero__photo" src="assets/img/stommeet-clinical-hero.jpg" width="1672" height="941" alt="Стоматолог в бинокулярных лупах работает с учебной моделью челюсти" fetchpriority="high">
      </picture>
      <div class="hero__shade"></div>
      <figcaption class="hero__caption">Разбор клинического случая</figcaption>
    </figure>
    <div class="wrap hero__inner">
      <div class="hero__text">
        <p class="hero__eyebrow">Онлайн-академия для стоматологов</p>
        <h1 class="hero__title"><span>Клиническая</span> <span>практика.</span> <span class="hl">Из первых рук.</span></h1>
        <p class="hero__lead">Курсы, прямые эфиры и разборы клинических случаев.</p>
        <div class="hero__cta">
          <a class="btn btn--primary btn--lg" href="#/catalog">Выбрать курс${ico('arrow')}</a>
          <a class="btn btn--ghost btn--lg" href="#/webinars">Расписание эфиров</a>
        </div>
      </div>
    </div>
    <div class="wrap hero__live">
      <div class="live-strip">
        <span class="live-strip__label"><span class="live-strip__dot" aria-hidden="true"></span>Прямой эфир</span>
        <span class="live-strip__sep" aria-hidden="true"></span>
        <span class="live-strip__title">${esc(live.shortTitle || live.title)}</span>
        <a class="live-strip__link" href="#/course/${live.id}">Смотреть программу${ico('arrow')}</a>
      </div>
    </div>
  </section>

  <section class="dirs theme-light" aria-labelledby="dirs-h">
    <div class="wrap">
      <h2 class="sec-title" id="dirs-h">Выберите направление</h2>
      <div class="dir-tabs" role="tablist" aria-label="Направления обучения">
        ${DIRECTIONS.map((d, i) => `<button class="dir-tab" type="button" role="tab" id="dtab-${d.id}" data-dtab="${d.id}" aria-controls="dir-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${d.tab}</button>`).join('')}
      </div>
      <div class="dir-cards" id="dir-panel" role="tabpanel" aria-labelledby="dtab-${DIRECTIONS[0].id}">${dirCards(DIRECTIONS[0])}</div>
    </div>
  </section>

  <section class="section start">
    <div class="wrap">
      ${sectionHead('Курсы ближайшего потока', 'С чего начать', ['#/catalog?type=course', 'Все курсы'])}
      <div class="start__grid">
        <article class="feature">
          <div class="feature__cover">${cover(lead)}<div class="card__tags">${typeTag(lead)}</div></div>
          <div class="feature__body">
            <p class="card__dir">${dirOf(lead.dir).name} · ${lead.level}</p>
            <h3 class="feature__title"><a href="#/course/${lead.id}">${esc(lead.title)}</a></h3>
            <p class="feature__lead">${lead.short}</p>
            <p class="card__meta">${metaOf(lead)}</p>
            <div class="feature__foot">
              <span class="who">${mono(teacherOf(lead))}<span>${teacherOf(lead).name}</span></span>
              <span class="price price--lg">${fmtPrice(lead.price)}</span>
            </div>
            <div class="feature__actions">${ctaFor(lead)}<a class="btn btn--ghost" href="#/course/${lead.id}">Программа курса</a></div>
          </div>
        </article>
        <div class="start__list">${startList.map(p => card(p, 'row')).join('')}</div>
      </div>
    </div>
  </section>

  <section class="section section--alt sched">
    <div class="wrap">
      ${sectionHead('Расписание', 'Ближайшие эфиры', ['#/webinars', 'Все вебинары'])}
      <ol class="sched__list">${sched.map(scheduleRow).join('')}</ol>
    </div>
  </section>

  <section class="section about theme-light">
    <div class="wrap about__grid">
      <div class="about__text">
        <p class="eyebrow">Об академии</p>
        <p class="statement">STOMMEET — онлайн-академия, где врачи разбирают клинические случаи шаг за шагом: от диагностики до отдалённого результата.</p>
        <dl class="principles">
          <div><dt>Клинический подход</dt><dd>Каждая тема разобрана на случаях из практики лектора: этапы, решения и ошибки.</dd></div>
          <div><dt>Вопросы во время эфира</dt><dd>В трансляции можно задать вопрос лектору и получить ответ в тот же вечер.</dd></div>
          <div><dt>Записи остаются у вас</dt><dd>Занятия курса доступны в личном кабинете для повторного просмотра.</dd></div>
        </dl>
      </div>
      <figure class="about__photo"><img src="assets/img/loupes.jpg" alt="Врач в бинокулярных лупах с подсветкой во время работы" width="1138" height="1300" loading="lazy"></figure>
    </div>
  </section>

  <section class="section teach">
    <div class="wrap">
      ${sectionHead('Преподаватели', 'Лекторы академии', ['#/teachers', 'Все преподаватели'])}
      <p class="note">Профили ниже — примеры структуры. Имена и биографии условные, фото заменены монограммами.</p>
      <ul class="tgrid">
        ${TEACHERS.map(t => `<li><a class="tcard" href="#/teachers/${t.id}">
          <span class="mono mono--${t.dir} mono--lg" aria-hidden="true">${t.initials}</span>
          <span class="tcard__name">${t.name}</span>
          <span class="tcard__spec">${t.spec}</span>
        </a></li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="section how theme-light">
    <div class="wrap how__grid">
      <figure class="how__photo"><img src="assets/img/study-laptop.jpg" alt="Врач смотрит онлайн-лекцию на ноутбуке и делает заметки" width="1400" height="934" loading="lazy"></figure>
      <div class="how__text">
        <p class="eyebrow">Как проходит обучение</p>
        <h2>От выбора программы до записи в кабинете</h2>
        <ol class="steps">
          <li><h3>Выберите программу</h3><p>Курс из нескольких занятий, отдельный эфир или готовая запись — в каталоге по направлениям.</p></li>
          <li><h3>Запишитесь</h3><p>Оставьте имя и email. После оплаты программа появится в личном кабинете.</p></li>
          <li><h3>Участвуйте в эфире</h3><p>Смотрите лекцию в браузере, задавайте вопросы лектору, следите за программой занятия.</p></li>
          <li><h3>Пересматривайте записи</h3><p>Записи занятий остаются в кабинете — к ним можно вернуться перед приёмом.</p></li>
        </ol>
      </div>
    </div>
  </section>

  <section class="cta-final">
    <img class="cta-final__bg" src="assets/img/instruments.jpg" alt="" loading="lazy">
    <div class="wrap cta-final__in">
      <h2>С какого направления начнём?</h2>
      <p>Отметьте одно или несколько — покажем подходящие курсы, эфиры и записи.</p>
      <div class="chips chips--dark" role="group" aria-label="Направления">
        ${DIRECTIONS.map(d => `<button class="chip" type="button" data-pick="${d.id}" aria-pressed="false">${d.name}</button>`).join('')}
      </div>
      <a class="btn btn--light btn--lg" href="#/catalog" data-pick-go>Показать все программы${ico('arrow')}</a>
    </div>
  </section>`;

  return {
    html, title: 'Клиническая практика. Из первых рук', nav: '',
    after(main) {
      const panel = $('#dir-panel', main), tabs = $$('[data-dtab]', main);
      let swap;
      function selectTab(tab, focus) {
        if (tab.getAttribute('aria-selected') === 'true') return;
        tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
        if (focus) tab.focus();
        clearTimeout(swap);
        panel.classList.add('is-switching');
        swap = setTimeout(() => {
          panel.innerHTML = dirCards(dirOf(tab.dataset.dtab));
          panel.setAttribute('aria-labelledby', tab.id);
          panel.classList.remove('is-switching');
        }, 180);
      }
      $('.dir-tabs', main).addEventListener('keydown', e => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        selectTab(tabs[(next + tabs.length) % tabs.length], true);
      });

      const picked = new Set(), go = $('[data-pick-go]', main);
      main.addEventListener('click', e => {
        const t = e.target.closest('[data-dtab]');
        if (t) return selectTab(t);
        const b = e.target.closest('[data-pick]');
        if (!b) return;
        picked.has(b.dataset.pick) ? picked.delete(b.dataset.pick) : picked.add(b.dataset.pick);
        b.setAttribute('aria-pressed', picked.has(b.dataset.pick));
        const n = PROGRAMS.filter(p => picked.has(p.dir)).length;
        go.href = picked.size ? '#/catalog?dir=' + [...picked].join(',') : '#/catalog';
        go.firstChild.textContent = picked.size ? `Показать ${n} ${plural(n, 'программу', 'программы', 'программ')}` : 'Показать все программы';
      });
      return () => clearTimeout(swap);
    },
  };
}

// ---------- Каталог ----------
const ORTHO_TOPICS = ['ortho-modern', 'occlusion', 'implant-prosth', 'digital-workflow', 'aesthetic-direct'];
const norm = s => s.toLowerCase().replace(/ё/g, 'е');

function renderCatalog(query) {
  const st = {
    type: TYPES[query.type] ? query.type : 'all',
    dirs: new Set((query.dir || '').split(',').filter(dirOf)),
    q: query.q || '',
    sort: ['date', 'price-asc', 'price-desc'].includes(query.sort) ? query.sort : 'date',
  };
  const counts = { all: PROGRAMS.length };
  for (const k in TYPES) counts[k] = PROGRAMS.filter(p => p.type === k).length;

  const html = `
  <section class="page-head">
    <div class="wrap">
      ${crumbs([['#/', 'Главная'], ['', 'Каталог']])}
      <h1>Каталог программ</h1>
      <p class="page-head__lead">Онлайн-курсы, прямые вебинары и записи по шести направлениям. Время эфиров — московское.</p>
    </div>
  </section>
  <div class="wrap catalog">
    <div class="catalog__bar">
      <div class="seg" role="group" aria-label="Формат">
        <button type="button" data-type="all">Все <span>${counts.all}</span></button>
        ${Object.entries(TYPES).map(([k, t]) => `<button type="button" data-type="${k}">${t.plural} <span>${counts[k]}</span></button>`).join('')}
      </div>
      <div class="catalog__tools">
        <label class="search">${ico('search', 'search__ico')}<span class="sr">Поиск</span><input type="search" placeholder="Тема, лектор, ключевое слово" value="${esc(st.q)}"></label>
        <label class="select"><span class="sr">Сортировка</span>
          <select data-sort>
            <option value="date">Сначала ближайшие</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
          </select>
        </label>
      </div>
    </div>
    ${chipsDirs(st.dirs, 'data-dirs')}
    <div data-spot></div>
    <p class="catalog__count" aria-live="polite"></p>
    <div class="grid" data-results></div>
  </div>`;

  const spotlight = filtered => `<section class="spotlight">
    <img src="assets/img/crown-handpiece.jpg" alt="Руки в перчатках обрабатывают керамическую коронку" width="1800" height="1197" loading="lazy">
    <div class="spotlight__text">
      <p class="eyebrow">Раздел каталога</p>
      <h2>Ортопедическая стоматология</h2>
      <p>Как планировать и проводить ортопедическое лечение: функциональный анализ, выбор конструкции, препарирование и фиксация — на своих зубах и на имплантатах.</p>
      <ul class="spotlight__topics">${ORTHO_TOPICS.map(byId).map(p => `<li><a href="#/course/${p.id}">${esc(p.title.split(':')[0])}</a><span>${typeLabel(p)}</span></li>`).join('')}</ul>
      ${filtered ? '' : '<button class="btn btn--primary" type="button" data-spot-go>Показать программы раздела</button>'}
    </div>
  </section>`;

  const sortKey = p => p.type === 'recording' ? Infinity - startOf(p) / 1e13 : +startOf(p);

  return {
    html, title: 'Каталог программ', nav: 'catalog',
    after(main) {
      const results = $('[data-results]', main), countEl = $('.catalog__count', main), spot = $('[data-spot]', main);
      const input = $('.search input', main), sel = $('[data-sort]', main);
      sel.value = st.sort;

      function paint() {
        $$('[data-type]', main).forEach(b => b.setAttribute('aria-pressed', b.dataset.type === st.type));
        $$('[data-dirs] [data-dir]', main).forEach(b => b.setAttribute('aria-pressed', b.dataset.dir ? st.dirs.has(b.dataset.dir) : st.dirs.size === 0));
        const showSpot = st.dirs.size === 0 || (st.dirs.size === 1 && st.dirs.has('orthopedics'));
        spot.innerHTML = showSpot && !st.q ? spotlight(st.dirs.has('orthopedics')) : '';
        const q = norm(st.q.trim());
        let list = PROGRAMS.filter(p => (st.type === 'all' || p.type === st.type)
          && (!st.dirs.size || st.dirs.has(p.dir))
          && (!q || norm(p.title + ' ' + p.short + ' ' + teacherOf(p).name + ' ' + dirOf(p.dir).name).includes(q)));
        list.sort(st.sort === 'date' ? (a, b) => (a.liveNow ? -1 : b.liveNow ? 1 : sortKey(a) - sortKey(b))
          : st.sort === 'price-asc' ? (a, b) => a.price - b.price : (a, b) => b.price - a.price);
        countEl.textContent = list.length ? `Найдено: ${list.length} ${plural(list.length, 'программа', 'программы', 'программ')}` : '';
        results.innerHTML = list.length ? list.map(p => card(p)).join('')
          : `<div class="empty"><h2>По этим условиям программ нет</h2><p>Попробуйте убрать часть фильтров или изменить запрос.</p><button class="btn btn--ghost" type="button" data-reset>Сбросить фильтры</button></div>`;
        setQuery('/catalog', { type: st.type === 'all' ? '' : st.type, dir: [...st.dirs].join(','), q: st.q, sort: st.sort === 'date' ? '' : st.sort });
      }

      main.addEventListener('click', e => {
        const tb = e.target.closest('[data-type]');
        if (tb) { st.type = tb.dataset.type; return paint(); }
        const db = e.target.closest('[data-dirs] [data-dir]');
        if (db) {
          const d = db.dataset.dir;
          if (!d) st.dirs.clear(); else st.dirs.has(d) ? st.dirs.delete(d) : st.dirs.add(d);
          return paint();
        }
        if (e.target.closest('[data-spot-go]')) { st.dirs = new Set(['orthopedics']); paint(); main.querySelector('.catalog__count').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        if (e.target.closest('[data-reset]')) { st.type = 'all'; st.dirs.clear(); st.q = ''; input.value = ''; paint(); }
      });
      let timer;
      input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { st.q = input.value; paint(); }, 200); });
      sel.addEventListener('change', () => { st.sort = sel.value; paint(); });
      paint();
    },
  };
}

// ---------- Страница программы ----------
function renderProgram(id) {
  const p = byId(id);
  if (!p) return renderNotFound();
  const t = teacherOf(p), d = dirOf(p.dir), s = startOf(p);
  const related = PROGRAMS.filter(x => x.id !== p.id && x.dir === p.dir).concat(PROGRAMS.filter(x => x.id !== p.id && x.dir !== p.dir && x.type === p.type)).slice(0, 3);

  const facts = p.type === 'course' ? [
    ['Старт', fmtDate(s)], ['Расписание', p.schedule], ['Объём', `${p.lessons} ${plural(p.lessons, 'занятие', 'занятия', 'занятий')}, ${p.duration}`], ['Уровень', p.level],
  ] : p.type === 'live' ? [
    ['Дата', p.liveNow ? 'Сегодня, идёт сейчас' : fmtDate(s)], ['Время', `${fmtTime(s)} МСК`], ['Продолжительность', fmtMinutes(p.minutes)], ['Уровень', p.level],
  ] : p.fromLive ? [
    ['Эфир прошёл', fmtDate(s)], ['Продолжительность', fmtMinutes(p.minutes)], ['Доступ', 'Сразу после оформления'], ['Уровень', p.level],
  ] : [
    ['Объём', `${p.lessons} ${plural(p.lessons, 'урок', 'урока', 'уроков')}, ${p.duration}`], ['Доступ', 'Сразу после оформления'], ['Уровень', p.level],
  ];

  const format = p.type === 'course' ? [
    ['Формат', 'Онлайн: прямые эфиры по расписанию и записи каждого занятия'],
    ['Вопросы лектору', 'В чате во время эфира и в комментариях к записи'],
    ['Доступ к записям', '12 месяцев после окончания курса (условие демо)'],
    ['Документ', 'Сертификат участника — условия уточняются'],
  ] : p.type === 'live' ? [
    ['Формат', 'Прямой эфир с демонстрацией клинических материалов'],
    ['Вопросы лектору', 'В чате эфира, лучшие вопросы разбираются в конце'],
    ['Запись', 'Появится в личном кабинете после эфира'],
  ] : [
    ['Формат', 'Видеозаписи — смотреть в своём темпе'],
    ['Вопросы', p.fromLive ? 'Вопросы участников из эфира и ответы лектора в записи' : 'В комментариях к урокам'],
    ['Доступ', '12 месяцев (условие демо)'],
  ];

  const programBlock = p.program ? `
    <section class="prog-sec" aria-labelledby="sec-program">
      <div class="prog-sec__head"><h2 id="sec-program">Программа</h2><button class="link-btn" type="button" data-toggle-all>Развернуть все</button></div>
      <div class="lessons">
        ${p.program.map(([title, dur, items], i) => `<details class="lesson"${i === 0 ? ' open' : ''}>
          <summary><span class="lesson__n">${String(i + 1).padStart(2, '0')}</span><span class="lesson__t">${title}</span><span class="lesson__d">${dur}</span>${ico('chevron', 'lesson__chev')}</summary>
          <ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>
        </details>`).join('')}
      </div>
    </section>` : `
    <section class="prog-sec" aria-labelledby="sec-program">
      <h2 id="sec-program">Программа эфира</h2>
      <ol class="agenda">${p.agenda.map(([m, title]) => `<li><span class="agenda__t">${fmtTime(new Date(+s + m * 60e3))}</span><span>${title}</span></li>`).join('')}</ol>
    </section>`;

  const html = `
  <section class="prog-hero">
    <div class="wrap">
      ${crumbs([['#/', 'Главная'], ['#/catalog', 'Каталог'], ['#/catalog?dir=' + d.id, d.name], ['', typeLabel(p)]])}
      <div class="prog-hero__grid">
        <div class="prog-hero__text">
          <div class="prog-hero__tags">${typeTag(p)}<span class="tag tag--muted">${d.name}</span></div>
          <h1>${esc(p.title)}</h1>
          <p class="prog-hero__lead">${p.short}</p>
          <p class="card__meta">${metaOf(p)}</p>
          <a class="who who--lg" href="#/teachers/${t.id}">${mono(t)}<span><strong>${t.name}</strong><small>${t.spec} · пример профиля</small></span></a>
          <div class="prog-hero__cta">${ctaFor(p, 'lg')}<p class="prog-hero__price"><strong>${fmtPrice(p.price)}</strong><small>условная цена</small></p></div>
        </div>
        <div class="prog-hero__art">${cover(p)}</div>
      </div>
    </div>
  </section>

  <div class="theme-light prog-light"><div class="wrap prog-body">
    <div class="prog-main">
      <section class="prog-sec" aria-labelledby="sec-about">
        <h2 id="sec-about">${p.type === 'course' ? 'О курсе' : p.type === 'live' ? 'Об эфире' : 'О записи'}</h2>
        <p class="prog-sec__lead">${p.about}</p>
      </section>
      ${p.forWhom ? `<div class="prog-two">
        <section class="prog-sec" aria-labelledby="sec-who"><h2 id="sec-who">Для кого</h2><ul class="dash">${p.forWhom.map(x => `<li>${x}</li>`).join('')}</ul></section>
        <section class="prog-sec" aria-labelledby="sec-out"><h2 id="sec-out">Чему научитесь</h2><ul class="dash dash--blue">${p.outcomes.map(x => `<li>${x}</li>`).join('')}</ul></section>
      </div>` : ''}
      ${programBlock}
      <section class="prog-sec" aria-labelledby="sec-teacher">
        <h2 id="sec-teacher">Преподаватель</h2>
        <div class="teacher-box">
          <span class="mono mono--${t.dir} mono--lg" aria-hidden="true">${t.initials}</span>
          <div>
            <p class="teacher-box__name">${t.name}</p>
            <p class="teacher-box__spec">${t.spec} · <span class="tag tag--muted">Пример профиля</span></p>
            ${t.bio.map(x => `<p>${x}</p>`).join('')}
            <a class="link-arrow" href="#/teachers/${t.id}">Все программы преподавателя${ico('arrow')}</a>
          </div>
        </div>
      </section>
      <section class="prog-sec" aria-labelledby="sec-format">
        <h2 id="sec-format">Формат обучения</h2>
        <dl class="format">${format.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      </section>
    </div>

    <aside class="prog-aside">
      <div class="price-card">
        <p class="price-card__label">Стоимость <small>условная</small></p>
        <p class="price-card__price">${fmtPrice(p.price)}</p>
        <div class="price-card__cta">${ctaFor(p, 'lg').replace('class="btn', 'class="btn btn--block')}</div>
        <dl class="price-card__facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <p class="price-card__note">Демо: оплата не подключена, запись сохраняется только в этом браузере.</p>
      </div>
    </aside>
  </div></div>

  <section class="section related">
    <div class="wrap">
      ${sectionHead('Похожие программы', d.full, ['#/catalog?dir=' + d.id, 'Все программы направления'])}
      <div class="grid grid--3">${related.map(x => card(x)).join('')}</div>
    </div>
  </section>

  <div class="buybar">
    <div><span class="buybar__price">${fmtPrice(p.price)}</span><span class="buybar__note">условная цена</span></div>
    ${ctaFor(p)}
  </div>`;

  return {
    html, title: p.title, nav: 'catalog', page: 'program',
    after(main) {
      const tgl = $('[data-toggle-all]', main);
      if (tgl) tgl.addEventListener('click', () => {
        const all = $$('.lesson', main), open = all.some(x => !x.open);
        all.forEach(x => x.open = open);
        tgl.textContent = open ? 'Свернуть все' : 'Развернуть все';
      });
    },
  };
}

// ---------- Вебинары ----------
function renderWebinars(query) {
  const live = PROGRAMS.find(p => p.liveNow), lt = teacherOf(live);
  const ups = upcomingLives(), past = pastLives(), next = ups[0];
  const tab = query.tab === 'past' ? 'past' : 'upcoming';
  const dirs = new Set((query.dir || '').split(',').filter(dirOf));

  const html = `
  <section class="page-head">
    <div class="wrap">
      ${crumbs([['#/', 'Главная'], ['', 'Вебинары']])}
      <h1>Вебинары</h1>
      <p class="page-head__lead">Прямые эфиры с разбором клинических случаев и вопросами лектору. Прошедшие эфиры доступны в записи. Время — московское.</p>
    </div>
  </section>
  <div class="wrap">
    <div class="web-top">
      <article class="onair-panel">
        <div class="onair-panel__text">
          <span class="status status--live status--dark"><i></i>Идёт сейчас · с ${fmtTime(startOf(live))} МСК</span>
          <h2><a href="#/course/${live.id}">${esc(live.title)}</a></h2>
          <p>${live.short}</p>
          <p class="who who--dark">${mono(lt)}<span>${lt.name}, ${lt.spec.toLowerCase()}</span></p>
          <div class="onair-panel__cta"><a class="btn btn--live btn--lg" href="#/room/${live.id}">${ico('play')}Войти в эфир</a><a class="btn btn--outline-light btn--lg" href="#/course/${live.id}">Об эфире</a></div>
        </div>
        <div class="onair-panel__art">${cover(live)}</div>
      </article>
      <article class="next-panel">
        <p class="eyebrow">Следующий эфир</p>
        <h2><a href="#/course/${next.id}">${esc(next.title)}</a></h2>
        <p class="card__meta">${metaOf(next)}</p>
        <p class="next-panel__label">До начала</p>
        <p class="next-panel__count" data-countdown="${+startOf(next)}">${fmtCountdown(startOf(next) - Date.now())}</p>
        ${ctaFor(next)}
      </article>
    </div>

    <div class="web-bar">
      <div class="seg" role="group" aria-label="Эфиры">
        <button type="button" data-tab="upcoming" aria-pressed="${tab === 'upcoming'}">Предстоящие <span>${ups.length + 1}</span></button>
        <button type="button" data-tab="past" aria-pressed="${tab === 'past'}">Прошедшие <span>${past.length}</span></button>
      </div>
    </div>
    ${chipsDirs(dirs, 'data-dirs')}
    <div class="web-list" data-list></div>
  </div>
  <div class="section-gap"></div>`;

  return {
    html, title: 'Вебинары', nav: 'webinars',
    after(main) {
      const st = { tab, dirs }, list = $('[data-list]', main);
      function paint() {
        $$('[data-tab]', main).forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === st.tab));
        $$('[data-dirs] [data-dir]', main).forEach(b => b.setAttribute('aria-pressed', b.dataset.dir ? st.dirs.has(b.dataset.dir) : st.dirs.size === 0));
        const ok = p => !st.dirs.size || st.dirs.has(p.dir);
        if (st.tab === 'upcoming') {
          const items = [live, ...ups].filter(ok);
          list.innerHTML = items.length ? `<ol class="sched__list">${items.map(scheduleRow).join('')}</ol>` : '<p class="empty-line">По выбранным направлениям предстоящих эфиров нет.</p>';
        } else {
          const items = past.filter(ok);
          list.innerHTML = items.length ? `<div class="grid grid--3">${items.map(p => `<article class="card">
              <div class="card__cover">${cover(p)}<div class="card__tags"><span class="tag">Запись доступна</span></div></div>
              <div class="card__body">
                <p class="card__dir">${dirOf(p.dir).name}</p>
                <h3 class="card__title"><a href="#/course/${p.id}">${esc(p.title)}</a></h3>
                <p class="card__meta">${metaOf(p)}</p>
                <div class="card__foot card__foot--act"><a class="btn btn--ghost btn--sm" href="#/room/${p.id}?state=recording">${ico('play')}Смотреть запись</a><span class="price">${fmtPrice(p.price)}</span></div>
              </div></article>`).join('')}</div>` : '<p class="empty-line">По выбранным направлениям записей нет.</p>';
        }
        setQuery('/webinars', { tab: st.tab === 'past' ? 'past' : '', dir: [...st.dirs].join(',') });
      }
      main.addEventListener('click', e => {
        const tb = e.target.closest('[data-tab]');
        if (tb) { st.tab = tb.dataset.tab; return paint(); }
        const db = e.target.closest('[data-dirs] [data-dir]');
        if (db) { const d = db.dataset.dir; if (!d) st.dirs.clear(); else st.dirs.has(d) ? st.dirs.delete(d) : st.dirs.add(d); paint(); }
      });
      paint();
      const cd = $('[data-countdown]', main);
      const timer = setInterval(() => { cd.textContent = fmtCountdown(+cd.dataset.countdown - Date.now()); }, 1000);
      return () => clearInterval(timer);
    },
  };
}

// ---------- Преподаватели ----------
function renderTeachers(focus) {
  const html = `
  <section class="page-head">
    <div class="wrap">
      ${crumbs([['#/', 'Главная'], ['', 'Преподаватели']])}
      <h1>Преподаватели</h1>
      <p class="page-head__lead">Так будет выглядеть раздел с лекторами. Сейчас все профили — примеры: имена, специализации и биографии условные, вместо фото — монограммы. Реальные данные заполнит академия.</p>
    </div>
  </section>
  <div class="wrap tlist">
    ${TEACHERS.map(t => {
      const progs = PROGRAMS.filter(p => p.teacher === t.id);
      return `<article class="trow" id="t-${t.id}">
        <span class="mono mono--${t.dir} mono--xl" aria-hidden="true">${t.initials}</span>
        <div class="trow__main">
          <p class="trow__spec">${t.spec}</p>
          <h2 class="trow__name">${t.name} <span class="tag tag--muted">Пример профиля</span></h2>
          ${t.bio.map(x => `<p>${x}</p>`).join('')}
          <ul class="tags">${t.interests.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="trow__progs">
          <h3>Программы · ${progs.length}</h3>
          <ul>${progs.map(p => `<li><a href="#/course/${p.id}"><span>${esc(p.title)}</span><small>${typeLabel(p)} · ${fmtPrice(p.price)}</small></a></li>`).join('')}</ul>
        </div>
      </article>`;
    }).join('')}
  </div>
  <div class="section-gap"></div>`;
  return {
    html, title: 'Преподаватели', nav: 'teachers',
    after(main) {
      const el = focus && $('#t-' + focus, main);
      if (el) { el.classList.add('is-focus'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60); }
    },
  };
}

// ---------- Личный кабинет ----------
const CAB_TABS = [['', 'Мои курсы'], ['webinars', 'Вебинары'], ['recordings', 'Записи'], ['history', 'История записей']];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
}

function probe(done, total) {
  return `<span class="probe" role="img" aria-label="Пройдено ${done} из ${total}">${Array.from({ length: total }, (_, i) => `<i${i < done ? ' class="on"' : ''}></i>`).join('')}</span>`;
}

function renderCabinet(tab = '') {
  if (!CAB_TABS.some(([k]) => k === tab)) tab = '';
  const mine = state.enrollments.map(e => byId(e.programId)).filter(Boolean);
  const courses = mine.filter(p => p.type === 'course' || (p.type === 'recording' && !p.fromLive));
  const webs = mine.filter(p => p.type === 'live');
  const recs = mine.filter(p => p.fromLive);
  const name = state.profile.name ? esc(state.profile.name.split(' ')[0]) : 'коллега';

  const emptyBox = (text, href, label) => `<div class="empty"><h2>${text}</h2><a class="btn btn--primary" href="${href}">${label}</a></div>`;

  const panes = {
    '': courses.length ? `<div class="cab-list">${courses.map(p => {
      const done = doneLessons(p.id).length, total = p.program.length, nextN = Math.min(done + 1, total);
      const notStarted = p.type === 'course' && startOf(p) > Date.now();
      return `<article class="cab-item">
        <div class="cab-item__art">${cover(p)}</div>
        <div class="cab-item__main">
          <p class="card__dir">${typeLabel(p)} · ${dirOf(p.dir).name}</p>
          <h3><a href="#/course/${p.id}">${esc(p.title)}</a></h3>
          <p class="card__meta">${notStarted ? `Старт ${fmtDate(startOf(p))}. В демо уроки открыты для просмотра.` : `Следующий урок: ${p.program[nextN - 1][0]}`}</p>
          <div class="cab-item__progress">${probe(done, total)}<span>${done} из ${total} ${plural(total, 'урока', 'уроков', 'уроков')}</span></div>
        </div>
        <a class="btn btn--primary" href="#/learn/${p.id}/${nextN}">${done ? 'Продолжить' : 'Начать'}${ico('arrow')}</a>
      </article>`;
    }).join('')}</div>` : emptyBox('Пока нет курсов', '#/catalog?type=course', 'Выбрать курс'),

    webinars: webs.length ? `<ol class="sched__list">${webs.sort((a, b) => startOf(a) - startOf(b)).map(scheduleRow).join('')}</ol>`
      : emptyBox('Вы пока не записаны на эфиры', '#/webinars', 'Расписание вебинаров'),

    recordings: recs.length ? `<div class="grid grid--3">${recs.map(p => `<article class="card">
        <div class="card__cover">${cover(p)}<div class="card__tags"><span class="tag">Запись эфира</span></div></div>
        <div class="card__body"><p class="card__dir">${dirOf(p.dir).name}</p>
          <h3 class="card__title"><a href="#/room/${p.id}?state=recording">${esc(p.title)}</a></h3>
          <p class="card__meta">${metaOf(p)}</p></div></article>`).join('')}</div>`
      : emptyBox('Записей пока нет', '#/webinars?tab=past', 'Прошедшие эфиры'),

    history: `<div class="table-wrap"><table class="table">
        <caption class="sr">История демо-записей на обучение</caption>
        <thead><tr><th scope="col">Дата</th><th scope="col">Программа</th><th scope="col">Формат</th><th scope="col">Статус</th></tr></thead>
        <tbody>${state.enrollments.slice().sort((a, b) => b.at - a.at).map(e => {
          const p = byId(e.programId);
          return p ? `<tr><td>${fmtDate(new Date(e.at))}</td><td><a href="#/course/${p.id}">${esc(p.title)}</a></td><td>${typeLabel(p)}</td>
            <td>${e.seed ? '<span class="tag tag--muted">Пример</span>' : '<span class="tag tag--ok">Демо-запись</span>'} без оплаты</td></tr>` : '';
        }).join('')}</tbody></table></div>
      <div class="cab-reset"><p>Демо-данные кабинета хранятся только в этом браузере.</p><button class="btn btn--ghost btn--sm" type="button" data-reset-demo>Сбросить демо-данные</button></div>`,
  };

  const html = `
  <section class="page-head page-head--cab">
    <div class="wrap">
      ${crumbs([['#/', 'Главная'], ['', 'Личный кабинет']])}
      <div class="cab-head">
        <div><h1>${greeting()}, ${name}</h1><p class="page-head__lead">Пример личного кабинета врача. Здесь собраны курсы, эфиры и записи, на которые вы записались в демо.</p></div>
        <span class="tag tag--muted">Демо · без входа и оплаты</span>
      </div>
    </div>
  </section>
  <div class="wrap cab">
    <nav class="cab-tabs" aria-label="Разделы кабинета">
      ${CAB_TABS.map(([k, label]) => {
        const n = { '': courses.length, webinars: webs.length, recordings: recs.length, history: state.enrollments.length }[k];
        return `<a href="#/cabinet${k ? '/' + k : ''}"${k === tab ? ' aria-current="page"' : ''}>${label}<span>${n}</span></a>`;
      }).join('')}
    </nav>
    <div class="cab-pane">${panes[tab]}</div>
  </div>
  <div class="section-gap"></div>`;

  return {
    html, title: 'Личный кабинет', nav: 'cabinet',
    after(main) {
      const r = $('[data-reset-demo]', main);
      if (r) r.addEventListener('click', () => {
        if (!confirm('Сбросить демо-данные кабинета? Ваши демо-записи и прогресс удалятся из этого браузера.')) return;
        state = seedState();
        saveState();
        toast('Демо-данные сброшены');
        route();
      });
    },
  };
}

// ---------- Инструкция для заказчика ----------
const GUIDE_STEPS = [
  ['#/', 'Главная страница', 'Пролистайте страницу сверху вниз. Это лицо академии: кто вы, какие направления, ближайшие курсы и эфиры, преподаватели, как проходит обучение. В блоке «Выберите направление» переключайте вкладки — карточки курсов и вебинаров меняются.',
    'Полоса «Прямой эфир» внизу первого экрана показывает, как сайт подсвечивает эфир, который идёт прямо сейчас.'],
  ['#/catalog', 'Каталог программ', 'Здесь собраны все курсы, эфиры и записи. Нажимайте переключатели «Онлайн-курсы / Прямые вебинары / Записи» и кнопки направлений, например «Ортопедия». Можно ввести слово в поиск.',
    'Список меняется сразу, без перезагрузки страницы.'],
  ['#/course/ortho-modern', 'Страница курса', 'Откройте любой курс. Ниже описания — программа: нажмите на занятие, и оно раскроется. Дальше — преподаватель и формат обучения. Справа — цена и кнопка записи.',
    'Такая страница должна убеждать врача записаться.'],
  ['#/course/occlusion', 'Запись на курс', 'Нажмите «Записаться на курс». Впишите любые имя и email, можно вымышленные, и поставьте галочку согласия. Нажмите «Записаться (демо)».',
    'Деньги не списываются, письма не уходят. В рабочей версии на этом шаге будет оплата.'],
  ['#/cabinet', 'Личный кабинет врача', 'Курс, на который вы записались, появился в «Моих курсах». Нажмите «Начать» — откроется урок с плеером. Внизу есть кнопка «Отметить урок пройденным»: полоска прогресса заполнится.',
    'Слева — разделы кабинета: вебинары, записи и история записей.'],
  ['#/webinars', 'Вебинары', 'Вверху — эфир, который идёт сейчас, и отсчёт до следующего. Ниже — расписание. Вкладка «Прошедшие» показывает записи эфиров.',
    'Даты всегда считаются от сегодняшнего дня, поэтому расписание не устаревает.'],
  ['#/room/live-wear', 'Комната эфира', 'Так врач будет смотреть лекцию. Вверху справа переключатель: «До начала» — отсчёт времени, «Прямой эфир» — идёт лекция, «Запись» — можно перематывать. Справа задайте вопрос лектору и нажмите «Отправить».',
    'Настоящее видео пока не подключено: вместо него показываются слайды программы.'],
];

function renderGuide() {
  const html = `
  <section class="page-head">
    <div class="wrap">
      ${crumbs([['#/', 'Главная'], ['', 'Как смотреть демо']])}
      <h1>Как смотреть демо-версию</h1>
      <p class="page-head__lead">Это прототип будущего сайта академии. Нажимайте всё подряд: ничего не сломается, оплаты нет, введённые данные никуда не отправляются. Маршрут ниже займёт 10–15 минут.</p>
    </div>
  </section>
  <div class="wrap guide">
    <ol class="guide__steps">
      ${GUIDE_STEPS.map(([href, title, what, note]) => `<li class="guide-step">
        <div>
          <h2>${title}</h2>
          <p>${what}</p>
          <p class="guide-step__note">${note}</p>
        </div>
        <a class="btn btn--ghost btn--sm" href="${href}">Открыть${ico('arrow')}</a>
      </li>`).join('')}
    </ol>
    <aside class="guide__side">
      <section class="guide-box">
        <h2>Обозначения на сайте</h2>
        <dl class="legend-list">
          <div><dt><span class="tag tag--muted">Демо</span></dt><dd>Метка «Демо · данные условные» в шапке каждой страницы: курсы, даты, цены и преподаватели условные. По нажатию открывается эта инструкция</dd></div>
          <div><dt><i class="swatch swatch--blue"></i></dt><dd>Синий — главные действия: выбрать курс, записаться, открыть</dd></div>
          <div><dt><i class="swatch swatch--red"></i></dt><dd>Красный — только прямой эфир: «Идёт сейчас», «Войти в эфир»</dd></div>
          <div><dt><span class="legend-art">${coverSVG('molars', 3, 'orthopedics')}</span></dt><dd>Рисунки-схемы на обложках вместо фото: окклюзия, имплантат, каналы, шкала цвета. Можно заменить на фотографии курсов</dd></div>
          <div><dt><span class="mono mono--orthopedics">АВ</span></dt><dd>Место для фото преподавателя. Имена и биографии — примеры</dd></div>
        </dl>
      </section>
      <section class="guide-box">
        <h2>На что обратить внимание</h2>
        <ul class="dash">
          <li>Нравится ли стиль, цвета и шрифты</li>
          <li>Понятно ли, как выбрать курс и записаться</li>
          <li>Каких разделов или информации не хватает</li>
          <li>Подходят ли рисунки-схемы на обложках или нужны фото</li>
          <li>Как вы видите эфиры: какая платформа, нужен ли чат</li>
        </ul>
      </section>
      <section class="guide-box guide-box--dark">
        <h2>Как прислать замечания</h2>
        <p>Сделайте скриншот места и напишите, что изменить. Можно голосовым сообщением. Замечания удобнее присылать одним списком.</p>
        <p class="guide-box__small">Чтобы начать заново с чистым кабинетом: «Личный кабинет» → «История записей» → «Сбросить демо-данные».</p>
      </section>
    </aside>
  </div>
  <div class="section-gap"></div>`;
  return { html, title: 'Как смотреть демо', nav: '' };
}

// ---------- Служебные страницы ----------
const DOCS = {
  privacy: ['Политика конфиденциальности', `
    <p class="doc-note">Шаблон-заглушка для демо. Не является юридическим документом: текст политики готовит академия вместе с юристом до запуска.</p>
    <h2>Что будет в документе</h2>
    <ol class="doc-list">
      <li>Оператор персональных данных: наименование, ИНН, ОГРН, адрес.</li>
      <li>Какие данные собираются: имя, email, телефон, специализация, данные об оплате.</li>
      <li>Цели обработки: запись на обучение, доступ к кабинету, выдача документов об обучении.</li>
      <li>Сроки хранения и порядок удаления данных.</li>
      <li>Хранение данных граждан РФ на серверах в России (152-ФЗ).</li>
      <li>Передача третьим лицам: платёжный сервис, видеоплатформа.</li>
      <li>Права пользователя и контакты для запросов.</li>
    </ol>
    <h2>Как устроено в демо</h2>
    <p>Формы демо-версии никуда не отправляют данные. Имя и email, введённые при записи, сохраняются только в этом браузере и удаляются кнопкой «Сбросить демо-данные» в личном кабинете. Cookies, счётчики и аналитика не используются.</p>`],
  offer: ['Договор оферты', `
    <p class="doc-note">Шаблон-заглушка для демо. Текст оферты готовит академия до запуска продаж.</p>
    <h2>Что будет в документе</h2>
    <ol class="doc-list">
      <li>Стороны договора и предмет: доступ к образовательным программам.</li>
      <li>Порядок оформления заказа и оплаты.</li>
      <li>Сроки и формат доступа к эфирам и записям.</li>
      <li>Условия возврата и переноса участия.</li>
      <li>Ответственность сторон и реквизиты.</li>
    </ol>`],
  contacts: ['Контакты', `
    <p class="doc-note">В демо контакты не указаны: реальные телефон, email и реквизиты академия добавит при запуске.</p>
    <h2>Что будет на странице</h2>
    <ol class="doc-list">
      <li>Телефон и email отдела обучения.</li>
      <li>Мессенджеры для быстрых вопросов.</li>
      <li>Реквизиты организации.</li>
      <li>Форма вопроса с согласием на обработку данных.</li>
    </ol>`],
};

function renderDoc(kind) {
  const [title, body] = DOCS[kind];
  return {
    title, nav: '',
    html: `<section class="page-head"><div class="wrap">${crumbs([['#/', 'Главная'], ['', title]])}<h1>${title}</h1></div></section>
      <div class="wrap doc">${body}<p><a class="link-arrow" href="#/">На главную${ico('arrow')}</a></p></div><div class="section-gap"></div>`,
  };
}

function renderNotFound() {
  return {
    title: 'Страница не найдена', nav: '',
    html: `<section class="page-head"><div class="wrap"><h1>Страница не найдена</h1><p class="page-head__lead">Возможно, ссылка устарела. Начните с каталога или главной.</p>
      <div class="hero__cta"><a class="btn btn--primary" href="#/catalog">Каталог</a><a class="btn btn--ghost" href="#/">На главную</a></div></div></section><div class="section-gap"></div>`,
  };
}
