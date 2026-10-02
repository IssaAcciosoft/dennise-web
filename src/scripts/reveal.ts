/**
 * Aparición única al hacer scroll (sistema de movimiento, src/styles/global.css §9).
 *
 * - Sin JavaScript todo se ve: el CSS no oculta nada por defecto. Este script solo marca como
 *   «pending» los [data-reveal] que, al cargar, están por DEBAJO de la pantalla (invisibles
 *   de todos modos), así que nunca hay parpadeo ni se toca el contenido inicial / LCP.
 * - IntersectionObserver: cuando entran, «in» (una sola vez) y se dejan de observar.
 * - Escalonado: los que entran en el mismo lote se retrasan --stagger (50 ms) entre sí.
 * - Nunca bloquea: si algo pendiente recibe el foco (teclado), aparece al instante.
 * - Con «reducir movimiento» el CSS lo convierte en un fundido corto de opacidad.
 */
const STAGGER_MS = 50;
const MAX_STEPS = 6;

export function initReveal(root: ParentNode = document): void {
  if (!('IntersectionObserver' in window)) return;
  const all = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-state])'));
  if (!all.length) return;

  // Lecturas primero (un único cálculo de layout) y escrituras después.
  const fold = window.innerHeight;
  const below = all.filter((el) => el.getBoundingClientRect().top > fold);
  if (!below.length) return;

  const show = (el: HTMLElement, delay = 0) => {
    if (el.dataset.revealState !== 'pending') return;
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.dataset.revealState = 'in';
    // Al terminar TODAS sus animaciones (las fotos tienen varias: fundido, clip y escala),
    // «done»: ya no puede volver a reproducirse si el elemento se oculta y se muestra.
    requestAnimationFrame(() => {
      const anims = typeof el.getAnimations === 'function' ? el.getAnimations({ subtree: true }) : [];
      Promise.all(anims.map((a) => a.finished))
        .catch(() => undefined)
        .then(() => {
          el.dataset.revealState = 'done';
          el.style.removeProperty('--reveal-delay');
        });
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      const entering = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      entering.forEach((entry, i) => {
        io.unobserve(entry.target);
        show(entry.target as HTMLElement, Math.min(i, MAX_STEPS) * STAGGER_MS);
      });
    },
    // Aparece cuando su borde superior cruza el 92 % de la pantalla.
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );

  for (const el of below) {
    el.dataset.revealState = 'pending';
    io.observe(el);
  }

  // Teclado / lectores: lo que recibe el foco no puede quedarse invisible.
  document.addEventListener('focusin', (e) => {
    const pending = (e.target as Element | null)?.closest<HTMLElement>('[data-reveal-state="pending"]');
    if (pending) {
      io.unobserve(pending);
      show(pending);
    }
  });
}
