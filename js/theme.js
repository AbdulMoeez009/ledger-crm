import { qs } from './dom.js';

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const knob = qs('#themeToggle .knob');
  if (knob) {
    knob.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

export function initTheme() {
  const toggle = qs('#themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  setTheme('dark');
}
