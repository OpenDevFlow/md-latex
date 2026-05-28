# md-latex

> **Real-time Markdown to LaTeX converter with live preview — write what you know, output what you need.**

`md-latex` is a powerful, modern web application that bridges the gap between the simplicity of Markdown and the typographical excellence of LaTeX. Write your documents, academic papers, or notes in intuitive Markdown, and instantly see both the compiled HTML preview and the production-ready LaTeX source code.

---

## Features

- **Real-Time 3-Pane Synchronization:** An advanced side-by-side-by-side layout (Markdown, LaTeX Output, HTML Preview). As you type or click around in the Markdown editor, the LaTeX and Preview panes intelligently scroll and highlight to exactly match your cursor's location using custom AST source-mapping.
- **Academic Standard Support:** Out-of-the-box support for YAML frontmatter (Title, Author, Abstract, Date), complex math equations (via KaTeX), tables, citations, and more.
- **Bibliography Management:** Upload or paste your `.bib` files directly into the file explorer. The transpiler will automatically bundle them using `filecontents` and inject `\printbibliography` into the output.
- **PDF Export:** Generate a compiled PDF of your LaTeX document with a single click using the integrated `texlive.net` compilation API.
- **Modern UI:** A stunning, responsive interface built with Tailwind CSS v4, featuring a sleek dark mode, glassmorphism elements, micro-animations, and resizable layout panes.
- **Local-First Storage:** Your documents are automatically saved to your browser's local storage via Zustand persistence, including folder management and document switching.

## Technology Stack

This project is orchestrated as a modern monorepo using **Turborepo** and **pnpm**.

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Editor:** [CodeMirror 6](https://codemirror.net/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **AST Parsing & Transpilation:** [unified](https://unifiedjs.com/), [remark](https://github.com/remarkjs/remark), and [rehype](https://github.com/rehypejs/rehype)

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [pnpm](https://pnpm.io/) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OpenDevFlow/md-latex.git
   cd md-latex
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open the application**
   Navigate to `http://localhost:3000` in your browser.

## Project Structure

```text
md-latex/
├── apps/
│   └── web/                 # Main Next.js application (Frontend UI)
├── packages/
│   └── transpiler/          # Core Markdown-to-LaTeX AST conversion engine
├── turbo.json               # Turborepo configuration
└── package.json             # Root workspace configuration
```

## How it Works

The core functionality of `md-latex` is driven by the `unified` ecosystem, transforming raw text into an Abstract Syntax Tree (AST), manipulating that tree, and generating target output strings (LaTeX and HTML).

### 1. Markdown Parsing
When you type in the CodeMirror editor, the raw Markdown string is captured and sent to the `unified` processor. The `remark-parse` plugin transforms this raw string into an `mdast` (Markdown Abstract Syntax Tree). Additional plugins like `remark-gfm` (for tables and strikethroughs) and `remark-math` (for mathematical blocks) are used to enrich the AST with complex node types.

### 2. LaTeX Transpilation
Our custom `@md-latex/transpiler` package walks this enriched AST to generate LaTeX code:
- **Node Emission:** It uses a registry of node emitters (e.g., `headingEmitter`, `paragraphEmitter`). Each emitter dictates exactly how a specific Markdown node translates into LaTeX (e.g., converting a level 2 heading node into a `\subsection{...}` command).
- **Source Mapping:** During emission, the transpiler injects temporary `% source-line: X` markers into the LaTeX output for block-level elements (paragraphs, tables, code blocks). 
- **Post-Processing:** Before returning the final string, the transpiler extracts these markers to build a `sourceMap`. This source map links the original Markdown line number directly to the generated LaTeX line number.

### 3. HTML Preview Generation
In parallel to LaTeX generation, the AST is converted to HTML for live viewing:
- **AST Conversion:** The `remark-rehype` plugin converts the Markdown AST into a HTML AST (`hast`).
- **Data Tagging:** A custom plugin (`rehypeSourceLinePlugin`) walks the HTML AST and injects a `data-source-line` attribute into every generated HTML element, matching it to the original Markdown line.
- **Rendering:** `rehype-katex` processes the math nodes, and `rehype-stringify` converts the final tree into an HTML string, which is injected into the React DOM using `dangerouslySetInnerHTML`.

### 4. 3-Pane Scroll Synchronization
The source mapping from both the LaTeX transpilation and the HTML tagging enables precise scroll synchronization:
- **Cursor Tracking:** The CodeMirror Markdown editor uses an `updateListener` to constantly monitor your cursor's line number and saves it to a global `Zustand` store as `activeLine`.
- **LaTeX Sync:** The LaTeX pane watches `activeLine`, cross-references it against the generated `sourceMap`, and programmatically sets the CodeMirror selection to the exact corresponding LaTeX line, Native CodeMirror active-line styling then visually highlights the block.
- **Preview Sync:** The HTML Preview pane watches `activeLine`, queries the DOM for an element matching `[data-source-line="X"]`, and calls `scrollIntoView()`.

## License

This project is open-source and available under the [MIT License](LICENSE).
