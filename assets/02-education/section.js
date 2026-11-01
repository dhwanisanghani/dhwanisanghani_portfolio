
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const K = 170;                      // stiffness, shared by every panel (that is what keeps the weights summed to 1)
  function init(root) {
    if (root.dataset.vsReady) return; root.dataset.vsReady = '1';
    const q = (el, s) => el.querySelector('.vs-accordion-gallery-' + s);
    const panels = [...root.querySelectorAll('.vs-accordion-gallery-panel')].map((el) => {
      const copy = q(el, 'copy');
      return { el, win: q(el, 'win'), body: q(el, 'body'), img: q(el, 'img'), dim: q(el, 'dim'), shade: q(el, 'shade'),
        spine: q(el, 'spine'), hit: q(el, 'hit'), bits: copy ? [...copy.children] : [], meta: q(el, 'meta'),
        w: { x: 0, v: 0, t: 0 }, pr: { x: 0, v: 0, t: 0 } };
    });
    const n = panels.length; if (!n) return;
    let active = clamp(+root.dataset.open || 0, 0, n - 1), raf = 0, last = 0;
    let seen = null, L = 0, E = 0, Ew = 0, c = 72, g = 8, axis = 'x', C = 20, drift = 14, visible = true, interacted = false, hoverT = 0;
    const px = { x: 0, v: 0, t: 0 };  // pointer drift spring, -1..1 across the row
    const sp = { x: 0, y: 0, t: 0, speed: 0 };
    panels[active].w.x = panels[active].w.t = 1;
    const css = (k, d) => { const v = parseFloat(getComputedStyle(root).getPropertyValue(k)); return Number.isFinite(v) ? v : d; };

    const readProps = () => {
      const b = clamp(css('--vs-accordion-gallery-bounce', 0.5), 0, 1);
      C = 2 * (1 - 0.62 * b) * Math.sqrt(K);          // damping ratio 1 (no overshoot) .. 0.38 (lively)
      drift = css('--vs-accordion-gallery-drift', 14);
    };
    const measure = () => {
      readProps();
      axis = root.clientWidth < css('--vs-accordion-gallery-stack-at', 640) ? 'y' : 'x';
      root.classList.toggle('is-stacked', axis === 'y');
      c = axis === 'x' ? css('--vs-accordion-gallery-closed', 72) : css('--vs-accordion-gallery-closed-y', 56);
      g = css('--vs-accordion-gallery-gap', 8);
      if (axis === 'y') {
        E = Math.round(root.clientWidth * css('--vs-accordion-gallery-open-y', 1.05));
        // Optional per-section height limits keep mobile copy in view without changing the springs.
        E = Math.max(css('--vs-accordion-gallery-open-min-y', 0), Math.min(E, css('--vs-accordion-gallery-open-max-y', Infinity)));
        L = E + (n - 1) * (c + g); if (root.style.height !== L + 'px') root.style.height = L + 'px';
      } else { if (root.style.height) root.style.height = ''; L = root.clientWidth; E = L - (n - 1) * (c + g); }
      Ew = Math.round(E + (E - c) * 0.35);           // headroom for the overshoot
      root.style.setProperty('--vs-accordion-gallery-slack', (axis === 'y' ? Ew - E : 0) + 'px');
      root.style.setProperty('--vs-accordion-gallery-open', E + 'px');   // the copy never outgrows the open panel
      for (const p of panels) {
        p.el.style.width = axis === 'x' ? Ew + 'px' : '100%'; p.el.style.height = axis === 'y' ? Ew + 'px' : '100%';
      }
      seen = root.getAttribute('style');
      render();
    };
    const sizes = new Float64Array(64);
    const render = () => {
      // Sizes from the weights. A weight that dips below 0 (the closing panel's undershoot) is
      // clipped, and the width it would have taken is shared out evenly by every other panel,
      // so the opener overshoots, the rest of the row gives way, and the row stays exactly full.
      const m = c * 0.5, target = E + (n - 1) * c; let sum = 0, big = 0;
      for (let i = 0; i < n; i++) {
        const s = Math.min(c + Math.max(0, panels[i].w.x) * (E - c), Ew); sizes[i] = s; sum += s;
        if (s > sizes[big]) big = i;
      }
      const share = (sum - target) / (n - 1);
      sum = 0;
      for (let i = 0; i < n; i++) { if (i !== big) sizes[i] = Math.max(m, sizes[i] - share); sum += sizes[i]; }
      sizes[big] = clamp(sizes[big] + target - sum, m, Ew);
      // snap every clip edge to the device pixel grid so the stacked layers never disagree by a sliver
      const dpr = devicePixelRatio || 1, snap = (v) => Math.round(v * dpr) / dpr;
      const T = axis === 'x' ? ((v) => `translate3d(${snap(v)}px,0,0)`) : ((v) => `translate3d(0,${snap(v)}px,0)`);
      let pos = 0;
      for (let i = 0; i < n; i++) {
        const p = panels[i], at = snap(pos), size = snap(pos + sizes[i]) - at, hide = Ew - size, w = clamp(p.w.x, 0, 1), pr = p.pr.x;
        p.el.style.transform = T(at);
        p.win.style.transform = T(-hide);
        p.body.style.transform = T(hide);
        const d = axis === 'x' ? px.x * drift * w : 0;
        p.img.style.transform = `${axis === 'x' ? `translate3d(${(-hide / 2 + d).toFixed(2)}px,0,0)` : `translate3d(0,${(-hide / 2).toFixed(2)}px,0)`} scale(${(1.1 - 0.1 * w - 0.025 * pr).toFixed(4)})`;
        p.dim.style.opacity = (0.46 * (1 - w) + 0.18 * pr).toFixed(3);
        p.shade.style.opacity = (0.5 + 0.5 * w).toFixed(3);
        p.spine.style.opacity = (1 - smooth(0.02, 0.28, w)).toFixed(3);
        p.bits.forEach((b, k) => {                    // title, line, meta arrive one after another
          const o = smooth(0.5 + k * 0.1, 0.92 + k * 0.04, w);
          b.style.opacity = o.toFixed(3);
          b.style.transform = `translate3d(0,${((1 - o) * (16 + k * 6)).toFixed(2)}px,0)`;
        });
        if (p.meta) p.meta.style.setProperty('--vs-accordion-gallery-rule', smooth(0.8, 1, w).toFixed(3));
        pos += sizes[i] + g;           // accumulate the exact sizes, snap only the edges: no drift
      }
    };
    const springs = () => { const a = [px]; for (const p of panels) a.push(p.w, p.pr); return a; };
    const settled = (s) => Math.abs(s.x - s.t) < 1e-4 && Math.abs(s.v) < 1e-3;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const p of panels) {
          const s = p.w; s.v += (-K * (s.x - s.t) - C * s.v) * h; s.x += s.v * h;
          const r = p.pr; r.v += (-600 * (r.x - r.t) - 40 * r.v) * h; r.x += r.v * h;
        }
        px.v += (-60 * (px.x - px.t) - 15.5 * px.v) * h; px.x += px.v * h;
      }
      render();
      const all = springs();
      if (!visible || all.every(settled)) { all.forEach((s) => { s.x = s.t; s.v = 0; }); render(); raf = 0; }
      else raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (reduce.matches) { springs().forEach((s) => { s.x = s.t; s.v = 0; }); render(); return; }
      if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const mark = () => panels.forEach((p, j) => {
      p.el.classList.toggle('is-open', j === active);
      p.hit.setAttribute('aria-expanded', String(j === active));
      p.hit.tabIndex = j === active ? 0 : -1;          // roving tab stop: Tab enters the row once, arrows move within it
    });
    const open = (i) => {
      i = clamp(i, 0, n - 1);
      if (i === active && panels[i].w.t === 1) return;
      active = i; panels.forEach((p, j) => { p.w.t = j === i ? 1 : 0; }); mark(); kick();
      root.dispatchEvent(new CustomEvent('vs-accordion-gallery:open', { detail: { index: i } }));
    };
    root.vsOpen = open;

    // pointer: velocity-aware hover intent + drift
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now(), dtm = Math.max(1, now - sp.t);
      const dist = Math.hypot(e.clientX - sp.x, e.clientY - sp.y);
      sp.speed = sp.speed * 0.6 + (dist / dtm) * 1000 * 0.4; sp.x = e.clientX; sp.y = e.clientY; sp.t = now;
      const r = root.getBoundingClientRect();
      px.t = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1) * -1;
      if (drift) kick();
    });
    root.addEventListener('pointerleave', () => { px.t = 0; clearTimeout(hoverT); kick(); });
    panels.forEach((p, i) => {
      p.el.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(hoverT);
        // hover intent: the wait grows with pointer speed, and while the pointer is still travelling
        // fast it keeps waiting, so sweeping across the row to reach a far panel opens only that one
        const fire = () => {
          if (performance.now() - sp.t < 45 && sp.speed > 900) { hoverT = setTimeout(fire, 45); return; }
          interacted = true; open(i);
        };
        hoverT = setTimeout(fire, 50 + clamp((sp.speed - 600) * 0.08, 0, 170));
      });
      p.el.addEventListener('pointerleave', () => clearTimeout(hoverT));
      p.el.addEventListener('pointerdown', () => { p.pr.t = 1; kick(); });
      const up = () => { if (p.pr.t) { p.pr.t = 0; kick(); } };
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => p.el.addEventListener(t, up));
      p.hit.addEventListener('click', () => { interacted = true; clearTimeout(hoverT); open(i); });
      p.hit.addEventListener('keydown', (e) => {
        const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault(); interacted = true;
        const j = clamp(next, 0, n - 1); panels[j].hit.focus({ preventScroll: true }); open(j);
      });
    });
    mark();

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(root);
    const every = +root.dataset.autoplay;
    if (every > 0 && !reduce.matches) {
      const loop = setInterval(() => {
        if (interacted) return clearInterval(loop);
        if (visible && !root.matches(':hover')) open((active + 1) % n);
      }, every);
    }
    let measureRaf = 0;
    new ResizeObserver(() => { if (!measureRaf) measureRaf = requestAnimationFrame(() => { measureRaf = 0; measure(); }); }).observe(root);
    new MutationObserver(() => { if (root.getAttribute('style') !== seen) measure(); }).observe(root, { attributes: true, attributeFilter: ['style'] });
    measure();
  }
  const boot = () => document.querySelectorAll('.vs-accordion-gallery').forEach(init);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
