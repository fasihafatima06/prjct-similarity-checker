import { RepositoryAnalysisInput, RepositoryFile } from '../types/analysis.js';

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url || typeof url !== 'string') return null;
  let cleaned = url.trim();
  if (cleaned.endsWith('.git')) cleaned = cleaned.slice(0, -4);
  if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);

  // Match https://github.com/owner/repo or github.com/owner/repo
  const fullUrlMatch = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/i);
  if (fullUrlMatch) {
    return { owner: fullUrlMatch[1], repo: fullUrlMatch[2] };
  }

  // Match simple owner/repo pattern
  const simpleMatch = cleaned.match(/^([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)$/);
  if (simpleMatch) {
    return { owner: simpleMatch[1], repo: simpleMatch[2] };
  }

  return null;
}

export function validateGitHubUrl(url: string): { valid: boolean; error?: string; normalized?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return { valid: false, error: 'Must be a valid public GitHub URL (https://github.com/owner/repo)' };
  }
  return {
    valid: true,
    normalized: `${parsed.owner}/${parsed.repo}`,
  };
}

const MAX_FILE_SIZE = 120 * 1024; // 120 KB max per file
const MAX_FETCHED_FILES = 25; // Max key files to inspect per repo

const IGNORED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'mp4', 'webm', 'mov',
  'zip', 'gz', 'tar', '7z', 'rar', 'pdf', 'doc', 'docx', 'exe',
  'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf', 'eot', 'mp3', 'wav',
  'lock', 'lockb', 'log', 'min.js', 'min.css', 'map'
]);

const IGNORED_DIRECTORIES = [
  'node_modules/', 'dist/', 'build/', '.next/', '.git/', 'coverage/',
  'vendor/', '.cache/', '__pycache__/', '.idea/', '.vscode/', 'target/', 'bin/', 'obj/'
];

// Sensitive files that should NEVER be fetched or stored
const SENSITIVE_FILE_PATTERNS = [
  /^\.env/i,
  /\.env\.(local|production|development|test)$/i,
  /\.(pem|key|crt|p12|pfx)$/i,
  /credentials\./i,
  /secrets\./i,
  /id_rsa/i
];

function isSensitiveFile(filename: string): boolean {
  const basename = filename.split('/').pop() || filename;
  if (basename.toLowerCase() === '.env.example') return false; // Allowed manifest
  return SENSITIVE_FILE_PATTERNS.some(pattern => pattern.test(basename));
}

// Throttling helper for API calls with backoff
async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response> {
  let delay = 500;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')) {
        const resetHeader = res.headers.get('x-ratelimit-reset');
        const waitSec = resetHeader ? Math.max(1, parseInt(resetHeader, 10) - Math.floor(Date.now() / 1000)) : 2;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, Math.min(waitSec * 1000, 3000)));
          continue;
        }
      }
      if (res.ok || res.status === 404) return res;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error(`Failed to fetch ${url} after retries`);
}

export async function fetchRepositoryData(url: string, isPrevious = false): Promise<RepositoryAnalysisInput> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  const { owner, repo } = parsed;
  const token = process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    'User-Agent': 'Hackathon-Originality-Analyzer/1.0',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Fetch Metadata
  const repoMetaRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`, headers);
  if (repoMetaRes.status === 404) {
    throw new Error(`Repository ${owner}/${repo} not found or is private.`);
  }
  if (repoMetaRes.status === 403 || repoMetaRes.status === 429) {
    const rateLimitRemaining = repoMetaRes.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0') {
      throw new Error(`GitHub API rate limit exceeded for ${owner}/${repo}. Configure GITHUB_TOKEN on server for higher limits.`);
    }
    throw new Error(`Access forbidden or rate limited by GitHub for ${owner}/${repo}.`);
  }
  if (!repoMetaRes.ok) {
    throw new Error(`GitHub API error (${repoMetaRes.status}) while fetching ${owner}/${repo}.`);
  }

  const repoMeta: any = await repoMetaRes.json();

  // 2. Fetch Languages
  let languages: Record<string, number> = {};
  try {
    const langRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/languages`, headers);
    if (langRes.ok) {
      languages = (await langRes.json()) as Record<string, number>;
    }
  } catch {}

  // 3. Fetch README Content
  let readmeContent = '';
  try {
    const readmeRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/readme`, headers);
    if (readmeRes.ok) {
      const readmeData: any = await readmeRes.json();
      if (readmeData.content && readmeData.encoding === 'base64') {
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      } else if (readmeData.download_url) {
        const rawRes = await fetchWithRetry(readmeData.download_url, headers);
        if (rawRes.ok) readmeContent = await rawRes.text();
      }
    }
  } catch {}

  // 4. Fetch File Tree
  const defaultBranch = repoMeta.default_branch || 'main';
  let treeItems: any[] = [];
  try {
    const treeRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, headers);
    if (treeRes.ok) {
      const treeData: any = await treeRes.json();
      if (Array.isArray(treeData.tree)) {
        treeItems = treeData.tree;
      }
    }
  } catch {}

  const filePaths: string[] = [];
  const directoriesSet = new Set<string>();
  let sourceFileCount = 0;
  let testFileCount = 0;

  const candidateFilesToFetch: { path: string; size: number; priority: number }[] = [];

  const MANIFEST_NAMES = new Set([
    'package.json', 'requirements.txt', 'pyproject.toml', 'pipfile', 'pom.xml',
    'build.gradle', 'go.mod', 'cargo.toml', 'composer.json', 'dockerfile',
    'docker-compose.yml', '.env.example'
  ]);

  for (const item of treeItems) {
    const path: string = item.path;
    if (item.type === 'tree') {
      directoriesSet.add(path);
      continue;
    }
    if (item.type !== 'blob') continue;

    // Check directory exclusions
    if (IGNORED_DIRECTORIES.some(dir => path.startsWith(dir) || path.includes('/' + dir))) {
      continue;
    }

    // Check sensitive file exclusions
    if (isSensitiveFile(path)) continue;

    filePaths.push(path);
    const filename = path.split('/').pop()?.toLowerCase() || '';
    const ext = filename.split('.').pop() || '';

    if (IGNORED_EXTENSIONS.has(ext)) continue;

    const isSource = ['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'java', 'c', 'cpp', 'cs', 'rs', 'rb', 'php', 'swift', 'kt', 'vue', 'svelte', 'html', 'css'].includes(ext);
    const isTest = path.includes('test') || path.includes('spec') || path.includes('__tests__');

    if (isSource) sourceFileCount++;
    if (isTest) testFileCount++;

    const isManifest = MANIFEST_NAMES.has(filename) || filename.endsWith('.csproj');
    const isKeySource = isSource && (
      path.startsWith('src/') ||
      path.startsWith('app/') ||
      path.startsWith('components/') ||
      path.startsWith('pages/') ||
      path.startsWith('routes/') ||
      path.startsWith('services/') ||
      path.startsWith('controllers/') ||
      path.startsWith('models/') ||
      path.startsWith('lib/') ||
      path.startsWith('server/') ||
      path.startsWith('api/') ||
      filename.includes('index') ||
      filename.includes('main') ||
      filename.includes('app') ||
      filename.includes('server')
    );

    if (isManifest) {
      candidateFilesToFetch.push({ path, size: item.size || 0, priority: 1 });
    } else if (isKeySource) {
      candidateFilesToFetch.push({ path, size: item.size || 0, priority: 2 });
    } else if (isSource) {
      candidateFilesToFetch.push({ path, size: item.size || 0, priority: 3 });
    }
  }

  // Sort files by priority (manifests first), then by file size (smaller files first)
  candidateFilesToFetch.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.size - b.size;
  });

  const selectedFilesToFetch = candidateFilesToFetch.slice(0, MAX_FETCHED_FILES);

  // 5. Fetch Selected File Contents in Parallel
  const fetchedFiles: RepositoryFile[] = [];
  const dependenciesSet = new Set<string>();

  await Promise.all(
    selectedFilesToFetch.map(async (fileInfo) => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${fileInfo.path}`;
        const res = await fetchWithRetry(rawUrl, headers);
        if (!res.ok) return;

        const content = await res.text();
        if (content.length > MAX_FILE_SIZE) return;

        const ext = fileInfo.path.split('.').pop()?.toLowerCase() || '';
        fetchedFiles.push({
          path: fileInfo.path,
          extension: ext,
          size: fileInfo.size,
          content,
        });

        // Dependency Parsing
        const lowerName = fileInfo.path.split('/').pop()?.toLowerCase() || '';
        if (lowerName === 'package.json') {
          try {
            const pkg = JSON.parse(content);
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            Object.keys(deps).forEach(d => dependenciesSet.add(d));
          } catch {}
        } else if (lowerName === 'requirements.txt') {
          content.split('\n').forEach(line => {
            const trimmed = line.trim().split('#')[0].trim();
            if (trimmed) {
              const name = trimmed.split(/[=><~]/)[0].trim();
              if (name) dependenciesSet.add(name);
            }
          });
        } else if (lowerName === 'pyproject.toml') {
          const matches = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/i);
          if (matches && matches[1]) {
            matches[1].split(',').forEach(d => {
              const clean = d.replace(/['"\s]/g, '').split(/[=><~]/)[0];
              if (clean) dependenciesSet.add(clean);
            });
          }
        } else if (lowerName === 'go.mod') {
          const reqMatches = content.match(/require\s*\(([\s\S]*?)\)/i);
          if (reqMatches && reqMatches[1]) {
            reqMatches[1].split('\n').forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts[0]) dependenciesSet.add(parts[0]);
            });
          }
        } else if (lowerName === 'cargo.toml') {
          const depMatches = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/i);
          if (depMatches && depMatches[1]) {
            depMatches[1].split('\n').forEach(line => {
              const key = line.split('=')[0].trim();
              if (key && !key.startsWith('#')) dependenciesSet.add(key);
            });
          }
        }
      } catch {}
    })
  );

  return {
    owner,
    name: repo,
    url: `https://github.com/${owner}/${repo}`,
    isPrevious,
    metadata: {
      description: repoMeta.description || '',
      language: repoMeta.language || null,
      languages,
      topics: Array.isArray(repoMeta.topics) ? repoMeta.topics : [],
      createdAt: repoMeta.created_at || new Date().toISOString(),
      updatedAt: repoMeta.updated_at || new Date().toISOString(),
      pushedAt: repoMeta.pushed_at || new Date().toISOString(),
      defaultBranch,
      stars: repoMeta.stargazers_count || 0,
      forks: repoMeta.forks_count || 0,
    },
    readme: readmeContent,
    files: fetchedFiles,
    dependencies: Array.from(dependenciesSet),
    structure: {
      directories: Array.from(directoriesSet),
      fileCount: filePaths.length,
      sourceFileCount,
      testFileCount,
      filePaths,
    },
    functionalConcepts: [],
    workflowSteps: [],
    normalizedTokens: [],
  };
}
