import React, { useEffect, useState } from 'react';
import { PlusCircle, ShieldCheck, AlertTriangle, Layers, History, PlayCircle, ArrowRight, Clock } from 'lucide-react';
import { getAllAnalyses, getPreviousProjects } from '../services/analysisService';
import type { AnalysisJob, ProjectFingerprint } from '../types/analysis';

interface DashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [analyses, setAnalyses] = useState<AnalysisJob[]>([]);
  const [previousProjects, setPreviousProjects] = useState<ProjectFingerprint[]>([]);

  useEffect(() => {
    getAllAnalyses().then(setAnalyses);
    getPreviousProjects().then(setPreviousProjects);
  }, []);

  const totalAnalyzed = analyses.reduce((acc, job) => acc + job.submissions.length, 0);
  const totalMatches = analyses.reduce((acc, job) => acc + job.currentMatches.length, 0);
  const highPriorityReviews = analyses.reduce((acc, job) => acc + job.currentMatches.filter(m => m.riskLevel === 'high').length, 0);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>Hackathon Originality Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Hackathon Integrity Intelligence
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
            Review submission originality with multi-signal evidence, structural code analysis, and workflow alignment — backed by {previousProjects.length} stored project baseline fingerprints.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('new-analysis')}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              <PlusCircle className="w-5 h-5" />
              <span>+ Create New Analysis</span>
            </button>

            <button
              onClick={() => onNavigate('new-analysis', { preset: 'todo' })}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-4 py-3 rounded-xl transition-all"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Run Preset Demo (Real GitHub Todo Repos)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submissions Analyzed</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalAnalyzed}</div>
          <p className="text-xs text-slate-500 mt-1">Total public GitHub repos retrieved</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Potential Matches</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalMatches}</div>
          <p className="text-xs text-slate-500 mt-1">Pairwise similarity signals identified</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High-Priority Reviews</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{highPriorityReviews}</div>
          <p className="text-xs text-slate-500 mt-1">Recommended for organizer review</p>
        </div>

        <div
          onClick={() => onNavigate('previous-projects')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stored Baseline Library</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{previousProjects.length}</div>
          <p className="text-xs text-slate-500 mt-1">Historical project baseline fingerprints</p>
        </div>
      </div>

      {/* Quick Launch Demo Presets */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Quick Launch Demonstration Presets</h3>
        <p className="text-xs text-slate-500 mb-4">
          Test the deterministic analysis engine against real, live public GitHub repositories.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('new-analysis', { preset: 'todo' })}
            className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 hover:border-indigo-300 cursor-pointer transition-all hover:shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                5 Real Repos
              </span>
              <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">React Todo App Submissions</h4>
            <p className="text-xs text-slate-500">
              Analyzes real GitHub repositories: `liam-mcallister/todo`, `mate-academy/react_todo-app`, `jumaed/react-todo-app`, `ShaifArfan/react-todo-app`, `scrimba/react-todo-app-tutorial`.
            </p>
          </div>

          <div
            onClick={() => onNavigate('new-analysis', { preset: 'resume' })}
            className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 hover:border-purple-300 cursor-pointer transition-all hover:shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                3 Real Repos
              </span>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">AI Resume & Career Tools</h4>
            <p className="text-xs text-slate-500">
              Compares resume parsers and job candidate matchers to highlight functional concept overlap.
            </p>
          </div>

          <div
            onClick={() => onNavigate('new-analysis', { preset: 'ecommerce' })}
            className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-emerald-50/30 hover:border-emerald-300 cursor-pointer transition-all hover:shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                4 Real Repos
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">E-Commerce & Storefront Apps</h4>
            <p className="text-xs text-slate-500">
              Compares shopping cart applications across React, Next.js, and Express architectures.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Analyses List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Analysis Runs</h3>
            <p className="text-xs text-slate-500">Historical analysis sessions stored in server memory</p>
          </div>
        </div>

        {analyses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">No analysis runs yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Start by pasting your hackathon public GitHub submission URLs.
            </p>
            <button
              onClick={() => onNavigate('new-analysis')}
              className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Create First Analysis
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {analyses.map((job) => (
              <div
                key={job.analysisId}
                onClick={() => onNavigate(job.status === 'processing' ? 'processing' : 'results', { id: job.analysisId })}
                className="p-4 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{job.hackathonName}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      job.status === 'complete'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : job.status === 'processing'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {job.submissions.length} submission(s) · {job.currentMatches.length} pairwise match(es) · Created {new Date(job.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-indigo-600">View Results →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
