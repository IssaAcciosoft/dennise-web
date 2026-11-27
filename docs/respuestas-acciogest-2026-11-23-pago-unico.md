# Respuesta de AccioGest (23-11-2026): Autogestión DG es pago único

Correcto: pago único por trámite. Respuestas:

1. No aplicamos planes-mensuales-619.sql. Los planes se quedan con payment_interval = null.
2. Portal de clientes de Stripe: fuera, no hace falta.
3. Opción a). El botón «Contratar» abre https://api.acciogest.com/form-builder/public/<id del plan>/page. Puede ser en la misma pestaña o en una nueva; vosotros elegís. Esa página ya lleva nuestras casillas, el importe y el pago con tarjeta. Quitad el diálogo propio y la llamada a create-checkout-session.
4. El texto de «Desistimiento» que proponéis está bien y es el que ponemos en nuestra página para cada plan. En la web no hace falta casilla.
   (Texto propuesto: «Contrato el {Plan}: pago único de {importe} € (IVA incluido). Pido que el servicio empiece ya, sin esperar a que pasen los 14 días en que puedo desistir. Sé que, si desisto antes de que el servicio esté completamente prestado, pagaré la parte proporcional de lo ya prestado hasta ese momento, y que perderé el derecho a desistir cuando esté completamente prestado. Acepto las condiciones de contratación»)
5. Condiciones: perfecto, quitad todo lo de la cuota mensual. Queda el texto de pago único del 10/11 con el art. 108.4. Pasa por muro-legal con el resto.
6. Vuelta tras pagar: /gracias/?tipo=plan&plan=<basico|estandar|premium>, sin response_id ni pago=ok. Esa página solo redirige cuando el pago se ha completado, así que /gracias/ no tiene que comprobar nada.

Lo demás, igual: formularios de leads, reservas con un id por servicio, privacidad con Zoom y Google, dominio dggestoresyabogados.com y los IDs.
