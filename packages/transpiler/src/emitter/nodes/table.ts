import type { Table, TableRow, TableCell } from 'mdast';
import type { NodeEmitter } from '../../types.js';

function getAlignChar(align: string | null | undefined): string {
  switch (align) {
    case 'left':   return 'l';
    case 'center': return 'c';
    case 'right':  return 'r';
    default:       return 'l';
  }
}

/**
 * GFM table → LaTeX table with standard borders and cell dividers.
 */
export const tableEmitter: NodeEmitter = (node: Table, ctx) => {
  const rows = node.children as TableRow[];
  if (rows.length === 0) return '';

  const colCount = (rows[0].children as TableCell[]).length;
  const aligns = node.align ?? [];

  // Build column spec with vertical rules
  const colSpec = Array.from({ length: colCount }, (_, i) =>
    getAlignChar(aligns[i]),
  ).join('|');

  const headerRow = rows[0];
  const headerCells = (headerRow.children as TableCell[])
    .map((cell) => ctx.emit(cell.children))
    .join(' & ');

  const bodyRows = rows.slice(1).map((row) =>
    (row.children as TableCell[])
      .map((cell) => ctx.emit(cell.children))
      .join(' & '),
  );

  const lines = [
    `\\begin{table}[H]`,
    `  \\centering`,
    `  \\begin{tabular}{|${colSpec}|}`,
    `    \\hline`,
    `    ${headerCells} \\\\`,
    `    \\hline`,
    ...bodyRows.map((row) => `    ${row} \\\\`),
    `    \\hline`,
    `  \\end{tabular}`,
    `\\end{table}`,
  ];

  return lines.join('\n');
};
