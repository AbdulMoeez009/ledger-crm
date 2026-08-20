import { qs } from './dom.js';

let lastFocusedElement = null;

function getFocusableElements(container) {
  return [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled);
}

export function trapFocus(event, container) {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableElements(container);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function setModalState(modal, isOpen) {
  if (!modal) return;
  modal.classList.toggle('open', isOpen);
  modal.setAttribute('aria-hidden', String(!isOpen));

  if (isOpen) {
    lastFocusedElement = document.activeElement;
    const focusable = getFocusableElements(modal)[0];
    setTimeout(() => focusable && focusable.focus(), 50);
  } else if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

export function closeModal(modal) {
  if (!modal) return;
  const handler = modal._keydownHandler;
  if (handler) {
    document.removeEventListener('keydown', handler);
    modal._keydownHandler = null;
  }
  setModalState(modal, false);
}

export function openModal(modal) {
  if (!modal) return;
  if (modal._keydownHandler) {
    document.removeEventListener('keydown', modal._keydownHandler);
  }

  const handler = (event) => {
    if (event.key === 'Escape') {
      modal.dispatchEvent(new CustomEvent('a11y-escape'));
      return;
    }
    trapFocus(event, modal);
  };

  modal._keydownHandler = handler;
  document.addEventListener('keydown', handler);
  setModalState(modal, true);
}

export function addModalA11y(modal) {
  if (!modal) return;

  modal.addEventListener('a11y-escape', () => closeModal(modal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal);
  });
}

export function initModalTrigger(button, modal, onOpen) {
  if (!button || !modal) return;

  button.addEventListener('click', () => {
    if (onOpen) onOpen();
    openModal(modal);
  });
}

export function isModalOpen(modal) {
  return !!modal && modal.classList.contains('open');
}
