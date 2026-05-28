import type { FrontmatterData, TranspilerOptions } from '../../types.js';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function formatAuthors(author: string | string[] | undefined): string {
  if (!author) return 'Author';
  if (Array.isArray(author)) return author.join(' \\and\n       ');
  return author;
}

/**
 * Safely format a date value from YAML frontmatter.
 * js-yaml parses `date: 2024-01-15` as a JS Date object.
 */
function formatDate(date: unknown): string {
  if (!date) return '\\today';
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = date.toLocaleString('en-US', { month: 'long' });
    const d = date.getDate();
    return `${m} ${d}, ${y}`;
  }
  return String(date);
}

// ──────────────────────────────────────────────────────────
// Professional preamble builder
// ──────────────────────────────────────────────────────────

function buildPreamble(
  frontmatter: FrontmatterData,
  options: Required<TranspilerOptions>,
): string {
  // Collect extra user packages (skip ones we manage ourselves)
  const MANAGED = new Set([
    'inputenc', 'fontenc', 'lmodern', 'geometry',
    'amsmath', 'amssymb', 'amsthm', 'mathtools',
    'graphicx', 'float', 'caption', 'subcaption',
    'booktabs', 'array', 'longtable', 'multirow',
    'hyperref', 'url', 'xcolor',
    'listings', 'minted',
    'microtype', 'parskip', 'setspace',
    'natbib', 'biblatex',
  ]);

  const fmPackages: string[] = Array.isArray(frontmatter.packages)
    ? (frontmatter.packages as string[])
    : [];
  const userPackages = [...fmPackages, ...options.packages].filter(
    (p) => !MANAGED.has(p.replace(/^\[.*?\]/, '').trim()),
  );

  const extras = userPackages
    .map((pkg) => {
      if (pkg.includes('[')) {
        const m = pkg.match(/^\[([^\]]+)\]\s*(.+)$/);
        return m ? `\\usepackage[${m[1]}]{${m[2].trim()}}` : `\\usepackage{${pkg}}`;
      }
      return `\\usepackage{${pkg}}`;
    })
    .join('\n');

  const citationStyle = options.citationStyle || 'apa';
  const biblatexBlock = options.bibliographyContent
    ? `\n\\usepackage[style=${citationStyle}, backend=biber]{biblatex}\n\\addbibresource{references.bib}\n`
    : '';

  return `\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}          % Better font rendering

\\usepackage[
  top=1in, bottom=1in,
  left=1.25in, right=1.25in,
  headheight=14pt
]{geometry}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsthm}
\\usepackage{mathtools}

\\usepackage{graphicx}
\\usepackage{float}
\\usepackage[labelfont=bf, font=small]{caption}
\\usepackage{subcaption}

\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{multirow}

\\usepackage[dvipsnames, table]{xcolor}
\\definecolor{codegreen}{rgb}{0.13,0.55,0.13}
\\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\\definecolor{codepurple}{rgb}{0.42,0.18,0.62}
\\definecolor{codeblue}{rgb}{0.05,0.40,0.70}
\\definecolor{backcolour}{rgb}{0.97,0.97,0.97}

\\usepackage{listings}
\\lstset{
  backgroundcolor=\\color{backcolour},
  commentstyle=\\color{codegreen}\\itshape,
  keywordstyle=\\color{codeblue}\\bfseries,
  numberstyle=\\tiny\\color{codegray},
  stringstyle=\\color{codepurple},
  basicstyle=\\ttfamily\\small,
  breakatwhitespace=false,
  breaklines=true,
  captionpos=b,
  keepspaces=true,
  numbers=left,
  numbersep=8pt,
  showspaces=false,
  showstringspaces=false,
  showtabs=false,
  tabsize=2,
  frame=single,
  framesep=4pt,
  rulecolor=\\color{gray!30},
  xleftmargin=12pt,
}

\\usepackage[
  colorlinks=true,
  linkcolor=NavyBlue,
  citecolor=ForestGreen,
  urlcolor=MidnightBlue,
  pdftitle={${frontmatter.title ?? 'Document'}},
  pdfauthor={${Array.isArray(frontmatter.author) ? (frontmatter.author as string[]).join(', ') : (frontmatter.author ?? '')}},
  pdfsubject={},
  bookmarksnumbered=true,
  pdfpagemode=UseOutlines,
]{hyperref}

\\usepackage{microtype}        % Subtle character protrusion & kerning
\\usepackage{parskip}          % Paragraph spacing instead of indent
\\usepackage{setspace}
${biblatexBlock}
${extras || '% (none)'}`;
}

/**
 * Wraps body content in a complete, publication-ready
 * `\documentclass{article}` document with a professional preamble.
 */
export function articleTemplate(
  body: string,
  frontmatter: FrontmatterData,
  options: Required<TranspilerOptions>,
): string {
  const docClass = frontmatter.documentclass ?? options.documentClass ?? 'article';
  const fontSize = (frontmatter as any).fontsize ?? '11pt';
  const preamble = buildPreamble(frontmatter, options);

  // Title block
  const hasTitle  = !!frontmatter.title;
  const hasAuthor = !!frontmatter.author;
  const hasDate   = true; // always emit \date

  const titleLines: string[] = [];
  if (hasTitle)  titleLines.push(`\\title{${frontmatter.title}}`);
  if (hasAuthor) titleLines.push(`\\author{${formatAuthors(frontmatter.author)}}`);
  titleLines.push(`\\date{${formatDate(frontmatter.date)}}`);

  const maketitle = hasTitle
    ? `${titleLines.join('\n')}\n\n\\begin{document}\n\n\\maketitle\n`
    : `\\begin{document}\n`;

  const abstractBlock = frontmatter.abstract
    ? `\n\\begin{abstract}\n${frontmatter.abstract}\n\\end{abstract}\n\n\\bigskip\n`
    : '';

  const fileContentsBlock = options.bibliographyContent
    ? `\\begin{filecontents}[overwrite]{references.bib}\n${options.bibliographyContent}\n\\end{filecontents}\n`
    : '';

  const printBib = options.bibliographyContent
    ? `\n\\printbibliography\n`
    : '';

  return [
    `% Generated by md-latex — https://github.com/OpenDevFlow/md-latex`,
    fileContentsBlock,
    `\\documentclass[${fontSize}, a4paper]{${docClass}}`,
    '',
    preamble,
    '',
    maketitle,
    abstractBlock,
    body.trim(),
    printBib,
    '',
    `\\end{document}`,
  ].filter(line => line !== null).join('\n').replace(/\n{3,}/g, '\n\n');
}
