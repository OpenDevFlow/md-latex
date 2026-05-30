import React, { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getBranches, createBranch, getCommits, getWorkspaceFromCommit, GithubBranch, GithubCommit, commitWorkspace } from '@/lib/githubSync';
import { useWorkspace } from '@/hooks/useWorkspace';
import { GithubSyncModal } from './GithubSyncModal';

export function SourceControlPanel() {
  const { githubToken, githubRepo, githubBranch, setGithubBranch, importWorkspace } = useEditorStore();
  const { buildArtifact } = useWorkspace();
  
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newBranchName, setNewBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const loadData = React.useCallback(async () => {
    if (!githubToken || !githubRepo) return;
    const [owner, repo] = githubRepo.split('/');
    
    setLoading(true);
    setError('');
    try {
      const [branchesData, commitsData] = await Promise.all([
        getBranches(githubToken!, owner, repo),
        getCommits(githubToken!, owner, repo, githubBranch)
      ]);
      setBranches(branchesData);
      setCommits(commitsData);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load repository data');
    } finally {
      setLoading(false);
    }
  }, [githubToken, githubRepo, githubBranch]);

  // Load branches and commits when repo/branch changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleFetch = async () => {
    await loadData();
  };

  const handlePull = async () => {
    if (commits.length === 0) {
      setError('No commits to pull.');
      return;
    }
    const latestCommitSha = commits[0].sha;
    await handleCheckout(latestCommitSha);
  };

  const handleCreateBranch = async () => {
    if (!githubToken || !githubRepo || !newBranchName.trim()) return;
    const [owner, repo] = githubRepo.split('/');
    
    setLoading(true);
    try {
      // Create from current branch's latest commit
      const currentBranchSha = branches.find(b => b.name === githubBranch)?.commit.sha;
      if (!currentBranchSha) throw new Error('Could not determine current branch SHA');
      
      await createBranch(githubToken, owner, repo, newBranchName.trim(), currentBranchSha);
      setGithubBranch(newBranchName.trim());
      setNewBranchName('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!githubToken || !githubRepo || !commitMessage.trim()) return;
    const [owner, repo] = githubRepo.split('/');
    
    setSyncing(true);
    try {
      const artifact = buildArtifact();
      const filesToSync = [];
      
      filesToSync.push({
        path: 'workspace.mdlatex',
        content: JSON.stringify(artifact, null, 2),
      });

      for (const doc of (artifact.documents || [])) {
        if (doc.type !== 'folder') {
          const ext = doc.type === 'bib' ? '.bib' : '.md';
          const filename = doc.title.endsWith(ext) ? doc.title : `${doc.title}${ext}`;
          filesToSync.push({
            path: `docs/${doc.id}/${filename}`,
            content: doc.content,
          });
        }
      }

      await commitWorkspace(githubToken, owner, repo, githubBranch, filesToSync, commitMessage.trim());
      setCommitMessage('');
      
      // Reload commits
      const commitsData = await getCommits(githubToken, owner, repo, githubBranch);
      setCommits(commitsData);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to push commit');
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckout = async (commitSha: string) => {
    if (!githubToken || !githubRepo) return;
    if (!confirm('This will replace your current workspace with the state from this commit. Unsaved changes will be lost (an auto-snapshot will be taken). Continue?')) {
      return;
    }
    
    const [owner, repo] = githubRepo.split('/');
    setLoading(true);
    try {
      const workspaceContent = await getWorkspaceFromCommit(githubToken, owner, repo, commitSha);
      const parsed = JSON.parse(workspaceContent);
      importWorkspace(parsed);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to checkout commit');
    } finally {
      setLoading(false);
    }
  };

  if (!githubToken || !githubRepo) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center" style={{ padding: '24px', gap: '16px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
        <div className="text-sm text-text-muted">
          Connect your GitHub account to manage version control directly from the editor.
        </div>
        <button 
          onClick={() => setShowSyncModal(true)}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          style={{ padding: '8px 16px' }}
        >
          Connect Repository
        </button>
        {showSyncModal && <GithubSyncModal onClose={() => setShowSyncModal(false)} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-border flex flex-col shrink-0" style={{ padding: '12px', gap: '12px' }}>
        <div className="flex items-center justify-between" style={{ gap: '8px' }}>
          <div className="text-sm font-medium text-text flex items-center truncate min-w-0" style={{ gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            <span className="truncate">{githubRepo}</span>
          </div>
          <button onClick={() => setShowSyncModal(true)} className="text-[10px] uppercase font-bold text-text-muted hover:text-accent shrink-0" title="Change Repository">
            Change
          </button>
        </div>
        
        {error && (
          <div className="text-xs text-danger bg-danger/10 p-2 rounded border border-danger/20 break-words">
            {error}
          </div>
        )}

        <div className="flex flex-col" style={{ gap: '8px' }}>
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-muted">Branch</label>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <button onClick={handleFetch} disabled={loading || syncing} className="text-[10px] uppercase font-bold text-text-muted hover:text-accent disabled:opacity-50 transition-colors" title="Fetch latest commits">Fetch</button>
              <button onClick={handlePull} disabled={loading || syncing} className="text-[10px] uppercase font-bold text-text-muted hover:text-accent disabled:opacity-50 transition-colors" title="Pull latest changes">Pull</button>
            </div>
          </div>
          <select
            value={githubBranch}
            onChange={(e) => setGithubBranch(e.target.value)}
            disabled={loading || syncing}
            className="w-full bg-surface-2 border border-border rounded text-sm text-text focus:outline-none focus:border-accent"
            style={{ padding: '6px 8px' }}
          >
            {branches.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex" style={{ gap: '8px' }}>
          <input
            type="text"
            placeholder="New branch name..."
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            disabled={loading || syncing}
            className="flex-1 bg-surface-2 border border-border rounded text-xs text-text focus:outline-none focus:border-accent"
            style={{ padding: '6px 8px' }}
          />
          <button
            onClick={handleCreateBranch}
            disabled={!newBranchName.trim() || loading || syncing}
            className="bg-surface-3 hover:bg-surface-3/80 disabled:opacity-50 text-text text-xs rounded border border-border transition-colors shrink-0"
            style={{ padding: '6px 12px' }}
          >
            Create
          </button>
        </div>

        <div className="flex flex-col border-t border-border" style={{ gap: '8px', paddingTop: '8px' }}>
          <textarea
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            disabled={loading || syncing}
            rows={2}
            className="w-full bg-surface-2 border border-border rounded text-sm text-text focus:outline-none focus:border-accent resize-none"
            style={{ padding: '6px 8px' }}
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || loading || syncing}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded transition-colors flex justify-center items-center"
            style={{ padding: '6px', gap: '8px' }}
          >
            {syncing ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : 'Commit & Push'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: '12px', gap: '12px' }}>
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider" style={{ marginBottom: '4px' }}>Commit History</h3>
        
        {loading && !syncing ? (
          <div className="flex justify-center" style={{ padding: '16px' }}>
            <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin"></div>
          </div>
        ) : commits.length === 0 ? (
          <div className="text-xs text-text-faint text-center" style={{ padding: '16px' }}>No commits found on this branch.</div>
        ) : (
          commits.map((commit) => (
            <div key={commit.sha} className="group flex flex-col bg-surface-2 rounded-lg border border-border relative overflow-hidden" style={{ gap: '4px', padding: '12px' }}>
              <div className="text-sm text-text font-medium truncate pr-8" title={commit.commit.message}>
                {commit.commit.message}
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{commit.commit.author?.name}</span>
                <span className="font-mono">{commit.sha.substring(0, 7)}</span>
              </div>
              <div className="text-[10px] text-text-faint">
                {new Date(commit.commit.author?.date || '').toLocaleString()}
              </div>
              
              <div className="absolute top-0 right-0 h-full flex flex-col justify-center px-2 bg-gradient-to-l from-surface-2 via-surface-2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCheckout(commit.sha)}
                  className="bg-accent hover:bg-accent-hover text-white text-[10px] font-medium px-2 py-1 rounded shadow-sm"
                >
                  Checkout
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {showSyncModal && <GithubSyncModal onClose={() => setShowSyncModal(false)} />}
    </div>
  );
}
