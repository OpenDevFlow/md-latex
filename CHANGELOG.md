# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **3-Pane Scroll Synchronization:** Added intelligent scroll-sync across Markdown, LaTeX, and HTML Preview panes. The transpiler now builds a source map linking AST nodes to LaTeX line numbers, while custom Rehype plugins tag HTML elements with data attributes.
- **texlive.net PDF Export:** Implemented a robust `texlive.net` integration via an invisible iframe `POST` method to bypass CORS restrictions, enabling 1-click PDF downloads.
- **Bibliography Manager:** Added full support for uploading/pasting `.bib` files. The transpiler automatically bundles these references via `filecontents` and injects `\printbibliography` into the output LaTeX.
- **Glassmorphism UI:** Completely redesigned the settings modal and export dropdown using Tailwind CSS v4, adding smooth micro-animations, blur effects, and custom SVG icons.
- **Zustand Persistence:** File system structures, documents, and user preferences are now fully persisted to `localStorage`.

### Changed
- **Turborepo Migration:** Converted the architecture to a pnpm workspace with Turborepo for faster build caching.
- **Tailwind v4 Upgrade:** Migrated from Tailwind v3 to v4, removing outdated config files and relying on the new CSS-first `@import "tailwindcss"` engine.
- **CodeMirror Enhancements:** Updated CodeMirror configurations to smoothly handle dynamic layouts (2-pane vs 3-pane) and apply Next.js theme variables dynamically.

### Fixed
- **Turbopack CSS Caching:** Resolved a severe bug where Next.js 15 Turbopack would not hot-reload dynamically added Tailwind utility classes on new components (fixed by converting critical layout padding to inline React styles).
- **macOS Typography:** Unified the base typography to standard `Inter` fonts for maximum legibility on Retina displays.
