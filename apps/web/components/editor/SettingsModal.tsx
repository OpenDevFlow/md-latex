'use client';

import { useEditorStore } from '@/store/editorStore';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const documents = useEditorStore((s) => s.documents);
  const transpilerOptions = useEditorStore((s) => s.transpilerOptions);
  const setTranspilerOptions = useEditorStore((s) => s.setTranspilerOptions);

  // Filter out folders to only show files for the bibliography selection
  const bibFiles = documents.filter((d) => d.type !== 'folder');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-xl w-[480px] flex flex-col overflow-hidden animate-dropIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold m-0">Document Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-3 rounded text-text-muted transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">Citation Style</label>
            <select
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
              value={transpilerOptions.citationStyle || 'apa'}
              onChange={(e) => setTranspilerOptions({ citationStyle: e.target.value })}
            >
              <option value="apa">APA (American Psychological Association)</option>
              <option value="ieee">IEEE</option>
              <option value="mla">MLA (Modern Language Association)</option>
              <option value="chicago">Chicago</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">Bibliography File</label>
            <p className="text-xs text-text-muted mb-2">Select a `.bib` file from your workspace to use for references.</p>
            <select
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
              value={transpilerOptions.bibliographyId || ''}
              onChange={(e) => setTranspilerOptions({ bibliographyId: e.target.value || null })}
            >
              <option value="">None</option>
              {bibFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface-2 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
