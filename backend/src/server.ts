import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analysesRouter } from './routes/analyses.js';
import { comparisonsRouter } from './routes/comparisons.js';
import { previousProjectsRouter } from './routes/previousProjects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/analyses', analysesRouter);
app.use('/api/comparisons', comparisonsRouter);
app.use('/api/previous-projects', previousProjectsRouter);

// System Status & Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'Hackathon Originality & Similarity Analyzer API',
    githubTokenConfigured: !!process.env.GITHUB_TOKEN,
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Originality & Similarity API Server running on port ${PORT}`);
  console.log(`🔑 GitHub Token Status: ${process.env.GITHUB_TOKEN ? 'Configured ✅' : 'Unauthenticated Public Mode (Rate-limited)'}`);
  console.log(`⚡ Database Status: ${process.env.SUPABASE_URL ? 'Supabase PostgreSQL Connected ✅' : 'Local JSON Persistent Storage Enabled ✅'}`);
  console.log(`=======================================================`);
});
