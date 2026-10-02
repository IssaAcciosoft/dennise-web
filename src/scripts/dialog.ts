/**
 * Utilidad para diálogos modales nativos (<dialog>): foco inicial, devolución del foco al
 * disparador, cierre con Esc / botón / clic fuera. El bloqueo de scroll y la ocultación del
 * WhatsApp flotante se hacen en CSS (html:has(dialog[open])).
 */
export interface DialogOptions {
  initialFocus?: () => HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface DialogController {
  open: (trigger?: HTMLElement | null) => void;
  close: () => void;
}

export function setupDialog(dialog: HTMLDialogElement, options: DialogOptions = {}): DialogController {
  let opener: HTMLElement | null = null;
  let pressStartedOnBackdrop = false;

  function open(trigger?: HTMLElement | null) {
    if (dialog.open) return;
    opener = trigger ?? (document.activeElement as HTMLElement | null);
    dialog.showModal();
    options.onOpen?.();
    options.initialFocus?.()?.focus();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener('close', () => {
    options.onClose?.();
    opener?.focus();
    opener = null;
  });
  // Clic en el fondo (fuera del contenido) cierra, salvo que la pulsación empezara dentro
  // (p. ej. al seleccionar texto y soltar fuera).
  dialog.addEventListener('pointerdown', (e) => {
    pressStartedOnBackdrop = e.target === dialog;
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && pressStartedOnBackdrop) close();
    pressStartedOnBackdrop = false;
  });
  dialog.querySelectorAll<HTMLElement>('[data-dialog-close]').forEach((btn) => btn.addEventListener('click', close));

  return { open, close };
}

/**
 * Convierte enlaces normales (que funcionan sin JS) en disparadores del diálogo.
 * Respeta Ctrl/Cmd/Mayús + clic y el botón central (abrir en pestaña nueva).
 */
export function bindTriggers(selector: string, controller: DialogController, asButton = true) {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (asButton && el.tagName === 'A') {
      el.setAttribute('role', 'button');
      el.setAttribute('aria-haspopup', 'dialog');
    }
    el.addEventListener('click', (e) => {
      const me = e as MouseEvent;
      if (me.metaKey || me.ctrlKey || me.shiftKey || me.button === 1) return;
      e.preventDefault();
      controller.open(el);
    });
    if (asButton && el.tagName === 'A') {
      // role=button: la barra espaciadora también debe activarlo
      el.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === ' ') {
          e.preventDefault();
          controller.open(el);
        }
      });
    }
  });
}
