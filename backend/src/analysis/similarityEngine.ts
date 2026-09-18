import { RepositoryAnalysisInput, SimilarityResult, ProjectFingerprint } from '../types/analysis.js';
import { generateTokenShingles, normalizeText } from './featureExtractor.js';
import { generateEvidenceForPair } from './evidenceGenerator.js';

export const SIMILARITY_WEIGHTS = {
  functional: 0.30,
  workflow: 0.20,
  structural: 0.15,
  code: 0.15,
  documentation: 0.10,
  technology: 0.05,
  terminology: 0.05,
};

const UBIQUITOUS_DEPS = new Set([
  'react', 'react-dom', 'typescript', 'express', 'lodash', 'dotenv',
  'axios', 'node-fetch', 'cors', 'vite', 'eslint', 'prettier',
  'tailwindcss', 'postcss', 'autoprefixer', 'jest', 'mocha', 'chai',
  'pip', 'setuptools', 'wheel', 'pytest'
]);

function calculateJaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionSize = 0;
  setA.forEach(item => {
    if (setB.has(item)) intersectionSize++;
  });
  const unionSize = setA.size + setB.size - intersectionSize;
  if (unionSize === 0) return 0;
  return intersectionSize / unionSize;
}

function calculateCosineSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();

  tokensA.forEach(t => freqA.set(t, (freqA.get(t) || 0) + 1));
  tokensB.forEach(t => freqB.set(t, (freqB.get(t) || 0) + 1));

  let dotProduct = 0;
  freqA.forEach((val, key) => {
    if (freqB.has(key)) {
      dotProduct += val * freqB.get(key)!;
    }
  });

  let magA = 0;
  freqA.forEach(val => (magA += val * val));
  magA = Math.sqrt(magA);

  let magB = 0;
  freqB.forEach(val => (magB += val * val));
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

// 1. Documentation Similarity
export function calculateDocumentationSimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  const textA = (repoA.metadata.description + ' ' + repoA.readme).trim();
  const textB = (repoB.metadata.description + ' ' + repoB.readme).trim();

  if (!textA || !textB) return 0;

  const tokensA = normalizeText(textA);
  const tokensB = normalizeText(textB);

  const jaccard = calculateJaccardSimilarity(new Set(tokensA), new Set(tokensB));
  const cosine = calculateCosineSimilarity(tokensA, tokensB);

  const combined = (jaccard * 0.4 + cosine * 0.6) * 100;
  return Math.min(100, Math.round(combined));
}

// 2. Functional Similarity
export function calculateFunctionalSimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  const setA = new Set(repoA.functionalConcepts);
  const setB = new Set(repoB.functionalConcepts);

  if (setA.size === 0 || setB.size === 0) return 0;

  const jaccard = calculateJaccardSimilarity(setA, setB);
  const cosine = calculateCosineSimilarity(repoA.functionalConcepts, repoB.functionalConcepts);

  const score = (jaccard * 0.5 + cosine * 0.5) * 100;
  return Math.min(100, Math.round(score));
}

// 3. Workflow Similarity
export function calculateWorkflowSimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  const stepsA = repoA.workflowSteps;
  const stepsB = repoB.workflowSteps;

  if (stepsA.length === 0 || stepsB.length === 0) return 0;

  const setA = new Set(stepsA);
  const setB = new Set(stepsB);

  const jaccard = calculateJaccardSimilarity(setA, setB);

  let orderMatches = 0;
  for (let i = 0; i < Math.min(stepsA.length, stepsB.length); i++) {
    if (stepsA[i] === stepsB[i]) orderMatches++;
  }
  const orderRatio = orderMatches / Math.max(stepsA.length, stepsB.length, 1);

  const score = (jaccard * 0.6 + orderRatio * 0.4) * 100;
  return Math.min(100, Math.round(score));
}

// 4. Code Similarity
export function calculateCodeSimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  if (repoA.normalizedTokens.length === 0 || repoB.normalizedTokens.length === 0) return 0;

  const shinglesA = generateTokenShingles(repoA.normalizedTokens, 4);
  const shinglesB = generateTokenShingles(repoB.normalizedTokens, 4);

  const jaccard = calculateJaccardSimilarity(shinglesA, shinglesB);
  const cosine = calculateCosineSimilarity(repoA.normalizedTokens, repoB.normalizedTokens);

  const score = (jaccard * 0.7 + cosine * 0.3) * 100;
  return Math.min(100, Math.round(score));
}

// 5. Structural Similarity
export function calculateStructuralSimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  const dirSetA = new Set(repoA.structure.directories);
  const dirSetB = new Set(repoB.structure.directories);

  const dirJaccard = calculateJaccardSimilarity(dirSetA, dirSetB);

  const normPathsA = new Set(repoA.structure.filePaths.map(p => p.split('/').slice(0, -1).join('/')));
  const normPathsB = new Set(repoB.structure.filePaths.map(p => p.split('/').slice(0, -1).join('/')));

  const pathJaccard = calculateJaccardSimilarity(normPathsA, normPathsB);

  const score = (dirJaccard * 0.5 + pathJaccard * 0.5) * 100;
  return Math.min(100, Math.round(score));
}

// 6. Technology Similarity
export function calculateTechnologySimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  const depsA = repoA.dependencies;
  const depsB = repoB.dependencies;

  if (depsA.length === 0 && depsB.length === 0) {
    const langsA = Object.keys(repoA.metadata.languages);
    const langsB = Object.keys(repoB.metadata.languages);
    if (langsA.length === 0 || langsB.length === 0) return 0;
    return Math.round(calculateJaccardSimilarity(new Set(langsA), new Set(langsB)) * 100);
  }

  let weightedIntersection = 0;
  let weightedUnion = 0;

  const allDeps = new Set([...depsA, ...depsB]);

  allDeps.forEach(dep => {
    const isUbiquitous = UBIQUITOUS_DEPS.has(dep.toLowerCase());
    const weight = isUbiquitous ? 0.3 : 1.5;

    const inA = depsA.includes(dep);
    const inB = depsB.includes(dep);

    if (inA && inB) weightedIntersection += weight;
    if (inA || inB) weightedUnion += weight;
  });

  if (weightedUnion === 0) return 0;
  const score = (weightedIntersection / weightedUnion) * 100;
  return Math.min(100, Math.round(score));
}

// 7. Terminology Similarity
export function calculateTerminologySimilarity(repoA: RepositoryAnalysisInput, repoB: RepositoryAnalysisInput): number {
  const termsA = new Set(repoA.functionalConcepts);
  const termsB = new Set(repoB.functionalConcepts);

  const uncommonA = Array.from(termsA).filter(t => t.length > 5);
  const uncommonB = Array.from(termsB).filter(t => t.length > 5);

  if (uncommonA.length === 0 || uncommonB.length === 0) return 0;
  return Math.round(calculateJaccardSimilarity(new Set(uncommonA), new Set(uncommonB)) * 100);
}

export function compareRepositories(
  repoA: RepositoryAnalysisInput,
  repoB: RepositoryAnalysisInput
): SimilarityResult {
  const documentationSimilarity = calculateDocumentationSimilarity(repoA, repoB);
  const functionalSimilarity = calculateFunctionalSimilarity(repoA, repoB);
  const workflowSimilarity = calculateWorkflowSimilarity(repoA, repoB);
  const codeSimilarity = calculateCodeSimilarity(repoA, repoB);
  const structuralSimilarity = calculateStructuralSimilarity(repoA, repoB);
  const technologySimilarity = calculateTechnologySimilarity(repoA, repoB);
  const terminologySimilarity = calculateTerminologySimilarity(repoA, repoB);

  const overallSimilarity = Math.min(
    100,
    Math.round(
      functionalSimilarity * SIMILARITY_WEIGHTS.functional +
      workflowSimilarity * SIMILARITY_WEIGHTS.workflow +
      structuralSimilarity * SIMILARITY_WEIGHTS.structural +
      codeSimilarity * SIMILARITY_WEIGHTS.code +
      documentationSimilarity * SIMILARITY_WEIGHTS.documentation +
      technologySimilarity * SIMILARITY_WEIGHTS.technology +
      terminologySimilarity * SIMILARITY_WEIGHTS.terminology
    )
  );

  const isPreviousMatch = !!(repoA.isPrevious || repoB.isPrevious);
  const matchType = isPreviousMatch ? 'current-previous' : 'current-current';

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (overallSimilarity >= 75 || functionalSimilarity >= 85 || codeSimilarity >= 70) {
    riskLevel = 'high';
  } else if (overallSimilarity >= 50 || functionalSimilarity >= 65) {
    riskLevel = 'medium';
  }

  const resultId = `cmp_${repoA.owner}_${repoA.name}__${repoB.owner}_${repoB.name}`.toLowerCase();

  const evidence = generateEvidenceForPair(repoA, repoB, {
    documentationSimilarity,
    functionalSimilarity,
    workflowSimilarity,
    codeSimilarity,
    structuralSimilarity,
    technologySimilarity,
    overallSimilarity,
  });

  const matchedFiles: { pathA: string; pathB: string; similarity: number }[] = [];
  repoA.files.forEach(fileA => {
    repoB.files.forEach(fileB => {
      const filenameA = fileA.path.split('/').pop() || '';
      const filenameB = fileB.path.split('/').pop() || '';
      if (filenameA && filenameA === filenameB) {
        matchedFiles.push({
          pathA: fileA.path,
          pathB: fileB.path,
          similarity: Math.round(calculateCosineSimilarity(
            fileA.content ? normalizeText(fileA.content) : [],
            fileB.content ? normalizeText(fileB.content) : []
          ) * 100)
        });
      }
    });
  });

  return {
    id: resultId,
    submissionA: {
      id: `${repoA.owner}/${repoA.name}`,
      owner: repoA.owner,
      repositoryName: repoA.name,
      repositoryUrl: repoA.url,
      description: repoA.metadata.description,
      primaryLanguage: repoA.metadata.language,
      languages: repoA.metadata.languages,
      createdAt: repoA.metadata.createdAt,
      updatedAt: repoA.metadata.updatedAt,
      pushedAt: repoA.metadata.pushedAt,
      stars: repoA.metadata.stars,
      forks: repoA.metadata.forks,
      status: 'complete',
      fileCount: repoA.structure.fileCount,
      sourceFileCount: repoA.structure.sourceFileCount,
      dependencies: repoA.dependencies,
      frameworks: repoA.fingerprint?.frameworks || [],
      isPrevious: repoA.isPrevious,
    },
    submissionB: {
      id: `${repoB.owner}/${repoB.name}`,
      owner: repoB.owner,
      repositoryName: repoB.name,
      repositoryUrl: repoB.url,
      description: repoB.metadata.description,
      primaryLanguage: repoB.metadata.language,
      languages: repoB.metadata.languages,
      createdAt: repoB.metadata.createdAt,
      updatedAt: repoB.metadata.updatedAt,
      pushedAt: repoB.metadata.pushedAt,
      stars: repoB.metadata.stars,
      forks: repoB.metadata.forks,
      status: 'complete',
      fileCount: repoB.structure.fileCount,
      sourceFileCount: repoB.structure.sourceFileCount,
      dependencies: repoB.dependencies,
      frameworks: repoB.fingerprint?.frameworks || [],
      isPrevious: repoB.isPrevious,
    },
    overallSimilarity,
    functionalSimilarity,
    workflowSimilarity,
    codeSimilarity,
    structuralSimilarity,
    documentationSimilarity,
    technologySimilarity,
    matchType,
    evidence,
    riskLevel,
    reviewStatus: riskLevel === 'high' ? 'review' : 'resolved',
    matchedFiles,
  };
}

// Convert a stored ProjectFingerprint into a RepositoryAnalysisInput for pairwise comparison
export function fingerprintToAnalysisInput(fp: ProjectFingerprint): RepositoryAnalysisInput {
  return {
    owner: fp.owner,
    name: fp.name,
    url: fp.repositoryUrl,
    isPrevious: true,
    metadata: {
      description: fp.description || '',
      language: fp.primaryLanguage,
      languages: fp.languages || {},
      topics: [],
      createdAt: fp.metadata?.createdAt || fp.firstAnalyzedAt || new Date().toISOString(),
      updatedAt: fp.metadata?.updatedAt || new Date().toISOString(),
      pushedAt: fp.metadata?.pushedAt || new Date().toISOString(),
      defaultBranch: 'main',
      stars: fp.metadata?.stars || 0,
      forks: fp.metadata?.forks || 0,
    },
    readme: fp.documentationTerms.join(' '),
    files: [],
    dependencies: fp.dependencies || [],
    structure: {
      directories: fp.directoryStructure || [],
      fileCount: Object.values(fp.fileTypeDistribution || {}).reduce((a, b) => a + b, 0),
      sourceFileCount: fp.codeTokens.length > 0 ? 10 : 0,
      testFileCount: 0,
      filePaths: fp.routes || [],
    },
    functionalConcepts: fp.features || [],
    workflowSteps: fp.workflowSteps || [],
    normalizedTokens: fp.codeTokens || [],
    fingerprint: fp,
  };
}
