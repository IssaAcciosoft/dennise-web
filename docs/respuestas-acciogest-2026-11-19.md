Hola,

Gracias. Os contesto por puntos (comprobado en el código de la API que vamos a subir).

1. WEB-INTEGRACION.md
Os lo paso aparte. Está bien salvo el apartado 6.2, que está marcado como desfasado: la casilla se llama «Desistimiento» (no «Inicio inmediato del servicio»), con el texto del handoff, y la creamos nosotros. La tabla de errores del §1 está al día.

2. Importe del plan
GET /form-builder/public/{PLAN_ID} devuelve en la raíz:
- payment_amount: número en euros, no en céntimos (por ejemplo 242). Es lo que se cobra, con el IVA incluido. Stripe no añade impuestos.
- payment_currency: "EUR".
- payment_interval: "month" en los planes mensuales. Hasta el día en que pasemos los planes a mensuales vale null y create-checkout-session responde 400 «Este formulario no tiene cobro mensual configurado».
- payment_enabled: true.

3. Respuesta de create-checkout-session
200 con { "url": "https://checkout.stripe.com/c/pay/cs_…", "sessionId": "cs_…", "response_id": 123 }. La url está en la raíz y es la que hay que abrir. Los otros dos campos son informativos.
Será siempre checkout.stripe.com: Denisse no tiene dominio propio de Checkout. Está bien aceptar solo ese dominio. Si algún día configurase uno, os avisaríamos.

4. Errores del checkout
Esta ruta devuelve 200, 400, 404, 429, 500 y 502. No devuelve 201, 403, 409 ni 422 (esos son de /submit, la ruta de los leads).
- 502 «No se pudo preparar el pago. Inténtalo de nuevo.» y 500 «Error al preparar el pago»: mensaje y dejar reintentar.
- 429: Retry-After no os sirve. En la API está expuesta, pero esta ruta pública la sirve nginx con CORS abierto y no os podemos asegurar que el navegador la deje leer. Tratadlo como dice el documento: botón bloqueado 60 s con cuenta atrás. El límite es de 120 envíos cada 10 minutos por conexión, compartido con los formularios de leads.
- Casillas: la clave tiene que ser exactamente la etiqueta («Consentimiento RGPD», «Desistimiento») y el valor cualquier texto no vacío. No vale false ni "". Enviad como valor el texto de la casilla (sin el markdown de los enlaces), porque se guarda como prueba de lo que se aceptó. Si llega un 400 «Faltan campos obligatorios», missing_fields dice qué etiqueta no ha encontrado: casi siempre es una tilde, una mayúscula o un espacio.

5. Política: «cuando abres el formulario»
Tenéis razón, la frase no vale para vuestra web. «Cuando abres» se refiere a nuestra página de formulario alojada, que manda un aviso de visita; vosotros pintáis vuestros formularios y no la usáis. No hace falta que mandéis nada al abrir ni que paséis los UTM al widget (el widget de reservas no los guarda). Cambiad la frase por esta:

Si has llegado desde un enlace de campaña o red social, el origen de la visita (utm_source, utm_medium y utm_campaign) se guarda temporalmente en tu navegador y se envía a AccioGest, junto con la página de origen, solo cuando envías un formulario o contratas un plan, sin cookies y sin identificarte.

Así coincide con el apartado de «La web solo se comunica con AccioGest cuando…».

6. Página de origen
La sacamos de la cabecera Referer (también la usamos para la vuelta si el cliente cancela en Stripe). No hace falta campo en el cuerpo. Poned la ruta completa solo en las llamadas a AccioGest, con referrerPolicy: 'no-referrer-when-downgrade' en esos fetch, sin cambiar la política de toda la web.

7. Widget de reservas
- Los mensajes salen del iframe servido desde https://api.acciogest.com. Ese es el origen que tenéis que permitir, para acciogest:booking:height y para acciogest:booking:done ({ type, citaId: número o null, serviceId }).
- Cambiar de servicio sin recargar la página: si usáis nuestro script (/plugin-citas-embed.js), llamad a window.AccioGestBooking.setService('<id>'), que vuelve a montar el iframe con el servicio nuevo. Si montáis vosotros el iframe, cambiad su src (…/plugin-citas/public/<id>/page?service=<id>). Dentro del iframe el servicio no cambia sin recargarlo.
- Tarjeta sin ID: mejor que esa tarjeta no ofrezca «Reservar» (que mande a WhatsApp o a contacto). Si reservase con el primer servicio, se cobraría otro precio u otra modalidad. De todas formas, los 6 servicios tendrán ID.
- Online y presencial son servicios distintos en AccioGest, cada uno con su ID y su precio. Tienen la misma duración pero el nombre cambia al final: «Asesoría migratoria · 1 hora · online» 60 € / «… · presencial» 80 €; «Asesoría migratoria · 30 min · online» 30 € / «presencial» 50 €; «Sesión de orientación académica · 30 min · online» 45 € / «presencial» 65 €. Cada tarjeta (o cada opción de modalidad) va con su ID.

8. Plan con el precio oculto
Correcto: sin importe no se puede mostrar la casilla de desistimiento, así que «Solicitar información» en su lugar está bien.

9. Zoom y Google
Propuesta, pendiente de la revisión de muro-legal, que la hará con el resto de los textos antes de publicar:
- Zoom (Zoom Communications, Inc., EE. UU.): encargado de Denisse para las asesorías online. Transferencia a EE. UU. amparada en el Marco de Privacidad de Datos UE-EE. UU. (Zoom está adherida) y en cláusulas contractuales tipo.
- Google (Google Ireland Limited, con posible acceso de Google LLC, EE. UU.): subencargado de AccioGest para el correo con el que el sistema envía los avisos y confirmaciones. Transferencia con las mismas garantías (Marco de Privacidad y cláusulas tipo).
Si Denisse usa además Zoom o Google con su propia cuenta para otras cosas, nos lo decís y lo ajustamos.

Lo demás: os pasamos los IDs en cuanto montemos la empresa en producción y os avisamos el día en que podáis publicar. La revisión legal la pedimos nosotros cuando nos digáis que los textos están listos.

Gracias.
