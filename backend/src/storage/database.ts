import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { AnalysisJob, ProjectFingerprint, SimilarityResult, ReviewStatus } from '../types/analysis.js';

const DATA_DIR = typeof __dirname !== 'undefined'
  ? path.resolve(__dirname, '../../data')
  : (fs.existsSync(path.join(process.cwd(), 'backend', 'data'))
    ? path.join(process.cwd(), 'backend', 'data')
    : path.join(process.cwd(), 'data'));
const PREVIOUS_PROJECTS_FILE = path.join(DATA_DIR, 'previous_projects.json');
const ANALYSES_FILE = path.join(DATA_DIR, 'analyses.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

class DatabaseAdapter {
  private supabase: SupabaseClient | null = null;
  private isSupabaseConfigured = false;

  constructor() {
    ensureDataDir();
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (url && key && !url.includes('your-supabase') && !key.includes('your-supabase')) {
      try {
        this.supabase = createClient(url, key);
        this.isSupabaseConfigured = true;
        console.log(`⚡ Supabase PostgreSQL Database connected successfully (${url})`);
      } catch (err: any) {
        console.warn(`⚠️ Supabase client init failed: ${err.message}. Using persistent JSON storage fallback.`);
      }
    } else {
      console.log(`ℹ️ Supabase credentials not set in .env. Using persistent local JSON storage at ${DATA_DIR}`);
    }
  }

  // --- Local File Helpers ---
  private readLocalJson<T>(filePath: string, defaultValue: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
    }
    return defaultValue;
  }

  private writeLocalJson<T>(filePath: string, data: T): void {
    try {
      ensureDataDir();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  }

  // --- Previous Projects Database Operations ---

  public async getPreviousProjects(): Promise<ProjectFingerprint[]> {
    if (this.isSupabaseConfigured && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('previous_projects')
          .select('*')
          .order('last_analyzed_at', { ascending: false });

        if (!error && data) {
          return data.map(row => (row.project_fingerprint as ProjectFingerprint) || {
            repositoryId: row.id,
            repositoryUrl: row.repository_url,
            owner: row.github_owner,
            name: row.github_name,
            description: row.description || '',
            primaryLanguage: null,
            languages: row.languages || {},
            frameworks: row.frameworks || [],
            dependencies: row.dependencies || [],
            projectType: [],
            features: row.features || [],
            workflowSteps: row.workflow || [],
            apiPatterns: [],
            entities: [],
            routes: [],
            directoryStructure: [],
            documentationTerms: [],
            codeTokens: [],
            fileTypeDistribution: {},
            metadata: {},
            gitHistory: {},
            firstAnalyzedAt: row.first_analyzed_at,
            lastAnalyzedAt: row.last_analyzed_at,
            lastCommitSha: row.last_commit_sha,
          });
        }
      } catch (err) {
        console.warn('Supabase getPreviousProjects error, falling back to local store:', err);
      }
    }

    const localMap = this.readLocalJson<Record<string, ProjectFingerprint>>(PREVIOUS_PROJECTS_FILE, {});
    return Object.values(localMap).sort(
      (a, b) => new Date(b.lastAnalyzedAt || 0).getTime() - new Date(a.lastAnalyzedAt || 0).getTime()
    );
  }

  public async savePreviousProject(fingerprint: ProjectFingerprint): Promise<ProjectFingerprint> {
    const now = new Date().toISOString();
    fingerprint.lastAnalyzedAt = now;
    if (!fingerprint.firstAnalyzedAt) fingerprint.firstAnalyzedAt = now;

    // 1. Supabase Persistence
    if (this.isSupabaseConfigured && this.supabase) {
      try {
        const row = {
          id: fingerprint.repositoryId,
          repository_url: fingerprint.repositoryUrl,
          github_owner: fingerprint.owner,
          github_name: fingerprint.name,
          github_full_name: fingerprint.repositoryId,
          description: fingerprint.description,
          languages: fingerprint.languages,
          frameworks: fingerprint.frameworks,
          dependencies: fingerprint.dependencies,
          features: fingerprint.features,
          workflow: fingerprint.workflowSteps,
          structure_fingerprint: { directories: fingerprint.directoryStructure },
          code_fingerprint: { tokens: fingerprint.codeTokens.length },
          documentation_fingerprint: { terms: fingerprint.documentationTerms.length },
          technology_fingerprint: { dependencies: fingerprint.dependencies },
          project_fingerprint: fingerprint,
          github_created_at: fingerprint.metadata.createdAt || null,
          github_updated_at: fingerprint.metadata.updatedAt || null,
          last_analyzed_at: now,
          last_commit_sha: fingerprint.lastCommitSha || null,
          updated_at: now,
        };

        const { error } = await this.supabase
          .from('previous_projects')
          .upsert(row, { onConflict: 'repository_url' });

        if (error) {
          console.warn('Supabase upsert previous_projects error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase savePreviousProject failed:', err.message);
      }
    }

    // 2. Local Storage Persistence
    const localMap = this.readLocalJson<Record<string, ProjectFingerprint>>(PREVIOUS_PROJECTS_FILE, {});
    localMap[fingerprint.repositoryId] = fingerprint;
    this.writeLocalJson(PREVIOUS_PROJECTS_FILE, localMap);

    return fingerprint;
  }

  public async deletePreviousProject(repositoryId: string): Promise<boolean> {
    const idLower = repositoryId.toLowerCase();

    if (this.isSupabaseConfigured && this.supabase) {
      try {
        await this.supabase.from('previous_projects').delete().eq('id', idLower);
      } catch {}
    }

    const localMap = this.readLocalJson<Record<string, ProjectFingerprint>>(PREVIOUS_PROJECTS_FILE, {});
    if (localMap[idLower]) {
      delete localMap[idLower];
      this.writeLocalJson(PREVIOUS_PROJECTS_FILE, localMap);
      return true;
    }
    return false;
  }

  // --- Analyses Database Operations ---

  public async saveAnalysisJob(job: AnalysisJob): Promise<void> {
    if (this.isSupabaseConfigured && this.supabase) {
      try {
        await this.supabase.from('analyses').upsert({
          id: job.analysisId,
          hackathon_name: job.hackathonName,
          status: job.status,
          progress: job.progress,
          current_stage: job.currentStage,
          stage_message: job.stageMessage,
          submissions: job.submissions,
          previous_submissions: job.previousSubmissions,
          current_matches: job.currentMatches,
          previous_matches: job.previousMatches,
          evidence: job.evidence,
          errors: job.errors,
          settings: job.settings,
          created_at: job.createdAt,
          updated_at: job.updatedAt,
        }, { onConflict: 'id' });
      } catch (err: any) {
        console.warn('Supabase saveAnalysisJob error:', err.message);
      }
    }

    const jobsMap = this.readLocalJson<Record<string, AnalysisJob>>(ANALYSES_FILE, {});
    jobsMap[job.analysisId] = job;
    this.writeLocalJson(ANALYSES_FILE, jobsMap);
  }

  public async getAnalysisJob(analysisId: string): Promise<AnalysisJob | undefined> {
    if (this.isSupabaseConfigured && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('analyses')
          .select('*')
          .eq('id', analysisId)
          .single();

        if (!error && data) {
          return {
            analysisId: data.id,
            hackathonName: data.hackathon_name,
            status: data.status,
            progress: data.progress,
            currentStage: data.current_stage,
            stageMessage: data.stage_message,
            submissions: data.submissions || [],
            previousSubmissions: data.previous_submissions || [],
            currentMatches: data.current_matches || [],
            previousMatches: data.previous_matches || [],
            evidence: data.evidence || [],
            errors: data.errors || [],
            settings: data.settings || {},
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch {}
    }

    const jobsMap = this.readLocalJson<Record<string, AnalysisJob>>(ANALYSES_FILE, {});
    return jobsMap[analysisId];
  }

  public async getAllAnalysisJobs(): Promise<AnalysisJob[]> {
    if (this.isSupabaseConfigured && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('analyses')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(row => ({
            analysisId: row.id,
            hackathonName: row.hackathon_name,
            status: row.status,
            progress: row.progress,
            currentStage: row.current_stage,
            stageMessage: row.stage_message,
            submissions: row.submissions || [],
            previousSubmissions: row.previous_submissions || [],
            currentMatches: row.current_matches || [],
            previousMatches: row.previous_matches || [],
            evidence: row.evidence || [],
            errors: row.errors || [],
            settings: row.settings || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch {}
    }

    const jobsMap = this.readLocalJson<Record<string, AnalysisJob>>(ANALYSES_FILE, {});
    return Object.values(jobsMap).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const dbAdapter = new DatabaseAdapter();
