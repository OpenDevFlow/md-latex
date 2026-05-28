'use client';

import { useEditorStore } from '@/store/editorStore';
import type { ActivePane } from '@/store/editorStore';

const PANES: { key: ActivePane; label: string; icon: React.ReactNode }[] = [
  {
    key: 'md',
    label: 'Editor',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    ),
  },
  {
    key: 'latex',
    label: 'LaTeX',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    ),
  },
  {
    key: 'preview',
    label: 'Preview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    ),
  },
];

export function PaneSwitcher() {
  const activePane = useEditorStore((s) => s.activePane);
  const setActivePane = useEditorStore((s) => s.setActivePane);

  return (
    <nav
      className="pane-switcher"
      aria-label="Switch pane"
      role="tablist"
    >
      {PANES.map(({ key, label, icon }) => (
        <button
          key={key}
          id={`pane-tab-${key}`}
          role="tab"
          aria-selected={activePane === key}
          onClick={() => setActivePane(key)}
          className={`pane-tab ${activePane === key ? 'active' : ''}`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
