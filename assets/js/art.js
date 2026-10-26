// Клинические диаграммы для героя и обложек: окклюзионные контакты, имплантаты, каналы, шкала цвета.
// Обложки рисуются кодом, поэтому не повторяются и не зависят от стоковых фото.

function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f2 = n => Math.round(n * 100) / 100;
const pathOf = (pts, close = true) => 'M' + pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join('L') + (close ? 'Z' : '');
let artUid = 0;

function place(pts, cx, cy, a, s = 1) {
  const c = Math.cos(a), si = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x * c - y * si) * s, cy + (x * si + y * c) * s]);
}

// Пятно от артикуляционной бумаги: неровный эллипс.
function blob(x, y, rx, ry, rot, r) {
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2, k = 0.8 + r() * 0.4;
    pts.push([Math.cos(t) * rx * k, Math.sin(t) * ry * k]);
  }
  const P = place(pts, x, y, rot);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = 'M' + mid(P[n - 1], P[0]).map(f2).join(' ');
  for (let i = 0; i < n; i++) {
    const m = mid(P[i], P[(i + 1) % n]);
    d += 'Q' + f2(P[i][0]) + ' ' + f2(P[i][1]) + ' ' + f2(m[0]) + ' ' + f2(m[1]);
  }
  return d + 'Z';
}

// Зубы верхней челюсти в окклюзионной проекции, мм: ширина, глубина, «квадратность», сужение к нёбу, тип.
const TEETH = {
  1: [8.6, 7.0, 2.3, 0.5, 'inc'], 2: [6.6, 6.2, 2.2, 0.5, 'inc'], 3: [7.6, 8.0, 2.0, 0.35, 'can'],
  4: [7.0, 9.2, 2.4, 0.15, 'pre'], 5: [6.6, 9.0, 2.4, 0.12, 'pre'], 6: [10.2, 11.0, 3.2, 0.12, 'mol'], 7: [9.2, 10.6, 3.0, 0.18, 'mol'],
};

// Контур: x — вдоль зубного ряда, +y — к нёбу.
function toothShape(w, d, n, taper) {
  const pts = [];
  for (let i = 0; i < 48; i++) {
    const t = i / 48 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * d / 2;
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w / 2 * (1 - taper * y / d);
    pts.push([x, y]);
  }
  return pts;
}

function fissures(kind, w, d) {
  if (kind === 'mol') return [
    [[-0.32 * w, 0.04 * d], [-0.08 * w, -0.06 * d], [0.3 * w, 0.02 * d]],
    [[0.02 * w, -0.04 * d], [0.07 * w, -0.36 * d]],
    [[-0.12 * w, 0], [-0.17 * w, 0.36 * d]],
  ];
  if (kind === 'pre') return [[[-0.3 * w, 0.03 * d], [0, -0.03 * d], [0.3 * w, 0.03 * d]]];
  if (kind === 'can') return [[[0, -0.3 * d], [0, 0.22 * d]]];
  return [[[-0.34 * w, -0.2 * d], [0.34 * w, -0.2 * d]]];
}

const SPOTS = {
  mol: [[-0.22, 0.2], [0.2, 0.22], [-0.2, -0.2], [0.22, -0.2], [0, 0]],
  pre: [[0, 0.2], [0, -0.18]], can: [[0, 0]], inc: [[0, 0.22]],
};
const SPOT_P = { mol: 0.62, pre: 0.6, can: 0.45, inc: 0.4 };

// Синие — центральная окклюзия, красные — боковые движения (двухцветная регистрация).
function contactMarks(kind, w, d, r) {
  const out = [];
  for (const [sx, sy] of SPOTS[kind]) {
    if (r() > SPOT_P[kind]) continue;
    const rx = (kind === 'mol' ? 1.05 : 0.8) + r() * 0.55, ry = rx * (0.55 + r() * 0.3), rot = r() * Math.PI;
    const x = sx * w + (r() - 0.5) * 0.8, y = sy * d + (r() - 0.5) * 0.8;
    out.push(['blue', x, y, rx, ry, rot]);
    if (r() < 0.5) out.push(['red', x + (r() - 0.5) * rx * 0.7, y + (r() - 0.5) * ry * 0.7, rx * (0.4 + r() * 0.2), ry * (0.45 + r() * 0.2), rot + 0.5]);
  }
  return out;
}

// Один зуб в окклюзионной проекции. Возвращает разметку и метки.
function occlusalTooth(k, cx, cy, a, s, r, opt, counter) {
  const [w, d, n, taper, kind] = TEETH[k];
  // Контур чуть шире шага, чтобы скруглённые зубы смыкались в контактных пунктах.
  let out = `<path class="a-out" d="${pathOf(place(toothShape(w * 1.07, d, n, taper), cx, cy, a, s))}"/>`;
  for (const f of fissures(kind, w, d)) out += `<path class="a-fis" d="${pathOf(place(f, cx, cy, a, s), false)}"/>`;
  if (opt.brackets) {
    const b = place([[-1.4, -d / 2 + 0.3], [1.4, -d / 2 + 0.3], [1.4, -d / 2 + 2.3], [-1.4, -d / 2 + 2.3]], cx, cy, a, s);
    out += `<path class="a-bracket" d="${pathOf(b)}"/>`;
  }
  if (opt.marks) {
    for (const [c, x, y, rx, ry, rot] of contactMarks(kind, w, d, r)) {
      const [P] = place([[x, y]], cx, cy, a, s);
      out += `<g class="mk" style="--i:${counter.i++}"><path class="a-${c}" d="${blob(P[0], P[1], rx * s, ry * s, rot + a, r)}"/></g>`;
    }
  }
  return out;
}

// Расстановка зубов по дуге (правая половина изображения = 2-й квадрант).
function archLayout() {
  const A = 28, B = 40, q = 2.3, gap = 0, N = 600;
  const pts = [], len = [0];
  for (let i = 0; i <= N; i++) {
    const u = i / N * 1.5;
    pts.push([A * u, B * Math.pow(u, q)]);
    if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const at = sl => {
    let i = len.findIndex(l => l >= sl);
    if (i < 1) i = 1;
    const k = (sl - len[i - 1]) / (len[i] - len[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
      Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])];
  };
  const out = [];
  let sl = gap / 2;
  for (let k = 1; k <= 7; k++) {
    const w = TEETH[k][0];
    const [x, y, a] = at(sl + w / 2);
    out.push({ k, x, y, a });
    sl += w + gap;
  }
  return out;
}

// Верхняя зубная дуга. Левая половина — зеркальная копия правой с другими метками.
function archInner({ seed = 1, numbers = true, marks = true, brackets = false } = {}) {
  const T = archLayout(), counter = { i: 0 };
  const half = r => {
    let s = '';
    for (const t of T) s += occlusalTooth(t.k, t.x, t.y, t.a, 1, r, { marks, brackets }, counter);
    if (brackets) {
      const wire = [[0, T[0].y - TEETH[1][1] / 2 + 1.3]].concat(T.map(t => place([[0, -TEETH[t.k][1] / 2 + 1.3]], t.x, t.y, t.a)[0]));
      s = `<path class="a-wire" d="${pathOf(wire, false)}"/>` + s;
    }
    return s;
  };
  let body = `<g>${half(rng(seed))}</g><g transform="scale(-1 1)">${half(rng(seed + 101))}</g>`;
  if (numbers) {
    for (const t of T) {
      const [P] = place([[0, -(TEETH[t.k][1] / 2 + 3.6)]], t.x, t.y, t.a);
      body += `<text class="a-num" x="${f2(P[0])}" y="${f2(P[1])}">${20 + t.k}</text><text class="a-num" x="${f2(-P[0])}" y="${f2(P[1])}">${10 + t.k}</text>`;
    }
  }
  const last = T[6], pad = numbers ? 10 : 7;
  const W = last.x + pad, H = last.y + pad;
  return { body, vb: `${f2(-W)} ${-pad} ${f2(W * 2)} ${f2(H + pad)}` };
}

function archSVG(opt = {}) {
  const { body, vb } = archInner(opt);
  return `<svg class="art art--arch${opt.anim ? ' art--anim' : ''}" viewBox="${vb}" role="img" aria-label="Схема верхней зубной дуги с окклюзионными контактами">${body}</svg>`;
}

// ---------- Обложки 160×100 ----------

function dotGrid() {
  let s = '';
  for (let x = 8; x < 160; x += 12) for (let y = 8; y < 100; y += 12) s += `<circle class="a-grid" cx="${x}" cy="${y}" r=".55"/>`;
  return s;
}

function scaleBar(x, y, len, label) {
  return `<path class="a-tick" d="M${x} ${y}h${len}M${x} ${y - 2}v4M${x + len} ${y - 2}v4M${x + len / 2} ${y - 1.2}v2.4"/><text class="a-cap" x="${x + len + 3}" y="${y + 0.2}">${label}</text>`;
}

function rowMolars(r) {
  const quad = r() < 0.5 ? 1 : 2, ks = [4, 5, 6, 7], s = 3.1, counter = { i: 0 };
  const total = ks.reduce((a, k) => a + TEETH[k][0] + 0.4, 0) * s;
  let x = 80 - total / 2, out = '';
  const order = quad === 2 ? ks : ks.slice().reverse();
  order.forEach((k, i) => {
    const w = TEETH[k][0] * s, cx = x + w / 2 + 0.2 * s, cy = 56 + Math.pow(i - 1.5, 2) * 2.2;
    const a = (i - 1.5) * 0.06 * (quad === 2 ? 1 : -1);
    out += occlusalTooth(k, cx, cy, a, s, r, { marks: true }, counter);
    out += `<text class="a-num a-num--cv" x="${f2(cx)}" y="${f2(cy - TEETH[k][1] * s / 2 - 6)}">${quad * 10 + k}</text>`;
    x += w + 0.4 * s;
  });
  return out;
}

// Граница препарирования: накладка (часть бугров) или вкладка (центральная полость).
function onlay(r) {
  const k = r() < 0.5 ? 6 : 7, inlay = r() < 0.5, a = (r() - 0.5) * 0.5;
  const s = 6.2, cx = 84, cy = 52, [w, d, n, taper] = TEETH[k], counter = { i: 0 };
  let out = occlusalTooth(k, cx, cy, a, s, r, { marks: true }, counter);
  const inner = inlay ? toothShape(w * 0.72, d * 0.3, 3.4, 0) : toothShape(w * 0.6, d * 0.78, 3, 0.1).map(([x, y]) => [x + w * 0.14, y]);
  out += `<path class="a-prep" d="${pathOf(place(inner, cx, cy, a, s))}"/>`;
  out += `<text class="a-num a-num--cv" x="${cx - 44}" y="20">${(r() < 0.5 ? 10 : 20) + k}</text>`;
  return out + scaleBar(10, 90, 5 * s, '5 мм');
}

// Сетка скана внутри контура зуба (триангуляция по узлам решётки).
function meshInside(k, cx, cy, a, s, r) {
  const [w, d, n, taper] = TEETH[k], step = 0.95, nodes = {};
  const inside = (x, y) => Math.pow(Math.abs(x / (w / 2 * (1 - taper * y / d))), n) + Math.pow(Math.abs(y / (d / 2)), n) <= 0.97;
  for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
    const x = i * step + (r() - 0.5) * 0.35, y = j * step + (r() - 0.5) * 0.35;
    if (inside(x, y)) nodes[i + ',' + j] = place([[x, y]], cx, cy, a, s)[0];
  }
  let lines = '', dots = '';
  for (const key in nodes) {
    const [i, j] = key.split(',').map(Number), p = nodes[key];
    for (const nb of [[i + 1, j], [i, j + 1], [i + 1, j + 1]]) {
      const q = nodes[nb.join(',')];
      if (q) lines += `M${f2(p[0])} ${f2(p[1])}L${f2(q[0])} ${f2(q[1])}`;
    }
    dots += `<circle class="a-pt" cx="${f2(p[0])}" cy="${f2(p[1])}" r=".55"/>`;
  }
  return `<path class="a-mesh" d="${lines}"/>${dots}`;
}

// Внутриротовое сканирование: часть зубов уже в сетке, остальные ждут прохода сканера.
function scanRow(r) {
  const quad = r() < 0.5 ? 1 : 2, ks = r() < 0.5 ? [4, 5, 6] : [5, 6, 7], s = 4.3, done = 1 + Math.floor(r() * 2);
  const order = quad === 2 ? ks : ks.slice().reverse();
  const total = order.reduce((a, k) => a + TEETH[k][0] + 0.3, 0) * s;
  let x = 80 - total / 2, out = '', cut = 0;
  order.forEach((k, i) => {
    const [w, d, n, taper] = TEETH[k], cx = x + w * s / 2, cy = 54 + (i - 1) * (quad === 2 ? 1.5 : -1.5), a = (i - 1) * 0.05;
    const scanned = quad === 2 ? i < done : i >= order.length - done;
    out += `<path class="a-out${scanned ? '' : ' a-ghost'}" d="${pathOf(place(toothShape(w * 1.04, d, n, taper), cx, cy, a, s))}"/>`;
    if (scanned) out += meshInside(k, cx, cy, a, s, r);
    out += `<text class="a-num a-num--cv" x="${f2(cx)}" y="${f2(cy - d * s / 2 - 6)}">${quad * 10 + k}</text>`;
    if (quad === 2 && i === done - 1) cut = x + w * s + 0.15 * s;
    if (quad === 1 && i === order.length - done - 1) cut = x + w * s + 0.15 * s;
    x += (w + 0.3) * s;
  });
  return out + `<path class="a-scan" d="M${f2(cut)} 6V94"/><path class="a-scan-edge" d="M${f2(cut)} 10V90"/>`;
}

const SHADES = [
  ['A1', '#E7D6B5', '#F3EBDC'], ['A2', '#E0C9A0', '#F0E4CE'], ['A3', '#D9BE8F', '#EDDEC3'], ['A3,5', '#CFB07F', '#E8D5B6'],
  ['B1', '#EBE1C4', '#F6F1E3'], ['B2', '#E4D4AA', '#F2E8D1'], ['C2', '#D0C5AC', '#E6E0CF'],
];
function shadeGuide(r) {
  const id = 'sg' + (++artUid), sel = Math.floor(r() * SHADES.length);
  let defs = '', out = '';
  SHADES.forEach(([name, c1, c2], i) => {
    const x = 13 + i * 19.5, gid = id + i;
    defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".72" stop-color="${c2}"/><stop offset="1" stop-color="#D3DAE0"/></linearGradient>`;
    out += `<rect class="a-handle" x="${x + 5}" y="8" width="5" height="14" rx="1"/>`;
    out += `<path class="a-tab${i === sel ? ' a-tab--sel' : ''}" fill="url(#${gid})" d="M${x} 24c0-1.2.8-2 2-2h11c1.2 0 2 .8 2 2l-1.4 42c-.3 8-3.4 12-6.1 12s-5.8-4-6.1-12z"/>`;
    out += `<text class="a-num a-num--cv" x="${x + 7.5}" y="90">${name}</text>`;
    if (i === sel) out += `<path class="a-red-line" d="M${x + 2} 4h11"/>`;
  });
  return `<defs>${defs}</defs>` + out;
}

// Боковая проекция моляра: коронка с буграми и два корня. Начало координат — шейка зуба.
function crownTop(w, h) {
  return `M${-w / 2} ${-h * 0.25}C${-w / 2} ${-h * 0.8} ${-w * 0.38} ${-h} ${-w * 0.22} ${-h}C${-w * 0.1} ${-h} ${-w * 0.06} ${-h * 0.86} 0 ${-h * 0.86}C${w * 0.06} ${-h * 0.86} ${w * 0.1} ${-h} ${w * 0.22} ${-h}C${w * 0.38} ${-h} ${w / 2} ${-h * 0.8} ${w / 2} ${-h * 0.25}`;
}
function crownSide(w, h) {
  return crownTop(w, h) + `C${w / 2} ${-h * 0.05} ${w * 0.44} 0 ${w * 0.36} ${h * 0.08}L${-w * 0.36} ${h * 0.08}C${-w * 0.44} 0 ${-w / 2} ${-h * 0.05} ${-w / 2} ${-h * 0.25}Z`;
}
function molarSide(w, h, R) {
  return crownTop(w, h)
    + `C${w / 2} ${-h * 0.05} ${w * 0.44} 0 ${w * 0.4} ${h * 0.05}Q${w * 0.42} ${R * 0.6} ${w * 0.26} ${R}Q${w * 0.15} ${R * 1.02} ${w * 0.13} ${R * 0.8}Q${w * 0.08} ${h * 0.4} 0 ${h * 0.38}`
    + `Q${-w * 0.08} ${h * 0.4} ${-w * 0.13} ${R * 0.8}Q${-w * 0.15} ${R * 1.02} ${-w * 0.26} ${R}Q${-w * 0.42} ${R * 0.6} ${-w * 0.4} ${h * 0.05}C${-w * 0.44} 0 ${-w / 2} ${-h * 0.05} ${-w / 2} ${-h * 0.25}Z`;
}

function bone(top, r, x0 = 0, x1 = 160) {
  let d = `M${x0} ${top(x0)}`;
  for (let x = x0 + 4; x <= x1; x += 4) d += `L${x} ${f2(top(x))}`;
  let s = `<path class="a-bone" d="${d}L${x1} 100L${x0} 100Z"/>`;
  for (let i = 0; i < 70; i++) {
    const x = x0 + r() * (x1 - x0), y = top(x) + 3 + r() * (100 - top(x));
    s += `<circle class="a-dot" cx="${f2(x)}" cy="${f2(y)}" r="${f2(0.5 + r() * 0.7)}"/>`;
  }
  return s;
}

function threads(x, y0, y1, w0, w1) {
  let d = '';
  for (let y = y0 + 2.5; y < y1 - 1.5; y += 3.2) {
    const w = (w0 + (w1 - w0) * (y - y0) / (y1 - y0)) / 2;
    d += `M${f2(x - w)} ${f2(y)}l-1.8 1.4l1.8 1.4M${f2(x + w)} ${f2(y)}l1.8 1.4l-1.8 1.4`;
  }
  return `<path class="a-thread" d="${d}"/>`;
}

function implantBody(x, top, apex, wTop, wApex, cls = 'a-metal') {
  return `<path class="${cls}" d="M${x - wTop / 2} ${top}L${x + wTop / 2} ${top}L${x + wApex / 2} ${apex - 3}Q${x} ${apex + 1.5} ${x - wApex / 2} ${apex - 3}Z"/>` + threads(x, top, apex, wTop, wApex);
}

// Имплантат в боковой проекции: с коронкой, с формирователем десны или под хирургическим шаблоном.
function implantScene(r, guide) {
  const healing = !guide && r() < 0.5, x = 80 + Math.round((r() - 0.5) * 14);
  const crest = c => 60 + Math.sin(c / 13) * 1.6;
  let out = bone(crest, r);
  out += `<path class="a-gum" d="M0 ${crest(0) - 5}C40 ${crest(40) - 7} 60 ${crest(60) - 4} 80 ${crest(80) - 6}C100 ${crest(100) - 8} 130 ${crest(130) - 4} 160 ${crest(160) - 6}L160 ${crest(160)}L0 ${crest(0)}Z"/>`;
  out += `<g transform="translate(16 53)"><path class="a-out" d="${molarSide(30, 30, 36)}"/></g>`;
  out += `<g transform="translate(144 53)"><path class="a-out" d="${molarSide(30, 30, 36)}"/></g>`;
  out += implantBody(x, 58, 93, 12, 8.5);
  if (guide) {
    out += `<path class="a-guide" d="M0 30H160V40H0Z"/><path class="a-metal" d="M${x - 6} 28h12v14h-12z"/>`;
  } else if (healing) {
    out += `<path class="a-metal" d="M${x - 6} 58V51Q${x - 6} 47.5 ${x - 3} 47.5H${x + 3}Q${x + 6} 47.5 ${x + 6} 51V58Z"/>`;
    out += `<path class="a-prep" d="M${x - 14} 53Q${x - 8} 52 ${x - 6} 48M${x + 14} 53Q${x + 8} 52 ${x + 6} 48"/>`;
  } else {
    out += `<path class="a-metal" d="M${x - 4.5} 46h9l1.5 12h-12z"/>`;
    out += `<g transform="translate(${x} 46)"><path class="a-out" d="${crownSide(28, 26)}"/></g>`;
    out += `<path class="a-blue" d="${blob(x - 7, 20.5, 2.6, 1.3, 0.2, r)}"/><path class="a-red" d="${blob(x + 8, 20.8, 1.6, 0.9, 0.4, r)}"/>`;
  }
  return out + `<path class="a-axis" d="M${x} 4V98"/>`;
}

function ridgePlan(r) {
  let out = `<path class="a-bone a-cortex" d="M42 100C42 66 56 34 80 31C104 34 118 66 118 100Z"/>`;
  for (let i = 0; i < 60; i++) {
    const y = 40 + r() * 58, half = 4 + (y - 31) * 0.55, x = 80 + (r() - 0.5) * 2 * Math.min(half, 36);
    out += `<circle class="a-dot" cx="${f2(x)}" cy="${f2(y)}" r="${f2(0.5 + r() * 0.6)}"/>`;
  }
  out += `<path class="a-gum" d="M36 100C36 60 54 26 80 24C106 26 124 60 124 100H118C118 66 104 34 80 31C56 34 42 66 42 100Z"/>`;
  out += `<g transform="rotate(-6 80 56)"><path class="a-plan" d="M74 36H86L84.5 73Q80 78 75.5 73Z"/></g>`;
  out += `<circle class="a-nerve" cx="86" cy="88" r="4.5"/>`;
  out += `<path class="a-tick" d="M132 31V83M129 31h6M129 83h6"/><text class="a-cap" x="137" y="58">12 мм</text>`;
  out += `<path class="a-tick" d="M50 60H110M50 57v6M110 57v6"/><text class="a-cap a-cap--end" x="46" y="60">8 мм</text>`;
  return out;
}

function impactedScene(r) {
  const crest = x => 44 + Math.sin(x / 18) * 1.4 + (x > 90 ? (x - 90) * 0.08 : 0);
  let out = bone(crest, r);
  out += `<path class="a-gum" d="M0 39C30 37 60 40 90 38C120 37 140 41 160 42L160 ${f2(crest(160))}C120 ${f2(crest(120))} 60 ${f2(crest(60))} 0 ${f2(crest(0))}Z"/>`;
  out += `<g transform="translate(44 44)"><path class="a-out" d="${molarSide(30, 27, 36)}"/></g>`;
  out += `<g transform="translate(104 62) rotate(-48)"><path class="a-out" d="${molarSide(27, 25, 30)}"/></g>`;
  out += `<path class="a-prep" d="M88 46C96 40 120 40 126 50C130 60 118 72 104 72C92 70 84 58 88 46Z"/>`;
  out += `<path class="a-nerve" d="M0 86C40 90 90 92 160 84M0 92C40 96 90 98 160 90"/>`;
  out += `<path class="a-incision" d="M96 37.6C108 37 122 38.6 136 40.4"/>`;
  return r() < 0.5 ? out : `<g transform="translate(160 0) scale(-1 1)">${out}</g>`;
}

function premolarSide(w, h, R) {
  return `M${-w / 2} ${-h * 0.3}C${-w / 2} ${-h * 0.75} ${-w * 0.22} ${-h} 0 ${-h}C${w * 0.22} ${-h} ${w / 2} ${-h * 0.75} ${w / 2} ${-h * 0.3}`
    + `C${w / 2} ${-h * 0.05} ${w * 0.42} 0 ${w * 0.36} ${h * 0.06}Q${w * 0.3} ${R * 0.6} ${w * 0.07} ${R}Q0 ${R * 1.04} ${-w * 0.07} ${R}Q${-w * 0.3} ${R * 0.6} ${-w * 0.36} ${h * 0.06}C${-w * 0.42} 0 ${-w / 2} ${-h * 0.05} ${-w / 2} ${-h * 0.3}Z`;
}

// Продольный срез: моляр с двумя каналами или премоляр с эндодонтическим файлом на рабочей длине.
function canalScene(r) {
  const pre = r() < 0.5, flip = r() < 0.5 ? -1 : 1;
  const sx = pre ? 72 : 80, sy = 46, w = pre ? 32 : 46, h = pre ? 28 : 30, R = pre ? 50 : 46, apex = R * 0.93;
  let g;
  if (pre) {
    g = `<path class="a-out" d="${premolarSide(w, h, R)}"/>`
      + `<path class="a-pulp" d="M${-w * 0.14} ${-h * 0.35}Q0 ${-h * 0.55} ${w * 0.14} ${-h * 0.35}L${w * 0.1} ${h * 0.15}Q0 ${h * 0.22} ${-w * 0.1} ${h * 0.15}Z"/>`
      + `<path class="a-canal" d="M0 ${h * 0.15}Q${w * 0.05} ${R * 0.55} 0 ${apex}"/>`
      + `<path class="a-file" d="M0 ${-h - 10}V${apex}"/><rect class="a-stop" x="-3.4" y="${-h - 3.5}" width="6.8" height="2.4" rx="1"/><rect class="a-handle" x="-3.5" y="${-h - 17}" width="7" height="7.5" rx="1.5"/>`
      + `<path class="a-red-line" d="M-3 ${apex}h6"/>`;
  } else {
    g = `<path class="a-out" d="${molarSide(w, h, R)}"/>`
      + `<path class="a-pulp" d="M${-w * 0.24} ${-h * 0.32}Q0 ${-h * 0.5} ${w * 0.24} ${-h * 0.32}L${w * 0.2} ${h * 0.1}Q0 ${h * 0.2} ${-w * 0.2} ${h * 0.1}Z"/>`
      + `<path class="a-canal" d="M${-w * 0.16} ${h * 0.1}Q${-w * 0.26} ${R * 0.5} ${-w * 0.25} ${apex}M${w * 0.16} ${h * 0.1}Q${w * 0.26} ${R * 0.5} ${w * 0.25} ${apex}"/>`
      + `<path class="a-red-line" d="M${-w * 0.25 - 3} ${apex}h6M${w * 0.25 - 3} ${apex}h6"/>`
      + `<path class="a-blue" d="${blob(-9, -h + 2.5, 2.4, 1.2, 0.1, r)}"/>`;
  }
  let out = `<g transform="translate(${sx} ${sy}) scale(${flip} 1)">${g}</g>`;
  const top = sy - h, bottom = sy + apex;
  let ticks = '';
  for (let y = top; y <= bottom + 0.1; y += (bottom - top) / 20) ticks += `M130 ${f2(y)}h${Math.abs((y - top) % ((bottom - top) / 4)) < 0.5 ? 5 : 2.5}`;
  return out + `<path class="a-tick" d="M130 ${f2(top)}V${f2(bottom)}${ticks}"/><text class="a-cap" x="137" y="${f2(bottom + 0.6)}">РД</text>`;
}

// Дуга во вложенном SVG; половина обложек показывает нижнюю челюсть (поворот на 180°).
function nestArch(a, flip) {
  const [x, y, w, h] = a.vb.split(' ').map(Number);
  const body = flip ? `<g transform="rotate(180 ${f2(x + w / 2)} ${f2(y + h / 2)})">${a.body}</g>` : a.body;
  return `<svg x="18" y="5" width="124" height="90" viewBox="${a.vb}">${body}</svg>`;
}

const COVER_ART = {
  molars: r => rowMolars(r),
  onlay: r => onlay(r),
  mesh: r => scanRow(r),
  shades: r => shadeGuide(r),
  implant: r => implantScene(r, false),
  guide: r => implantScene(r, true),
  plan: r => ridgePlan(r),
  impacted: r => impactedScene(r),
  canals: r => canalScene(r),
  arch: (r, seed) => nestArch(archInner({ seed, numbers: false }), r() < 0.5),
  brackets: (r, seed) => nestArch(archInner({ seed, numbers: false, marks: false, brackets: true }), r() < 0.5),
};

const ART_LABELS = {
  molars: 'Окклюзионные контакты на жевательных зубах', onlay: 'Граница препарирования под накладку', mesh: 'Цифровой скан зуба',
  shades: 'Шкала цвета', implant: 'Имплантат с коронкой', guide: 'Хирургический шаблон', plan: 'Планирование имплантата по КЛКТ',
  impacted: 'Ретинированный третий моляр', canals: 'Каналы и рабочая длина', arch: 'Зубная дуга с контактами', brackets: 'Брекеты и дуга',
};

function coverSVG(art, seed, dir, extraClass = '') {
  const r = rng(seed);
  return `<svg class="art art--cover cv--${dir} ${extraClass}" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${ART_LABELS[art]}"><rect class="cv-bg" width="160" height="100"/>${dotGrid()}${COVER_ART[art](r, seed)}</svg>`;
}
