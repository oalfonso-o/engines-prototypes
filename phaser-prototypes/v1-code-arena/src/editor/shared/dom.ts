export function clearElement(element: Element): void {
  element.replaceChildren();
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  textContent?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

export function createButton(label: string, className?: string): HTMLButtonElement {
  const button = createElement("button", className, label);
  button.type = "button";
  return button;
}
