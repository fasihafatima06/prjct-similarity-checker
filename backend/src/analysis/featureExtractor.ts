import { RepositoryAnalysisInput } from '../types/analysis.js';
import { buildProjectFingerprint } from './fingerprintGenerator.js';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is',
  'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'github', 'readme', 'project', 'app', 'application', 'built', 'using', 'run', 'install', 'npm', 'yarn', 'start'
]);

export function normalizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_\-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^[-_]+|[-_]+$/g, ''))
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export function splitIdentifier(identifier: string): string[] {
  // Splits camelCase, PascalCase, snake_case, kebab-case
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export function extractFunctionalConcepts(repo: RepositoryAnalysisInput): string[] {
  const conceptsSet = new Set<string>();

  // 1. From README text
  const readmeTokens = normalizeText(repo.readme);
  readmeTokens.forEach(t => conceptsSet.add(t));

  // 2. From Topics
  repo.metadata.topics.forEach(t => {
    splitIdentifier(t).forEach(w => conceptsSet.add(w));
  });

  // 3. From File Paths & Component Names
  repo.structure.filePaths.forEach(path => {
    const filename = path.split('/').pop() || '';
    const nameWithoutExt = filename.split('.')[0];
    splitIdentifier(nameWithoutExt).forEach(w => conceptsSet.add(w));
  });

  // 4. From File Source Code identifiers (if available)
  repo.files.forEach(file => {
    if (!file.content) return;
    const routeMatches = file.content.match(/['"`]\/(api\/)?[a-z0-9/_\-]{3,}['"`]/gi);
    if (routeMatches) {
      routeMatches.forEach(rm => {
        const clean = rm.replace(/['"`]/g, '').replace(/^\//, '');
        clean.split('/').forEach(part => {
          splitIdentifier(part).forEach(w => conceptsSet.add(w));
        });
      });
    }
  });

  return Array.from(conceptsSet);
}

export function inferWorkflowSteps(repo: RepositoryAnalysisInput): string[] {
  const workflowCandidates = [
    'create', 'add', 'upload', 'fetch', 'parse', 'process', 'transform',
    'match', 'rank', 'filter', 'search', 'save', 'store', 'update', 'edit',
    'delete', 'remove', 'complete', 'toggle', 'render', 'display', 'export',
    'auth', 'login', 'signup', 'verify', 'notify', 'send', 'pay', 'checkout'
  ];

  const foundSteps: { step: string; index: number }[] = [];
  const textToScan = (repo.readme + ' ' + repo.structure.filePaths.join(' ')).toLowerCase();

  workflowCandidates.forEach(candidate => {
    const pos = textToScan.indexOf(candidate);
    if (pos !== -1) {
      foundSteps.push({ step: candidate, index: pos });
    }
  });

  foundSteps.sort((a, b) => a.index - b.index);
  return foundSteps.map(s => s.step);
}

export function stripCodeComments(code: string, extension: string): string {
  if (!code) return '';
  let cleaned = code;
  if (['js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt', 'css', 'scss', 'vue', 'svelte'].includes(extension)) {
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    cleaned = cleaned.replace(/\/\/.*/g, '');
  }
  if (['py', 'rb', 'sh', 'yaml', 'yml'].includes(extension)) {
    cleaned = cleaned.replace(/#.*/g, '');
  }
  return cleaned;
}

export function tokenizeCode(code: string, extension: string): string[] {
  const stripped = stripCodeComments(code, extension);
  const noStrings = stripped.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, ' STR_LITERAL ');
  return noStrings
    .replace(/[\{\}\(\)\[\];,]/g, ' ')
    .split(/\s+/)
    .filter(t => t.trim().length > 0);
}

export function generateTokenShingles(tokens: string[], k = 4): Set<string> {
  const shingles = new Set<string>();
  if (tokens.length < k) {
    if (tokens.length > 0) shingles.add(tokens.join('_'));
    return shingles;
  }
  for (let i = 0; i <= tokens.length - k; i++) {
    shingles.add(tokens.slice(i, i + k).join('_'));
  }
  return shingles;
}

export function enrichRepositoryAnalysis(repo: RepositoryAnalysisInput): RepositoryAnalysisInput {
  repo.functionalConcepts = extractFunctionalConcepts(repo);
  repo.workflowSteps = inferWorkflowSteps(repo);

  const allTokens: string[] = [];
  repo.files.forEach(file => {
    if (file.content) {
      allTokens.push(...tokenizeCode(file.content, file.extension));
    }
  });
  repo.normalizedTokens = allTokens;

  // Build Project Fingerprint
  repo.fingerprint = buildProjectFingerprint(repo);

  return repo;
}
