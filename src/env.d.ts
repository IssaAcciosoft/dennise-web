/// <reference types="astro/client" />

// Módulo (export {}) para que `declare module 'astro'` amplíe los tipos de Astro, no los sustituya.
export {};

declare module 'astro' {
  interface AstroClientDirectives {
    /** Hidratación diferida propia (src/directives/deferred.ts). */
    'client:deferred'?: {
      media?: string;
      motion?: boolean;
      on?: 'idle' | 'visible';
      rootMargin?: string;
    };
  }
}

declare global {
  interface Window {
    /** View Transition de llegada a Empoderando Voces (la aurora espera a que termine). */
    __evTransition?: Promise<unknown>;
  }
}
