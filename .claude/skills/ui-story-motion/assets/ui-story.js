/* UI Story — un « film d'interface » joué dans la page, sans dépendance.
   Chaque chapitre raconte une action : nom de l'outil → bouton → écran réel
   visité par la caméra → transition liquide → barre de progression en très
   gros plan → coche de validation et résultat.
   Usage : createUIStory(element, chapitres, options) — voir SKILL.md. */
(function (global) {
'use strict';

const EASE = {
  out: 'cubic-bezier(.22,1,.36,1)',
  inOut: 'cubic-bezier(.65,0,.35,1)',
  back: 'cubic-bezier(.34,1.56,.64,1)',
  in: 'cubic-bezier(.55,0,1,.45)'
};
const DEFAULT_MARK = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="currentColor"/>' +
  '<path d="M8 26h8l3-5 4 12 4-18 3 11h10" fill="none" stroke="#0A0E12" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DEFAULT_TICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
let uid = 0;

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}

function createUIStory(root, chapters, opts) {
  const o = Object.assign({
    hold: 1000,            // durée de lecture d'une étiquette (ms)
    onCue: null,           // (nom, chapitre) à chaque temps fort : sert au sound design d'une vidéo
    autoplay: true,
    headingTag: 'h3',
    labels: { prev: 'Précédent', next: 'Suivant', pause: 'Mettre en pause', play: 'Lire', chapter: 'Chapitre', fiche: 'Voir la fiche', open: 'Ouvrir' }
  }, opts || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const id = 'us' + (++uid);

  /* ---------- structure ---------- */
  root.classList.add('us');
  root.textContent = '';
  const stage = el('div', 'us-stage', root);
  stage.innerHTML =
    `<svg class="us-defs" width="0" height="0" aria-hidden="true"><defs>
       <filter id="${id}-liquid" x="-40%" y="-40%" width="180%" height="180%">
         <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="n"/>
         <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/>
       </filter></defs></svg>
     <i class="us-streak s1"></i><i class="us-streak s2"></i><i class="us-glow"></i>
     <div class="us-title" aria-hidden="true"><span class="us-mark"></span><span class="us-name"></span></div>
     <div class="us-cta" aria-hidden="true"><span class="us-cta-label"></span></div>
     <div class="us-cam"><div class="us-panel"><img alt=""><i class="us-sheen"></i></div></div>
     <i class="us-hl"></i>
     <div class="us-toast" aria-hidden="true"><div class="us-toast-row"><span class="us-ticon"></span><span class="us-ttext"><b></b><small></small></span></div><div class="us-bar"><i></i></div></div>
     <div class="us-done" aria-hidden="true"><span class="us-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="us-value"></span></div>
     <svg class="us-cursor" viewBox="0 0 34 40" aria-hidden="true"><path d="M3 2l27 15-11.5 3.2L13 34z" fill="#fff" stroke="#0A0E12" stroke-width="1.8" stroke-linejoin="round"/></svg>
     <div class="us-callout" aria-hidden="true"></div>`;
  const info = el('div', 'us-info', root);
  const meta = el('div', 'us-meta', info);
  const heading = el(o.headingTag, 'us-heading', info); heading.setAttribute('aria-live', 'polite');
  const desc = el('p', 'us-desc', info);
  const feats = el('ul', 'us-feats', info);
  const actions = el('div', 'us-actions', info);
  const nav = el('div', 'us-nav', info);
  const prevBtn = el('button', 'us-btn', nav); prevBtn.type = 'button'; prevBtn.setAttribute('aria-label', o.labels.prev);
  prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const dots = el('div', 'us-dots', nav);
  const nextBtn = el('button', 'us-btn', nav); nextBtn.type = 'button'; nextBtn.setAttribute('aria-label', o.labels.next);
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const pauseBtn = el('button', 'us-btn', nav); pauseBtn.type = 'button';

  const $ = s => stage.querySelector(s);
  const s1 = $('.s1'), s2 = $('.s2'), glow = $('.us-glow'), title = $('.us-title'), mark = $('.us-mark'), name = $('.us-name'),
        cta = $('.us-cta'), ctaLabel = $('.us-cta-label'), panel = $('.us-panel'), img = panel.querySelector('img'), sheen = $('.us-sheen'),
        hl = $('.us-hl'), toast = $('.us-toast'), ticon = $('.us-ticon'), ttitle = toast.querySelector('b'), tmeta = toast.querySelector('small'),
        bar = $('.us-bar'), fill = bar.firstElementChild, done = $('.us-done'), disc = $('.us-disc'), check = disc.querySelector('path'),
        value = $('.us-value'), cursor = $('.us-cursor'), callout = $('.us-callout'),
        disp = stage.querySelector('feDisplacementMap');

  /* ---------- outils d'animation ---------- */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cue = name => { if (o.onCue) try { o.onCue(name, ci); } catch (e) {} };
  const A = (node, kf, op) => {
    const a = node.animate(kf, Object.assign({ fill: 'forwards', easing: EASE.out }, op, { duration: reduce ? 1 : op.duration }));
    return a.finished.catch(() => {});
  };
  // anime depuis l'état courant (calculé) vers « to », puis fige le résultat
  const go = (node, to, op) => {
    node.getAnimations().forEach(a => { try { a.commitStyles(); } catch (e) {} a.cancel(); });
    const cs = getComputedStyle(node), from = {};
    for (const k in to) from[k] = cs[k];
    const a = node.animate([from, to], Object.assign({ fill: 'forwards', easing: EASE.inOut }, op, { duration: reduce ? 1 : (op && op.duration) || 600 }));
    return a.finished.then(() => { try { a.commitStyles(); } catch (e) {} a.cancel(); }).catch(() => {});
  };
  // déformation liquide : fait varier l'intensité du filtre SVG
  function liquid(node, from, to, ms, alive) {
    node.style.filter = `url(#${id}-liquid)`;
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        if (!alive()) return res();
        const p = Math.min(1, (now - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        disp.setAttribute('scale', (from + (to - from) * e).toFixed(1));
        if (p < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- caméra sur l'écran ---------- */
  let box = { W: 0, H: 0, w: 0, h: 0, l: 0, t: 0 };
  const OVER = { x: .5, y: .5, zoom: .9, rx: 14, ry: -18 };
  const FLAT = { x: .5, y: .5, zoom: .9, rx: 0, ry: 0 };
  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight, a = (img.naturalWidth || 16) / (img.naturalHeight || 10);
    let h = H * .84, w = h * a; if (w > W * .74) { w = W * .74; h = w / a; }
    box = { W, H, w, h, l: (W - w) / 2, t: (H - h) / 2 };
    Object.assign(panel.style, { width: w + 'px', height: h + 'px', left: box.l + 'px', top: box.t + 'px' });
  }
  const camT = h => {
    const dx = box.W / 2 - (box.l + h.x * box.w), dy = box.H * .56 - (box.t + h.y * box.h);
    return { transformOrigin: `${h.x * 100}% ${h.y * 100}%`,
      transform: `translate(${dx}px,${dy}px) rotateX(${h.rx ?? 10}deg) rotateY(${h.ry ?? -12}deg) scale(${h.zoom ?? 2})` };
  };
  const cam = (h, d) => go(panel, camT(h), { duration: d || 900 });
  const cursorTo = (x, y, d) => go(cursor, { transform: `translate(${x}px,${y}px)`, opacity: 1 }, { duration: d || 650, easing: 'cubic-bezier(.5,0,.2,1)' });
  async function click(x, y) {
    cursor.animate([{ scale: '1' }, { scale: '.8' }, { scale: '1' }], { duration: 220 });
    await sleep(120);
  }

  /* ---------- état ---------- */
  let ci = 0, runId = 0, userPaused = !o.autoplay || reduce, visible = false;
  const pre = chapters.flatMap(c => c.screens.map(s => { const i = new Image(); i.src = s.src; return i; }));

  function reset() {
    stage.getAnimations({ subtree: true }).forEach(a => a.cancel());
    [s1, s2, glow, title, cta, ctaLabel, panel, hl, toast, done, disc, check, value, cursor, callout, name, mark, fill]
      .forEach(n => n.removeAttribute('style'));
    disp.setAttribute('scale', 0);
    layout();
  }

  function renderInfo() {
    const c = chapters[ci];
    meta.textContent = '';
    (c.tags || []).forEach(t => { const s = el('span', t === c.devTag ? 'dev' : '', meta); s.textContent = t; });
    heading.textContent = c.title || c.name;
    desc.textContent = c.desc || '';
    feats.textContent = '';
    c.screens.flatMap(s => s.hotspots || []).forEach(h => { el('li', '', feats).textContent = h.label; });
    actions.textContent = '';
    if (c.fiche) { const a = el('a', 'us-link primary', actions); a.href = c.fiche; a.textContent = o.labels.fiche; }
    if (c.url) { const a = el('a', 'us-link ghost', actions); a.href = c.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = (c.urlLabel || o.labels.open) + ' →'; }
    [...dots.children].forEach((b, i) => b.setAttribute('aria-current', i === ci));
    img.alt = c.screens[0].alt || c.title || c.name;
  }
  const featOn = label => [...feats.children].forEach(li => li.classList.toggle('on', li.textContent === label));

  /* ---------- les temps du film ---------- */
  async function intro(c, alive) {
    const W = box.W, H = box.H;
    mark.innerHTML = c.mark || DEFAULT_MARK;
    name.textContent = '';
    const letters = [...(c.name || c.title)].map(ch => { const s = el('span', '', name); s.textContent = ch === ' ' ? ' ' : ch; return s; });
    title.style.opacity = 1;
    const nameW = name.scrollWidth;
    name.style.width = '0px';
    // deux traînées de lumière convergent vers le centre
    cue('streak');
    A(s1, [{ opacity: 0, transform: `translate(${-W * .5}px,${H * .5}px) rotate(-32deg) scaleX(1.3)` }, { opacity: 1, offset: .55 },
           { opacity: 0, transform: 'translate(0,0) rotate(-32deg) scaleX(.15)' }], { duration: 520, easing: EASE.in });
    A(s2, [{ opacity: 0, transform: `translate(${W * .5}px,${-H * .5}px) rotate(-32deg) scaleX(1.3)` }, { opacity: 1, offset: .55 },
           { opacity: 0, transform: 'translate(0,0) rotate(-32deg) scaleX(.15)' }], { duration: 520, easing: EASE.in });
    await sleep(440); if (!alive()) return;
    // éclair + apparition du logo avec dépassement
    cue('pop');
    A(glow, [{ opacity: .9, transform: 'translate(-50%,-50%) scale(.15)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.7)' }], { duration: 700 });
    A(mark, [{ opacity: 0, transform: 'scale(.5) rotate(-24deg)', filter: 'blur(4px)' }, { opacity: 1, transform: 'scale(1.2) rotate(5deg)', filter: 'blur(0px)', offset: .6 },
             { opacity: 1, transform: 'scale(1) rotate(0)', filter: 'blur(0px)' }], { duration: 620 });
    await sleep(520); if (!alive()) return;
    // le nom s'écrit lettre à lettre, avec une lueur qui retombe
    A(name, [{ width: '0px' }, { width: nameW + 'px' }], { duration: 120 + letters.length * 45, easing: EASE.out });
    letters.forEach((l, i) => setTimeout(() => alive() && cue('tick'), i * 45));
    letters.forEach((l, i) => A(l, [
      { opacity: 0, transform: 'translateY(.3em)', filter: 'blur(6px)', textShadow: '0 0 18px var(--us-accent)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)', textShadow: '0 0 0 transparent' }], { duration: 420, delay: i * 45 }));
    await sleep(letters.length * 45 + 420 + o.hold * .7);
  }

  async function ctaBeat(c, alive) {
    const W = box.W, H = box.H;
    A(title, [{ opacity: 1, transform: 'translate(-50%,-50%)' }, { opacity: 0, transform: 'translate(-50%,-150%) scale(.8)' }], { duration: 450, easing: EASE.inOut });
    ctaLabel.textContent = c.cta || o.labels.open;
    await sleep(160); if (!alive()) return;
    // le bouton naît d'un trait fin et rebondit à sa taille
    cue('cta');
    await A(cta, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.06,.22)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.07)', offset: .7 },
                  { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 520 });
    A(ctaLabel, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
    go(cursor, { transform: `translate(${W * .86}px,${H * .96}px)`, opacity: 0 }, { duration: 1 });
    await sleep(150); if (!alive()) return;
    await cursorTo(W / 2 + 6, H / 2 + 6, 620); if (!alive()) return;
    cue('click');
    cta.animate([{ scale: '1' }, { scale: '.93' }, { scale: '1' }], { duration: 220 });
    await click();
    if (!alive()) return;
    // basculement en 3D dans un halo, l'écran de l'application prend sa place
    cue('whoosh');
    go(cursor, { opacity: 0 }, { duration: 200 });
    A(cta, [{ opacity: 1, transform: 'translate(-50%,-50%) scale(1)', filter: 'blur(0px)' },
            { opacity: 0, transform: 'translate(-50%,-25%) perspective(600px) rotateX(58deg) rotateZ(-16deg) scale(1.5)', filter: 'blur(6px)' }], { duration: 380, easing: EASE.in });
    A(glow, [{ opacity: .95, transform: 'translate(-50%,-50%) scale(.3)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(2.4)' }], { duration: 850 });
    img.src = c.screens[0].src; await img.decode().catch(() => {}); if (!alive()) return;
    layout();
    const over = camT(OVER);
    panel.style.transformOrigin = '50% 50%';
    await A(panel, [{ opacity: 0, filter: 'blur(6px)', transform: `translate(0px,${H * .14}px) rotateX(66deg) rotateZ(-20deg) scale(.3)` },
                    { opacity: 1, filter: 'blur(0px)', transform: over.transform }], { duration: 720, easing: EASE.back });
    cue('land');
    sheen.animate([{ transform: 'translateX(-60%)' }, { transform: 'translateX(60%)' }], { duration: reduce ? 1 : 1000, easing: 'ease-in-out' });
  }

  async function tour(c, alive) {
    const W = box.W, H = box.H, cx = W / 2, cy = H * .56;
    for (let si = 0; si < c.screens.length; si++) {
      if (!alive()) return;
      const s = c.screens[si];
      if (si > 0) {
        // panoramique filé vers l'écran suivant
        cue('whip');
        go(cursor, { opacity: 0 }, { duration: 150 });
        const cur = getComputedStyle(panel).transform;
        await A(panel, [{ transform: cur, filter: 'blur(0px)', opacity: 1 }, { transform: cur + ` translateX(${-box.w * .5}px)`, filter: 'blur(8px)', opacity: 0 }], { duration: 260, easing: EASE.in });
        if (!alive()) return;
        img.src = s.src; await img.decode().catch(() => {}); if (!alive()) return;
        layout();
        const t = camT(OVER);
        panel.getAnimations().forEach(a => a.cancel());
        panel.style.transformOrigin = t.transformOrigin;
        await A(panel, [{ transform: t.transform + ` translateX(${box.w * .5}px)`, filter: 'blur(8px)', opacity: 0 }, { transform: t.transform, filter: 'blur(0px)', opacity: 1 }], { duration: 320 });
        panel.getAnimations().forEach(a => { try { a.commitStyles(); } catch (e) {} a.cancel(); });
      }
      img.alt = s.alt || c.title || c.name;
      for (const h of (s.hotspots || [])) {
        if (!alive()) return;
        go(hl, { opacity: 0 }, { duration: 150 });
        panel.animate([{ filter: 'blur(0px)' }, { filter: 'blur(1.6px)' }, { filter: 'blur(0px)' }], { duration: reduce ? 1 : 900 });
        await Promise.all([cam(h, 900), sleep(250).then(() => cursorTo(cx + 5, cy + 6, 760))]);
        if (!alive()) return;
        cue('click');
        await click();
        A(hl, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.85)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 300, easing: EASE.back });
        callout.getAnimations().forEach(a => a.cancel());
        callout.textContent = h.label; featOn(h.label);
        Object.assign(callout.style, { left: cx + 'px', top: (cy - H * .06) + 'px' });
        A(callout, [{ opacity: 0, transform: 'translate(-50%,calc(-100% + 6px)) scale(.92)' }, { opacity: 1, transform: 'translate(-50%,-100%) scale(1)' }], { duration: 260, easing: EASE.back });
        await sleep(o.hold);
        A(callout, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
      }
    }
    featOn(null);
    go(hl, { opacity: 0 }, { duration: 150 });
    go(cursor, { opacity: 0 }, { duration: 200 });
    await cam(OVER, 650);
  }

  async function result(c, alive) {
    const r = c.result || {};
    // l'écran fond comme un liquide et se reforme en notification
    cue('liquid');
    go(panel, { transform: camT(OVER).transform + ' scale(.32)', opacity: 0, borderRadius: '48px' }, { duration: 560, easing: EASE.in });
    await liquid(panel, 0, 70, 520, alive); if (!alive()) return;
    panel.style.filter = '';
    ticon.innerHTML = r.icon || DEFAULT_TICON;
    cue('blip');
    ttitle.textContent = r.title || c.name;
    tmeta.textContent = r.meta || '';
    A(toast, [{ opacity: 0, borderRadius: '44px', transform: 'translate(-50%,-50%) scale(.42)' },
              { opacity: 1, borderRadius: '18px', transform: 'translate(-50%,-50%) scale(1)' }], { duration: 560, easing: EASE.back });
    await liquid(toast, 70, 0, 560, alive); if (!alive()) return;
    toast.style.filter = '';
    await sleep(250); if (!alive()) return;
    // très gros plan sur la barre, la caméra suit le remplissage
    const tb = toast.getBoundingClientRect(), bb = bar.getBoundingClientRect(), k = 2.7;
    const ox = bb.left - tb.left + bb.width * .15, oy = bb.top - tb.top + bb.height / 2;
    toast.style.transformOrigin = `${ox}px ${oy}px`;
    await A(toast, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(-50%,-50%) scale(${k})` }], { duration: 560, easing: EASE.inOut });
    if (!alive()) return;
    const travel = bb.width * .7 * k;
    cue('riser');
    A(fill, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1500, easing: 'cubic-bezier(.45,0,.25,1)' });
    await A(toast, [{ transform: `translate(-50%,-50%) scale(${k})` }, { transform: `translate(calc(-50% - ${travel}px),-50%) scale(${k})` }], { duration: 1500, easing: 'cubic-bezier(.45,0,.25,1)' });
    if (!alive()) return;
    // retour, la carte se contracte en pastille, la coche se dessine
    A(toast, [{ opacity: 1, filter: 'blur(0px)', transform: `translate(calc(-50% - ${travel}px),-50%) scale(${k})` },
              { opacity: 0, filter: 'blur(5px)', transform: 'translate(-50%,-50%) scale(.5,.25)' }], { duration: 420, easing: EASE.in });
    value.textContent = r.value || '';
    setTimeout(() => alive() && cue('ding'), 560);
    done.style.opacity = 1;
    A(disc, [{ opacity: 0, transform: 'scale(3.2,.45)', borderRadius: '999px' }, { opacity: 1, transform: 'scale(1)', borderRadius: '999px' }], { duration: 480, delay: 200, easing: EASE.back });
    A(check, [{ strokeDashoffset: 20 }, { strokeDashoffset: 0 }], { duration: 320, delay: 560, easing: EASE.out });
    A(value, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 680 });
    await sleep(680 + 380 + o.hold * 1.5); if (!alive()) return;
    await A(done, [{ opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.92)' }], { duration: 320, easing: EASE.in });
  }

  async function play(first) {
    const myId = ++runId, alive = () => myId === runId;
    while (alive()) {
      const c = chapters[ci];
      reset();
      await intro(c, alive); if (!alive()) return;
      await ctaBeat(c, alive); if (!alive()) return;
      await tour(c, alive); if (!alive()) return;
      await result(c, alive); if (!alive()) return;
      await sleep(250); if (!alive()) return;
      ci = (ci + 1) % chapters.length; renderInfo();
    }
  }

  // image fixe : utilisée en pause et quand le visiteur réduit les animations
  async function still() {
    const my = runId;  // une lecture lancée entre-temps garde la main
    reset();
    const c = chapters[ci];
    img.src = c.screens[0].src; await img.decode().catch(() => {});
    if (my !== runId) return;
    layout();
    const t = camT(reduce ? FLAT : OVER);
    Object.assign(panel.style, { opacity: 1, transformOrigin: t.transformOrigin, transform: t.transform });
  }
  function stop() { runId++; }
  function start() { if (!userPaused && visible && !reduce) play(); }
  function goTo(i) {
    stop(); ci = (i + chapters.length) % chapters.length; renderInfo();
    if (userPaused || reduce || !visible) still(); else play();
  }
  function setPaused(p) {
    userPaused = p;
    pauseBtn.innerHTML = p
      ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    pauseBtn.setAttribute('aria-label', p ? o.labels.play : o.labels.pause);
    if (p) { stop(); still(); } else start();
  }

  chapters.forEach((c, i) => {
    const b = el('button', '', dots); b.type = 'button';
    b.setAttribute('aria-label', `${o.labels.chapter} ${i + 1} : ${c.title || c.name}`);
    b.addEventListener('click', () => goTo(i));
  });
  prevBtn.addEventListener('click', () => goTo(ci - 1));
  nextBtn.addEventListener('click', () => goTo(ci + 1));
  pauseBtn.addEventListener('click', () => setPaused(!userPaused));
  setPaused(userPaused);
  if (reduce) pauseBtn.hidden = true;
  renderInfo();
  still();

  new ResizeObserver(() => { if (userPaused || reduce || !visible) still(); else layout(); }).observe(stage);
  new IntersectionObserver(es => {
    const v = es[0].isIntersecting;
    if (v && !visible) { visible = true; start(); }
    else if (!v && visible) { visible = false; stop(); still(); }
  }, { threshold: .35 }).observe(stage);

  return { goTo, setPaused, get chapter() { return ci; } };
}

global.createUIStory = createUIStory;
})(window);
