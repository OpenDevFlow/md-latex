import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/index.js';

describe('heading emitter', () => {
  it('maps H1 → \\section', async () => {
    const { latex } = await transpile('# Introduction', { wrapDocument: false });
    expect(latex).toContain('\\section{Introduction}');
  });

  it('maps H2 → \\subsection', async () => {
    const { latex } = await transpile('## Background', { wrapDocument: false });
    expect(latex).toContain('\\subsection{Background}');
  });

  it('maps H3 → \\subsubsection', async () => {
    const { latex } = await transpile('### Details', { wrapDocument: false });
    expect(latex).toContain('\\subsubsection{Details}');
  });
});

describe('inline formatting', () => {
  it('bold → \\textbf', async () => {
    const { latex } = await transpile('**bold text**', { wrapDocument: false });
    expect(latex).toContain('\\textbf{bold text}');
  });

  it('italic → \\textit', async () => {
    const { latex } = await transpile('*italic text*', { wrapDocument: false });
    expect(latex).toContain('\\textit{italic text}');
  });

  it('inline code → \\texttt', async () => {
    const { latex } = await transpile('use `npm install`', { wrapDocument: false });
    expect(latex).toContain('\\texttt{npm install}');
  });
});

describe('code block emitter', () => {
  it('fenced code block → lstlisting', async () => {
    const { latex } = await transpile('```python\nprint("hi")\n```', { wrapDocument: false });
    expect(latex).toContain('\\begin{lstlisting}');
    expect(latex).toContain('language=Python');
    expect(latex).toContain('print("hi")');
    expect(latex).toContain('\\end{lstlisting}');
  });
});

describe('blockquote emitter', () => {
  it('> quote → \\begin{quote}', async () => {
    const { latex } = await transpile('> A famous quote', { wrapDocument: false });
    expect(latex).toContain('\\begin{quote}');
    expect(latex).toContain('\\end{quote}');
  });
});

describe('list emitter', () => {
  it('unordered list → itemize', async () => {
    const { latex } = await transpile('- item one\n- item two', { wrapDocument: false });
    expect(latex).toContain('\\begin{itemize}');
    expect(latex).toContain('\\item item one');
    expect(latex).toContain('\\item item two');
    expect(latex).toContain('\\end{itemize}');
  });

  it('ordered list → enumerate', async () => {
    const { latex } = await transpile('1. first\n2. second', { wrapDocument: false });
    expect(latex).toContain('\\begin{enumerate}');
    expect(latex).toContain('\\end{enumerate}');
  });
});

describe('link emitter', () => {
  it('[text](url) → \\href', async () => {
    const { latex } = await transpile('[Google](https://google.com)', { wrapDocument: false });
    expect(latex).toContain('\\href{https://google.com}{Google}');
  });
});

describe('thematic break', () => {
  it('--- → \\rule', async () => {
    const { latex } = await transpile('---', { wrapDocument: false });
    expect(latex).toContain('\\noindent\\rule');
  });
});

describe('math emitter', () => {
  it('inline math → $...$', async () => {
    const { latex } = await transpile('The value $x^2$', { wrapDocument: false });
    expect(latex).toContain('$x^2$');
  });

  it('display math → \\[...\\]', async () => {
    const { latex } = await transpile('$$\nE = mc^2\n$$', { wrapDocument: false });
    expect(latex).toContain('\\[');
    expect(latex).toContain('E = mc^2');
    expect(latex).toContain('\\]');
  });
});

describe('citation plugin', () => {
  it('[@key] → \\cite{key}', async () => {
    const { latex } = await transpile('See [@smith2020]', { wrapDocument: false });
    expect(latex).toContain('\\cite{smith2020}');
  });

  it('multiple keys → \\cite{a,b}', async () => {
    const { latex } = await transpile('See [@a; @b]', { wrapDocument: false });
    expect(latex).toContain('\\cite{a,b}');
  });
});
