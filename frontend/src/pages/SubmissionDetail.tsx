import React, { useEffect, useState } from 'react';
import { getAnalysisResults } from '../services/analysisService';
import type { Submission } from '../types/analysis';
import { ArrowLeft, ExternalLink, Calendar, Star, GitFork } from 'lucide-react';

interface SubmissionDetailProps {
  submissionId: string;
  analysisId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  submissionId,
  analysisId,
  onNavigate,
}) => {
  const [sub, setSub] = useState<Submission | null>(null);

  useEffect(() => {
    if (analysisId) {
      getAnalysisResults(analysisId).then(data => {
        const found = data.submissions.find(s => s.id === submissionId || `${s.owner}/${s.repositoryName}` === submissionId);
        if (found) setSub(found);
      });
    }
  }, [submissionId, analysisId]);

  if (!sub) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-900">Submission Profile</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Loading or repository details missing.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const langs = Object.entries(sub.languages || {});
  const totalLangBytes = langs.reduce((acc, [_, b]) => acc + b, 0);

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate(analysisId ? 'results' : 'dashboard', { id: analysisId || '' })}
        className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Submissions</span>
      </button>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-mono text-slate-400">{sub.owner}</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{sub.repositoryName}</h1>
            <p className="text-sm text-slate-600 mt-1">{sub.description || 'No description provided.'}</p>
          </div>

          <a
            href={sub.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs shrink-0"
          >
            <span>View GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Timeline Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Repository Created</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {new Date(sub.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Latest Pushed Activity</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {new Date(sub.pushedAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">GitHub Metrics</span>
            <span className="font-semibold text-slate-900 flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" /> {sub.stars} stars</span>
              <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5 text-slate-400" /> {sub.forks} forks</span>
            </span>
          </div>
        </div>

        {/* Languages Distribution Bar */}
        {langs.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700">Language Breakdown</span>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              {langs.map(([lang, bytes], idx) => {
                const percent = Math.round((bytes / (totalLangBytes || 1)) * 100);
                const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-sky-500', 'bg-amber-500', 'bg-teal-500'];
                return (
                  <div
                    key={lang}
                    style={{ width: `${percent}%` }}
                    className={`${colors[idx % colors.length]}`}
                    title={`${lang}: ${percent}%`}
                  ></div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              {langs.map(([lang, bytes]) => {
                const percent = Math.round((bytes / (totalLangBytes || 1)) * 100);
                return (
                  <span key={lang} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <strong>{lang}</strong> {percent}%
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Dependencies Stack */}
        {sub.dependencies && sub.dependencies.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">Extracted Tech Dependencies</span>
            <div className="flex flex-wrap gap-1.5">
              {sub.dependencies.map((dep) => (
                <span key={dep} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded font-mono text-xs">
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
