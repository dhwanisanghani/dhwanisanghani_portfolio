document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const burger = document.getElementById('dhwani-menu-toggle');
  const menu = document.getElementById('dhwani-overlay-menu');
  const blocks = [...document.querySelectorAll('#dhwani-overlay-wipe .dhwani-overlay-block')];
  const lines = [...menu.querySelectorAll('.dhwani-menu-item')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animated = !!window.gsap && !reducedMotion.matches;
  let isOpen = false;

  const hero = document.getElementById('dhwani-hero');
  const updateBrand = () => {
    const box = hero?.getBoundingClientRect();
    root.classList.toggle('dhwani-on-hero', !!box && box.top < 72 && box.bottom > 72);
  };
  window.addEventListener('scroll', updateBrand, { passive: true });
  updateBrand();

  // One reversible timeline: eight staggered downward wipes, then the links.
  const timeline = animated ? window.gsap.timeline({ paused: true }) : null;
  if (timeline) {
    timeline.to(blocks, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 1,
      stagger: 0.075,
      ease: 'power3.inOut'
    });
    timeline.to(lines, { opacity: 1, duration: 0.3, stagger: 0.05 }, '-=0.5');
  } else {
    root.classList.add('dhwani-menu-fallback');
  }

  function toggle(force) {
    const opening = typeof force === 'boolean' ? force : !isOpen;
    if (opening === isOpen) return;
    isOpen = opening;
    burger.classList.toggle('is-active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    menu.setAttribute('aria-hidden', String(!isOpen));
    menu.inert = !isOpen;
    if (timeline) {
      isOpen ? timeline.play() : timeline.reverse();
    } else if (reducedMotion.matches) {
      blocks.forEach(block => { block.style.clipPath = isOpen
        ? 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)'
        : 'polygon(0% 0%,100% 0%,100% 0%,0% 0%)'; });
      lines.forEach(line => { line.style.opacity = isOpen ? '1' : '0'; });
    } else {
      root.classList.toggle('dhwani-menu-open', isOpen);
    }
    if (isOpen) {
      window.setTimeout(() => {
        if (isOpen) menu.querySelector('a')?.focus({ preventScroll: true });
      }, animated ? 1250 : reducedMotion.matches ? 0 : 1250);
    }
  }

  burger.addEventListener('click', () => toggle());
  menu.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start'});
        history.replaceState(null, '', link.getAttribute('href'));
      }
      toggle(false);
    });
  });
  document.querySelector('#dhwani-overlay-nav .dhwani-nav-mark')?.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', event => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      toggle(false);
      burger.focus();
    } else if (event.key === 'Tab') {
      const focusable = [burger, ...menu.querySelectorAll('a')];
      const current = focusable.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && current === focusable.length - 1) {
        event.preventDefault();
        burger.focus();
      }
    }
  });
});
