import { AnalysisJob, SimilarityResult, ReviewStatus, ProjectFingerprint } from '../types/analysis.js';
import { dbAdapter } from './database.js';

class AnalysisStore {
  private jobs = new Map<string, AnalysisJob>();

  constructor() {
    // Hydrate in-memory state from persistent DB on startup
    this.initHydration();
  }

  private async initHydration() {
    try {
      const persistedJobs = await dbAdapter.getAllAnalysisJobs();
      persistedJobs.forEach(j => this.jobs.set(j.analysisId, j));
    } catch (err) {
      console.warn('Hydration error:', err);
    }
  }

  public createJob(job: AnalysisJob): AnalysisJob {
    this.jobs.set(job.analysisId, job);
    dbAdapter.saveAnalysisJob(job);
    return job;
  }

  public getJob(analysisId: string): AnalysisJob | undefined {
    return this.jobs.get(analysisId);
  }

  public updateJobProgress(
    analysisId: string,
    progress: number,
    currentStage: string,
    stageMessage: string
  ): void {
    const job = this.jobs.get(analysisId);
    if (job) {
      job.progress = progress;
      job.currentStage = currentStage;
      job.stageMessage = stageMessage;
      job.updatedAt = new Date().toISOString();
      dbAdapter.saveAnalysisJob(job);
    }
  }

  public completeJob(
    analysisId: string,
    results: {
      submissions: any[];
      previousSubmissions: any[];
      currentMatches: SimilarityResult[];
      previousMatches: SimilarityResult[];
      evidence: any[];
      errors: any[];
    }
  ): void {
    const job = this.jobs.get(analysisId);
    if (job) {
      job.status = 'complete';
      job.progress = 100;
      job.currentStage = 'Complete';
      job.stageMessage = 'Analysis successfully finished';
      job.submissions = results.submissions;
      job.previousSubmissions = results.previousSubmissions;
      job.currentMatches = results.currentMatches;
      job.previousMatches = results.previousMatches;
      job.evidence = results.evidence;
      job.errors = results.errors;
      job.updatedAt = new Date().toISOString();
      dbAdapter.saveAnalysisJob(job);
    }
  }

  public failJob(analysisId: string, errorMessage: string): void {
    const job = this.jobs.get(analysisId);
    if (job) {
      job.status = 'failed';
      job.progress = 100;
      job.currentStage = 'Failed';
      job.stageMessage = errorMessage;
      job.updatedAt = new Date().toISOString();
      dbAdapter.saveAnalysisJob(job);
    }
  }

  public updateReviewStatus(
    analysisId: string,
    comparisonId: string,
    status: ReviewStatus,
    notes?: string
  ): SimilarityResult | undefined {
    const job = this.jobs.get(analysisId);
    if (!job) return undefined;

    let target = job.currentMatches.find(m => m.id === comparisonId) ||
                 job.previousMatches.find(m => m.id === comparisonId);

    if (target) {
      target.reviewStatus = status;
      if (notes !== undefined) target.reviewNotes = notes;
      dbAdapter.saveAnalysisJob(job);
    }
    return target;
  }

  public getAllJobs(): AnalysisJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Previous Projects Persistence API ---

  public async getPreviousProjects(): Promise<ProjectFingerprint[]> {
    return dbAdapter.getPreviousProjects();
  }

  public async savePreviousProject(fingerprint: ProjectFingerprint): Promise<ProjectFingerprint> {
    return dbAdapter.savePreviousProject(fingerprint);
  }

  public async deletePreviousProject(id: string): Promise<boolean> {
    return dbAdapter.deletePreviousProject(id);
  }
}

export const analysisStore = new AnalysisStore();
