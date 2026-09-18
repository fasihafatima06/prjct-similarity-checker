import type { AnalysisJob, SimilarityResult, ReviewStatus, ProjectFingerprint } from '../types/analysis';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export async function createAnalysis(payload: {
  hackathonName?: string;
  repositories: string[];
  previousRepositories?: string[];
  settings?: Record<string, boolean>;
}): Promise<{ analysisId: string; status: string; totalRepositories: number }> {
  const response = await fetch(`${API_BASE_URL}/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned error status ${response.status}`);
  }

  return response.json();
}

export async function getAnalysisStatus(analysisId: string): Promise<{
  analysisId: string;
  status: 'processing' | 'complete' | 'failed';
  progress: number;
  currentStage: string;
  stageMessage: string;
  hackathonName: string;
  createdAt: string;
  errors: { url: string; error: string }[];
}> {
  const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status for analysis ${analysisId}`);
  }
  return response.json();
}

export async function getAnalysisResults(analysisId: string): Promise<AnalysisJob> {
  const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}/results`);
  if (!response.ok) {
    throw new Error(`Failed to fetch results for analysis ${analysisId}`);
  }
  return response.json();
}

export async function getComparison(comparisonId: string): Promise<SimilarityResult> {
  const response = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch comparison ${comparisonId}`);
  }
  return response.json();
}

export async function updateReviewStatus(
  comparisonId: string,
  analysisId: string,
  reviewStatus: ReviewStatus,
  notes?: string
): Promise<SimilarityResult> {
  const response = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, reviewStatus, notes }),
  });

  if (!response.ok) {
    throw new Error('Failed to update review status');
  }

  return response.json();
}

export async function getAllAnalyses(): Promise<AnalysisJob[]> {
  const response = await fetch(`${API_BASE_URL}/analyses`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getPreviousProjects(): Promise<ProjectFingerprint[]> {
  const response = await fetch(`${API_BASE_URL}/previous-projects`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function addPreviousProject(url: string): Promise<ProjectFingerprint> {
  const response = await fetch(`${API_BASE_URL}/previous-projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add baseline project');
  }

  return response.json();
}

export async function deletePreviousProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/previous-projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete baseline project');
  }
}

export async function checkBackendHealth(): Promise<{ status: string; githubTokenConfigured: boolean; supabaseConfigured: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      return response.json();
    }
  } catch {}
  return { status: 'offline', githubTokenConfigured: false, supabaseConfigured: false };
}
