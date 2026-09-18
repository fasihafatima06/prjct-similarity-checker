import { Router } from 'express';
import { validateGitHubUrl, fetchRepositoryData } from '../github/githubClient.js';
import { enrichRepositoryAnalysis } from '../analysis/featureExtractor.js';
import { compareRepositories, fingerprintToAnalysisInput } from '../analysis/similarityEngine.js';
import { analysisStore } from '../storage/analysisStore.js';
import { AnalysisJob, RepositoryAnalysisInput, SimilarityResult, Submission } from '../types/analysis.js';

export const analysesRouter = Router();

// GET /api/analyses - List all recent jobs
analysesRouter.get('/', (_req, res) => {
  const jobs = analysisStore.getAllJobs();
  res.json(jobs);
});

// POST /api/analyses - Create new analysis
analysesRouter.post('/', async (req, res) => {
  const { hackathonName, repositories, previousRepositories = [], settings } = req.body || {};

  if (!Array.isArray(repositories) || repositories.length === 0) {
    return res.status(400).json({ error: 'At least one GitHub repository URL is required' });
  }

  // Validate & normalize URLs
  const validCurrentUrls: string[] = [];
  const validPreviousUrls: string[] = [];
  const errors: { url: string; error: string }[] = [];

  const seenUrls = new Set<string>();

  repositories.forEach((url: string) => {
    const val = validateGitHubUrl(url);
    if (!val.valid || !val.normalized) {
      errors.push({ url, error: val.error || 'Invalid GitHub URL format' });
    } else if (seenUrls.has(val.normalized)) {
      // Deduplicate silently
    } else {
      seenUrls.add(val.normalized);
      validCurrentUrls.push(`https://github.com/${val.normalized}`);
    }
  });

  previousRepositories.forEach((url: string) => {
    const val = validateGitHubUrl(url);
    if (val.valid && val.normalized && !seenUrls.has(val.normalized)) {
      seenUrls.add(val.normalized);
      validPreviousUrls.push(`https://github.com/${val.normalized}`);
    }
  });

  if (validCurrentUrls.length === 0) {
    return res.status(400).json({
      error: 'No valid GitHub repository URLs provided',
      errors
    });
  }

  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newJob: AnalysisJob = {
    analysisId,
    hackathonName: hackathonName?.trim() || 'Hackathon Originality Analysis',
    status: 'processing',
    progress: 5,
    currentStage: 'Initializing',
    stageMessage: `Preparing real GitHub analysis for ${validCurrentUrls.length} submission(s)...`,
    submissions: [],
    previousSubmissions: [],
    currentMatches: [],
    previousMatches: [],
    evidence: [],
    errors,
    settings: {
      compareCurrent: settings?.compareCurrent ?? true,
      searchPrevious: settings?.searchPrevious ?? true,
      analyzeHistory: settings?.analyzeHistory ?? true,
      compareFunctionality: settings?.compareFunctionality ?? true,
      compareStructure: settings?.compareStructure ?? true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  analysisStore.createJob(newJob);

  // Return immediately for async polling
  res.status(202).json({
    analysisId,
    status: 'processing',
    totalRepositories: validCurrentUrls.length + validPreviousUrls.length,
  });

  // Execute background analysis
  runAnalysisProcess(analysisId, validCurrentUrls, validPreviousUrls).catch(err => {
    console.error(`[Analysis Error ${analysisId}]:`, err);
    analysisStore.failJob(analysisId, err.message || 'Analysis unexpected error');
  });
});

// GET /api/analyses/:id - Get status & progress
analysesRouter.get('/:id', (req, res) => {
  const job = analysisStore.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Analysis job not found' });
  }
  res.json({
    analysisId: job.analysisId,
    status: job.status,
    progress: job.progress,
    currentStage: job.currentStage,
    stageMessage: job.stageMessage,
    hackathonName: job.hackathonName,
    createdAt: job.createdAt,
    errors: job.errors,
  });
});

// GET /api/analyses/:id/results - Get completed results
analysesRouter.get('/:id/results', (req, res) => {
  const job = analysisStore.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Analysis job not found' });
  }

  res.json({
    analysisId: job.analysisId,
    hackathonName: job.hackathonName,
    status: job.status,
    progress: job.progress,
    submissions: job.submissions,
    previousSubmissions: job.previousSubmissions,
    currentMatches: job.currentMatches,
    previousMatches: job.previousMatches,
    evidence: job.evidence,
    errors: job.errors,
    settings: job.settings,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

async function runAnalysisProcess(
  analysisId: string,
  currentUrls: string[],
  previousUrls: string[]
) {
  // Stage 1: Fetching repositories
  analysisStore.updateJobProgress(
    analysisId,
    15,
    'Collecting repositories',
    `Validating and retrieving GitHub metadata for ${currentUrls.length} submission(s)...`
  );

  const currentRepos: RepositoryAnalysisInput[] = [];
  const previousRepos: RepositoryAnalysisInput[] = [];
  const failedErrors: { url: string; error: string }[] = [];

  // 1. Fetch current submissions
  for (let i = 0; i < currentUrls.length; i++) {
    const url = currentUrls[i];
    const stepPercent = 15 + Math.round(((i + 1) / (currentUrls.length || 1)) * 30);
    analysisStore.updateJobProgress(
      analysisId,
      stepPercent,
      'Fetching repository content',
      `Reading README, file tree & source code for ${url.replace('https://github.com/', '')}...`
    );

    try {
      const repoData = await fetchRepositoryData(url, false);
      const enriched = enrichRepositoryAnalysis(repoData);
      currentRepos.push(enriched);

      // Persist fingerprint into Previous Project Library for future matching
      if (enriched.fingerprint) {
        await analysisStore.savePreviousProject(enriched.fingerprint);
      }
    } catch (err: any) {
      failedErrors.push({ url, error: err.message || 'Failed to fetch repository' });
    }
  }

  // 2. Load candidate previous projects from persistent Database Library
  const storedPreviousFingerprints = await analysisStore.getPreviousProjects();
  const currentRepoIds = new Set(currentRepos.map(r => `${r.owner}/${r.name}`.toLowerCase()));

  storedPreviousFingerprints.forEach(fp => {
    if (!currentRepoIds.has(fp.repositoryId.toLowerCase())) {
      previousRepos.push(fingerprintToAnalysisInput(fp));
    }
  });

  // 3. Fetch explicit previous URLs if provided in payload
  for (const url of previousUrls) {
    try {
      const val = validateGitHubUrl(url);
      if (val.normalized && !currentRepoIds.has(val.normalized.toLowerCase())) {
        const repoData = await fetchRepositoryData(url, true);
        const enriched = enrichRepositoryAnalysis(repoData);
        previousRepos.push(enriched);
        if (enriched.fingerprint) {
          await analysisStore.savePreviousProject(enriched.fingerprint);
        }
      }
    } catch (err: any) {
      failedErrors.push({ url, error: err.message || 'Failed to fetch baseline repository' });
    }
  }

  if (currentRepos.length === 0) {
    analysisStore.failJob(
      analysisId,
      `All repository fetch attempts failed. ${failedErrors.map(e => e.error).join('; ')}`
    );
    return;
  }

  // Stage 2: Feature & Signal Extraction Complete
  analysisStore.updateJobProgress(
    analysisId,
    60,
    'Analyzing project signals',
    `Extracted features, dependencies & normalized code tokens across ${currentRepos.length} submission(s).`
  );

  // Stage 3: Pairwise Comparisons
  const totalPairwise = (currentRepos.length * (currentRepos.length - 1)) / 2;
  analysisStore.updateJobProgress(
    analysisId,
    75,
    'Comparing repositories',
    `Executing ${totalPairwise} submission comparison(s) and searching ${previousRepos.length} historical baseline project(s)...`
  );

  const currentMatches: SimilarityResult[] = [];
  const previousMatches: SimilarityResult[] = [];

  // Pairwise Current vs Current
  for (let i = 0; i < currentRepos.length; i++) {
    for (let j = i + 1; j < currentRepos.length; j++) {
      const result = compareRepositories(currentRepos[i], currentRepos[j]);
      currentMatches.push(result);
    }
  }

  // Current vs Previous Project Library
  for (let i = 0; i < currentRepos.length; i++) {
    for (let j = 0; j < previousRepos.length; j++) {
      const result = compareRepositories(currentRepos[i], previousRepos[j]);
      // Only include previous project matches if similarity score is meaningful (e.g. >= 15%)
      if (result.overallSimilarity >= 15 || result.functionalSimilarity >= 25 || result.codeSimilarity >= 20) {
        previousMatches.push(result);
      }
    }
  }

  // Sort matches by overall similarity descending
  currentMatches.sort((a, b) => b.overallSimilarity - a.overallSimilarity);
  previousMatches.sort((a, b) => b.overallSimilarity - a.overallSimilarity);

  // Collect evidence
  const allEvidence = [
    ...currentMatches.flatMap(m => m.evidence),
    ...previousMatches.flatMap(m => m.evidence),
  ];

  // Stage 4: Completing
  analysisStore.updateJobProgress(
    analysisId,
    95,
    'Generating evidence',
    'Synthesizing multi-signal evidence cards & human review workspace...'
  );

  const mapToSubmission = (r: RepositoryAnalysisInput): Submission => ({
    id: `${r.owner}/${r.name}`,
    owner: r.owner,
    repositoryName: r.name,
    repositoryUrl: r.url,
    description: r.metadata.description,
    primaryLanguage: r.metadata.language,
    languages: r.metadata.languages,
    createdAt: r.metadata.createdAt,
    updatedAt: r.metadata.updatedAt,
    pushedAt: r.metadata.pushedAt,
    stars: r.metadata.stars,
    forks: r.metadata.forks,
    status: 'complete',
    fileCount: r.structure.fileCount,
    sourceFileCount: r.structure.sourceFileCount,
    dependencies: r.dependencies,
    frameworks: r.fingerprint?.frameworks || [],
    isPrevious: r.isPrevious,
  });

  const submissions = currentRepos.map(mapToSubmission);
  const prevSubmissions = previousRepos.map(mapToSubmission);

  failedErrors.forEach(e => {
    const val = validateGitHubUrl(e.url);
    if (val.normalized) {
      const [owner, name] = val.normalized.split('/');
      submissions.push({
        id: val.normalized,
        owner: owner || 'unknown',
        repositoryName: name || 'repository',
        repositoryUrl: e.url,
        description: 'Failed to access or analyze repository.',
        primaryLanguage: null,
        languages: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pushedAt: new Date().toISOString(),
        stars: 0,
        forks: 0,
        status: 'failed',
        errorMessage: e.error,
      });
    }
  });

  analysisStore.completeJob(analysisId, {
    submissions,
    previousSubmissions: prevSubmissions,
    currentMatches,
    previousMatches,
    evidence: allEvidence,
    errors: failedErrors,
  });
}
