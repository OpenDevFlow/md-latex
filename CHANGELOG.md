# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-29

### Added
- Implemented 3-pane scroll synchronization across Markdown, LaTeX, and HTML Preview using AST source mapping.
- Integrated `texlive.net` PDF export via an iframe POST method to bypass CORS restrictions.
- Added bibliography management for uploading and parsing `.bib` files using `filecontents`.
- Redesigned the settings modal and export dropdown with a glassmorphism UI and micro-animations.
- Persisted file system structures, documents, and user preferences to `localStorage` via Zustand.

### Changed
- Migrated the architecture to a pnpm workspace utilizing Turborepo for faster builds.
- Upgraded styling engine from Tailwind v3 to Tailwind v4.
- Updated CodeMirror configurations to smoothly handle dynamic pane layouts and theme toggling.

### Fixed
- Fixed Turbopack CSS caching issues on Next.js 15 by converting critical layout padding to inline styles.
- Standardized typography across the application to utilize the `Inter` font family.
- Resolved scroll synchronization flickering and jittering in the LaTeX and HTML Preview panes during active typing.
