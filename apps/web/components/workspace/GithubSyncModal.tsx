import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { requestDeviceCode, pollForToken, DeviceCodeResponse } from '@/lib/githubAuth';
import { getUserRepos, createRepo, commitWorkspace, GithubRepo } from '@/lib/githubSync';
import { useWorkspace } from '@/hooks/useWorkspace';

interface GithubSyncModalProps {
  onClose: () => void;
}

export function GithubSyncModal({ onClose }: GithubSyncModalProps) {
  const { githubToken, githubRepo, setGithubToken, setGithubUser, setGithubRepo } = useEditorStore();
  const { buildArtifact } = useWorkspace();
  const cancelAuthRef = React.useRef(false);

  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeResponse | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(githubRepo || '');
  const [newRepoName, setNewRepoName] = useState<string>('');
  
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'fetching_repos' | 'ready' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchRepos = async (token: string) => {
    setStatus('fetching_repos');
    try {
      const userRepos = await getUserRepos(token);
      setRepos(userRepos);
      
      // If previously selected repo is in the list, keep it
      if (!githubRepo && userRepos.length > 0) {
        setSelectedRepo(userRepos[0].full_name);
      }
      
      setStatus('ready');
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to fetch repositories. Token may be invalid.');
      setGithubToken(null);
      setStatus('error');
    }
  };

  // 1. Initial State Check
  useEffect(() => {
    if (githubToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRepos(githubToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubToken]);

  const handleConnect = async () => {
    setStatus('idle');
    setErrorMessage('');
    try {
      cancelAuthRef.current = false;
      const data = await requestDeviceCode();
      setDeviceCodeData(data);
      setStatus('authorizing');

      // Start polling
      const token = await pollForToken(data.device_code, data.interval, () => cancelAuthRef.current);
      setGithubToken(token);
      fetchRepos(token);
    } catch (error) {
      const err = error as Error;
      if (err.message !== 'Cancelled') {
        setErrorMessage(err.message || 'Authorization failed.');
        setStatus('error');
      }
    }
  };

  const handleCreateRepo = async () => {
    if (!githubToken || !newRepoName.trim()) return;
    setStatus('syncing');
    try {
      const repo = await createRepo(githubToken, newRepoName.trim());
      setRepos([repo, ...repos]);
      setSelectedRepo(repo.full_name);
      setNewRepoName('');
      setStatus('ready');
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to create repository.');
      setStatus('error');
    }
  };

  const handleSync = async () => {
    if (!githubToken || !selectedRepo) return;
    
    const [owner, repo] = selectedRepo.split('/');
    setStatus('syncing');
    
    try {
      const artifact = buildArtifact();
      const filesToSync = [];
      
      // Add the workspace backup file
      filesToSync.push({
        path: 'workspace.mdlatex',
        content: JSON.stringify(artifact, null, 2),
      });

      // Add all markdown and tex documents in a structured way
      for (const doc of (artifact.documents || [])) {
        if (doc.type !== 'folder') {
          // Resolve path based on parent folders (simplified for now, flattening or just saving to docs/)
          const ext = doc.type === 'bib' ? '.bib' : '.md'; // tex is generated, so mostly md and bib
          const filename = doc.title.endsWith(ext) ? doc.title : `${doc.title}${ext}`;
          filesToSync.push({
            path: `docs/${doc.id}/${filename}`,
            content: doc.content,
          });
        }
      }

      await commitWorkspace(githubToken, owner, repo, 'main', filesToSync, `Sync workspace: ${new Date().toLocaleString()}`);
      
      setGithubRepo(selectedRepo);
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to sync to GitHub.');
      setStatus('error');
    }
  };

  const handleCancelAuth = () => {
    cancelAuthRef.current = true;
    setStatus('idle');
    setDeviceCodeData(null);
  };

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
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            <h2 className="text-lg font-semibold text-text m-0">GitHub Cloud Sync</h2>
          </div>
          <button onClick={onClose} className="hover:bg-surface-3 rounded text-text-muted transition-colors" style={{ padding: '4px' }} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {status === 'error' && (
            <div 
              className="rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex gap-2 items-start"
              style={{ padding: '12px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {(!githubToken && (status === 'idle' || status === 'error')) && (
            <div className="flex flex-col gap-4 text-center items-center py-2">
              <p className="text-sm text-text-muted">
                Connect your GitHub account to sync and backup your workspaces directly to a repository.
              </p>
              <button
                onClick={handleConnect}
                className="bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                style={{ padding: '8px 24px' }}
              >
                Connect to GitHub
              </button>
            </div>
          )}

          {status === 'authorizing' && deviceCodeData && (
            <div className="flex flex-col gap-4 text-center items-center py-4">
              <p className="text-sm text-text-muted">
                Please enter the following code at <a href={deviceCodeData.verification_uri} target="_blank" rel="noreferrer" className="text-accent hover:underline">{deviceCodeData.verification_uri}</a> to authorize md-latex.
              </p>
              <div 
                className="bg-surface border border-border rounded-lg text-2xl font-mono font-bold tracking-widest text-text flex items-center justify-center gap-4"
                style={{ padding: '16px' }}
              >
                <span>{deviceCodeData.user_code}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(deviceCodeData.user_code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text transition-colors border border-border flex-shrink-0"
                  title="Copy Code"
                >
                  {copiedCode ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted mt-2">
                <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
                Waiting for authorization...
              </div>
              <button onClick={handleCancelAuth} className="text-sm text-text-faint hover:text-text underline mt-2">
                Cancel
              </button>
            </div>
          )}

          {(status === 'fetching_repos' || status === 'syncing') && (
            <div 
              className="flex flex-col items-center justify-center gap-3"
              style={{ padding: '32px 0' }}
            >
              <div className="w-8 h-8 rounded-full border-3 border-accent border-t-transparent animate-spin"></div>
              <p className="text-sm text-text-muted">
                {status === 'fetching_repos' ? 'Fetching repositories...' : 'Syncing to GitHub...'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div 
              className="flex flex-col items-center justify-center gap-3 text-success"
              style={{ padding: '32px 0' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="font-medium text-lg">Successfully Synced!</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 relative">
                <label className="block text-sm font-medium text-text m-0">Select Repository</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                    style={{ padding: '10px 40px 10px 12px' }}
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                  >
                    {repos.length === 0 && <option value="">No repositories found</option>}
                    {repos.map(repo => (
                      <option key={repo.full_name} value={repo.full_name}>{repo.full_name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-xs text-text-faint uppercase font-medium">OR</span>
                <div className="h-px bg-border flex-1"></div>
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="block text-sm font-medium text-text m-0">Create New Repository</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="md-latex-workspace"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    className="flex-1 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    style={{ padding: '10px 12px' }}
                  />
                  <button 
                    onClick={handleCreateRepo}
                    disabled={!newRepoName.trim()}
                    className="bg-surface-3 hover:bg-surface-3/80 disabled:opacity-50 disabled:cursor-not-allowed text-text font-medium rounded-lg transition-colors border border-border"
                    style={{ padding: '8px 16px' }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {status === 'ready' && (
          <div 
            className="border-t border-border bg-surface-2 flex items-center justify-between"
            style={{ padding: '16px 24px' }}
          >
            <button 
              onClick={() => {
                setGithubToken(null);
                setGithubUser(null);
                setGithubRepo(null);
                setStatus('idle');
              }}
              className="text-sm font-medium text-text-muted hover:text-danger transition-colors"
            >
              Disconnect
            </button>
            <button
              onClick={handleSync}
              disabled={!selectedRepo}
              className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2 rounded-lg"
              style={{ padding: '8px 24px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Sync Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
