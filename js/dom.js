export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function bindKeyboardActivation(element, callback) {
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback(event);
    }
  });
}

export function setText(id, value) {
  const element = qs(`#${id}`);
  if (element) element.textContent = value;
}

export function toggleHidden(element, shouldHide) {
  if (!element) return;
  element.hidden = shouldHide;
}
