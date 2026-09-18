-- Schema for Hackathon Originality & Similarity Analyzer
-- Compatible with Supabase / PostgreSQL

-- 1. Table for Persistent Previous Project Library
CREATE TABLE IF NOT EXISTS previous_projects (
  id TEXT PRIMARY KEY,
  repository_url TEXT UNIQUE NOT NULL,
  github_owner TEXT NOT NULL,
  github_name TEXT NOT NULL,
  github_full_name TEXT NOT NULL,
  description TEXT,
  languages JSONB DEFAULT '{}'::jsonb,
  frameworks JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  workflow JSONB DEFAULT '[]'::jsonb,
  structure_fingerprint JSONB DEFAULT '{}'::jsonb,
  code_fingerprint JSONB DEFAULT '{}'::jsonb,
  documentation_fingerprint JSONB DEFAULT '{}'::jsonb,
  technology_fingerprint JSONB DEFAULT '{}'::jsonb,
  project_fingerprint JSONB DEFAULT '{}'::jsonb,
  github_created_at TIMESTAMPTZ,
  github_updated_at TIMESTAMPTZ,
  first_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  last_commit_sha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for Analysis Jobs
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  hackathon_name TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  current_stage TEXT,
  stage_message TEXT,
  submissions JSONB DEFAULT '[]'::jsonb,
  previous_submissions JSONB DEFAULT '[]'::jsonb,
  current_matches JSONB DEFAULT '[]'::jsonb,
  previous_matches JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table for Pairwise Similarity Results
CREATE TABLE IF NOT EXISTS similarity_results (
  id TEXT PRIMARY KEY,
  analysis_id TEXT REFERENCES analyses(id) ON DELETE CASCADE,
  submission_a JSONB NOT NULL,
  submission_b JSONB NOT NULL,
  overall_similarity NUMERIC NOT NULL,
  functional_similarity NUMERIC DEFAULT 0,
  workflow_similarity NUMERIC DEFAULT 0,
  code_similarity NUMERIC DEFAULT 0,
  structural_similarity NUMERIC DEFAULT 0,
  documentation_similarity NUMERIC DEFAULT 0,
  technology_similarity NUMERIC DEFAULT 0,
  match_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  review_status TEXT DEFAULT 'review',
  review_notes TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  matched_files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_previous_projects_full_name ON previous_projects(github_full_name);
CREATE INDEX IF NOT EXISTS idx_previous_projects_url ON previous_projects(repository_url);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_similarity_results_analysis_id ON similarity_results(analysis_id);

-- Enable Row Level Security (RLS)
ALTER TABLE previous_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE similarity_results ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated / service role backend connections
CREATE POLICY "Public read policy for previous_projects" ON previous_projects FOR SELECT USING (true);
CREATE POLICY "Service role write policy for previous_projects" ON previous_projects FOR ALL USING (true);

CREATE POLICY "Public read policy for analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "Service role write policy for analyses" ON analyses FOR ALL USING (true);

CREATE POLICY "Public read policy for similarity_results" ON similarity_results FOR SELECT USING (true);
CREATE POLICY "Service role write policy for similarity_results" ON similarity_results FOR ALL USING (true);
