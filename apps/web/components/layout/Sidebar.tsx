'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { WorkspaceSwitcherPanel } from '@/components/workspace/WorkspaceSwitcherPanel';
import { WorkspaceHistoryPanel } from '@/components/workspace/WorkspaceHistoryPanel';

function getHeadings(content: string) {
  const lines = content.split('\n');
  const headings = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }
  return headings;
}

interface FileTreeProps {
  level: number;
  parentId: string | null;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
}

function FileTree({ level, parentId, editingId, setEditingId, editTitle, setEditTitle }: FileTreeProps) {
  const documents = useEditorStore((s) => s.documents);
  const currentDocId = useEditorStore((s) => s.currentDocId);
  const loadDocument = useEditorStore((s) => s.loadDocument);
  const deleteDocument = useEditorStore((s) => s.deleteDocument);
  const toggleFolder = useEditorStore((s) => s.toggleFolder);
  const moveItem = useEditorStore((s) => s.moveItem);
  const renameItem = useEditorStore((s) => s.renameItem);
  
  const items = documents.filter(d => (d.parentId || null) === parentId);
  
  if (items.length === 0) return null;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent, isFolder: boolean) => {
    if (isFolder) {
      e.preventDefault(); // Allow drop
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetId) {
      moveItem(draggedId, targetId);
    }
  };
  
  return (
    <>
      {items.map((doc) => {
        const isFolder = doc.type === 'folder';
        const paddingLeft = `${level * 12 + 8}px`;
        
        return (
          <div key={doc.id}>
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, doc.id)}
              onDragOver={(e) => handleDragOver(e, isFolder)}
              onDrop={(e) => isFolder ? handleDrop(e, doc.id) : undefined}
              className={`file-item group ${currentDocId === doc.id ? 'active' : ''}`}
              style={{ paddingLeft }}
              onClick={() => isFolder ? toggleFolder(doc.id) : loadDocument(doc)}
            >
              {isFolder ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  {doc.isOpen ? (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  ) : (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  )}
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              )}
              
              {editingId === doc.id ? (
                <input
                  autoFocus
                  className="flex-1 bg-surface border border-accent text-text px-1 text-sm outline-none w-full min-w-0"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => {
                    if (editTitle.trim() && editTitle.trim() !== doc.title) {
                      renameItem(doc.id, editTitle.trim());
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editTitle.trim() && editTitle.trim() !== doc.title) {
                        renameItem(doc.id, editTitle.trim());
                      }
                      setEditingId(null);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="truncate flex-1"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(doc.id);
                    setEditTitle(doc.title);
                  }}
                >
                  {doc.title || 'Untitled'}
                </span>
              )}
              <button 
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/20 text-danger rounded transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDocument(doc.id);
                }}
                title={isFolder ? "Delete folder" : "Delete file"}
                aria-label={isFolder ? "Delete folder" : "Delete file"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
            
            {isFolder && doc.isOpen && (
              <FileTree 
                level={level + 1} 
                parentId={doc.id} 
                editingId={editingId}
                setEditingId={setEditingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const showSidebar = useEditorStore((s) => s.showSidebar);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const documents = useEditorStore((s) => s.documents);
  const newDocument = useEditorStore((s) => s.newDocument);
  const newFolder = useEditorStore((s) => s.newFolder);
  const moveItem = useEditorStore((s) => s.moveItem);
  const content = useEditorStore((s) => s.content);

  const [treeExpanded, setTreeExpanded] = useState(true);
  const [outlineExpanded, setOutlineExpanded] = useState(true);

  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Extract headings from the current document
  const headings = useMemo(() => getHeadings(content), [content]);

  // Handle mobile layout (hide sidebar on small screens entirely for now, as requested in plan)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showSidebar || isMobile) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      const store = useEditorStore.getState();
      
      const newDocId = crypto.randomUUID();
      const now = Date.now();
      const newDoc = {
        id: newDocId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        content: fileContent,
        createdAt: now,
        updatedAt: now,
      };
      
      store.setDocuments([newDoc, ...store.documents]);
      store.loadDocument(newDoc);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="sidebar" aria-label="Sidebar">
      {/* File Tree Section */}
      <div className="sidebar-section file-tree-section">
        <div className="sidebar-header">
          <button 
            className="flex items-center gap-2 flex-1" 
            onClick={() => setTreeExpanded(!treeExpanded)}
          >
            <svg
              className={`transition-transform ${treeExpanded ? '' : '-rotate-90'}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span className="font-semibold text-sm">File tree</span>
          </button>
          <div className="sidebar-actions flex items-center gap-3 text-text-muted">
            <button title="New File" aria-label="New File" onClick={() => newDocument()} className="hover:text-text transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </button>
            <button title="New Folder" aria-label="New Folder" onClick={() => newFolder()} className="hover:text-text transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".md,.txt,.tex" 
              onChange={handleFileUpload} 
            />
            <button title="Upload File" aria-label="Upload File" onClick={() => fileInputRef.current?.click()} className="hover:text-text transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            <button title="Close Sidebar" aria-label="Close Sidebar" onClick={toggleSidebar} className="hover:text-text transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        
        {treeExpanded && (
          <div 
            className="sidebar-content file-list flex-1 min-h-[100px]"
            onDragOver={(e) => {
              e.preventDefault(); // allow drop
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const draggedId = e.dataTransfer.getData('text/plain');
              if (draggedId) {
                // If it's dropped in the root container and not caught by a folder
                moveItem(draggedId, null);
              }
            }}
          >
            {documents.length === 0 ? (
              <div className="text-xs text-text-faint italic px-2">No documents saved.</div>
            ) : (
              <FileTree 
                level={0} 
                parentId={null} 
                editingId={editingId}
                setEditingId={setEditingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
              />
            )}
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* File Outline Section */}
      <div className="sidebar-section file-outline-section">
        <div className="sidebar-header">
          <button 
            className="flex items-center gap-2 flex-1" 
            onClick={() => setOutlineExpanded(!outlineExpanded)}
          >
            <svg
              className={`transition-transform ${outlineExpanded ? '' : '-rotate-90'}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span className="font-semibold text-sm">File outline</span>
          </button>
        </div>
        
        {outlineExpanded && (
          <div className="sidebar-content outline-list">
            {headings.length === 0 ? (
              <div className="text-xs text-text-faint italic px-2">No headings in document.</div>
            ) : (
              headings.map((heading, i) => {
                // To keep it simple, treat H1 and H2 as top level items in the outline.
                const isTopLevel = heading.level <= 2;
                const indentClass = isTopLevel ? '' : 'pl-6 border-l border-border ml-2 my-1 text-text-muted';
                
                return (
                  <div key={i}>
                    {isTopLevel && (
                      <div className="flex items-center gap-2 text-sm text-text-muted mt-2 mb-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span className="truncate">{heading.text}</span>
                      </div>
                    )}
                    {!isTopLevel && (
                      <div className={`outline-item ${indentClass} truncate hover:bg-surface-3 py-1 px-2 rounded cursor-pointer transition-colors text-sm`}>
                        {heading.text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Workspaces Section */}
      <WorkspacesSidebarSection />
    </div>
  );
}

function WorkspacesSidebarSection() {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'saved' | 'history'>('saved');

  return (
    <div className="sidebar-section" style={{ flexShrink: 0 }}>
      <div className="sidebar-header">
        <button
          className="flex items-center gap-2 flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            className={`transition-transform ${expanded ? '' : '-rotate-90'}`}
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="font-semibold text-sm">Workspaces</span>
        </button>
      </div>

      {expanded && (
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
            {(['saved', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '7px 0', fontSize: '12px', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s',
                  color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
              >
                {t === 'saved' ? 'Saved' : 'History'}
              </button>
            ))}
          </div>

          {tab === 'saved' ? <WorkspaceSwitcherPanel /> : <WorkspaceHistoryPanel />}
        </div>
      )}
    </div>
  );
}
