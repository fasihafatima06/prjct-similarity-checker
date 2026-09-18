import { Router } from 'express';
import { validateGitHubUrl, fetchRepositoryData } from '../github/githubClient.js';
import { enrichRepositoryAnalysis } from '../analysis/featureExtractor.js';
import { analysisStore } from '../storage/analysisStore.js';

export const previousProjectsRouter = Router();

// GET /api/previous-projects - List all stored previous project fingerprints
previousProjectsRouter.get('/', async (_req, res) => {
  try {
    const projects = await analysisStore.getPreviousProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch previous projects' });
  }
});

// POST /api/previous-projects - Add a new baseline public GitHub repository to database
previousProjectsRouter.post('/', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid GitHub repository URL is required' });
  }

  const val = validateGitHubUrl(url);
  if (!val.valid || !val.normalized) {
    return res.status(400).json({ error: val.error || 'Invalid GitHub URL format' });
  }

  try {
    const repoUrl = `https://github.com/${val.normalized}`;
    const repoData = await fetchRepositoryData(repoUrl, true);
    const enriched = enrichRepositoryAnalysis(repoData);

    if (!enriched.fingerprint) {
      return res.status(500).json({ error: 'Failed to generate fingerprint for repository' });
    }

    const saved = await analysisStore.savePreviousProject(enriched.fingerprint);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze and save baseline repository' });
  }
});

// DELETE /api/previous-projects/:owner/:name - Remove owner/name baseline repository
previousProjectsRouter.delete('/:owner/:name', async (req, res) => {
  const repoId = `${req.params.owner}/${req.params.name}`;
  try {
    const deleted = await analysisStore.deletePreviousProject(repoId);
    if (!deleted) {
      return res.status(404).json({ error: 'Previous project not found' });
    }
    res.json({ message: 'Previous project deleted successfully', repositoryId: repoId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete previous project' });
  }
});

// DELETE /api/previous-projects/:id - Remove baseline repository by ID
previousProjectsRouter.delete('/:id', async (req, res) => {
  const repoId = req.params.id;
  try {
    const deleted = await analysisStore.deletePreviousProject(repoId);
    if (!deleted) {
      return res.status(404).json({ error: 'Previous project not found' });
    }
    res.json({ message: 'Previous project deleted successfully', repositoryId: repoId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete previous project' });
  }
});
