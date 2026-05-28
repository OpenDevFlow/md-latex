import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/index.js';

const SAMPLE_DOCUMENT = `---
title: Quantum Entanglement
author: Jane Smith
date: 2024-01-15
---

# Introduction

This paper explores **quantum entanglement** and its implications for *information theory*.

## Mathematical Framework

The state vector $|\\psi\\rangle$ evolves according to:

$$
i\\hbar\\frac{\\partial}{\\partial t}|\\psi\\rangle = \\hat{H}|\\psi\\rangle
$$

## Results

| Method | Accuracy | Time (ms) |
|--------|----------|-----------|
| Naive  | 82.3%    | 450       |
| Ours   | 97.1%    | 38        |

\`\`\`python
def entangle(q1, q2):
    return (q1 @ q2) / norm(q1 @ q2)
\`\`\`

> "The universe is stranger than we can suppose."

See [@haldane1927] for the original quote.

---

1. First conclusion
2. Second conclusion
`;

describe('integration: full document round-trip', () => {
  it('produces valid LaTeX structure', async () => {
    const { latex, frontmatter, warnings } = await transpile(SAMPLE_DOCUMENT);

    // Document structure
    expect(latex).toContain('\\documentclass{article}');
    expect(latex).toContain('\\begin{document}');
    expect(latex).toContain('\\end{document}');

    // Frontmatter → preamble
    expect(latex).toContain('\\title{Quantum Entanglement}');
    expect(latex).toContain('\\author{Jane Smith}');
    expect(latex).toContain('\\maketitle');

    // Sections
    expect(latex).toContain('\\section{Introduction}');
    expect(latex).toContain('\\subsection{Mathematical Framework}');
    expect(latex).toContain('\\subsection{Results}');

    // Inline formatting
    expect(latex).toContain('\\textbf{quantum entanglement}');
    expect(latex).toContain('\\textit{information theory}');

    // Math
    expect(latex).toContain('\\[');
    expect(latex).toContain('\\]');

    // Table
    expect(latex).toContain('\\begin{table}');
    expect(latex).toContain('\\begin{tabular}');
    expect(latex).toContain('\\end{tabular}');

    // Code
    expect(latex).toContain('\\begin{lstlisting}');
    expect(latex).toContain('def entangle');

    // Quote
    expect(latex).toContain('\\begin{quote}');

    // Citation
    expect(latex).toContain('\\cite{haldane1927}');

    // Horizontal rule
    expect(latex).toContain('\\noindent\\rule');

    // Ordered list
    expect(latex).toContain('\\begin{enumerate}');

    // Frontmatter correctly parsed
    expect(frontmatter.title).toBe('Quantum Entanglement');
    expect(frontmatter.author).toBe('Jane Smith');

    // No warnings about missing emitters
    const unknownWarnings = warnings.filter((w) =>
      w.message.includes('No emitter'),
    );
    expect(unknownWarnings).toHaveLength(0);
  });
});
