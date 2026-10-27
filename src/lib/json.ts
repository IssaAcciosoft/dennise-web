/**
 * JSON para incrustar dentro de un <script> en línea (JSON-LD, scripts is:inline con datos).
 * JSON.stringify no escapa «</script>» ni «<!--»: un texto del catálogo de AccioGest con
 * «</script><script>…» cerraría el script y ejecutaría código en la página. Se escapan `<`, `>`
 * y `&` como <, > y & (siguen siendo JSON y JS válidos, con el mismo valor), y
 * U+2028 / U+2029 (separadores de línea que algunos motores no admiten en literales de JS).
 */
export const safeJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
