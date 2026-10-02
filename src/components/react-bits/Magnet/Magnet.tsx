/**
 * Magnet — adaptado de React Bits (Animations/Magnet)
 * https://reactbits.dev · https://github.com/DavidHDev/react-bits
 *
 * Copyright (c) 2026 David Haz
 * MIT + Commons Clause License Condition v1.0 (texto completo en ../LICENSE.md).
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish, and
 * distribute the Software as part of an application, website, or product, subject to the
 * following conditions: The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software. Commons Clause: you may not sell,
 * sublicense, or redistribute the components themselves, whether alone, in a bundle, or as a
 * ported version. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 *
 * Cambios para esta web (Emil Kowalski: movimiento decorativo, sutil y barato):
 * - Solo con ratón fino (hover: hover + pointer: fine) y sin «reducir movimiento».
 * - Desplazamiento máximo acotado (`maxOffset`): en un botón enorme, el original lo movía
 *   cientos de píxeles.
 * - El transform se escribe directamente en el elemento (sin re-render de React por cada
 *   movimiento del ratón) y se agrupa en un requestAnimationFrame.
 * - Curvas propias: ease-out al seguir y ease-in-out (más lento) al volver al reposo.
 * - Escucha `pointermove` solo mientras el elemento está en pantalla.
 */
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Distancia (px) alrededor del elemento en la que empieza a atraer. */
  padding?: number;
  disabled?: boolean;
  /** Mayor = más sutil (desplazamiento = distancia al centro / magnetStrength). */
  magnetStrength?: number;
  /** Desplazamiento máximo en px. */
  maxOffset?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

export default function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  maxOffset = 12,
  activeTransition = 'transform 240ms cubic-bezier(0.23, 1, 0.32, 1)',
  inactiveTransition = 'transform 520ms cubic-bezier(0.77, 0, 0.175, 1)',
  wrapperClassName = '',
  innerClassName = '',
  ...props
}: MagnetProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner || disabled) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return;

    let active = false;
    let frame = 0;
    let px = 0;
    let py = 0;
    const clamp = (v: number) => Math.max(-maxOffset, Math.min(maxOffset, v));

    const apply = () => {
      frame = 0;
      const { left, top, width, height } = wrap.getBoundingClientRect();
      const cx = left + width / 2;
      const cy = top + height / 2;
      const inside = Math.abs(cx - px) < width / 2 + padding && Math.abs(cy - py) < height / 2 + padding;
      if (inside) {
        if (!active) inner.style.transition = activeTransition;
        active = true;
        inner.style.transform = `translate3d(${clamp((px - cx) / magnetStrength)}px, ${clamp((py - cy) / magnetStrength)}px, 0)`;
      } else if (active) {
        active = false;
        inner.style.transition = inactiveTransition;
        inner.style.transform = 'translate3d(0, 0, 0)';
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const listen = (on: boolean) => {
      if (on) window.addEventListener('pointermove', onMove, { passive: true });
      else window.removeEventListener('pointermove', onMove);
    };
    const io = new IntersectionObserver(([entry]) => {
      listen(entry.isIntersecting);
      if (!entry.isIntersecting && active) {
        active = false;
        inner.style.transition = inactiveTransition;
        inner.style.transform = 'translate3d(0, 0, 0)';
      }
    }, { rootMargin: `${padding}px` });
    io.observe(wrap);

    return () => {
      io.disconnect();
      listen(false);
      cancelAnimationFrame(frame);
      inner.style.transform = '';
      inner.style.transition = '';
    };
  }, [padding, disabled, magnetStrength, maxOffset, activeTransition, inactiveTransition]);

  return (
    <div ref={wrapRef} className={wrapperClassName} {...props}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
