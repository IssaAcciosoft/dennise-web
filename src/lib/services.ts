/**
 * Catálogo de servicios (src/data/servicios.json). AccioGest no expone catálogo público:
 * los precios se editan en el JSON y la web se recompila. Ver docs/integracion-acciogest.md.
 */
import catalog from '~/data/servicios.json';

export type Price = { modality: string; label: string; amount: number };
export type Consultation = {
  id: string;
  name: string;
  duration_minutes: number;
  duration_label: string;
  description: string | null;
  prices: Price[];
  bookable: boolean;
  lead_value: string;
};
export type Plan = {
  id: string;
  name: string;
  amount: number;
  featured: boolean;
  form_key: string;
  lead_value: string;
};
export type Program = {
  id: string;
  name: string;
  procedures_title: string;
  procedures: string[];
  includes_title: string;
  includes: string[];
  plans: Plan[];
};

/** Servicios de extranjería en España (sin precio publicado: se solicitan por el formulario). */
export type ImmigrationService = {
  id: string;
  name: string;
  description: string;
  lead_value: string;
};
export type Immigration = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string[];
  services: ImmigrationService[];
  also_title: string;
  /** «Nómadas digitales · Emprendedores · Residencias» (web anterior). Con lead_value → opción del formulario. */
  also: { name: string; lead_value?: string }[];
};
/** Apertura de empresas en Dubái (/dubai/). */
export type Dubai = {
  id: string;
  name: string;
  lead_value: string;
  structures: string[];
};

export const CATALOG = catalog as {
  updated_at: string;
  currency: string;
  tax_included: boolean;
  tax_label: string;
  immigration: Immigration;
  consultations: Consultation[];
  programs: Program[];
  dubai: Dubai;
};

export const consultations: Consultation[] = CATALOG.consultations;
export const autogestiona: Program = CATALOG.programs.find((p) => p.id === 'autogestiona') ?? CATALOG.programs[0];
export const immigration: Immigration = CATALOG.immigration;
export const dubai: Dubai = CATALOG.dubai;

/** Valor «Otro» del selector de servicio (formulario «servicio» de AccioGest). */
export const OTHER_SERVICE = 'Otro trámite / no lo sé';

/**
 * Opciones del selector «Servicio» (ServiceRequestDialog): lead_value de todo el catálogo,
 * agrupadas. El texto visible puede ser más corto que el valor que recibe AccioGest.
 */
export const serviceOptions = [
  {
    label: immigration.title,
    options: [
      ...immigration.services.map((s) => ({ value: s.lead_value, label: s.name })),
      ...immigration.also.flatMap((a) => (a.lead_value ? [{ value: a.lead_value, label: a.name }] : [])),
    ],
  },
  { label: 'Asesorías', options: consultations.map((c) => ({ value: c.lead_value })) },
  { label: autogestiona.name, options: autogestiona.plans.map((p) => ({ value: p.lead_value })) },
  { label: 'Empresas en Dubái', options: [{ value: dubai.lead_value }] },
  { value: OTHER_SERVICE },
];

const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
export const formatAmount = (amount: number) => nf.format(amount);

export const allAmounts = [
  ...consultations.flatMap((c) => c.prices.map((p) => p.amount)),
  ...autogestiona.plans.map((p) => p.amount),
];
export const minAmount = Math.min(...allAmounts);
export const maxAmount = Math.max(...allAmounts);
