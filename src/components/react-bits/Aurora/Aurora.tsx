/**
 * Aurora — adaptado de React Bits (Backgrounds/Aurora)
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
 * Cambios para esta web (rendimiento y accesibilidad):
 * - `paused`: el bucle se detiene fuera de pantalla / con la pestaña oculta (lo decide el padre).
 * - Lienzo a media resolución (`dpr`, la aurora es difusa) y como mucho `fps` fotogramas/s.
 * - Colores convertidos una sola vez (antes, en cada fotograma); sin modo claro.
 * - ResizeObserver del contenedor en lugar de `resize` de la ventana.
 * - Si no hay WebGL2 (o falla el contexto) no se monta nada: queda el póster estático.
 * - `onReady` tras el primer fotograma (el padre funde el lienzo sobre el póster).
 */
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

export interface AuroraProps {
  /** Tres colores (izquierda, centro, derecha). */
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  /** Detiene el bucle de render (fuera de pantalla, pestaña oculta). */
  paused?: boolean;
  /** Resolución del lienzo respecto a los píxeles CSS. */
  dpr?: number;
  /** Fotogramas por segundo máximos. */
  fps?: number;
  className?: string;
  onReady?: () => void;
}

interface Loop {
  start: () => void;
  stop: () => void;
}

export default function Aurora({
  colorStops = ['#5227FF', '#7cff67', '#5227FF'],
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  paused = false,
  dpr = 0.5,
  fps = 30,
  className = '',
  onReady,
}: AuroraProps) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<Loop | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const stopsKey = colorStops.join(',');

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        dpr,
        webgl: 2,
        powerPreference: 'low-power',
      });
    } catch {
      return; // sin WebGL: se queda el póster
    }
    const gl = renderer.gl;
    if (!gl || !renderer.isWebgl2) {
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.backgroundColor = 'transparent';
    canvas.setAttribute('aria-hidden', 'true');

    const geometry = new Triangle(gl);
    delete (geometry.attributes as Record<string, unknown>).uv;

    const stops = stopsKey.split(',').map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: stops },
        uResolution: { value: [1, 1] },
        uBlend: { value: blend },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(canvas);

    const resize = () => {
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
      renderer.render({ scene: mesh });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(ctn);
    resize();

    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let running = false;
    let announced = false;
    const frameMs = 1000 / fps;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last && now - last < frameMs - 1) return;
      const dt = last ? Math.min(now - last, 100) : frameMs;
      last = now;
      elapsed += dt;
      program.uniforms.uTime.value = elapsed * 0.001 * speed;
      renderer.render({ scene: mesh });
      if (!announced) {
        announced = true;
        onReadyRef.current?.();
      }
    };
    const loop: Loop = {
      start() {
        if (running) return;
        running = true;
        last = 0;
        raf = requestAnimationFrame(tick);
      },
      stop() {
        running = false;
        cancelAnimationFrame(raf);
      },
    };
    loopRef.current = loop;
    if (!pausedRef.current) loop.start();

    return () => {
      loop.stop();
      loopRef.current = null;
      ro.disconnect();
      if (canvas.parentNode === ctn) ctn.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [stopsKey, amplitude, blend, speed, dpr, fps]);

  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (paused) loop.stop();
    else loop.start();
  }, [paused]);

  return <div ref={ctnRef} className={`aurora-container ${className}`.trim()} />;
}
