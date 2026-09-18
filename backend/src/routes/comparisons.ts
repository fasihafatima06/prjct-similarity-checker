import { Router } from 'express';
import { analysisStore } from '../storage/analysisStore.js';
import { ReviewStatus } from '../types/analysis.js';

export const comparisonsRouter = Router();

// GET /api/comparisons/:id - Retrieve detailed comparison pair by ID
comparisonsRouter.get('/:id', (req, res) => {
  const comparisonId = req.params.id;
  const jobs = analysisStore.getAllJobs();

  for (const job of jobs) {
    const match = job.currentMatches.find(m => m.id === comparisonId) ||
                  job.previousMatches.find(m => m.id === comparisonId);
    if (match) {
      return res.json({
        ...match,
        analysisId: job.analysisId,
        hackathonName: job.hackathonName,
      });
    }
  }

  return res.status(404).json({ error: 'Comparison detail not found' });
});

// PATCH /api/comparisons/:id/review - Update review status & notes
comparisonsRouter.patch('/:id/review', (req, res) => {
  const comparisonId = req.params.id;
  const { analysisId, reviewStatus, notes } = req.body || {};

  if (!analysisId || !reviewStatus) {
    return res.status(400).json({ error: 'analysisId and reviewStatus are required' });
  }

  const validStatuses: ReviewStatus[] = ['review', 'dismissed', 'resolved'];
  if (!validStatuses.includes(reviewStatus)) {
    return res.status(400).json({ error: `reviewStatus must be one of ${validStatuses.join(', ')}` });
  }

  const updated = analysisStore.updateReviewStatus(analysisId, comparisonId, reviewStatus, notes);

  if (!updated) {
    return res.status(404).json({ error: 'Comparison result not found for specified analysisId' });
  }

  return res.json(updated);
});
