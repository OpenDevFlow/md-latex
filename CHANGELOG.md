# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Workspace — Core Export / Import
- Export full workspace as a versioned `.mdlatex` bundle (JSON, format v2)
- Import workspace with live validation, format version checking, and a forward-compatible migration chain
- Workspace format version bumped to v2 with metadata fields: `label`, `description`, `tags`, `wordCount`

#### Workspace — Advanced Features
- **Password protection**: AES-256-GCM encryption via native Web Crypto API (PBKDF2 key derivation, 100k iterations). Only the sensitive payload is encrypted; metadata stays readable in the import dialog
- **Export as ZIP**: Download all workspace files as a structured `.zip` preserving folder hierarchy, plus a `.mdlatex-meta.json` manifest
- **Share via URL**: Compress workspace to a `#w=` URL hash using native `CompressionStream` (zero dependencies). Anyone with the link loads the workspace instantly in their browser
- **Share via URL + Password**: Encrypted shareable URL — receiver is prompted for the password before the workspace is decrypted
- **Drag and drop import**: Drop a `.mdlatex` file anywhere on the editor to trigger the import flow
- **Diff preview / cherry-pick**: Before confirming an import, see a colour-coded diff (New / Modified / Unchanged / Removed) and select exactly which files to import
- **Auto-snapshots**: Workspace is automatically snapshotted to `localStorage` before every import (ring buffer of 5 entries, 400 KB size guard)
- **Named workspace switcher**: Save the current workspace under a custom name, then load, rename, export, or delete it from the sidebar Workspaces panel
- **Workspace history panel**: Browse and restore from the last 5 auto-snapshots in the sidebar

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
