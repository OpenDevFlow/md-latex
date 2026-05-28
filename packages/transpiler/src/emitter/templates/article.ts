import type { FrontmatterData, TranspilerOptions } from '../types';

const DEFAULT_PACKAGES = [
  'inputenc',
  'fontenc',
  'geometry',
  'amsmath',
  'amssymb',
  'graphicx',
  'hyperref',
  'listings',
  'xcolor',
  'booktabs',
  'microtype',
];

function formatAuthors(author: string | string[] | undefined): string {
  if (!author) return '';
  if (Array.isArray(author)) return author.join(' \\and ');
  return author;
}

/**
 * Wraps body content in a full `\documentclass{article}` document.
 */
export function articleTemplate(
  body: string,
  frontmatter: FrontmatterData,
  options: Required<TranspilerOptions>,
): string {
  const docClass = frontmatter.documentclass ?? options.documentClass ?? 'article';

  // Merge packages: defaults + frontmatter + options
  const fmPackages: string[] = Array.isArray(frontmatter.packages)
    ? frontmatter.packages
    : [];
  const allPackages = Array.from(
    new Set([...DEFAULT_PACKAGES, ...fmPackages, ...options.packages]),
  );

  const packageLines = allPackages
    .map((pkg) => {
      // Support pkg or pkg[options] syntax
      if (pkg.startsWith('[')) {
        const [opts, name] = pkg.slice(1).split(']');
        return `\\usepackage[${opts}]{${name?.trim()}}`;
      }
      return `\\usepackage{${pkg}}`;
    })
    .join('\n');

  const titleBlock: string[] = [];
  if (frontmatter.title) titleBlock.push(`\\title{${frontmatter.title}}`);
  if (frontmatter.author)
    titleBlock.push(`\\author{${formatAuthors(frontmatter.author)}}`);
  if (frontmatter.date) titleBlock.push(`\\date{${frontmatter.date}}`);

  const maketitle =
    titleBlock.length > 0
      ? `${titleBlock.join('\n')}\n\n\\begin{document}\n\n\\maketitle\n`
      : `\\begin{document}\n`;

  const abstractBlock = frontmatter.abstract
    ? `\n\\begin{abstract}\n${frontmatter.abstract}\n\\end{abstract}\n`
    : '';

  return [
    `\\documentclass{${docClass}}`,
    '',
    `% Geometry`,
    `\\usepackage[margin=1in]{geometry}`,
    '',
    `% Packages`,
    packageLines,
    '',
    `% Listings config`,
    `\\lstset{`,
    `  basicstyle=\\ttfamily\\small,`,
    `  breaklines=true,`,
    `  numbers=left,`,
    `  numberstyle=\\tiny\\color{gray},`,
    `  commentstyle=\\color{gray},`,
    `  keywordstyle=\\color{blue!70},`,
    `  stringstyle=\\color{orange},`,
    `}`,
    '',
    maketitle,
    abstractBlock,
    body.trim(),
    '',
    `\\end{document}`,
  ].join('\n');
}
