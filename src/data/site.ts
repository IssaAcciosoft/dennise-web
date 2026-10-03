/**
 * Datos de contacto, redes y navegación: ÚNICA fuente de verdad.
 * Si cambia el teléfono, se cambia solo aquí (enlaces wa.me, tel:, JSON-LD y textos visibles).
 * Fuente: docs/contenido.md §1.
 */

export const SITE = {
  name: 'Denisse González',
  /** Nombre comercial del despacho (JSON-LD LegalService, pie, contacto, páginas legales). */
  firm: 'DG Gestores y Abogados',
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

/** Confirmado por la cliente (web anterior, docs/contenido.md §1). */
export const PHONE = {
  /** Formato E.164, para tel: y JSON-LD. */
  e164: '+34670647593',
  /** Para https://wa.me/<wa> (sin «+» ni espacios). */
  wa: '34670647593',
  /** Para mostrar (espacios de no separación). */
  display: '+34 670 647 593',
} as const;

/** Email de contacto (confirmado el 02/10/2026, docs/contenido.md §1). */
export const EMAIL = {
  address: 'lic.denissegb@icloud.com',
  href: 'mailto:lic.denissegb@icloud.com',
  /** Para mostrar con un punto de corte antes de «@» (<wbr>) en pantallas estrechas. */
  user: 'lic.denissegb',
  domain: 'icloud.com',
} as const;

/**
 * Domicilio del despacho (asesorías presenciales), confirmado el 02/10/2026.
 * Sustituye a la dirección de la web antigua, que NO debe aparecer en ningún sitio.
 * Sin mapa incrustado: «Cómo llegar» abre Google Maps (cero peticiones a terceros al cargar).
 */
export const OFFICE = {
  name: 'DG Gestores y Abogados',
  /** Para mostrar. */
  street: 'C/ Eraso 31, local A',
  neighborhood: 'Guindalera',
  postalCode: '28028',
  locality: 'Madrid',
  region: 'Madrid',
  country: 'ES',
  /** Para JSON-LD (PostalAddress.streetAddress). */
  streetAddress: 'Calle de Eraso 31, local A',
  /** Una línea: «C/ Eraso 31, local A (Guindalera), 28028 Madrid». */
  oneLine: 'C/ Eraso 31, local A (Guindalera), 28028 Madrid',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Eraso%2031%2C%2028028%20Madrid',
} as const;

export const SOCIALS = [
  { id: 'facebook', label: 'Facebook', handle: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100068039383642' },
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
  dubai: 'Hola Denisse, me gustaría recibir información sobre la apertura de una empresa en Dubái.',
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
  { label: 'Dubái', path: '/dubai/' },
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
