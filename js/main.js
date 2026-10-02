/* ==========================================================================
   Denisse González · Abogada — main.js (sin dependencias)
   ========================================================================== */

/**
 * CONFIGURACIÓN DEL FORMULARIO «CUÉNTAME TU HISTORIA»
 * --------------------------------------------------------------------------
 * STORY_FORM_ENDPOINT
 *   URL del servicio que recibirá las historias por email, por ejemplo un
 *   formulario de Formspree: 'https://formspree.io/f/abcdwxyz'.
 *   - Si tiene valor: el formulario se envía con fetch (POST + FormData,
 *     cabecera Accept: application/json) y se muestra el resultado en el diálogo.
 *   - Si está vacío (''): se redacta un mensaje de WhatsApp con todos los
 *     datos y se abre https://wa.me/<WHATSAPP_NUMBER> en una pestaña nueva.
 *
 * WHATSAPP_NUMBER
 *   Número en formato internacional, sin «+» ni espacios.
 */
const STORY_FORM_ENDPOINT = '';
const WHATSAPP_NUMBER = '34670647593';

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     Bloqueo de scroll (contador: varios elementos pueden pedirlo)
     ------------------------------------------------------------------ */
  let lockCount = 0;
  function lockScroll() {
    if (lockCount === 0) {
      const sbw = window.innerWidth - root.clientWidth;
      root.style.setProperty('--scrollbar-w', sbw > 0 ? sbw + 'px' : '0px');
      root.classList.add('is-locked');
    }
    lockCount += 1;
  }
  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      root.classList.remove('is-locked');
      root.style.removeProperty('--scrollbar-w');
    }
  }

  /* ------------------------------------------------------------------
     WhatsApp flotante: se oculta sobre el hero, el contacto, el pie
     y mientras hay un diálogo abierto.
     ------------------------------------------------------------------ */
  const waFloat = $('[data-wa-float]');
  const waHiders = new Set();
  function setWaHidden(reason, hidden) {
    if (!waFloat) return;
    if (hidden) waHiders.add(reason); else waHiders.delete(reason);
    const isHidden = waHiders.size > 0;
    waFloat.classList.toggle('is-hidden', isHidden);
    if (isHidden) waFloat.setAttribute('tabindex', '-1'); else waFloat.removeAttribute('tabindex');
  }
  if (waFloat && 'IntersectionObserver' in window) {
    const watch = [['hero', '#inicio'], ['contact', '#contacto'], ['footer', '.site-footer']];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setWaHidden(entry.target.dataset.waWatch, entry.isIntersecting));
    }, { threshold: 0.15 });
    watch.forEach(([key, sel]) => {
      const el = $(sel);
      if (el) { el.dataset.waWatch = key; io.observe(el); }
    });
  }

  /* ------------------------------------------------------------------
     Cabecera: sombra al hacer scroll
     ------------------------------------------------------------------ */
  const header = $('[data-header]');
  if (header) {
    // Altura real de la cabecera: el panel del menú móvil y el desplazamiento a las
    // anclas empiezan justo debajo, aunque la cabecera cambie de alto.
    const setHeaderOffset = () => {
      root.style.setProperty('--header-offset', Math.ceil(header.getBoundingClientRect().height) + 'px');
    };
    setHeaderOffset();
    if ('ResizeObserver' in window) new ResizeObserver(setHeaderOffset).observe(header);
    else window.addEventListener('resize', setHeaderOffset);

    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     Navegación móvil
     ------------------------------------------------------------------ */
  const navToggle = $('[data-nav-toggle]');
  const nav = $('[data-nav]');
  const mobileNavQuery = window.matchMedia('(max-width: 1239.98px)');
  const inertTargets = () => [$('main'), $('.site-footer'), waFloat].filter(Boolean);
  let navOpen = false;

  function openNav() {
    if (!header || navOpen) return;
    navOpen = true;
    header.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    inertTargets().forEach((el) => { el.inert = true; });
    lockScroll();
  }
  function closeNav(returnFocus) {
    if (!header || !navOpen) return;
    navOpen = false;
    header.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    inertTargets().forEach((el) => { el.inert = false; });
    unlockScroll();
    if (returnFocus) navToggle.focus();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => (navOpen ? closeNav(false) : openNav()));
    header.addEventListener('click', (e) => {
      if (navOpen && e.target.closest('a')) closeNav(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navOpen) { e.preventDefault(); closeNav(true); }
    });
    const onQueryChange = () => { if (!mobileNavQuery.matches) closeNav(false); };
    if (mobileNavQuery.addEventListener) mobileNavQuery.addEventListener('change', onQueryChange);
    else if (mobileNavQuery.addListener) mobileNavQuery.addListener(onQueryChange);
  }

  /* ------------------------------------------------------------------
     Enlace activo en la navegación según la sección visible
     ------------------------------------------------------------------ */
  const navLinks = $$('.nav-list a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = Array.from(byId.keys()).map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove('is-active'));
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------
     Aparición suave al hacer scroll (solo con JS; ver .js en el CSS)
     ------------------------------------------------------------------ */
  const revealEls = $$('[data-reveal]');
  if (revealEls.length) {
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      // Pequeño escalonado entre hermanos que aparecen a la vez
      const groups = new Map();
      revealEls.forEach((el) => {
        const parent = el.parentElement;
        const i = groups.get(parent) || 0;
        groups.set(parent, i + 1);
        if (i > 0) el.style.setProperty('--reveal-delay', Math.min(i, 5) * 0.08 + 's');
      });
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ------------------------------------------------------------------
     Utilidad para diálogos modales nativos
     ------------------------------------------------------------------ */
  function setupDialog(dialog, { onOpen, onClose, initialFocus } = {}) {
    let opener = null;
    let pressStartedOnBackdrop = false;
    const supportsModal = typeof dialog.showModal === 'function';

    function open(trigger) {
      if (dialog.open) return;
      opener = trigger || document.activeElement;
      if (supportsModal) dialog.showModal(); else dialog.setAttribute('open', '');
      lockScroll();
      setWaHidden('dialog-' + dialog.id, true);
      if (onOpen) onOpen();
      const target = typeof initialFocus === 'function' ? initialFocus() : null;
      if (target) target.focus();
    }
    function close() {
      if (!dialog.open) return;
      if (supportsModal) dialog.close(); else { dialog.removeAttribute('open'); handleClosed(); }
    }
    function handleClosed() {
      unlockScroll();
      setWaHidden('dialog-' + dialog.id, false);
      if (onClose) onClose();
      if (opener && typeof opener.focus === 'function') opener.focus();
      opener = null;
    }

    dialog.addEventListener('close', handleClosed);
    dialog.addEventListener('mousedown', (e) => { pressStartedOnBackdrop = e.target === dialog; });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog && pressStartedOnBackdrop) close();
      pressStartedOnBackdrop = false;
    });
    $$('[data-dialog-close]', dialog).forEach((btn) => btn.addEventListener('click', close));
    if (!supportsModal) {
      dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }
    return { open, close };
  }

  /* ------------------------------------------------------------------
     Formulario «Cuéntame tu historia»
     ------------------------------------------------------------------ */
  const storyDialog = $('[data-story-dialog]');
  const storyForm = $('[data-story-form]');

  if (storyDialog && storyForm) {
    const resultBox = $('[data-story-result]', storyDialog);
    const resultTitle = $('[data-result-title]', storyDialog);
    const resultText = $('[data-result-text]', storyDialog);
    const resultLink = $('[data-result-link]', storyDialog);
    const statusEl = $('[data-form-status]', storyForm);
    const noteEl = $('[data-form-note]', storyForm);
    const submitBtn = $('[data-submit]', storyForm);
    const submitLabel = $('[data-submit-label]', storyForm);
    const historia = storyForm.elements.historia;
    const counter = $('[data-count]', storyForm);
    const titleEl = $('#story-title', storyDialog);
    const useEndpoint = typeof STORY_FORM_ENDPOINT === 'string' && STORY_FORM_ENDPOINT.trim() !== '';
    let attempted = false;
    let completed = false;
    let sending = false;
    const SEND_TIMEOUT_MS = 15000;

    if (noteEl) {
      noteEl.textContent = useEndpoint
        ? 'Tu historia me llegará de forma privada.'
        : 'Al enviar se abrirá WhatsApp con tu historia ya redactada; solo tendrás que pulsar «Enviar».';
    }

    const MIN_STORY = 20;
    const rules = {
      nombre: (v) => (v ? '' : 'Escribe tu nombre.'),
      pais: (v) => (v ? '' : 'Indica tu país.'),
      tema: (v) => (v ? '' : 'Elige de qué quieres hablar.'),
      historia: (v) => {
        if (!v) return 'Cuéntame brevemente tu historia.';
        if (v.length < MIN_STORY) return 'Tu historia es muy breve: escribe al menos ' + MIN_STORY + ' caracteres.';
        return '';
      },
      compartir: (v) => (v ? '' : 'Indica si tu historia puede compartirse públicamente.'),
      anonimato: (v) => (v ? '' : 'Indica si quieres permanecer en el anonimato.'),
      contacto: (v) => (v ? '' : 'Indica cómo puedo contactarte (email, teléfono/WhatsApp, Instagram…).'),
      consentimiento: (v) => (v ? '' : 'Necesito tu consentimiento para poder recibir tu historia.'),
    };
    const order = Object.keys(rules);

    function valueOf(name) {
      const el = storyForm.elements[name];
      if (!el) return '';
      if (el instanceof RadioNodeList) return el.value;
      if (el.type === 'checkbox') return el.checked ? 'Sí' : '';
      return el.value.trim();
    }
    function controlsOf(name) {
      const el = storyForm.elements[name];
      if (!el) return [];
      return el instanceof RadioNodeList ? Array.from(el) : [el];
    }

    function validateField(name) {
      const message = rules[name](valueOf(name));
      const errorEl = $('[data-error-for="' + name + '"]', storyForm);
      const controls = controlsOf(name);
      controls.forEach((c) => {
        if (message) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
      });
      const fieldset = controls[0] && controls[0].closest('fieldset');
      if (fieldset) fieldset.toggleAttribute('data-invalid', Boolean(message));
      if (errorEl) errorEl.textContent = message;
      return !message;
    }

    function setStatus(text, tone) {
      statusEl.textContent = text;
      if (tone) statusEl.dataset.tone = tone; else delete statusEl.dataset.tone;
    }

    function updateCount() {
      if (counter && historia) counter.textContent = String(historia.value.length);
    }
    if (historia) historia.addEventListener('input', updateCount);

    function invalidSummary(count) {
      return count === 1
        ? 'Revisa el campo marcado antes de enviar.'
        : 'Revisa los ' + count + ' campos marcados antes de enviar.';
    }
    // Tras un intento de envío, el aviso general se actualiza (o desaparece) al corregir.
    function refreshSummary() {
      if (sending || !statusEl.textContent || statusEl.dataset.tone) return;
      const remaining = order.filter((name) => rules[name](valueOf(name))).length;
      const text = remaining ? invalidSummary(remaining) : '';
      if (statusEl.textContent !== text) setStatus(text);
    }
    function onFieldEdit(e) {
      const name = e.target.name;
      if (!attempted || !rules[name]) return;
      validateField(name);
      refreshSummary();
    }
    storyForm.addEventListener('input', onFieldEdit);
    storyForm.addEventListener('change', onFieldEdit);

    function buildWhatsAppMessage() {
      const lines = [
        'Hola Denisse, quiero compartir mi historia en *Empoderando Voces*.',
        '',
        '*Nombre:* ' + valueOf('nombre'),
        '*País:* ' + valueOf('pais'),
        '*Tema:* ' + valueOf('tema'),
        '*Compartir públicamente:* ' + valueOf('compartir'),
        '*Permanecer en el anonimato:* ' + valueOf('anonimato'),
        '*Contacto:* ' + valueOf('contacto'),
        '',
        '*Mi historia:*',
        valueOf('historia'),
        '',
        'He leído y acepto la política de privacidad y consiento expresamente el tratamiento de los datos de mi historia.',
      ];
      return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    }

    function showResult({ tone, title, text, link, linkLabel }) {
      storyForm.hidden = true;
      resultBox.hidden = false;
      storyDialog.classList.add('is-result');
      resultBox.dataset.tone = tone;
      resultTitle.textContent = title;
      resultText.textContent = text;
      if (link) {
        resultLink.href = link;
        resultLink.hidden = false;
        const label = $('span', resultLink);
        if (label && linkLabel) label.textContent = linkLabel;
      } else {
        resultLink.hidden = true;
      }
      const scroller = $('.dialog-inner', storyDialog);
      if (scroller) scroller.scrollTop = 0;
      resultTitle.focus();
    }

    function resetForm() {
      storyForm.reset();
      storyForm.hidden = false;
      resultBox.hidden = true;
      storyDialog.classList.remove('is-result');
      attempted = false;
      completed = false;
      order.forEach((name) => {
        controlsOf(name).forEach((c) => c.removeAttribute('aria-invalid'));
        const errorEl = $('[data-error-for="' + name + '"]', storyForm);
        if (errorEl) errorEl.textContent = '';
      });
      $$('fieldset[data-invalid]', storyForm).forEach((f) => f.removeAttribute('data-invalid'));
      setStatus('');
      updateCount();
    }

    // Mientras se envía, el botón se marca con aria-disabled (no «disabled») para que
    // el foco del teclado no salga del diálogo; los envíos repetidos se ignoran.
    function setBusy(busy) {
      sending = busy;
      if (busy) submitBtn.setAttribute('aria-disabled', 'true'); else submitBtn.removeAttribute('aria-disabled');
      submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
      submitLabel.textContent = busy ? 'Enviando…' : 'Enviar mi historia';
    }

    storyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      attempted = true;
      const invalid = order.filter((name) => !validateField(name));
      if (invalid.length) {
        setStatus(invalidSummary(invalid.length));
        const first = controlsOf(invalid[0])[0];
        if (first) {
          first.focus({ preventScroll: true });
          (first.closest('.field') || first).scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
        return;
      }
      setStatus('');

      // Campo trampa anti-spam: si se rellena, no se envía nada.
      if (storyForm.elements._gotcha && storyForm.elements._gotcha.value) {
        completed = true;
        showResult({ tone: 'success', title: '¡Gracias por compartir tu historia!', text: 'La he recibido correctamente.' });
        return;
      }

      if (!useEndpoint) {
        const url = buildWhatsAppMessage();
        window.open(url, '_blank', 'noopener');
        completed = true;
        showResult({
          tone: 'success',
          title: 'Tu historia continúa en WhatsApp',
          text: 'Se ha abierto WhatsApp en una pestaña nueva con tu historia ya redactada. Solo tienes que pulsar «Enviar» para que me llegue. Si no se ha abierto, usa el botón de abajo.',
          link: url,
          linkLabel: 'Abrir WhatsApp',
        });
        return;
      }

      setBusy(true);
      setStatus('Enviando tu historia…', 'info');
      // Si el servicio no responde, se aborta y se ofrece WhatsApp como alternativa.
      const controller = 'AbortController' in window ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), SEND_TIMEOUT_MS) : null;
      try {
        const data = new FormData(storyForm);
        data.append('_subject', 'Nueva historia — Empoderando Voces');
        const response = await fetch(STORY_FORM_ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
          signal: controller ? controller.signal : undefined,
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        completed = true;
        setStatus('');
        showResult({
          tone: 'success',
          title: '¡Gracias por compartir tu historia!',
          text: 'Tu historia me ha llegado correctamente. La leeré con atención y te escribiré al contacto que me has indicado.',
        });
      } catch (err) {
        setStatus('');
        showResult({
          tone: 'error',
          title: 'No se ha podido enviar tu historia',
          text: 'Ha ocurrido un problema de conexión. Puedes intentarlo de nuevo más tarde o enviármela directamente por WhatsApp.',
          link: buildWhatsAppMessage(),
          linkLabel: 'Enviar por WhatsApp',
        });
      } finally {
        if (timer) clearTimeout(timer);
        setBusy(false);
      }
    });

    const storyModal = setupDialog(storyDialog, {
      initialFocus: () => (resultBox.hidden ? titleEl : resultTitle),
      onClose: () => {
        if (completed) resetForm();
        else if (!resultBox.hidden) {
          resultBox.hidden = true;
          storyForm.hidden = false;
          storyDialog.classList.remove('is-result');
        }
      },
    });

    $$('[data-story-open]').forEach((btn) => {
      btn.addEventListener('click', () => storyModal.open(btn));
    });

    updateCount();
  }

  /* ------------------------------------------------------------------
     Visor de imagen (artículo en medios)
     ------------------------------------------------------------------ */
  const lightbox = $('[data-lightbox-dialog]');
  if (lightbox) {
    const closeBtn = $('.lightbox-close', lightbox);
    const lb = setupDialog(lightbox, { initialFocus: () => closeBtn });
    $$('[data-lightbox]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // permitir abrir en pestaña nueva
        e.preventDefault();
        lb.open(link);
      });
    });
  }

  /* ------------------------------------------------------------------
     Cinta animada de Empoderando Voces: botón para pausarla / reanudarla
     ------------------------------------------------------------------ */
  const marquee = $('[data-marquee]');
  const marqueeToggle = $('[data-marquee-toggle]');
  if (marquee && marqueeToggle) {
    marqueeToggle.addEventListener('click', () => {
      const paused = marqueeToggle.getAttribute('aria-pressed') !== 'true';
      marqueeToggle.setAttribute('aria-pressed', String(paused));
      marquee.classList.toggle('is-paused', paused);
    });
  }

  // Todo inicializado: el script de <head> ya no retirará la clase «js».
  window.__dgReady = true;
})();
