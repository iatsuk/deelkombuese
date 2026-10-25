// Translate only public text and accessible labels. IDs, values and data attributes are immutable.
export function translateFragment(markup, translate, document) {
  const fragment = document.createElement('template');
  fragment.innerHTML = markup;
  const visit = (node) => {
    if (node.nodeType === 3) {
      const text = node.nodeValue;
      if (text.trim())
        node.nodeValue = text.match(/^\s*/)[0] + translate(text.trim()) + text.match(/\s*$/)[0];
      return;
    }
    if (['SCRIPT', 'STYLE', 'SVG'].includes(node.tagName)) return;
    for (const name of ['alt', 'title', 'placeholder', 'aria-label', 'aria-description']) {
      if (node.hasAttribute?.(name)) node.setAttribute(name, translate(node.getAttribute(name)));
    }
    for (const child of node.childNodes) visit(child);
  };
  visit(fragment.content);
  return fragment.innerHTML;
}
