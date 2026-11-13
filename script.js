/* Clock · vitrine de relógios
   1. Configuração da loja
   2. Página (navegação, entradas, corda, formulário, filme)
   3. Montagem 3D do relógio guiada pelo scroll (Three.js + GSAP ScrollTrigger) */

/* ---------- 1. Configuração da loja (edite aqui) ---------- */
const SITE = {
  whatsapp: '',            // número com DDI e DDD, só dígitos. Ex.: 5511999999999
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const ss = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const waLink = (text) => 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(text);

/* ---------- 2. Página ---------- */
function initPage() {
  document.documentElement.classList.add('js');
  // Links de WhatsApp
  $$('[data-wa]').forEach((a) => {
    a.href = waLink(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // Navegação: fundo ao rolar e menu no celular
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  let navSolid = false;
  const onNavScroll = () => {
    const solid = scrollY > 24;
    if (solid !== navSolid) { navSolid = solid; nav.classList.toggle('is-solid', solid); }
  };
  addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav__links a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Entradas em sequência
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  // Pausa geral em aba oculta
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
  });

  initNavGlide();
  initShop();
  initWind();
  initForm();
  initFilm();
}

/* Cabeçalho: destaque que desliza até o botão sob o mouse e repousa na página atual */
function initNavGlide() {
  const links = $('.nav__links');
  if (!links) return;
  const glide = document.createElement('span');
  glide.className = 'nav__glide';
  glide.setAttribute('aria-hidden', 'true');
  links.prepend(glide);
  const current = $('a[aria-current="page"]', links);
  let shown;
  const move = (a) => {
    if (a === shown) return;
    shown = a;
    if (!a || !a.offsetWidth) { links.classList.remove('has-glide'); return; }
    glide.style.width = a.offsetWidth + 'px';
    glide.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    links.classList.add('has-glide');
  };
  $$('a', links).forEach((a) => {
    a.addEventListener('pointerenter', () => move(a));
    a.addEventListener('focus', () => move(a));
  });
  links.addEventListener('pointerleave', () => move(current));
  links.addEventListener('focusout', (e) => { if (!links.contains(e.relatedTarget)) move(current); });
  const place = () => { const a = shown; shown = undefined; move(a); };
  addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);
  move(current);
  requestAnimationFrame(() => requestAnimationFrame(() => links.classList.add('is-ready')));
}

/* Vitrine: filtro por tipo de relógio */
function initShop() {
  const shop = $('.shop');
  if (!shop) return;
  const btns = $$('.filter__btn');
  const items = $$('.product', shop);
  const count = $('.shop__count');
  btns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    let n = 0;
    items.forEach((it) => {
      const on = f === 'todos' || it.dataset.cat === f;
      it.hidden = !on;
      if (on) n++;
    });
    if (count) count.textContent = n + (n === 1 ? ' relógio' : ' relógios');
  }));
}

/* Momento interativo: segure para dar corda */
function initWind() {
  const box = $('.wind');
  if (!box) return;
  const btn = $('.wind__btn', box);
  const arc = $('.wind__arc', box);
  const gear = $('.wind__gear', box);
  const label = $('.wind__label', box);
  const LEN = 302;
  let prog = 0, holding = false, done = false, raf = null, last = 0, shown = -1;

  const paint = () => {
    const v = Math.round(prog * 1000) / 1000;
    if (v === shown) return;
    shown = v;
    arc.style.strokeDashoffset = String(Math.round(LEN * (1 - v)));
    gear.style.transform = 'rotate(' + Math.round(v * 540) + 'deg)';
  };
  const finish = () => {
    done = true; prog = 1; paint();
    box.classList.add('is-wound');
    label.textContent = 'Corda cheia';
    btn.setAttribute('aria-pressed', 'true');
  };
  const tick = (now) => {
    const dt = Math.min(400, now - (last || now)); last = now;
    if (holding) prog = Math.min(1, prog + dt / 2200);
    else prog = Math.max(0, prog - dt / 900);
    paint();
    if (prog >= 1) { raf = null; last = 0; finish(); return; }
    if (!holding && prog <= 0) { raf = null; last = 0; return; }
    raf = requestAnimationFrame(tick);
  };
  const start = (e) => {
    if (done) return;
    if (RM.matches) { finish(); return; }
    if (e && e.pointerId !== undefined) btn.setPointerCapture(e.pointerId);
    holding = true; box.classList.add('is-holding');
    if (raf === null) raf = requestAnimationFrame(tick);
  };
  const stop = () => { holding = false; box.classList.remove('is-holding'); };

  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); }
  });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  btn.addEventListener('blur', stop);
}

/* Formulário: monta a mensagem e abre o WhatsApp da loja */
function initForm() {
  const form = $('.form');
  if (!form) return;
  const motivo = $('#f-motivo', form);
  const dataRow = $('.form__row--data', form);
  const syncData = () => dataRow.classList.toggle('is-on', motivo.value === 'visita');
  motivo.addEventListener('change', syncData);

  // vindo de outra página: ?produto=...&motivo=visita
  const q = new URLSearchParams(location.search);
  if (q.get('produto')) $('#f-produto', form).value = q.get('produto').slice(0, 80);
  if (['interesse', 'visita', 'duvida'].includes(q.get('motivo'))) motivo.value = q.get('motivo');
  syncData();

  $$('[data-produto]').forEach((b) => b.addEventListener('click', () => {
    $('#f-produto', form).value = b.dataset.produto;
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const motivos = {
      interesse: 'Tenho interesse em um relógio',
      visita: 'Quero agendar uma visita à loja',
      duvida: 'Tenho uma dúvida',
    };
    const linhas = [
      'Olá, Clock! Meu nome é ' + d.get('nome') + '.',
      motivos[d.get('motivo')] + '.',
    ];
    if (d.get('produto')) linhas.push('Relógio: ' + d.get('produto') + '.');
    if (d.get('motivo') === 'visita' && d.get('data')) {
      linhas.push('Dia de preferência: ' + String(d.get('data')).split('-').reverse().join('/') + '.');
    }
    if (d.get('mensagem')) linhas.push(String(d.get('mensagem')));
    window.open(waLink(linhas.join('\n')), '_blank', 'noopener');
    form.classList.add('is-sent');
    $('.form__done', form).focus();
  });
  $('.form__again', form).addEventListener('click', () => form.classList.remove('is-sent'));
}

/* Filme do mecanismo: só carrega e toca quando aparece na tela */
function initFilm() {
  const v = $('.film__video');
  if (!v) return;
  let loaded = false;
  const io = new IntersectionObserver(([e]) => {
    if (RM.matches) return;
    if (e.isIntersecting) {
      if (!loaded) { loaded = true; v.src = v.dataset.src; }
      v.play().catch(() => {});
    } else if (loaded) v.pause();
  }, { threshold: 0.25 });
  io.observe(v);
  v.addEventListener('error', () => v.classList.add('is-dead'));
  RM.addEventListener('change', () => { if (RM.matches) v.pause(); });
}

/* ---------- 3. Legendas da montagem ---------- */
const hero = $('#montagem');            // só existe na página inicial
const bands = hero ? $$('.band', hero).map((el, i, all) => ({
  el, a: +el.dataset.a, b: +el.dataset.b,
  first: i === 0, last: i === all.length - 1, op: -1, k: -1,
})) : [];
const railItems = hero ? $$('.rail li', hero) : [];
const railFill = hero ? $('.rail__fill', hero) : null;
const STEP_AT = [0.08, 0.215, 0.345, 0.54, 0.68, 0.775, 0.87];
let loadK = 0, railStep = -1, railP = -1;

function splitWords() {
  $$('.band h1, .band h2', hero).forEach((h) => {
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.textContent = '';
    const words = text.split(/\s+/);
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--th', (i / Math.max(1, words.length) * 0.5).toFixed(3));
      s.textContent = w;
      h.append(s, ' ');
    });
  });
}

function updateBands(p) {
  for (const b of bands) {
    const f = Math.min(0.012, (b.b - b.a) / 3);
    const op = (b.first ? 1 : ss(p, b.a, b.a + f)) * (b.last ? 1 : 1 - ss(p, b.b - f, b.b));
    let k = clamp((p - b.a) / Math.min(0.02, (b.b - b.a) * 0.35));
    if (b.first) k = Math.max(k, loadK);
    if (Math.abs(op - b.op) > 0.008 || ((op === 0 || op === 1) && op !== b.op)) {
      b.op = op;
      b.el.style.opacity = op.toFixed(3);
      b.el.classList.toggle('on', op > 0.02);
    }
    if (Math.abs(k - b.k) > 0.008 || ((k === 0 || k === 1) && k !== b.k)) {
      b.k = k;
      b.el.style.setProperty('--k', k.toFixed(3));
    }
  }
  let step = 0;
  for (const s of STEP_AT) if (p >= s) step++;
  if (step !== railStep) {
    railStep = step;
    railItems.forEach((li, i) => {
      li.classList.toggle('is-done', i < step);
      li.classList.toggle('is-cur', i === step - 1 && p < 0.955);
    });
    hero.classList.toggle('is-complete', false);
  }
  const complete = p >= 0.955;
  if (complete !== hero.classList.contains('is-complete')) hero.classList.toggle('is-complete', complete);
  if (Math.abs(p - railP) > 0.002) {
    railP = p;
    railFill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
}

function resetBandStyles() {
  for (const b of bands) {
    b.op = -1; b.k = -1;
    b.el.style.removeProperty('opacity');
    b.el.style.removeProperty('--k');
    b.el.classList.remove('on');
  }
  railStep = -1; railP = -1;
}

/* ---------- 4. O relógio em 3D ---------- */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const loadImage = (src) => new Promise((res) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});
const toCanvas = (img, size) => { const c = mkCanvas(size, size); c.getContext('2d').drawImage(img, 0, 0, size, size); return c; };

/* Texturas desenhadas em canvas (acabamentos de relojoaria) */
function carbonCanvas(size, seed, shards) {          // reserva, caso a textura real não carregue
  const c = mkCanvas(size, size), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#0e0e0f'; x.fillRect(0, 0, size, size);
  for (let i = 0; i < shards; i++) {
    const cx = r() * size, cy = r() * size, rad = size * (0.02 + r() * 0.075);
    const n = 3 + Math.floor(r() * 3), a0 = r() * TAU;
    x.beginPath();
    for (let j = 0; j < n; j++) {
      const a = a0 + (j / n) * TAU + r() * 0.6, rr = rad * (0.5 + r() * 0.7);
      if (j) x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath();
    const g = x.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad), v = 26 + Math.floor(r() * 74);
    g.addColorStop(0, 'rgba(' + v + ',' + v + ',' + (v + 3) + ',' + (0.15 + r() * 0.5).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(8,8,9,' + (0.2 + r() * 0.5).toFixed(2) + ')');
    x.fillStyle = g; x.fill();
  }
  return c;
}
function dialCanvas(img, RD) {                        // mostrador: textura real + janela da data do dia
  const S = 2048, c = mkCanvas(S, S), x = c.getContext('2d'), m = S / 2, u = m / RD;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (img) {
    // a textura real entra em escala menor (logos na posição certa) e espelhada nas bordas, sem emendas
    const w = S * 0.72, o = (S - w) / 2;
    for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) {
      x.save();
      x.translate(o + tx * w + (tx ? w : 0), o + ty * w + (ty ? w : 0));
      x.scale(tx ? -1 : 1, ty ? -1 : 1);
      x.drawImage(img, 0, 0, w, w);
      x.restore();
    }
  } else {
    x.drawImage(carbonCanvas(1024, 7, 560), 0, 0, S, S);
    x.fillStyle = '#ece7df';
    x.font = 'italic 800 104px "Arial Narrow", Arial, sans-serif';
    x.save(); x.translate(m, m - 0.3 * u); x.scale(1.35, 1); x.fillText('EDIFICE', 0, 0); x.restore();
    x.font = '700 72px Arial, sans-serif'; x.fillText('CASIO', m, m - 0.2 * u);
    x.font = '500 50px Arial, sans-serif'; x.fillText('AUTOMATIC', m, m + 0.36 * u);
  }
  const ww = 0.19 * u, wh = 0.135 * u, wx = m + 0.515 * u, wy = m - wh / 2;
  x.fillStyle = '#f4f1ec'; x.fillRect(wx, wy, ww, wh);
  const sh = x.createLinearGradient(0, wy, 0, wy + wh);
  sh.addColorStop(0, 'rgba(0,0,0,.34)'); sh.addColorStop(0.28, 'rgba(0,0,0,0)');
  x.fillStyle = sh; x.fillRect(wx, wy, ww, wh);
  x.fillStyle = '#141312'; x.font = '700 ' + Math.round(wh * 0.8) + 'px Arial, sans-serif';
  x.fillText(String(new Date().getDate()), wx + ww / 2, wy + wh / 2 + wh * 0.04);
  return c;
}
function ticksCanvas() {                              // trilha de minutos do aro interno
  const W = 2048, Hh = 32, c = mkCanvas(W, Hh), x = c.getContext('2d');
  x.fillStyle = '#0a0a0b'; x.fillRect(0, 0, W, Hh);
  for (let i = 0; i <= 60; i++) {
    const five = i % 5 === 0, w = five ? 7 : 3;
    x.fillStyle = five ? '#f2efe9' : 'rgba(242,239,233,.75)';
    x.fillRect((i / 60) * W - w / 2, five ? 9 : 13, w, five ? 17 : 13);
  }
  return c;
}
function streaksCanvas(W, Hh, seed) {                 // escovado em linhas
  const c = mkCanvas(W, Hh), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#8a8a8a'; x.fillRect(0, 0, W, Hh);
  for (let i = 0; i < Hh * 4; i++) {
    const v = 50 + Math.floor(r() * 180);
    x.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.2 + r() * 0.45).toFixed(2) + ')';
    x.fillRect(0, r() * Hh, W, 0.6 + r() * 1.6);
  }
  return c;
}
function ringsCanvas(S, seed) {                       // escovado circular
  const c = mkCanvas(S, S), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#8f8f8f'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    const v = 60 + Math.floor(r() * 170);
    x.strokeStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.15 + r() * 0.35).toFixed(2) + ')';
    x.lineWidth = 0.6 + r() * 1.5;
    x.beginPath(); x.arc(S / 2, S / 2, r() * S * 0.5, 0, TAU); x.stroke();
  }
  return c;
}
function stripesCanvas(S, seed) {                     // Côtes de Genève
  const c = mkCanvas(S, S), x = c.getContext('2d'), r = rng(seed), bw = S / 8;
  x.save(); x.translate(S / 2, S / 2); x.rotate(-0.55); x.translate(-S, -S);
  for (let i = 0; i < 17; i++) {
    const g = x.createLinearGradient(i * bw, 0, (i + 1) * bw, 0);
    g.addColorStop(0, '#565656'); g.addColorStop(0.5, '#dcdcdc'); g.addColorStop(1, '#565656');
    x.fillStyle = g; x.fillRect(i * bw, 0, bw + 1, S * 2);
  }
  for (let i = 0; i < 1500; i++) {
    const v = 40 + Math.floor(r() * 200);
    x.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.1)';
    x.fillRect(r() * S * 2, 0, 0.8 + r() * 1.6, S * 2);
  }
  x.restore();
  return c;
}
function perlageCanvas(S) {                           // perlage da platina
  const c = mkCanvas(S, S), x = c.getContext('2d'), d = S / 24, rad = d * 0.74;
  x.fillStyle = '#6d6d6d'; x.fillRect(0, 0, S, S);
  for (let row = -1; row < 30; row++) for (let col = -1; col < 26; col++) {
    const cx = col * d + (row % 2 ? d / 2 : 0), cy = row * d * 0.86;
    const g = x.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.05, cx, cy, rad);
    g.addColorStop(0, '#e4e4e4'); g.addColorStop(0.55, '#8c8c8c'); g.addColorStop(1, '#474747');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.1)'; x.lineWidth = 1;
    for (let k = 1; k < 3; k++) { x.beginPath(); x.arc(cx, cy, (rad * k) / 3, 0, TAU); x.stroke(); }
  }
  return c;
}

async function initWatch() {
  const canvas = $('#watch');
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('sem WebGL');
  if (!window.gsap || !window.ScrollTrigger) throw new Error('sem GSAP');

  const [T, dialImg, carbonImg] = await Promise.all([
    import(THREE_URL), loadImage('assets/tex-dial.jpg'), loadImage('assets/tex-carbon.jpg'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const coarse = matchMedia('(pointer: coarse)').matches;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);

  /* Estúdio: caixas de luz suaves que os metais refletem */
  {
    const glow = mkCanvas(256, 256), gx = glow.getContext('2d');
    gx.fillStyle = '#000'; gx.fillRect(0, 0, 256, 256);
    gx.shadowColor = '#fff'; gx.shadowBlur = 34; gx.fillStyle = '#fff';
    gx.fillRect(54, 54, 148, 148); gx.fillRect(54, 54, 148, 148);
    const glowTex = new T.CanvasTexture(glow);
    const s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x100d0b, side: T.BackSide })));
    const box = (hex, power, w, h, pos) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({
        map: glowTex, color: new T.Color(hex).multiplyScalar(power), side: T.DoubleSide,
        blending: T.AdditiveBlending, depthWrite: false,
      }));
      m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); s.add(m);
    };
    box(0xfff0e4, 6.5, 13, 7, [0, 10, 4]);      // teto
    box(0xffb98a, 8, 4, 12, [-10, 1, 4]);      // faixa quente à esquerda
    box(0xdfe8ff, 5, 3, 11, [10, 2, 3]);       // faixa fria à direita
    box(0xffffff, 2.4, 9, 5, [1, 2, 12]);      // preenchimento frontal
    box(0xff9a66, 6, 9, 9, [4, 3, -10]);       // contraluz rosé
    box(0xffc9a8, 1.6, 10, 6, [0, -10, 3]);    // rebatedor de baixo
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(s, 0.02).texture;
    pm.dispose();
  }
  const key = new T.DirectionalLight(0xffe9d8, 1.5);
  key.position.set(-3.5, 6.5, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  key.shadow.camera.left = -2.6; key.shadow.camera.right = 2.6; key.shadow.camera.top = 2.6; key.shadow.camera.bottom = -2.6;
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.012; key.shadow.radius = 3;
  scene.add(key);
  const rim = new T.DirectionalLight(0xff9d6c, 2.4); rim.position.set(6, 2, -5); scene.add(rim);
  scene.add(new T.AmbientLight(0xffffff, 0.1));

  /* Texturas */
  const texOf = (cv, srgb) => { const t = new T.CanvasTexture(cv); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = maxAniso; return t; };
  const worldTex = (cv, scale, srgb) => {          // para peças extrudadas: UV = posição x,y
    const t = texOf(cv, srgb); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(scale, scale); t.offset.set(0.5, 0.5); return t;
  };
  const RD = 0.875;                                // raio do disco do mostrador
  const carbonCv = carbonImg ? toCanvas(carbonImg, 1024) : carbonCanvas(1024, 21, 520);
  const stripesCv = stripesCanvas(1024, 5), ringsCv = ringsCanvas(1024, 9), streakCv = streaksCanvas(512, 256, 3);
  const dialTex = texOf(dialCanvas(dialImg, RD), true);
  const streakTex = texOf(streakCv); streakTex.wrapS = streakTex.wrapT = T.RepeatWrapping;

  /* Materiais */
  const std = (o) => new T.MeshStandardMaterial(o), phys = (o) => new T.MeshPhysicalMaterial(o);
  const M = {
    carbon: phys({ map: worldTex(carbonCv, 0.4, true), bumpMap: worldTex(carbonCv, 0.4), bumpScale: 0.18, color: 0x747474, metalness: 0.15, roughness: 0.5, clearcoat: 0.28, clearcoatRoughness: 0.4, envMapIntensity: 0.8 }),
    bezelTop: std({ color: 0x101012, metalness: 1, roughness: 0.62, roughnessMap: streakTex, bumpMap: streakTex, bumpScale: 0.25 }),
    polish: std({ color: 0x060607, metalness: 1, roughness: 0.1 }),
    black: std({ color: 0x0a0a0b, metalness: 0.7, roughness: 0.5 }),
    blackFlat: std({ color: 0x0b0b0d, metalness: 1, roughness: 0.3, flatShading: true }),
    rose: std({ color: 0xdea281, metalness: 1, roughness: 0.16 }),
    roseSatin: std({ color: 0xd69a79, metalness: 1, roughness: 0.55, roughnessMap: worldTex(ringsCv, 0.58), bumpMap: worldTex(ringsCv, 0.58), bumpScale: 0.2 }),
    roseStripes: std({ color: 0xffffff, map: worldTex(stripesCv, 0.58, true), metalness: 1, roughness: 0.3 }),
    steel: std({ color: 0xc9ccd2, metalness: 1, roughness: 0.16 }),
    steelDark: std({ color: 0x5a5d64, metalness: 1, roughness: 0.34 }),
    backFace: std({ color: 0x7a7d84, metalness: 1, roughness: 0.6, roughnessMap: texOf(ringsCv), bumpMap: texOf(ringsCv), bumpScale: 0.2 }),
    plate: std({ color: 0x5a5e66, map: worldTex(perlageCanvas(1024), 0.58, true), metalness: 1, roughness: 0.5 }),
    plateSide: std({ color: 0x4a4d54, metalness: 1, roughness: 0.4 }),
    bridge: std({ color: 0x64676f, map: worldTex(stripesCv, 0.58, true), metalness: 1, roughness: 0.32 }),
    blue: std({ color: 0x2647b8, metalness: 1, roughness: 0.2 }),
    spring: std({ color: 0x8f9cc8, metalness: 1, roughness: 0.3 }),
    ruby: phys({ color: 0xc2143f, metalness: 0, roughness: 0.06, clearcoat: 1, emissive: 0x2c0410 }),
    rubber: std({ color: 0x060606, metalness: 0, roughness: 0.56, envMapIntensity: 0.5, side: T.DoubleSide }),
    lume: std({ color: 0xf3f0e8, metalness: 0, roughness: 0.55, emissive: 0x3c3a34 }),
    dial: phys({ map: dialTex, bumpMap: dialTex, bumpScale: 0.06, color: 0xa6a6a6, metalness: 0.2, roughness: 0.6, clearcoat: 0.12, clearcoatRoughness: 0.35, envMapIntensity: 0.8 }),
    rehaut: std({ map: texOf(ticksCanvas(), true), metalness: 0.3, roughness: 0.5 }),
    glass: phys({ color: 0x000000, metalness: 0, roughness: 0, transparent: true, blending: T.AdditiveBlending, depthWrite: false, envMapIntensity: 0.1, specularColor: 0xcfdcff }),
    glassTint: std({ color: 0x9db4e0, metalness: 0, roughness: 0.1, transparent: true, opacity: 0.055, depthWrite: false }),
    glassEdge: std({ color: 0xc4d4f2, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.75, depthWrite: false }),
  };
  M.roseStripes.color.set(0xe8ab8a);

  /* Ajudantes de geometria (eixo do relógio = Z, mostrador virado para +Z) */
  const mesh = (g, m) => new T.Mesh(g, m);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const cyl = (r, h, mat, seg = 48) => { const g = new T.CylinderGeometry(r, r, h, seg); g.rotateX(Math.PI / 2); return mesh(g, mat); };
  const disc = (r, mat, seg = 96) => mesh(new T.CircleGeometry(r, seg), mat);
  // anel torneado: os pontos (raio, z) seguem a regra normal = (dz, -dr)
  const lathe = (pts, mat, seg = 128) => {
    const g = new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), seg); g.rotateX(Math.PI / 2); return mesh(g, mat);
  };
  const ext = (shape, depth, bevel = 0, curve = 24) => new T.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: curve,
  });
  const poly = (pts) => { const s = new T.Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s; };
  const sector = (r0, r1, a0, a1) => { const s = new T.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); return s; };
  const screw = (x, y, z, mat = M.steel, r = 0.034) => {
    const g = new T.Group();
    g.add(cyl(r, 0.018, mat, 20));
    g.add(at(mesh(new T.BoxGeometry(r * 1.7, r * 0.28, 0.006), M.polish), 0, 0, 0.0095));
    g.position.set(x, y, z); g.rotation.z = x * 7 + y * 3;
    return g;
  };
  const jewel = (x, y, z, r = 0.03) => {
    const g = new T.Group();
    g.add(cyl(r * 1.55, 0.008, M.rose, 24));
    const dome = mesh(new T.SphereGeometry(r, 20, 12), M.ruby); dome.scale.z = 0.35; dome.position.z = 0.004; g.add(dome);
    g.position.set(x, y, z);
    return g;
  };
  const gearShape = (teeth, r, spokes) => {
    const s = new T.Shape(), pitch = TAU / teeth, root = r - Math.min(0.028, r * 0.14);
    for (let t = 0; t < teeth; t++) {
      const a = t * pitch;
      [[root, 0], [r, 0.28], [r, 0.52], [root, 0.8]].forEach(([rad, f], k) => {
        const x = Math.cos(a + f * pitch) * rad, y = Math.sin(a + f * pitch) * rad;
        if (t || k) s.lineTo(x, y); else s.moveTo(x, y);
      });
    }
    s.closePath();
    if (spokes) {
      const rin = r * 0.3, rout = root - r * 0.15, sw = r * 0.13;
      const dOut = Math.asin(sw / 2 / rout), dIn = Math.asin(sw / 2 / rin);
      for (let i = 0; i < spokes; i++) {
        const a0 = (i / spokes) * TAU, a1 = ((i + 1) / spokes) * TAU, h = new T.Path();
        h.absarc(0, 0, rout, a0 + dOut, a1 - dOut, false);
        h.absarc(0, 0, rin, a1 - dIn, a0 + dIn, true);
        h.closePath(); s.holes.push(h);
      }
    }
    return s;
  };
  // curva as pontas para trás (as asas da caixa e a pulseira seguem o mesmo arco)
  const Y0 = 1.0, RB = 1.5;
  const bend = (g) => {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), z = pos.getZ(i), sgn = Math.sign(y), sLen = Math.abs(y) - Y0;
      if (sLen <= 0) continue;
      const a = sLen / RB;
      pos.setY(i, sgn * (Y0 + (RB + z) * Math.sin(a)));
      pos.setZ(i, (RB + z) * Math.cos(a) - RB);
    }
    pos.needsUpdate = true; g.computeVertexNormals();
    return g;
  };
  // seção retangular arredondada (plano x–z) e varredura ao longo de y
  const rr = (hw, z0, z1, rad) => {
    const pts = [], n = 4;
    [[hw - rad, z1 - rad, 0], [-(hw - rad), z1 - rad, 90], [-(hw - rad), z0 + rad, 180], [hw - rad, z0 + rad, 270]].forEach(([cx, cz, a0]) => {
      for (let i = 0; i <= n; i++) { const a = ((a0 + (i / n) * 90) * Math.PI) / 180; pts.push([cx + Math.cos(a) * rad, cz + Math.sin(a) * rad]); }
    });
    return pts;
  };
  const sweep = (secFn, y0, y1, steps) => {
    const pos = [], uv = [], idx = [], n = secFn(0).length;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps, y = y0 + (y1 - y0) * t;
      secFn(t).forEach((p) => { pos.push(p[0], y, p[1]); uv.push(p[0], y); });
    }
    for (let j = 0; j < steps; j++) for (let i = 0; i < n; i++) {
      const a = j * n + i, b = j * n + ((i + 1) % n), c = a + n, d = b + n;
      idx.push(a, d, b, a, c, d);
    }
    for (const j of [0, steps]) for (let i = 1; i < n - 1; i++) idx.push(j * n, j * n + i, j * n + i + 1);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  };

  /* Registro das peças.
     gap: peça da pilha central (flutua acima da caixa e desce para o lugar)
     off: peça lateral (fundo, coroa, pulseira) que chega pelo lado */
  const root = new T.Group();
  scene.add(root);
  const parts = [], P = {}, stack = [];
  const addPart = (name, obj, o = {}) => {
    root.add(obj);
    const q = {
      name, obj, p: 0, lift: 0,
      home: obj.position.clone(), homeQ: obj.quaternion.clone(),
      off: new T.Vector3().fromArray(o.off || [0, 0, 0]),
      gap: o.gap || 0, spread: o.spread || 0, seed: parts.length * 1.73 + 0.4,
    };
    q.awayQ = new T.Quaternion().setFromEuler(new T.Euler().fromArray(o.rot || [0, 0, 0])).multiply(q.homeQ);
    if (q.gap) stack.push(q);
    parts.push(q); P[name] = q;
  };

  /* Caixa em carbono forjado: corpo e quatro asas facetadas */
  {
    const quad = [[1.13, 0], [1.125, 0.3], [1.1, 0.58], [1.05, 0.85], [1.01, 1.0]];
    const loop = [];
    quad.forEach((p) => loop.push([p[0], p[1]]));
    for (let i = quad.length - 1; i >= 0; i--) loop.push([-quad[i][0], quad[i][1]]);
    for (let i = 1; i < quad.length; i++) loop.push([-quad[i][0], -quad[i][1]]);
    for (let i = quad.length - 1; i >= 1; i--) loop.push([quad[i][0], -quad[i][1]]);
    const s = poly(loop), h = new T.Path();
    h.absarc(0, 0, 0.93, 0, TAU, true); s.holes.push(h);
    const geo = new T.ExtrudeGeometry(s, { depth: 0.23, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.04, bevelSegments: 1, curveSegments: 72 });
    geo.translate(0, 0, -0.175);
    const g = new T.Group();
    g.add(mesh(geo, M.carbon));
    const lugSec = (t) => {
      const y = 0.98 + 0.6 * t, xo = 1.01 - Math.max(0, y - 1) * 0.3, xi = 0.4, c = 0.04;
      const zb = -0.22 + 0.11 * t, zt = 0.1 - 0.05 * ss(t, 0.7, 1);
      return [[xi, zb], [xo, zb], [xo + c, zb + c], [xo + c, zt - c], [xo, zt], [xi + 0.02, zt], [xi, zt - 0.02]];
    };
    const lugGeo = bend(sweep(lugSec, 0.98, 1.58, 14).toNonIndexed());
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach((q) => { const l = mesh(lugGeo, M.carbon); l.scale.set(q[0], q[1], 1); g.add(l); });
    g.add(lathe([[0.89, -0.2], [0.89, 0.09]], M.black, 96));                         // parede interna
    addPart('case', g);
  }
  /* Fundo da caixa */
  {
    const g = new T.Group();
    g.add(at(cyl(0.93, 0.05, M.steelDark, 96), 0, 0, -0.245));
    const face = disc(0.93, M.backFace); face.rotation.x = Math.PI; face.position.z = -0.2705; g.add(face);
    const med = disc(0.5, M.polish); med.rotation.x = Math.PI; med.position.z = -0.272; g.add(med);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3, n = mesh(new T.BoxGeometry(0.1, 0.05, 0.02), M.polish);
      n.position.set(Math.cos(a) * 0.8, Math.sin(a) * 0.8, -0.268); n.rotation.z = a + Math.PI / 2; g.add(n);
    }
    addPart('caseback', g, { off: [0, 0, -0.62], rot: [0, 0, 0.9] });
  }
  /* Coroa */
  {
    const g = new T.Group();
    const knob = mesh(new T.CylinderGeometry(0.118, 0.118, 0.14, 10), M.blackFlat); knob.rotation.z = Math.PI / 2; knob.position.x = 0.1;
    const cap = mesh(new T.CylinderGeometry(0.085, 0.105, 0.02, 10), M.polish); cap.rotation.z = Math.PI / 2; cap.position.x = 0.18;
    const stem = mesh(new T.CylinderGeometry(0.05, 0.05, 0.12, 20), M.steelDark); stem.rotation.z = Math.PI / 2;
    g.add(knob, cap, stem);
    g.position.set(1.17, 0, -0.04);
    addPart('crown', g, { off: [0.75, 0, 0], rot: [2.2, 0, 0] });
  }

  /* --- Pilha central, de baixo para cima --- */
  /* Rotor (massa oscilante) */
  let rotor;
  {
    const g = new T.Group();
    rotor = new T.Group();
    rotor.add(at(mesh(ext(sector(0.12, 0.64, 0, Math.PI), 0.014, 0.003, 48), M.roseStripes), 0, 0, -0.007));
    rotor.add(at(mesh(ext(sector(0.62, 0.82, 0.03, Math.PI - 0.03), 0.04, 0.006, 48), M.rose), 0, 0, -0.026));
    rotor.add(cyl(0.13, 0.03, M.steelDark, 40));
    rotor.add(at(cyl(0.05, 0.036, M.steel, 24), 0, 0, 0));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; rotor.add(screw(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0.016, M.blue, 0.018)); }
    g.add(rotor);
    g.position.set(0, 0, -0.19);
    addPart('rotor', g, { gap: 0.42, rot: [0.06, -0.05, 1.2] });
  }
  /* Platina com perlage */
  {
    const g = new T.Group();
    g.add(at(cyl(0.84, 0.08, M.plateSide, 96), 0, 0, -0.11));
    g.add(at(mesh(ext(sector(0.0001, 0.84, 0, TAU), 0.0005, 0, 96), M.plate), 0, 0, -0.0699));
    g.add(at(lathe([[0.84, -0.07], [0.84, -0.058], [0.79, -0.058], [0.79, -0.07]], M.rose, 96), 0, 0, 0));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 1.05; g.add(screw(Math.cos(a) * 0.7, Math.sin(a) * 0.7, -0.062, M.blue)); }
    addPart('plate', g, { gap: 0.3, rot: [-0.05, 0.06, -0.5] });
  }
  /* Engrenagens */
  const gears = [];
  {
    const defs = [
      { x: -0.36, y: 0.30, r: 0.30, t: 48, sp: 0, mat: M.roseSatin, dir: 1 },
      { x: 0.02, y: 0.0, r: 0.21, t: 36, sp: 5, mat: M.rose, dir: -1 },
      { x: 0.36, y: 0.20, r: 0.17, t: 30, sp: 5, mat: M.rose, dir: 1 },
      { x: 0.42, y: -0.11, r: 0.15, t: 26, sp: 5, mat: M.rose, dir: -1 },
      { x: 0.26, y: -0.33, r: 0.12, t: 15, sp: 4, mat: M.steel, dir: 1 },
    ];
    defs.forEach((d, i) => {
      const g = new T.Group(), wheel = new T.Group();
      wheel.add(at(mesh(ext(gearShape(d.t, d.r, d.sp), 0.02, 0, 10), d.mat), 0, 0, -0.01));
      if (!d.sp) {                                   // tambor da corda: tampa e roda de catraca
        wheel.add(at(cyl(d.r * 0.82, 0.03, M.roseSatin, 64), 0, 0, 0));
        wheel.add(at(mesh(ext(gearShape(22, d.r * 0.5, 0), 0.012, 0, 8), M.steel), 0, 0, 0.015));
      } else wheel.add(at(mesh(ext(gearShape(8, d.r * 0.26, 0), 0.03, 0, 6), M.steel), 0, 0, -0.035));
      wheel.add(cyl(Math.max(0.014, d.r * 0.09), 0.07, M.steel, 16));
      g.add(wheel);
      g.position.set(d.x, d.y, -0.046 + (i % 2) * 0.012);
      gears.push({ wheel, speed: d.dir * 0.5 * (36 / d.t) });
      addPart('gear' + i, g, { gap: i ? 0.09 : 0.26, spread: 0.3, rot: [(i % 2 ? 1 : -1) * 0.1, (i % 3 ? 1 : -1) * 0.09, 0] });
    });
  }
  /* Balanço e espiral */
  let balance, spring;
  const BX = -0.32, BY = -0.4;
  {
    const g = new T.Group();
    balance = new T.Group();
    balance.add(mesh(new T.TorusGeometry(0.19, 0.02, 14, 72), M.rose));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.5, bar = mesh(new T.BoxGeometry(0.19, 0.03, 0.014), M.rose);
      bar.position.set(Math.cos(a) * 0.095, Math.sin(a) * 0.095, 0); bar.rotation.z = a; balance.add(bar);
    }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; balance.add(at(mesh(new T.SphereGeometry(0.014, 10, 8), M.rose), Math.cos(a) * 0.212, Math.sin(a) * 0.212, 0)); }
    balance.add(cyl(0.034, 0.03, M.rose, 24));
    const pts = [];
    for (let i = 0; i <= 250; i++) { const a = i * 0.2, r = 0.02 + i * 0.00054; pts.push(new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.016)); }
    spring = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 500, 0.0028, 4), M.spring);
    g.add(balance, spring);
    g.position.set(BX, BY, -0.04);
    addPart('balance', g, { gap: 0.12, spread: 0.3, rot: [0.1, -0.1, 0] });
  }
  /* Pontes com Côtes de Genève */
  {
    const g = new T.Group();
    g.add(mesh(ext(sector(0.3, 0.8, 1.85, 3.25), 0.02, 0.004, 40), M.bridge));
    g.add(mesh(ext(sector(0.52, 0.8, -0.55, 1.05), 0.02, 0.004, 40), M.bridge));
    const ang = Math.atan2(BY, BX), L = 0.3, w = 0.12, pill = new T.Shape();
    pill.absarc(0, 0, w / 2, Math.PI / 2, Math.PI * 1.5, false); pill.absarc(L, 0, w / 2, -Math.PI / 2, Math.PI / 2, false); pill.closePath();
    const cock = mesh(ext(pill, 0.02, 0.004, 16), M.bridge); cock.position.set(BX, BY, 0); cock.rotation.z = ang; g.add(cock);
    g.add(mesh(ext(sector(0.6, 0.8, ang - 0.22, ang + 0.22), 0.02, 0.004, 16), M.bridge));
    [[-0.66, 0.2], [-0.2, 0.68], [0.68, 0.3], [0.6, -0.18], [Math.cos(ang) * 0.7, Math.sin(ang) * 0.7]].forEach((q) => g.add(screw(q[0], q[1], 0.028, M.blue, 0.032)));
    g.add(jewel(-0.36, 0.3, 0.026, 0.034), jewel(0.36, 0.2, 0.026), jewel(0.42, -0.11, 0.026), jewel(BX, BY, 0.026, 0.034));
    g.position.set(0, 0, -0.016);
    addPart('bridges', g, { gap: 0.24, rot: [0.05, 0.06, 0.5] });
  }
  /* Mostrador com o aro dos minutos */
  {
    const g = new T.Group();
    g.add(at(disc(RD, M.dial, 128), 0, 0, 0.045));
    g.add(at(cyl(RD, 0.012, M.black, 96), 0, 0, 0.0385));
    g.add(lathe([[0.89, 0.15], [0.83, 0.045]], M.rehaut, 128));
    g.add(lathe([[0.89, 0.045], [0.89, 0.15]], M.black, 96));
    addPart('dial', g, { gap: 0.32, rot: [-0.06, 0.04, -0.7] });
  }
  /* Índices aplicados e moldura da data */
  {
    const g = new T.Group();
    const baton = (w, len) => {
      const b = new T.Group(), hw = w / 2, hl = len / 2;
      b.add(mesh(ext(poly([[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]]), 0.02, 0.011), M.rose));
      b.add(at(mesh(new T.BoxGeometry(w * 0.42, len * 0.78, 0.004), M.lume), 0, 0, 0.032));
      return b;
    };
    for (let h = 1; h <= 12; h++) {
      if (h === 3) continue;
      const a = -(h / 12) * TAU + Math.PI / 2;
      for (const o of h === 12 ? [-0.046, 0.046] : [0]) {
        const b = baton(h === 12 ? 0.05 : 0.064, 0.25);
        b.position.set(Math.cos(a) * 0.655 - Math.sin(a) * o, Math.sin(a) * 0.655 + Math.cos(a) * o, 0.056);
        b.rotation.z = a - Math.PI / 2; g.add(b);
      }
    }
    const fx = 0.61, fw = 0.19, fh = 0.135, ft = 0.014, fz = 0.056;
    [[fx, fh / 2 + ft / 2, fw + ft * 2, ft], [fx, -fh / 2 - ft / 2, fw + ft * 2, ft], [fx - fw / 2 - ft / 2, 0, ft, fh], [fx + fw / 2 + ft / 2, 0, ft, fh]]
      .forEach((q) => g.add(at(mesh(new T.BoxGeometry(q[2], q[3], 0.022), M.rose), q[0], q[1], fz)));
    const stub = baton(0.064, 0.05); stub.position.set(0.775, 0, 0.056); stub.rotation.z = -Math.PI / 2; g.add(stub);
    addPart('indices', g, { gap: 0.2, rot: [0.04, -0.05, 0.52] });
  }
  /* Ponteiros */
  const hands = {};
  {
    const g = new T.Group();
    const hand = (pts, z, lume) => {
      const grp = new T.Group();
      grp.add(mesh(ext(poly(pts), 0.006, 0.005), M.rose));
      grp.add(at(mesh(new T.BoxGeometry(lume[0], lume[2] - lume[1], 0.004), M.lume), 0, (lume[1] + lume[2]) / 2, 0.012));
      grp.position.z = z;
      return grp;
    };
    hands.h = hand([[-0.018, -0.09], [0.018, -0.09], [0.04, 0.03], [0.04, 0.34], [0, 0.44], [-0.04, 0.34], [-0.04, 0.03]], 0.094, [0.026, 0.1, 0.32]);
    hands.m = hand([[-0.014, -0.1], [0.014, -0.1], [0.031, 0.04], [0.031, 0.61], [0, 0.72], [-0.031, 0.61], [-0.031, 0.04]], 0.108, [0.02, 0.12, 0.58]);
    hands.s = new T.Group();
    hands.s.add(at(mesh(new T.BoxGeometry(0.011, 0.96, 0.006), M.rose), 0, 0.28, 0));
    hands.s.add(at(mesh(new T.BoxGeometry(0.03, 0.09, 0.006), M.rose), 0, -0.16, 0));
    hands.s.position.z = 0.124;
    g.add(hands.h, hands.m, hands.s);
    g.add(at(cyl(0.052, 0.046, M.rose, 32), 0, 0, 0.113));
    g.add(at(cyl(0.02, 0.01, M.steel, 20), 0, 0, 0.139));
    addPart('hands', g, { gap: 0.2, rot: [0.05, 0.05, -1.2] });
  }
  /* Vidro de safira */
  let glass;
  {
    const g = new T.Group();
    glass = new T.Group();
    const tint = cyl(0.886, 0.036, M.glassTint, 96); tint.position.z = 0.17; tint.renderOrder = 4;
    const shine = cyl(0.888, 0.04, M.glass, 96); shine.position.z = 0.17; shine.renderOrder = 5;
    const edge = lathe([[0.888, 0.15], [0.888, 0.19]], M.glassEdge, 128); edge.renderOrder = 6;
    glass.add(tint, shine, edge);
    g.add(glass);
    addPart('crystal', g, { gap: 0.28, rot: [-0.05, 0.04, 0] });
  }
  /* Bisel: topo escovado e chanfro polido */
  {
    const g = new T.Group();
    g.add(lathe([[1.04, 0.184], [0.905, 0.212]], M.bezelTop, 160));
    g.add(lathe([[0.905, 0.212], [0.89, 0.203]], M.polish, 160));
    g.add(lathe([[0.89, 0.203], [0.89, 0.14]], M.black, 160));
    g.add(lathe([[1.1, 0.13], [1.04, 0.184]], M.polish, 160));
    g.add(lathe([[1.1, 0.085], [1.1, 0.13]], M.bezelTop, 160));
    g.add(lathe([[0.89, 0.085], [1.1, 0.085]], M.black, 96));
    addPart('bezel', g, { gap: 0.24, rot: [0.05, -0.04, 0.6] });
  }

  /* Pulseira: duas metades com o painel central em relevo */
  {
    const half = () => {
      const g = new T.Group();
      g.add(mesh(bend(sweep((t) => rr(0.84 * (1 - 0.16 * t), -0.2, -0.05, 0.035), 1.6, 3.4, 72)), M.rubber));
      g.add(mesh(bend(sweep((t) => rr(0.375 * (1 - 0.08 * t), -0.2, 0.088 - 0.123 * ss(t, 0, 0.75), 0.03), 1.03, 3.25, 84)), M.rubber));
      return g;
    };
    addPart('strapTop', half(), { off: [0, 0.8, -0.12], rot: [0.16, 0, 0] });
    const bot = half(); bot.rotation.z = Math.PI;
    addPart('strapBottom', bot, { off: [0, -0.8, -0.12], rot: [-0.16, 0, 0] });
  }

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  glass.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
  const H0 = stack.reduce((a, q) => a + q.gap, 0);

  /* Linha do tempo: o scroll encaixa uma peça de cada vez */
  let tl = null, mode = '';
  function buildTimeline() {
    tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
    });
    const put = (name, start, dur) => tl.to(P[name], { p: 1, duration: dur }, start);
    put('case', 0.07, 0.04); put('caseback', 0.09, 0.09); put('crown', 0.125, 0.07);
    put('rotor', 0.22, 0.085); put('plate', 0.25, 0.085);
    for (let i = 0; i < 5; i++) put('gear' + i, 0.35 + i * 0.022, 0.075);
    put('balance', 0.45, 0.07); put('bridges', 0.475, 0.065);
    put('dial', 0.55, 0.085); put('indices', 0.6, 0.065);
    put('hands', 0.69, 0.075);
    put('crystal', 0.78, 0.06); put('bezel', 0.805, 0.055);
    put('strapTop', 0.875, 0.065); put('strapBottom', 0.885, 0.065);
    tl.to({}, { duration: 0.001 }, 0.999);
  }

  function setMode() {
    const next = RM.matches ? 'still' : 'gl';
    if (next === mode) return;
    mode = next;
    if (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(); tl.kill(); tl = null; }
    hero.classList.remove('boot', 'static', 'gl', 'still');
    hero.classList.add(mode);
    resetBandStyles();
    if (mode === 'gl') {
      parts.forEach((q) => { q.p = 0; });
      buildTimeline();
      ScrollTrigger.refresh();
    } else parts.forEach((q) => { q.p = 1; });
    resize();
    kick();
  }

  /* Tamanho e enquadramento */
  const stage = $('.stage', hero);
  let distMul = 1;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wide = camera.aspect > 1.15;
    distMul = wide ? 1 : Math.min(2.1, Math.pow(1.25 / camera.aspect, 0.85));
    if (wide) camera.setViewOffset(w, h, -w * 0.17, h * 0.045, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.11, w, h);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => { resize(); kick(); });

  /* Paralaxe leve com o ponteiro */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!coarse) addEventListener('pointermove', (e) => {
    ptr.tx = (e.clientX / innerWidth - 0.5) * 2; ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  /* Laço de renderização: só roda com a montagem na tela e a aba visível */
  const qF = new T.Quaternion(), eF = new T.Euler(), vF = new T.Vector3(), t0 = performance.now();
  let raf = null, onScreen = true, lastT = 0;
  function frame(now) {
    raf = null;
    if (!onScreen || document.hidden) return;
    const t = (now - t0) / 1000, dt = Math.min(0.1, lastT ? t - lastT : 0.016); lastT = t;
    const still = mode === 'still';

    if (loadK < 1) loadK = clamp((now - t0) / 1300);
    const prog = tl ? tl.progress() : 1;
    if (mode === 'gl') updateBands(prog);

    // altura da pilha: cada peça flutua logo acima da anterior e a pilha desce junto
    let H = 0;
    for (const q of stack) { H += q.gap * (1 - q.p); q.lift = H; }
    const Hn = H / H0;

    for (const q of parts) {
      const o = q.obj, loose = 1 - q.p;
      o.position.copy(q.home);
      if (q.gap) {
        o.position.z += q.lift;
        if (q.spread) { o.position.x *= 1 + q.spread * loose; o.position.y *= 1 + q.spread * loose; }
      } else o.position.addScaledVector(q.off, loose);
      o.quaternion.slerpQuaternions(q.awayQ, q.homeQ, q.p);
      if (!still && loose > 0.001) {
        o.position.z += Math.sin(t * 0.9 + q.seed) * 0.02 * loose;
        o.position.x += Math.sin(t * 0.6 + q.seed * 1.7) * 0.008 * loose;
        eF.set(Math.sin(t * 0.5 + q.seed) * 0.03 * loose, Math.cos(t * 0.43 + q.seed * 0.7) * 0.03 * loose, 0);
        o.quaternion.multiply(qF.setFromEuler(eF));
      }
    }
    if (!still) {
      for (const g of gears) g.wheel.rotation.z += g.speed * dt;
      const sw = Math.sin(t * 7.5);
      balance.rotation.z = sw * 1.1; spring.rotation.z = sw * 0.35;
      rotor.rotation.z += dt * 0.3;
    }
    // o vidro reflete mais enquanto flutua e fica discreto depois de assentado
    const gk = clamp(P.crystal.lift / 0.5);
    M.glassTint.opacity = 0.03 + 0.04 * gk; M.glass.envMapIntensity = 0.08 + 0.1 * gk;
    const d = new Date();
    const sec = d.getSeconds() + (still ? 0 : d.getMilliseconds() / 1000), min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
    hands.s.rotation.z = -(sec / 60) * TAU;
    hands.m.rotation.z = -(min / 60) * TAU;
    hands.h.rotation.z = -(hr / 12) * TAU;

    // enquadramento automático: quanto menor a pilha, mais de frente e mais perto
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
    const beauty = ss(prog, 0.93, 1);
    const rx = -0.24 - 0.86 * Math.pow(Hn, 0.75) + ptr.y * 0.045;
    const ry = 0.2 - 0.52 * prog - 0.06 * beauty + (still ? 0 : Math.sin(t * 0.35) * 0.03) + ptr.x * 0.07;
    const rz = 0.04 + 0.05 * Hn + (still ? 0 : Math.sin(t * 0.23) * 0.1 * Hn);
    root.rotation.set(rx, ry, rz);
    vF.set(0, 0, 0.46 * H).applyEuler(root.rotation);
    root.position.copy(vF).multiplyScalar(-1);
    camera.position.z = (10.4 + 1.25 * H - 0.4 * beauty) * distMul;

    renderer.render(scene, camera);
    if (!still) raf = requestAnimationFrame(frame);
  }
  function kick() { if (raf === null) raf = requestAnimationFrame(frame); }

  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) { lastT = 0; kick(); } }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastT = 0; kick(); } });
  RM.addEventListener('change', setMode);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); hero.classList.remove('gl', 'still'); hero.classList.add('static'); });

  // gancho para testes automatizados
  window.__clock = { parts, progress: () => (tl ? tl.progress() : 1) };

  setMode();
}

/* ---------- Partida ---------- */
if (hero) splitWords();
initPage();
if (hero) initWatch().catch((err) => {
  console.warn('Montagem 3D indisponível, usando a imagem fixa:', err.message);
  hero.classList.remove('boot', 'gl', 'still');
  hero.classList.add('static');
});
