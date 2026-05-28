import type { List, ListItem } from 'mdast';
import type { NodeEmitter } from '../../types.js';

export const listEmitter: NodeEmitter = (node: List, ctx) => {
  const env = node.ordered ? 'enumerate' : 'itemize';
  const items = (node.children as ListItem[])
    .map((item) => {
      const content = ctx.emit(item.children).trim();
      // Handle task list items (GFM)
      if (item.checked === true) {
        return `  \\item[$\\boxtimes$] ${content}`;
      } else if (item.checked === false) {
        return `  \\item[$\\square$] ${content}`;
      }
      return `  \\item ${content}`;
    })
    .join('\n');

  return `\n\\begin{${env}}\n${items}\n\\end{${env}}\n`;
};
