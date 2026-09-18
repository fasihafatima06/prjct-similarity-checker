export type ReviewStatus = 'review' | 'dismissed' | 'resolved';

export type Submission = {
  id: string;
  owner: string;
  repositoryName: string;
  repositoryUrl: string;
  description: string;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  stars: number;
  forks: number;
  status: 'analyzing' | 'complete' | 'failed' | 'review';
  errorMessage?: string;
  fileCount?: number;
  sourceFileCount?: number;
  dependencies?: string[];
  frameworks?: string[];
  isPrevious?: boolean;
};

export type EvidenceType =
  | 'functional'
  | 'workflow'
  | 'code'
  | 'structure'
  | 'documentation'
  | 'technology'
  | 'historical';

export type EvidenceStrength = 'weak' | 'moderate' | 'strong';

export type Evidence = {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  strength: EvidenceStrength;
  sourceA?: string[];
  sourceB?: string[];
  details?: Record<string, any>;
};

export type SimilarityResult = {
  id: string;
  submissionA: Submission;
  submissionB: Submission;

  overallSimilarity: number;
  functionalSimilarity: number;
  workflowSimilarity: number;
  codeSimilarity: number;
  structuralSimilarity: number;
  documentationSimilarity: number;
  technologySimilarity: number;

  matchType: 'current-current' | 'current-previous';

  evidence: Evidence[];

  riskLevel: 'low' | 'medium' | 'high';
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  matchedFiles?: { pathA: string; pathB: string; similarity: number }[];
  analysisId?: string;
  hackathonName?: string;
};

export type RepositoryFile = {
  path: string;
  extension: string;
  size: number;
  content?: string;
};

export type ProjectFingerprint = {
  repositoryId: string; // e.g. "owner/repo"
  repositoryUrl: string;
  owner: string;
  name: string;
  description: string;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  frameworks: string[];
  dependencies: string[];
  projectType: string[];
  features: string[];
  workflowSteps: string[];
  apiPatterns: string[];
  entities: string[];
  routes: string[];
  directoryStructure: string[];
  documentationTerms: string[];
  codeTokens: string[];
  fileTypeDistribution: Record<string, number>;
  metadata: {
    stars?: number;
    forks?: number;
    createdAt?: string;
    updatedAt?: string;
    pushedAt?: string;
  };
  gitHistory: {
    firstObservedCommit?: string;
    firstObservedAt?: string;
    latestCommit?: string;
  };
  firstAnalyzedAt?: string;
  lastAnalyzedAt?: string;
  lastCommitSha?: string;
};

export type RepositoryAnalysisInput = {
  owner: string;
  name: string;
  url: string;
  isPrevious?: boolean;

  metadata: {
    description: string;
    language: string | null;
    languages: Record<string, number>;
    topics: string[];
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    defaultBranch: string;
    stars: number;
    forks: number;
  };

  readme: string;

  files: RepositoryFile[];

  dependencies: string[];

  structure: {
    directories: string[];
    fileCount: number;
    sourceFileCount: number;
    testFileCount: number;
    filePaths: string[];
  };

  functionalConcepts: string[];
  workflowSteps: string[];
  normalizedTokens: string[];
  fingerprint?: ProjectFingerprint;
};

export type AnalysisSettings = {
  compareCurrent: boolean;
  searchPrevious: boolean;
  analyzeHistory: boolean;
  compareFunctionality: boolean;
  compareStructure: boolean;
};

export type AnalysisJob = {
  analysisId: string;
  hackathonName: string;
  status: 'processing' | 'complete' | 'failed';
  progress: number;
  currentStage: string;
  stageMessage: string;
  submissions: Submission[];
  previousSubmissions: Submission[];
  currentMatches: SimilarityResult[];
  previousMatches: SimilarityResult[];
  evidence: Evidence[];
  errors: { url: string; error: string }[];
  settings: AnalysisSettings;
  createdAt: string;
  updatedAt: string;
};

export type CreateAnalysisPayload = {
  hackathonName?: string;
  repositories: string[];
  previousRepositories?: string[];
  settings?: Partial<AnalysisSettings>;
};
