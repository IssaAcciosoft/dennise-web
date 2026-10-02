/**
 * Preguntas frecuentes de la web anterior (docs/web-anterior.md §5), tal cual.
 * Se muestran con <details>/<summary> (components/ui/Faq.astro) y se publican también como
 * FAQPage en JSON-LD (mismo texto: lo exige schema.org / Google).
 * - /servicios/ → preguntas de España (+ enlace a /dubai/ para la de Dubái).
 * - /dubai/     → pregunta de Dubái.
 */
export type FaqItem = { id: string; question: string; answer: string };

export const FAQ_SPAIN: FaqItem[] = [
  {
    id: 'regularizarme-sin-papeles',
    question: '¿Puedo regularizarme si estoy en España sin papeles?',
    answer:
      'Sí. Existen varias vías legales como el arraigo social, laboral o familiar. Evaluamos tu situación y te orientamos con la opción más viable.',
  },
  {
    id: 'traer-a-mi-familia',
    question: '¿Qué necesito para traer a mi familia a España?',
    answer: 'Debes tener residencia legal, ingresos suficientes y una vivienda adecuada. Nosotros gestionamos todo el proceso contigo.',
  },
];

export const FAQ_DUBAI: FaqItem[] = [
  {
    id: 'empresa-dubai-desde-el-extranjero',
    question: '¿Puedo abrir una empresa en Dubái desde el extranjero?',
    // PENDIENTE DE REVISIÓN LEGAL (alerta 9.1 de docs/web-anterior.md): «grandes ventajas
    // fiscales» es texto de la cliente; confirmar con ella el alcance (impuesto de sociedades de
    // EAU desde 2023; 0 % solo para ingresos cualificados en zonas francas).
    answer:
      'Sí. Asesoramos a emprendedores que desean abrir su empresa en Dubái, sin necesidad de residir allí. Es rápido, legal y con grandes ventajas fiscales.',
  },
];

/** FAQPage (schema.org) para JSON-LD. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
