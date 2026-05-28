import type { Link } from 'mdast';
import type { NodeEmitter } from '../types';

export const linkEmitter: NodeEmitter = (node: Link, ctx) => {
  const text = ctx.emit(node.children);
  const url = node.url;
  // If the link text is the same as the URL, use \url{}
  if (text === url) {
    return `\\url{${url}}`;
  }
  return `\\href{${url}}{${text}}`;
};
