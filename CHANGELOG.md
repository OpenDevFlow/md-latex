# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-06-01

### Security
- **GitHub OAuth token exchange**: Replaced the public third-party `corsproxy.io` proxy with a first-party Cloudflare Worker for the device flow token exchange. The `access_token` (full `repo` scope) no longer transits untrusted external infrastructure. CORS is restricted to the GitHub Pages origin on the Worker. `requestDeviceCode` continues using the public proxy as it returns only a `device_code` with no tokens.

## [1.2.0] - 2026-05-31

### Added
- **GitHub Version Control**: Implemented a comprehensive GitHub version control system directly inside the app. Users can now view their commit history, checkout previous commits, create new branches, and commit changes without leaving the editor.
- **Sidebar Tabs Refactor**: Redesigned the left sidebar to use a clean Tab-based navigation system, splitting the File Explorer, Workspaces, and the new Version Control panel into distinct dedicated views.
- **GitHub Cloud Sync & Backup**: Added the ability to sync and backup the entire workspace directly to a GitHub repository from the browser. It securely uses the GitHub Device Authorization Flow (proxied to bypass CORS restrictions natively on GitHub Pages) to handle OAuth without needing a backend server.
- **Copy Device Code Button**: Added a copy-to-clipboard button right next to the GitHub device authorization code to improve UX.
- **Fetch & Pull Operations**: Added manual "Fetch" and "Pull" actions to the Version Control panel, allowing users to synchronize their workspace with the latest remote changes effortlessly.

### Fixed
- **Sidebar Separator Overlap**: Fixed a layout bug where the sidebar split-pane resize handles (separators) had an overly high `z-index`, causing them to inappropriately bleed through and render on top of modal overlays (like the GitHub Sync modal).
- **Modal Component Padding Issues**: Fixed broken UI padding inside the `GithubSyncModal` by migrating non-functional generic Tailwind spacing utilities (e.g. `p-3`, `py-2`) to inline styles, restoring the intended clean aesthetic for error toasts, buttons, and loading states.
- **Sidebar & Source Control Padding**: Fixed severe UI squishing and completely missing padding within the `Sidebar` tabs and the `SourceControlPanel`. Just like the modal, generic Tailwind padding utilities were bypassed in favor of robust inline styles (`style={{ padding: '...' }}`).
- **Polling Loop Closure Bug**: Fixed a classic React stale closure bug that caused the GitHub Device Flow background polling to instantly cancel itself on the first tick due to evaluating the old `status === 'idle'` state. Safely migrated the cancellation check to a mutable `cancelAuthRef`.
## [1.1.0] - 2026-05-30

### Added

#### Workspace - Core Export / Import
- Export full workspace as a versioned `.mdlatex` bundle (JSON, format v2)
- Import workspace with live validation, format version checking, and a forward-compatible migration chain
- Workspace format version bumped to v2 with metadata fields: `label`, `description`, `tags`, `wordCount`

#### Workspace - Advanced Features
- **Password protection**: AES-256-GCM encryption via native Web Crypto API (PBKDF2 key derivation, 100k iterations). Only the sensitive payload is encrypted; metadata stays readable in the import dialog
- **Export as ZIP**: Download all workspace files as a structured `.zip` preserving folder hierarchy, plus a `.mdlatex-meta.json` manifest
- **Share via URL**: Compress workspace to a `#w=` URL hash using native `CompressionStream` (zero dependencies). Anyone with the link loads the workspace instantly in their browser
- **Share via URL + Password**: Encrypted shareable URL — receiver is prompted for the password before the workspace is decrypted
- **Drag and drop import**: Drop a `.mdlatex` file anywhere on the editor to trigger the import flow
- **Diff preview / cherry-pick**: Before confirming an import, see a colour-coded diff (New / Modified / Unchanged / Removed) and select exactly which files to import
- **Auto-snapshots**: Workspace is automatically snapshotted to `localStorage` before every import (ring buffer of 5 entries, 400 KB size guard)
- **Named workspace switcher**: Save the current workspace under a custom name, then load, rename, export, or delete it from the sidebar Workspaces panel
- **Workspace history panel**: Browse and restore from the last 5 auto-snapshots in the sidebar
- **Native sidebar resizer**: Replaced static sidebar section dividers with functional drag-to-resize split panes. Built natively using raw React state to calculate percentage-based heights without external dependencies, giving users full layout control.

### Fixed

- **Import Selected button not working**: The diff modal was shown with a hardcoded empty artifact before the file was parsed, causing all existing files to appear as "Removed" and 0 files to be importable. The import flow now parses and validates the file first, then shows the real diff. Cherry-pick selection is correctly applied via `commitImport` before loading the workspace
- **`frontmatter.date.replace is not a function` crash**: js-yaml parses certain date formats (e.g. `20/10/2022`) as native `Date` objects rather than strings. The date handling in the transpiler now coerces all values to string via `String()` before calling `.replace()`, making all date formats safe: ISO dates, DD/MM/YYYY, plain text, `\today`, and numeric years
- **Sidebar scrolling issues**: Rebuilt the sidebar layout to use independent per-section scrolling with sticky section headers, and replaced buggy flexbox resizing with a robust native drag-to-resize implementation. This resolves scroll issues (especially in the Workspaces section) without layout conflicts.
- **Save Workspace button overflow**: Added `minWidth: 0` to the workspace save input field to prevent it from ignoring flex constraints and pushing the "Save" button out of bounds.

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
