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

export const CATALOG = catalog as {
  updated_at: string;
  currency: string;
  tax_included: boolean;
  tax_label: string;
  consultations: Consultation[];
  programs: Program[];
};

export const consultations: Consultation[] = CATALOG.consultations;
export const autogestiona: Program = CATALOG.programs.find((p) => p.id === 'autogestiona') ?? CATALOG.programs[0];

const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
export const formatAmount = (amount: number) => nf.format(amount);

export const allAmounts = [
  ...consultations.flatMap((c) => c.prices.map((p) => p.amount)),
  ...autogestiona.plans.map((p) => p.amount),
];
export const minAmount = Math.min(...allAmounts);
export const maxAmount = Math.max(...allAmounts);
