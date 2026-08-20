import { qs } from './dom.js';

export function initShortcuts() {
  const logo = qs('.brand, .side-brand');
  if (logo) {
    logo.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
