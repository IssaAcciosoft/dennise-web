/** Módulo virtual de src/integrations/acciogest-catalog.mjs (lo lee solo src/lib/services.ts). */
declare module 'virtual:acciogest-catalog' {
  const data: {
    /** true con ACCIOGEST_MOCK_CATALOG (datos de prueba). */
    mock: boolean;
    /** BOOKING_PLUGIN_ID con el que se descargó el catálogo (null = sin configurar). */
    plugin_id: string | null;
    /** De dónde sale `catalog`. */
    catalog_source: 'off' | 'api' | 'mock' | 'last-good' | 'none';
    catalog: {
      updated_at: string | null;
      currency: string;
      servicios: {
        id: string;
        nombre: string | null;
        descripcion: string | null;
        duracion_min: number | null;
        precio_bruto: number;
        mostrar_precio: boolean;
      }[];
    } | null;
    /** Importe de cada plan leído del campo de pago de su formulario. */
    plans: Partial<Record<'basico' | 'estandar' | 'premium', { form_id: string; amount: number }>>;
  };
  export default data;
}
