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
      <div 
        className="bg-surface border border-border rounded-xl shadow-xl flex flex-col overflow-hidden animate-dropIn"
        style={{ width: '480px' }}
      >
        <div 
          className="flex items-center justify-between border-b border-border"
          style={{ padding: '16px 24px' }}
        >
          <h2 className="text-lg font-semibold m-0">Document Settings</h2>
          <button onClick={onClose} className="hover:bg-surface-3 rounded text-text-muted transition-colors" style={{ padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            <label className="block text-sm font-medium text-text m-0">Citation Style</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                style={{ padding: '10px 40px 10px 12px' }}
                value={transpilerOptions.citationStyle || 'apa'}
                onChange={(e) => setTranspilerOptions({ citationStyle: e.target.value })}
              >
                <option value="apa">APA (American Psychological Association)</option>
                <option value="ieee">IEEE</option>
                <option value="mla">MLA (Modern Language Association)</option>
                <option value="chicago">Chicago</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="block text-sm font-medium text-text m-0">Bibliography File</label>
            <p className="text-xs text-text-muted m-0 mb-1">Select a `.bib` file from your workspace to use for references.</p>
            <div className="relative">
              <select
                className="w-full appearance-none bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                style={{ padding: '10px 40px 10px 12px' }}
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="border-t border-border bg-surface-2 flex justify-end"
          style={{ padding: '16px 24px' }}
        >
          <button 
            onClick={onClose}
            className="bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            style={{ padding: '8px 24px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
