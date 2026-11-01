

(() => {
  'use strict';
  const owner = document.querySelector('.vs-experience-section');
  if (!owner || !owner.matches('.vs-experience-section')) return;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  owner.querySelectorAll('.vs-stack-cards').forEach(root => {
    if (root.vsStackCards) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const phone = matchMedia('(max-width: 760px)');
    const probe = document.createElement('div');
    probe.className = 'vs-stack-cards-viewport-probe';
    probe.setAttribute('aria-hidden', 'true');
    root.append(probe);
    const cards = [...root.querySelectorAll('.vs-stack-cards-card')].map((el, i) => {
      el.style.setProperty('--i', i);
      const grid = el.querySelector('.vs-stack-cards-grid');
      grid.tabIndex = 0;
      grid.setAttribute('role', 'region');
      grid.setAttribute('aria-label', 'Role details; scroll for more when needed');
      const hint = document.createElement('span');
      hint.className = 'vs-stack-cards-scroll-hint';
      hint.textContent = 'Scroll for all details ↕';
      hint.setAttribute('aria-hidden', 'true');
      el.querySelector('.vs-stack-cards-inner').append(hint);
      return { el, i, inner: el.querySelector('.vs-stack-cards-inner'),
        grid, hint,
        img: el.querySelector('.vs-stack-cards-media img'),
        shade: el.querySelector('.vs-stack-cards-shade'),
        tab: el.querySelector('.vs-stack-cards-tab'),
        d: 0, dv: 0, t: 0, tv: 0, buried: false, nearby: false,
        transform: '', opacity: '', imageTransform: '' };
    });
    const n = cards.length;
    if (!n) return;
    let pins = [], spans = [], reveals = [], starts = [];
    let naturalHeight = 0, cardHeight = 0, viewHeight = 0, pinTop = 0;
    let depth = .05, dim = .45, blur = 0, lift = 7, topIndex = -1;
    let raf = 0, measureRaf = 0, needsNatural = false, active = false, destroyed = false;
    let lastTime = 0, previousScroll = scrollY, velocity = 0;
    let width = root.clientWidth, windowWidth = innerWidth, windowHeight = innerHeight;
    let lastOwnStyle = '';
    root.style.setProperty('--vs-stack-cards-n', n);
    root.dataset.vsReady = '1';

    // Only real layout changes measure content. Address-bar animations and
    // scroll events never reflow or resize the deck.
    function measure(contentChanged = false) {
      if (destroyed) return;
      const cs = getComputedStyle(root);
      const number = (name, fallback) => {
        const value = parseFloat(cs.getPropertyValue(name));
        return Number.isFinite(value) ? value : fallback;
      };
      depth = number('--vs-stack-cards-depth', .05);
      dim = number('--vs-stack-cards-dim', .45);
      blur = phone.matches ? 0 : number('--vs-stack-cards-blur', 0);
      const offset = number('--vs-stack-cards-offset', 36);
      const preferred = number('--vs-stack-cards-preferred-top', 12);
      if (contentChanged || !naturalHeight) {
        root.classList.add('vs-stack-cards-measuring');
        naturalHeight = Math.ceil(Math.max(...cards.map(c => c.inner.offsetHeight))) + 4;
        root.classList.remove('vs-stack-cards-measuring');
      }
      // 100svh stays steady when mobile browser controls collapse on a swipe.
      viewHeight = probe.offsetHeight || windowHeight;
      const heading = owner.querySelector('.vs-experience-heading');
      const headingStyle = getComputedStyle(heading);
      const sectionStyle = getComputedStyle(owner);
      const headerSpace = heading.offsetHeight + (parseFloat(headingStyle.marginBottom) || 0) + (parseFloat(sectionStyle.paddingTop) || 0) + 16;
      const deckSpace = preferred + (n - 1) * offset;
      const available = Math.max(140, viewHeight - Math.max(headerSpace, deckSpace) - 20);
      cardHeight = Math.min(naturalHeight, phone.matches ? 620 : 500, available);
      pinTop = preferred;
      const h = cardHeight + 'px', top = pinTop + 'px';
      if (root.style.getPropertyValue('--vs-stack-cards-h') !== h) root.style.setProperty('--vs-stack-cards-h', h);
      if (root.style.getPropertyValue('--vs-stack-cards-top') !== top) root.style.setProperty('--vs-stack-cards-top', top);
      lastOwnStyle = root.getAttribute('style');
      cards.forEach(c => {
        c.el.classList.toggle('vs-stack-cards-has-overflow', c.grid.scrollHeight > c.grid.clientHeight + 2);
      });
      const gap = n > 1 ? parseFloat(getComputedStyle(cards[1].el).marginTop) || 0 : 0;
      const origin = root.getBoundingClientRect().top + scrollY;
      starts = cards.map((c, i) => origin + i * (cardHeight + gap));
      pins = cards.map((c, i) => starts[i] - (pinTop + i * offset));
      spans = cards.map((c, i) => i ? Math.max(1, cardHeight + gap - offset) : 1);
      reveals = starts.map(y => y - viewHeight * .85);
      lift = Math.max(2, offset * .2);
      previousScroll = scrollY;
      velocity = 0;
      lastTime = 0;
      wake();
    }
    function queueMeasure(contentChanged = false) {
      needsNatural = needsNatural || contentChanged;
      if (measureRaf || destroyed) return;
      measureRaf = requestAnimationFrame(() => {
        measureRaf = 0;
        const natural = needsNatural; needsNatural = false;
        measure(natural);
      });
    }
    function wake() {
      if (active && !raf && !destroyed) raf = requestAnimationFrame(frame);
    }
    function frame(now) {
      raf = 0;
      if (!active || destroyed) return;
      const elapsed = lastTime ? (now - lastTime) / 1000 : 1 / 60;
      const dt = clamp(elapsed, 1 / 240, .05);
      lastTime = now;
      const y = scrollY;
      const speed = clamp((y - previousScroll) / Math.max(elapsed, 1 / 240), -5000, 5000);
      previousScroll = y;
      velocity += (speed - velocity) * (1 - Math.exp(-12 * dt));
      const progress = cards.map((c, i) => i ? clamp(1 - (pins[i] - y) / spans[i], 0, 1) : clamp(1 - (pins[0] - y) / 400, 0, 1));
      let moving = false, current = 0;
      const steps = Math.max(1, Math.ceil(dt * 240)), step = dt / steps;
      cards.forEach((c, i) => {
        let target = 0;
        for (let j = i + 1; j < n; j++) target += progress[j];
        const flying = progress[i] > 0 && progress[i] < 1;
        const tilt = flying ? clamp(-velocity * (phone.matches ? .0005 : .0024), phone.matches ? -1.25 : -5, phone.matches ? 1.25 : 5) : 0;
        if (reduce.matches) {
          c.d = target; c.t = 0; c.dv = c.tv = 0;
        } else if (phone.matches) {
          // Monotonic damping avoids spring overshoot under momentum scrolling.
          c.d += (target - c.d) * (1 - Math.exp(-22 * dt));
          c.t += (tilt - c.t) * (1 - Math.exp(-16 * dt));
          c.dv = c.tv = 0;
        } else {
          for (let k = 0; k < steps; k++) {
            c.dv += (-260 * (c.d - target) - 28 * c.dv) * step;
            c.d += c.dv * step;
            c.tv += (-180 * (c.t - tilt) - 20 * c.tv) * step;
            c.t += c.tv * step;
          }
        }
        const unsettled = Math.abs(c.d - target) > .0001 || Math.abs(c.dv) > .001 || Math.abs(c.t - tilt) > .001 || Math.abs(c.tv) > .01;
        moving = moving || unsettled;
        if (progress[i] > .985) current = i;
        if (i === 0 || y > reveals[i]) c.el.classList.add('is-in');
        const d = Math.max(0, c.d);
        const transform = reduce.matches ? '' : `translate3d(0,${(-d * lift).toFixed(2)}px,0) perspective(1600px) rotateX(${c.t.toFixed(3)}deg) scale(${Math.max(.55, 1 - d * depth).toFixed(4)})`;
        if (transform !== c.transform) { c.inner.style.transform = transform; c.transform = transform; }
        const opacity = reduce.matches ? '0' : Math.min(dim, d * dim * .55).toFixed(3);
        if (opacity !== c.opacity) { c.shade.style.opacity = opacity; c.opacity = opacity; }
        if (blur) c.inner.style.filter = `blur(${Math.min(blur, d * blur * .6).toFixed(2)}px)`;
        else if (c.inner.style.filter) c.inner.style.filter = '';
        const imageTransform = reduce.matches ? '' : `translate3d(0,${((1 - progress[i]) * (phone.matches ? 2 : 4) - (phone.matches ? 1 : 2)).toFixed(2)}%,0)`;
        if (c.img && imageTransform !== c.imageTransform) { c.img.style.transform = imageTransform; c.imageTransform = imageTransform; }
        const nearby = starts[i] - y < viewHeight * 1.5 && starts[i] - y + cardHeight > -cardHeight;
        if (nearby !== c.nearby) { c.nearby = nearby; c.el.classList.toggle('vs-stack-cards-nearby', nearby); }
        const buried = d > .5;
        if (buried !== c.buried) { c.buried = buried; c.el.classList.toggle('is-buried', buried); }
      });
      if (current !== topIndex) { topIndex = current; root.dataset.top = current; }
      if (!reduce.matches && (moving || Math.abs(velocity) > 2)) raf = requestAnimationFrame(frame);
      else { lastTime = 0; velocity = 0; }
    }
    function go(index, behavior) {
      if (!Number.isFinite(index)) return;
      measure(false);
      const i = clamp(Math.round(index), 0, n - 1);
      cards[i].grid.scrollTo({ top: 0, behavior: 'instant' });
      const top = pinTop + i * (parseFloat(getComputedStyle(root).getPropertyValue('--vs-stack-cards-offset')) || 36);
      // An explicit tab click navigates; ordinary scrolling stays browser-native.
      scrollTo({ top: Math.max(0, top < 0 ? starts[i] - 12 : pins[i] + 1), behavior: behavior || (reduce.matches ? 'instant' : 'smooth') });
    }
    const clicks = cards.map(c => {
      const handler = () => go(c.i);
      c.tab.tabIndex = 0;
      c.tab.addEventListener('click', handler);
      return handler;
    });
    const intersection = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !active) {
        active = true; previousScroll = scrollY; lastTime = 0; velocity = 0;
        addEventListener('scroll', wake, { passive: true });
        queueMeasure(false);
      } else if (!entry.isIntersecting && active) {
        active = false;
        removeEventListener('scroll', wake);
        cancelAnimationFrame(raf); raf = 0; lastTime = 0;
      }
    }, { rootMargin: '25% 0px' });
    const resize = new ResizeObserver(entries => {
      const next = entries[0].contentRect.width;
      if (Math.abs(next - width) > .5) { width = next; queueMeasure(true); }
    });
    const mutation = new MutationObserver(() => {
      if (root.getAttribute('style') !== lastOwnStyle) queueMeasure(true);
    });
    const onResize = () => {
      const changedWidth = Math.abs(innerWidth - windowWidth) > 1;
      const changedHeight = Math.abs(innerHeight - windowHeight) > 1;
      windowWidth = innerWidth; windowHeight = innerHeight;
      if (changedWidth || (!phone.matches && changedHeight)) queueMeasure(changedWidth);
    };
    const onMotion = () => queueMeasure(false);
    const onLoad = () => queueMeasure(false);
    measure(true);
    cards[0].el.classList.add('is-in');
    intersection.observe(root); resize.observe(root);
    mutation.observe(root, { attributes: true, attributeFilter: ['style'] });
    addEventListener('resize', onResize, { passive: true });
    addEventListener('load', onLoad, { once: true });
    reduce.addEventListener('change', onMotion);
    if (document.fonts) document.fonts.ready.then(() => { if (!destroyed) queueMeasure(true); });
    root.vsStackCards = {
      go, measure: () => queueMeasure(true),
      destroy() {
        destroyed = true; cancelAnimationFrame(raf); cancelAnimationFrame(measureRaf);
        intersection.disconnect(); resize.disconnect(); mutation.disconnect();
        removeEventListener('scroll', wake); removeEventListener('resize', onResize); removeEventListener('load', onLoad);
        reduce.removeEventListener('change', onMotion);
        cards.forEach((c, i) => c.tab.removeEventListener('click', clicks[i]));
        probe.remove(); cards.forEach(c => c.hint.remove()); delete root.vsStackCards; delete root.dataset.vsReady;
      }
    };
  });
})();
