/**
 * Datos de contacto, redes y navegación: ÚNICA fuente de verdad.
 * Si cambia el teléfono, se cambia solo aquí (enlaces wa.me, tel:, JSON-LD y textos visibles).
 * Fuente: docs/contenido.md §1.
 */

export const SITE = {
  name: 'Denisse González',
  /** Nombre completo (JSON-LD, páginas legales). */
  legalName: 'Denisse González Barbosa',
  role: 'Abogada',
  title: 'Denisse González · Abogada',
  description:
    'Denisse González, abogada mexicana en España: asesoría migratoria y trámites de extranjería online y presenciales, derecho internacional y derechos humanos.',
  motto: 'Escuchar. Conectar. Actuar.',
  tagline: 'Un trámite puede cambiar tu vida.',
  locale: 'es_ES',
  lang: 'es',
  themeColor: '#6E1D7A',
} as const;

/** PENDIENTE DE CONFIRMAR por la cliente (docs/contenido.md §7.1). */
export const PHONE = {
  /** Formato E.164, para tel: y JSON-LD. */
  e164: '+34670647593',
  /** Para https://wa.me/<wa> (sin «+» ni espacios). */
  wa: '34670647593',
  /** Para mostrar (espacios de no separación). */
  display: '+34 670 647 593',
} as const;

export const SOCIALS = [
  { id: 'facebook', label: 'Facebook', handle: 'Facebook', href: 'https://www.facebook.com/share/1GQdBrwuAy/' },
  { id: 'instagram', label: 'Instagram', handle: '@lic.denisseg', href: 'https://www.instagram.com/lic.denisseg' },
  { id: 'tiktok', label: 'TikTok', handle: '@lic.denissegb', href: 'https://www.tiktok.com/@lic.denissegb' },
] as const;

export type SocialId = (typeof SOCIALS)[number]['id'];

/** Mensajes predefinidos de WhatsApp. */
export const WA_TEXT = {
  general: 'Hola Denisse, me gustaría hacerte una consulta.',
  reserva: 'Hola Denisse, me gustaría reservar una asesoría. ¿Qué disponibilidad tienes?',
  historia: 'Hola Denisse, quiero compartir mi historia (Empoderando Voces).',
  autogestionaDudas: 'Hola Denisse, tengo dudas sobre el Programa Autogestiona. Mi trámite es: ',
} as const;

export function waLink(text?: string): string {
  const base = `https://wa.me/${PHONE.wa}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const TEL_LINK = `tel:${PHONE.e164}`;

/** Navegación principal (cabecera y pie). `path` sin base; se resuelve con `url()`. */
export const NAV = [
  { label: 'Conóceme', path: '/conoceme/' },
  { label: 'Servicios', path: '/servicios/' },
  { label: 'Derechos humanos', path: '/derechos-humanos/' },
  { label: 'Empoderando Voces', path: '/empoderando-voces/' },
  { label: 'Contacto', path: '/contacto/' },
] as const;

export const BOOKING_PATH = '/servicios/#reservar';

export const LEGAL_NAV = [
  { label: 'Aviso legal', path: '/aviso-legal/' },
  { label: 'Política de privacidad', path: '/politica-privacidad/' },
  { label: 'Condiciones de contratación', path: '/condiciones-contratacion/' },
] as const;
