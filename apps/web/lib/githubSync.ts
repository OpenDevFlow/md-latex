import { Octokit } from '@octokit/rest';

export interface GithubRepo {
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
}

export interface SyncFile {
  path: string;
  content: string;
}

export async function getAuthenticatedUser(token: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}

export async function getUserRepos(token: string): Promise<GithubRepo[]> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });
  return data as GithubRepo[];
}

export async function createRepo(token: string, name: string): Promise<GithubRepo> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.createForAuthenticatedUser({
    name,
    private: true,
    auto_init: true, // Creates an initial commit so we have a base tree
  });
  return data as GithubRepo;
}

export async function commitWorkspace(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  files: SyncFile[],
  message: string = 'Sync md-latex workspace'
) {
  const octokit = new Octokit({ auth: token });

  // 1. Get the current reference
  const refPath = `heads/${branch}`;
  let refData;
  try {
    const { data } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: refPath,
    });
    refData = data;
  } catch (error) {
    const err = error as { status?: number };
    if (err.status === 404) {
      // If auto_init was true, 'main' should exist. 
      // If it fails, we might be dealing with an empty repo without auto_init.
      throw new Error(`Branch ${branch} not found. Please ensure the repository is initialized.`);
    }
    throw error;
  }

  const latestCommitSha = refData.object.sha;

  // 2. Get the commit to get its base tree
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // 3. Create the new tree
  const tree = files.map((file) => ({
    path: file.path,
    mode: '100644' as const,
    type: 'blob' as const,
    content: file.content,
  }));

  const { data: treeData } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree,
  });

  // 4. Create the new commit
  const { data: newCommitData } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: treeData.sha,
    parents: [latestCommitSha],
  });

  // 5. Update the reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: refPath,
    sha: newCommitData.sha,
  });

  return newCommitData.sha;
}

export interface GithubBranch {
  name: string;
  commit: { sha: string };
}

export async function getBranches(token: string, owner: string, repo: string): Promise<GithubBranch[]> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });
  return data as GithubBranch[];
}

export async function createBranch(token: string, owner: string, repo: string, branchName: string, sha: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha,
  });
  return data;
}

export interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
}

export async function getCommits(token: string, owner: string, repo: string, branch: string): Promise<GithubCommit[]> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: 50,
  });
  return data as unknown as GithubCommit[];
}

export async function getWorkspaceFromCommit(token: string, owner: string, repo: string, commitSha: string): Promise<string> {
  const octokit = new Octokit({ auth: token });
  
  // We need to fetch the file content from a specific commit.
  try {
    // Prevent 404 errors in Next.js by checking if the file exists in the tree first
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: commitSha,
    });

    const fileExists = treeData.tree.some((item) => item.path === 'workspace.mdlatex');
    if (!fileExists) {
      throw new Error('Could not fetch workspace.mdlatex from this commit. It may not exist.');
    }

    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'workspace.mdlatex',
      ref: commitSha,
    });

    if ('type' in data && data.type === 'file' && 'content' in data) {
      // Decode base64
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    throw new Error('Not a file');
  } catch (err) {
    // If it's our custom error, rethrow it
    if (err instanceof Error && err.message.includes('Could not fetch')) {
      throw err;
    }
    throw new Error('Could not fetch workspace.mdlatex from this commit. It may not exist.');
  }
}
