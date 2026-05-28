# md-latex Web UI

This is the frontend application for the `md-latex` monorepo. It is a modern, responsive web application built with [Next.js](https://nextjs.org/) and Tailwind CSS v4, providing a powerful 3-pane Markdown-to-LaTeX editing experience.

## Monorepo Workflow

Since this application is part of a Turborepo, it's best to run commands from the repository root:

- **Install dependencies:** `pnpm install`
- **Development server:** `pnpm --filter web dev`
- **Build production bundle:** `pnpm --filter web build`
- **Run tests:** `pnpm --filter web test`

You can also navigate to `apps/web` and use local `npm run dev` if preferred.

## Key Features

- **3-Pane Synchronized Editor:** Edit Markdown and see real-time updates in both the generated LaTeX source and the compiled HTML preview. Scrolling is intelligently synchronized across all three panes using Abstract Syntax Tree (AST) positional mapping.
- **texlive.net PDF Export:** Seamlessly generate and download PDF documents. The app bypasses CORS restrictions using a hidden iframe POST method to securely compile LaTeX via the public texlive.net service.
- **Bibliography Management:** Upload `.bib` files directly into the virtual file tree. The editor handles `filecontents` embedding and citation formatting.

## Usage Guide

1. **Launch the Editor:** Start the dev server and open [http://localhost:3000](http://localhost:3000).
2. **File Associations:** Create new `.md` files or upload existing `.bib` files via the sidebar.
3. **Live Preview Sync:** As you edit, the preview pane automatically flashes and scrolls to the closest matching line number.
4. **Export Limitations:** The PDF generation flow relies on the availability of the external `texlive.net` service. It requires an active internet connection and may time out on extremely large documents (timeout is set to 30s).
