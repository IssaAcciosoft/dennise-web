/**
 * CircularGallery — adaptado de React Bits (Components/CircularGallery)
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
 * Cambios para esta web:
 * - Cero peticiones a terceros: sin Google Fonts; los rótulos usan las fuentes del sitio.
 * - No secuestra la rueda ni los toques de toda la página: arrastre con Pointer Events solo
 *   sobre la galería (con captura del puntero y `touch-action: pan-y`, el scroll vertical sigue
 *   siendo nativo); la rueda solo cuenta si el gesto es horizontal (trackpad).
 * - Sin ondulación en reposo: la deformación solo aparece con la velocidad. Cuando la galería
 *   se detiene, el bucle de render también (no hay rAF permanente) → nada se mueve solo.
 * - API para botones (anterior / siguiente) y `onIndexChange` (región aria-live del padre).
 * - `onReady` cuando la primera foto está en la GPU (el padre funde el lienzo sobre la lista
 *   estática accesible). DPR máximo 1,5; ResizeObserver del contenedor; curva en arco ajustable.
 */
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

type GL = Renderer['gl'];

export interface GalleryItem {
  image: string;
  text: string;
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

async function ensureFont(font: string): Promise<void> {
  try {
    if (document.fonts?.load) await document.fonts.load(font);
  } catch {
    /* la fuente del sistema sirve de respaldo */
  }
}

function createTextTexture(gl: GL, text: string, font: string, color: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2d context');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.3);
  canvas.width = textWidth + 24;
  canvas.height = textHeight + 16;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  mesh: Mesh;

  constructor(gl: GL, plane: Mesh, text: string, textColor: string, font: string, textScale: number) {
    const { texture, width, height } = createTextTexture(gl, text, font, textColor);
    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });
    this.mesh = new Mesh(gl, { geometry, program });
    const aspect = width / height;
    const textHeightScaled = plane.scale.y * textScale;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled / plane.scale.x, textHeightScaled / plane.scale.y, 1);
    this.mesh.position.y = -0.5 - (textHeightScaled * 0.5 + 0.08 * plane.scale.y) / plane.scale.y;
    this.mesh.setParent(plane);
  }
}

interface Size {
  width: number;
  height: number;
}

class Media {
  extra = 0;
  plane: Mesh;
  program: Program;
  width = 0;
  widthTotal = 0;
  x = 0;
  speed = 0;

  constructor(
    gl: GL,
    geometry: Plane,
    scene: Transform,
    private image: string,
    private index: number,
    private length: number,
    private viewport: Size,
    private bend: number,
    private planeHeight: number,
    borderRadius: number,
    private onLoad: (index: number) => void,
  ) {
    const texture = new Texture(gl, { generateMipmaps: true });
    this.program = new Program(gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          // Solo se ondula mientras se mueve (en reposo, plano).
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * clamp(uSpeed * 0.35, -0.4, 0.4);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uLoaded;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = mix(vec4(0.227, 0.114, 0.267, 1.0), texture2D(tMap, uv), uLoaded);
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [1, 1] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: borderRadius },
        uLoaded: { value: 0 },
      },
      transparent: true,
    });
    const img = new Image();
    img.decoding = 'async';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      this.program.uniforms.uLoaded.value = 1;
      this.onLoad(this.index);
    };
    this.plane = new Mesh(gl, { geometry, program: this.program });
    this.plane.setParent(scene);
    this.onResize();
  }

  update(scroll: { current: number; last: number }, direction: 'right' | 'left') {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B = Math.abs(this.bend);
      const R = (H * H + B * B) / (2 * B);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    const isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    const isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && isBefore) this.extra -= this.widthTotal;
    if (direction === 'left' && isAfter) this.extra += this.widthTotal;
  }

  onResize(next?: { viewport: Size; bend: number }) {
    if (next) {
      this.viewport = next.viewport;
      this.bend = next.bend;
    }
    // Planos 3:4 cuya altura es `planeHeight` del alto de la galería.
    this.plane.scale.y = this.viewport.height * this.planeHeight;
    this.plane.scale.x = this.plane.scale.y * 0.75;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    const padding = Math.max(1.2, this.plane.scale.x * 0.22);
    this.width = this.plane.scale.x + padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

export interface CircularGalleryHandle {
  /** Avanza (1) o retrocede (-1) una foto. */
  go: (delta: number) => void;
}

interface AppOptions {
  items: GalleryItem[];
  bend: number;
  textColor: string;
  borderRadius: number;
  font: string;
  scrollEase: number;
  planeHeight: number;
  /** Desplaza el conjunto hacia arriba (fracción del alto) para dejar sitio a los rótulos. */
  offsetY: number;
  dragSpeed: number;
  onReady: () => void;
  onIndexChange: (index: number) => void;
}

class App {
  renderer: Renderer;
  gl: GL;
  camera: Camera;
  scene = new Transform();
  medias: Media[] = [];
  screen: Size = { width: 1, height: 1 };
  viewport: Size = { width: 1, height: 1 };
  scroll = { ease: 0.08, current: 0, target: 0, last: 0, position: 0 };
  raf = 0;
  running = false;
  isDown = false;
  startX = 0;
  pointerId = -1;
  lastIndex = -1;
  ready = false;
  ro: ResizeObserver;
  bendBase: number;

  constructor(
    private container: HTMLElement,
    private opts: AppOptions,
  ) {
    this.scroll.ease = opts.scrollEase;
    this.bendBase = opts.bend;
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    const canvas = this.gl.canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(canvas);
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
    this.measure();

    const geometry = new Plane(this.gl, { heightSegments: 24, widthSegments: 48 });
    const doubled = opts.items.concat(opts.items);
    this.medias = doubled.map(
      (item, index) =>
        new Media(
          this.gl,
          geometry,
          this.scene,
          item.image,
          index,
          doubled.length,
          this.viewport,
          this.bend(),
          opts.planeHeight,
          opts.borderRadius,
          (i) => this.onMediaLoad(i),
        ),
    );
    // Rótulos (cuando la fuente del sitio está lista).
    ensureFont(opts.font).then(() => {
      if (!this.gl) return;
      this.medias.forEach((m, i) => new Title(this.gl, m.plane, doubled[i].text, opts.textColor, opts.font, 0.1));
      this.requestRender();
    });

    container.addEventListener('pointerdown', this.onPointerDown);
    container.addEventListener('pointermove', this.onPointerMove);
    container.addEventListener('pointerup', this.onPointerUp);
    container.addEventListener('pointercancel', this.onPointerUp);
    container.addEventListener('wheel', this.onWheel, { passive: false });
    this.ro = new ResizeObserver(() => {
      this.measure();
      this.medias.forEach((m) => m.onResize({ viewport: this.viewport, bend: this.bend() }));
      this.snap();
      this.requestRender();
    });
    this.ro.observe(container);
    this.requestRender();
  }

  bend() {
    // Arco más suave en pantallas estrechas (con pocas fotos a la vista).
    return this.screen.width < 700 ? this.bendBase * 0.45 : this.bendBase;
  }

  measure() {
    this.screen = { width: this.container.clientWidth || 1, height: this.container.clientHeight || 1 };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    this.viewport = { width: height * this.camera.aspect, height };
    this.scene.position.y = height * this.opts.offsetY;
  }

  onMediaLoad(index: number) {
    if (!this.ready && index === 0) {
      this.ready = true;
      this.opts.onReady();
    }
    this.requestRender();
  }

  itemWidth() {
    return this.medias[0]?.width ?? 1;
  }

  snap() {
    const width = this.itemWidth();
    this.scroll.target = Math.round(this.scroll.target / width) * width;
  }

  go(delta: number) {
    this.snap();
    this.scroll.target += this.itemWidth() * delta;
    this.requestRender();
  }

  reportIndex() {
    const n = this.opts.items.length;
    const raw = Math.round(this.scroll.target / this.itemWidth());
    const index = ((raw % n) + n) % n;
    if (index !== this.lastIndex) {
      this.lastIndex = index;
      this.opts.onIndexChange(index);
    }
  }

  onPointerDown = (e: PointerEvent) => {
    if (this.isDown || (e.pointerType === 'mouse' && e.button !== 0)) return; // multitáctil: ignorar el segundo dedo
    this.isDown = true;
    this.pointerId = e.pointerId;
    this.scroll.position = this.scroll.current;
    this.startX = e.clientX;
    this.container.setPointerCapture?.(e.pointerId);
    this.container.dataset.dragging = '';
    this.requestRender();
  };

  onPointerMove = (e: PointerEvent) => {
    if (!this.isDown || e.pointerId !== this.pointerId) return;
    const distance = (this.startX - e.clientX) * (this.viewport.width / this.screen.width) * this.opts.dragSpeed;
    this.scroll.target = this.scroll.position + distance;
    this.requestRender();
  };

  onPointerUp = (e: PointerEvent) => {
    if (!this.isDown || e.pointerId !== this.pointerId) return;
    this.isDown = false;
    this.pointerId = -1;
    delete this.container.dataset.dragging;
    this.snap();
    this.requestRender();
  };

  wheelTimer = 0;
  onWheel = (e: WheelEvent) => {
    // Solo gestos horizontales (trackpad); la rueda vertical sigue desplazando la página.
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    this.scroll.target += e.deltaX * (this.viewport.width / this.screen.width) * 0.6;
    window.clearTimeout(this.wheelTimer);
    this.wheelTimer = window.setTimeout(() => {
      this.snap();
      this.requestRender();
    }, 140);
    this.requestRender();
  };

  requestRender() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.update);
  }

  update = () => {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const settled = !this.isDown && Math.abs(this.scroll.target - this.scroll.current) < 0.002;
    if (settled) this.scroll.current = this.scroll.target;
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    this.medias.forEach((m) => m.update(this.scroll, direction));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.reportIndex();
    if (settled) {
      this.running = false; // en reposo: sin bucle
      return;
    }
    this.raf = requestAnimationFrame(this.update);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    this.running = false;
    window.clearTimeout(this.wheelTimer);
    this.ro.disconnect();
    const c = this.container;
    c.removeEventListener('pointerdown', this.onPointerDown);
    c.removeEventListener('pointermove', this.onPointerMove);
    c.removeEventListener('pointerup', this.onPointerUp);
    c.removeEventListener('pointercancel', this.onPointerUp);
    c.removeEventListener('wheel', this.onWheel);
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

interface CircularGalleryProps {
  items: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  /** Fuente CSS de los rótulos (ya cargada por la web), p. ej. 'italic 500 56px "Cormorant Garamond"'. */
  font?: string;
  scrollEase?: number;
  /** Alto de cada foto respecto al alto de la galería (0–1). */
  planeHeight?: number;
  /** Desplazamiento vertical del conjunto (fracción del alto; positivo = arriba). */
  offsetY?: number;
  dragSpeed?: number;
  className?: string;
  onReady?: () => void;
  onIndexChange?: (index: number) => void;
}

const CircularGallery = forwardRef<CircularGalleryHandle, CircularGalleryProps>(function CircularGallery(
  {
    items,
    bend = 2,
    textColor = '#ffffff',
    borderRadius = 0.03,
    font = '500 48px sans-serif',
    scrollEase = 0.08,
    planeHeight = 0.66,
    offsetY = 0.08,
    dragSpeed = 1,
    className = '',
    onReady,
    onIndexChange,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);
  const cbRef = useRef({ onReady, onIndexChange });
  cbRef.current = { onReady, onIndexChange };

  useImperativeHandle(ref, () => ({ go: (delta: number) => appRef.current?.go(delta) }), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let app: App | null = null;
    try {
      app = new App(el, {
        items,
        bend,
        textColor,
        borderRadius,
        font,
        scrollEase,
        planeHeight,
        offsetY,
        dragSpeed,
        onReady: () => cbRef.current.onReady?.(),
        onIndexChange: (i) => cbRef.current.onIndexChange?.(i),
      });
    } catch {
      app = null; // sin WebGL: se queda la lista estática
    }
    appRef.current = app;
    return () => {
      app?.destroy();
      appRef.current = null;
    };
  }, [items, bend, textColor, borderRadius, font, scrollEase, planeHeight, offsetY, dragSpeed]);

  return <div ref={containerRef} className={`circular-gallery ${className}`.trim()} />;
});

export default CircularGallery;
