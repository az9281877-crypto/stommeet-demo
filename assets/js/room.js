// Вебинарная комната и просмотр урока. Видео имитируется: вместо потока — слайды по главам программы.

function mountPlayer(root, opt) {
  const p = opt.program, t = teacherOf(p), live = opt.mode === 'live', rec = opt.mode === 'recording';
  const st = { pos: live ? (Date.now() - opt.startAt) / 1000 : 0, playing: live, muted: false, speed: 1, chapter: -1 };

  root.innerHTML = `
  <div class="player player--${opt.mode}">
    <div class="player__screen">
      <img class="player__poster" src="assets/img/${opt.poster || 'crown-handpiece'}.jpg" alt="">
      <div class="player__slide" aria-hidden="true">
        <div class="slide theme-light">
          <div class="slide__text">
            <p class="slide__n" data-sn></p>
            <p class="slide__title" data-st></p>
            <p class="slide__next" data-sx></p>
            <p class="slide__who">${t.name} · STOMMEET</p>
          </div>
          <div class="slide__art">${cover(p)}</div>
        </div>
      </div>
      <div class="player__pip" aria-hidden="true">${mono(t)}<span>Камера лектора</span><span class="eq"><i></i><i></i><i></i></span></div>
      ${live ? '<span class="player__badge"><i></i>В эфире</span>' : ''}
      ${opt.mode === 'before' ? `<div class="player__before">
          <p class="player__before-label">Эфир начнётся через</p>
          <p class="player__count" data-count>${fmtCountdown(opt.startAt - Date.now())}</p>
          <p class="player__before-sub">${fmtDate(new Date(opt.startAt))}, ${fmtTime(new Date(opt.startAt))} МСК</p>
          ${opt.cta || ''}
        </div>` : `<button class="player__big" type="button" data-act="play" aria-label="Воспроизвести">${ico('play')}</button>`}
    </div>
    ${opt.mode === 'before' ? '' : `<div class="player__controls">
      <button class="pbtn" type="button" data-act="play"></button>
      <button class="pbtn" type="button" data-act="mute" aria-label="Выключить звук">${ico('sound')}</button>
      <span class="player__time" data-time></span>
      <div class="player__bar${rec ? '' : ' player__bar--live'}" data-bar role="slider" tabindex="${rec ? 0 : -1}" aria-label="Позиция воспроизведения" aria-valuemin="0" aria-valuemax="${Math.round(opt.total)}"${rec ? '' : ' aria-disabled="true"'}>
        <span class="player__fill" data-fill></span>
        ${opt.chapters.map(([s]) => s ? `<span class="player__tick" style="left:${f2(s / opt.total * 100)}%"></span>` : '').join('')}
        <span class="player__thumb" data-thumb></span>
      </div>
      ${rec ? '<button class="pbtn pbtn--text" type="button" data-act="speed" aria-label="Скорость воспроизведения: 1×">1×</button>' : '<span class="player__live">LIVE</span>'}
      <button class="pbtn" type="button" data-act="full" aria-label="Во весь экран">${ico('full')}</button>
    </div>`}
  </div>`;

  const el = $('.player', root), q = s => $(s, el);

  function paint() {
    if (opt.mode === 'before') {
      const left = opt.startAt - Date.now();
      q('[data-count]').textContent = left > 0 ? fmtCountdown(left) : 'начинается';
      return;
    }
    st.pos = Math.min(Math.max(st.pos, 0), opt.total);
    const pct = st.pos / opt.total * 100;
    q('[data-fill]').style.width = pct + '%';
    q('[data-thumb]').style.left = pct + '%';
    q('[data-time]').textContent = rec ? `${fmtClock(st.pos)} / ${fmtClock(opt.total)}` : fmtClock(st.pos);
    const bar = q('[data-bar]');
    bar.setAttribute('aria-valuenow', Math.round(st.pos));
    bar.setAttribute('aria-valuetext', fmtClock(st.pos));
    const pb = q('.player__controls [data-act="play"]');
    pb.innerHTML = ico(st.playing ? 'pause' : 'play');
    pb.setAttribute('aria-label', st.playing ? 'Пауза' : 'Воспроизвести');
    el.classList.toggle('is-playing', st.playing);
    let ch = 0;
    opt.chapters.forEach(([s], i) => { if (st.pos >= s) ch = i; });
    if (ch !== st.chapter) {
      st.chapter = ch;
      q('[data-sn]').textContent = `Часть ${ch + 1} из ${opt.chapters.length}`;
      q('[data-st]').textContent = opt.chapters[ch][1];
      q('[data-sx]').textContent = opt.chapters[ch + 1] ? 'Далее: ' + opt.chapters[ch + 1][1] : 'Завершающая часть';
      if (opt.onChapter) opt.onChapter(ch);
    }
  }

  const timer = setInterval(() => {
    if (st.playing) {
      if (live) st.pos = (Date.now() - opt.startAt) / 1000;
      else st.pos += 0.25 * st.speed;
      if (rec && st.pos >= opt.total) st.playing = false;
    }
    paint();
  }, 250);

  const seekTo = x => {
    const r = q('[data-bar]').getBoundingClientRect();
    st.pos = (x - r.left) / r.width * opt.total;
    paint();
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'play') {
      st.playing = !st.playing;
      if (live && st.playing) st.pos = (Date.now() - opt.startAt) / 1000;
    } else if (act === 'mute') {
      st.muted = !st.muted;
      b.innerHTML = ico(st.muted ? 'mute' : 'sound');
      b.setAttribute('aria-label', st.muted ? 'Включить звук' : 'Выключить звук');
    } else if (act === 'speed') {
      st.speed = st.speed === 1 ? 1.5 : st.speed === 1.5 ? 2 : 1;
      b.textContent = String(st.speed).replace('.', ',') + '×';
      b.setAttribute('aria-label', 'Скорость воспроизведения: ' + b.textContent);
    } else if (act === 'full') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Браузер не разрешил полноэкранный режим'));
      else toast('Полноэкранный режим не поддерживается этим браузером');
    }
    paint();
  });
  if (rec) {
    const bar = q('[data-bar]');
    bar.addEventListener('pointerdown', e => {
      seekTo(e.clientX);
      bar.setPointerCapture(e.pointerId);
      const move = ev => seekTo(ev.clientX);
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', () => bar.removeEventListener('pointermove', move), { once: true });
    });
    bar.addEventListener('keydown', e => {
      const step = { ArrowLeft: -10, ArrowRight: 10, PageDown: -60, PageUp: 60 }[e.key];
      if (step) st.pos += step;
      else if (e.key === 'Home') st.pos = 0;
      else if (e.key === 'End') st.pos = opt.total;
      else return;
      e.preventDefault();
      paint();
    });
  }
  paint();

  return {
    seek(sec) { st.pos = sec; st.playing = true; paint(); },
    destroy() { clearInterval(timer); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); },
  };
}

// ---------- Комната эфира ----------
const ROOM_MODES = [['before', 'До начала'], ['live', 'Прямой эфир'], ['recording', 'Запись']];

function renderRoom(id, query) {
  const p = byId(id);
  if (!p || !p.agenda) return renderNotFound();
  const t = teacherOf(p), d = dirOf(p.dir);
  const natural = p.liveNow ? 'live' : p.type === 'live' ? 'before' : 'recording';
  const total = p.minutes * 60, chapters = p.agenda.map(([m, title]) => [m * 60, title]);
  const realStart = +startOf(p);

  const html = `
  <div class="room">
    <div class="room__wrap">
      <div class="room__top">
        <a class="room__back" href="#/webinars">${ico('back')}Все вебинары</a>
        <div class="room__state">
          <span class="room__state-label">Демо-состояние комнаты</span>
          <div class="seg seg--dark" role="group" aria-label="Состояние комнаты">
            ${ROOM_MODES.map(([k, label]) => `<button type="button" data-mode="${k}">${label}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="room__grid">
        <div class="room__main">
          <div data-player></div>
          <p class="room__notice"><strong>Трансляция не подключена.</strong> Это интерактивный прототип: видео заменено слайдами программы, сообщения участников — демонстрационные. В рабочей версии здесь будет плеер Kinescope или Zoom.</p>
          <div class="room__head">
            <p class="room__kicker">${d.name} · <span data-kind></span></p>
            <h1>${esc(p.title)}</h1>
            <a class="who who--dark" href="#/teachers/${t.id}">${mono(t)}<span>${t.name}, ${t.spec.toLowerCase()} · пример профиля</span></a>
          </div>
          <section class="room__agenda" aria-labelledby="agenda-h">
            <h2 id="agenda-h">Программа эфира</h2>
            <ol data-agenda></ol>
          </section>
        </div>
        <aside class="room__side" aria-label="Вопросы и чат">
          <div class="room__tabs" role="tablist">
            <button type="button" role="tab" data-side="questions">Вопросы лектору <span data-qn></span></button>
            <button type="button" role="tab" data-side="chat">Чат</button>
          </div>
          <div class="room__feed" data-feed aria-live="polite"></div>
          <form class="room__form" data-form novalidate>
            <label class="sr" for="room-input">Сообщение</label>
            <textarea id="room-input" rows="2" maxlength="500"></textarea>
            <button class="btn btn--primary btn--sm" type="submit">${ico('send')}Отправить</button>
          </form>
        </aside>
      </div>
    </div>
  </div>`;

  return {
    html, title: p.title, nav: 'webinars', page: 'room',
    after(main) {
      let mode = ROOM_MODES.some(([k]) => k === query.state) ? query.state : natural;
      let side = 'questions', player = null, script = null;
      const isWear = p.id === 'live-wear';
      const baseQ = (isWear ? CHAT_SEED.filter(m => m.q) : [{ who: 'Анна, Екатеринбург', text: 'Будет ли доступна презентация после эфира?', q: true, votes: 6 }])
        .map((m, i) => ({ ...m, answerAt: chapters[chapters.length - 1][0] + 120 + i * 260 }));
      const voted = new Set();
      let chat = [], scriptIdx = 0;
      const mineQ = () => (state.questions[p.id] || []);

      const feed = $('[data-feed]', main), form = $('[data-form]', main), input = $('#room-input', main);

      function startAtFor(m) {
        if (m === 'before') return natural === 'before' ? realStart : Date.now() + (14 * 60 + 32) * 1000;
        if (m === 'live') return p.liveNow ? realStart : Date.now() - 18 * 60e3;
        return 0;
      }

      function paintAgenda(cur = -1) {
        $('[data-agenda]', main).innerHTML = chapters.map(([s, title], i) => {
          const time = mode === 'recording' ? fmtClock(s) : fmtTime(new Date(startAtFor(mode) + s * 1000));
          const inner = `<span class="agenda__t">${time}</span><span>${title}</span>${i === cur && mode === 'live' ? '<span class="agenda__now">сейчас</span>' : ''}`;
          return `<li class="${i === cur ? 'is-cur' : ''}">${mode === 'recording' ? `<button type="button" data-ch="${i}">${inner}</button>` : `<div>${inner}</div>`}</li>`;
        }).join('');
      }

      function paintFeed() {
        $$('[data-side]', main).forEach(b => b.setAttribute('aria-selected', b.dataset.side === side));
        const qs = baseQ.map((m, i) => ({ ...m, key: 'b' + i })).concat(mineQ().map((m, i) => ({ ...m, key: 'm' + i, mine: true })))
          .map(m => ({ ...m, v: (m.votes || 0) + (voted.has(m.key) ? 1 : 0) })).sort((a, b) => b.v - a.v);
        $('[data-qn]', main).textContent = qs.length;
        if (side === 'questions') {
          feed.innerHTML = (mode === 'before' ? '<p class="feed-note">Вопросы можно задать заранее — лектор ответит в эфире.</p>' : '')
            + `<ul class="feed">${qs.map(m => `<li class="msg msg--q${m.mine ? ' msg--mine' : ''}">
              <p class="msg__who">${esc(m.who)}${m.mine ? ' · вы' : ''}</p>
              <p class="msg__text">${esc(m.text)}</p>
              <div class="msg__foot">
                <button class="vote" type="button" data-vote="${m.key}" aria-pressed="${voted.has(m.key)}" aria-label="Поддержать вопрос, сейчас ${m.v}">${ico('up')}${m.v}</button>
                ${mode === 'recording' && m.answerAt ? `<button class="link-btn link-btn--light" type="button" data-seek="${m.answerAt}">Ответ в записи · ${fmtClock(m.answerAt)}</button>` : ''}
              </div></li>`).join('')}</ul>`;
          input.placeholder = mode === 'recording' ? 'Вопрос к записи — лектор ответит в комментариях' : 'Ваш вопрос лектору';
          form.hidden = false;
        } else if (mode === 'before') {
          feed.innerHTML = '<p class="feed-note">Чат откроется в начале эфира. Пока можно задать вопрос лектору во вкладке «Вопросы».</p>';
          form.hidden = true;
        } else {
          const seed = isWear ? CHAT_SEED.filter(m => !m.q) : [{ who: 'Модератор', text: 'Добрый вечер! Вопросы лектору оставляйте во вкладке «Вопросы».', modMsg: true }];
          const msgs = seed.flatMap(m => m.mod ? [m, { who: 'Модератор', text: m.mod, modMsg: true }] : [m]).concat(chat);
          feed.innerHTML = (mode === 'recording' ? '<p class="feed-note">Архив чата эфира.</p>' : '')
            + `<ul class="feed">${msgs.map(m => `<li class="msg${m.modMsg ? ' msg--mod' : ''}${m.mine ? ' msg--mine' : ''}"><p class="msg__who">${esc(m.who)}</p><p class="msg__text">${esc(m.text)}</p></li>`).join('')}</ul>`;
          form.hidden = mode === 'recording';
          input.placeholder = 'Сообщение в чат';
          feed.scrollTop = feed.scrollHeight;
        }
      }

      function setMode(m) {
        mode = m;
        $$('[data-mode]', main).forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
        $('[data-kind]', main).textContent = { before: 'эфир скоро', live: 'прямой эфир', recording: 'запись эфира' }[m];
        if (player) player.destroy();
        clearInterval(script);
        const cta = isEnrolled(p.id) ? `<p class="player__ok">${ico('check')}Вы записаны. В рабочей версии напомним о начале на email.</p>`
          : `<button class="btn btn--primary btn--lg" type="button" data-enroll="${p.id}" data-inline>Записаться на эфир</button>`;
        player = mountPlayer($('[data-player]', main), { program: p, mode: m, chapters, total, startAt: startAtFor(m), cta, onChapter: paintAgenda });
        if (m === 'before') paintAgenda(-1);
        if (m === 'before' && side === 'chat') side = 'questions';
        paintFeed();
        if (m === 'live' && isWear) script = setInterval(() => {
          if (scriptIdx >= CHAT_SCRIPT.length) return clearInterval(script);
          const msg = CHAT_SCRIPT[scriptIdx++];
          if (msg.q) baseQ.push({ ...msg, answerAt: 0 }); else chat.push(msg);
          paintFeed();
        }, 9000);
        setQuery('/room/' + p.id, { state: m === natural ? '' : m });
      }

      main.addEventListener('click', e => {
        const mb = e.target.closest('[data-mode]');
        if (mb) return setMode(mb.dataset.mode);
        const sb = e.target.closest('[data-side]');
        if (sb) { side = sb.dataset.side; return paintFeed(); }
        const vb = e.target.closest('[data-vote]');
        if (vb) { const k = vb.dataset.vote; voted.has(k) ? voted.delete(k) : voted.add(k); return paintFeed(); }
        const sk = e.target.closest('[data-seek]');
        if (sk) { player.seek(+sk.dataset.seek); return $('[data-player]', main).scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        const ch = e.target.closest('[data-ch]');
        if (ch) player.seek(chapters[+ch.dataset.ch][0]);
      });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) { input.focus(); return; }
        const who = state.profile.name || 'Вы';
        if (side === 'questions') {
          state.questions[p.id] = mineQ().concat({ who, text, votes: 0, at: Date.now() });
          saveState();
          toast('Вопрос отправлен лектору');
        } else chat.push({ who, text, mine: true });
        input.value = '';
        paintFeed();
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
      });

      setMode(mode);
      return () => { if (player) player.destroy(); clearInterval(script); };
    },
  };
}

// ---------- Урок в кабинете ----------
function renderLearn(id, n) {
  const p = byId(id);
  if (!p || !p.program) return renderNotFound();
  const len = p.program.length;
  n = Math.min(Math.max(1, n), len);
  const [title, dur, items] = p.program[n - 1];
  const total = toMinutes(dur) * 60;
  const chapters = items.map((x, i) => [Math.round(total * i / items.length), x]);
  const done = new Set(doneLessons(p.id));

  const html = `
  <section class="page-head page-head--slim">
    <div class="wrap">${crumbs([['#/cabinet', 'Личный кабинет'], ['#/cabinet', 'Мои курсы'], ['', esc(p.title.split(':')[0])]])}</div>
  </section>
  <div class="wrap learn">
    <div class="learn__main">
      <div data-player></div>
      <p class="room__notice room__notice--light"><strong>Демо:</strong> видео урока заменено слайдами. В рабочей версии здесь будет защищённый плеер с записью занятия.</p>
      ${isEnrolled(p.id) ? '' : '<p class="feed-note feed-note--light">Вы не записаны на эту программу. В демо урок открыт для просмотра.</p>'}
      <p class="eyebrow">Урок ${n} из ${len} · ${dur}</p>
      <h1 class="learn__title">${title}</h1>
      <h2 class="learn__sub">Темы урока</h2>
      <ol class="learn__chapters">${chapters.map(([s, x], i) => `<li><button type="button" data-ch="${i}"><span class="agenda__t">${fmtClock(s)}</span><span>${x}</span></button></li>`).join('')}</ol>
      <p class="muted">Материалы урока — презентация и протоколы — появятся в рабочей версии платформы.</p>
      <div class="learn__actions">
        <button class="btn ${done.has(n - 1) ? 'btn--ghost' : 'btn--primary'}" type="button" data-done aria-pressed="${done.has(n - 1)}">${done.has(n - 1) ? ico('check') + 'Урок пройден' : 'Отметить урок пройденным'}</button>
        ${n < len ? `<a class="btn btn--ghost" href="#/learn/${p.id}/${n + 1}">Следующий урок${ico('arrow')}</a>` : '<a class="btn btn--ghost" href="#/cabinet">Вернуться в кабинет</a>'}
      </div>
    </div>
    <aside class="learn__side">
      <p class="card__dir">${typeLabel(p)} · ${dirOf(p.dir).name}</p>
      <h2><a href="#/course/${p.id}">${esc(p.title)}</a></h2>
      <div class="cab-item__progress">${probe(done.size, len)}<span>${done.size} из ${len}</span></div>
      <ol class="learn__lessons">${p.program.map(([lt, ld], i) => `<li class="${i + 1 === n ? 'is-cur' : ''}${done.has(i) ? ' is-done' : ''}">
        <a href="#/learn/${p.id}/${i + 1}"${i + 1 === n ? ' aria-current="page"' : ''}><span class="learn__mark">${done.has(i) ? ico('check') : String(i + 1).padStart(2, '0')}</span><span>${lt}<small>${ld}${done.has(i) ? ' · пройден' : ''}</small></span></a>
      </li>`).join('')}</ol>
    </aside>
  </div>
  <div class="section-gap"></div>`;

  return {
    html, title: title + ' — урок', nav: 'cabinet',
    after(main) {
      const player = mountPlayer($('[data-player]', main), { program: p, mode: 'recording', chapters, total, poster: 'tooth-model' });
      main.addEventListener('click', e => {
        const ch = e.target.closest('[data-ch]');
        if (ch) player.seek(chapters[+ch.dataset.ch][0]);
        if (e.target.closest('[data-done]')) {
          const set = new Set(doneLessons(p.id));
          set.has(n - 1) ? set.delete(n - 1) : set.add(n - 1);
          state.progress[p.id] = [...set].sort((a, b) => a - b);
          saveState();
          toast(set.has(n - 1) ? 'Урок отмечен как пройденный' : 'Отметка снята');
          const y = window.scrollY;
          route();
          window.scrollTo(0, y);
        }
      });
      return () => player.destroy();
    },
  };
}
