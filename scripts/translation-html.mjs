import { parseFragment, serialize } from 'parse5';
export function translateHtml(markup, translate) {
  const tree = parseFragment(markup);
  const visit = (node) => {
    if (['script', 'style', 'svg'].includes(node.tagName)) return;
    if (node.nodeName === '#text' && node.value.trim()) node.value = translate(node.value.trim());
    for (const attribute of node.attrs || [])
      if (
        ['alt', 'title', 'placeholder', 'aria-label', 'aria-description'].includes(attribute.name)
      )
        attribute.value = translate(attribute.value);
    for (const child of node.childNodes || []) visit(child);
  };
  visit(tree);
  return serialize(tree);
}
export function visibleMessages(markup) {
  const result = [];
  const visit = (node) => {
    if (['script', 'style', 'svg'].includes(node.tagName)) return;
    if (node.nodeName === '#text' && node.value.trim()) result.push(node.value.trim());
    for (const attribute of node.attrs || [])
      if (
        ['alt', 'title', 'placeholder', 'aria-label', 'aria-description'].includes(attribute.name)
      )
        result.push(attribute.value);
    for (const child of node.childNodes || []) visit(child);
  };
  visit(parseFragment(markup));
  return result;
}
