/**
 * Spotlight — adaptado de React Bits (Components/SpotlightCard), sin React
 * https://reactbits.dev · https://github.com/DavidHDev/react-bits
 *
 * Copyright (c) 2026 David Haz
 * MIT + Commons Clause License Condition v1.0 (texto completo en
 * src/components/react-bits/LICENSE.md). Permission is hereby granted, free of charge, to any
 * person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, and distribute the Software as part of an application, website,
 * or product, subject to the following conditions: The above copyright notice and this
 * permission notice shall be included in all copies or substantial portions of the Software.
 * Commons Clause: you may not sell, sublicense, or redistribute the components themselves,
 * whether alone, in a bundle, or as a ported version. THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND.
 *
 * Cambios para esta web (Emil Kowalski: decorativo, sutil y barato):
 * - Sin React (~0,4 KB): una capa .spotlight por tarjeta [data-spotlight], creada aquí.
 * - La luz se mueve con `transform` en su propia capa (el original reescribía variables CSS en
 *   la tarjeta → recálculo de estilos de todos sus hijos en cada movimiento del ratón).
 * - Un solo cálculo por fotograma (requestAnimationFrame).
 * - Solo con ratón fino (hover: hover + pointer: fine) y sin «reducir movimiento».
 * - Aparece con opacity (ease, 300 ms) y se apaga algo más rápido.
 * Estilos: src/styles/global.css §6 («Tarjetas con foco de luz»).
 */
export function initSpotlight(selector = '[data-spotlight]'): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll<HTMLElement>(selector).forEach((card) => {
    if (card.querySelector(':scope > .spotlight')) return;
    const light = document.createElement('span');
    light.className = 'spotlight';
    light.setAttribute('aria-hidden', 'true');
    card.prepend(light);

    let raf = 0;
    let cx = 0;
    let cy = 0;
    const paint = () => {
      raf = 0;
      const r = card.getBoundingClientRect(); // una lectura por fotograma (sin layout pendiente)
      light.style.transform = `translate3d(${(cx - r.left).toFixed(1)}px, ${(cy - r.top).toFixed(1)}px, 0)`;
    };
    const track = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX;
      cy = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX;
      cy = e.clientY;
      paint(); // aparece donde está el ratón, sin deslizarse desde la esquina
    });
    card.addEventListener('pointermove', track);
  });
}
