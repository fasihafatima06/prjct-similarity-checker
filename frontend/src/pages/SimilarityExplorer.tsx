import React, { useEffect, useState } from 'react';
import { getAnalysisResults } from '../services/analysisService';
import type { AnalysisJob, SimilarityResult } from '../types/analysis';
import { SimilarityBadge } from '../components/SimilarityBadge';
import { Search, GitCompare, ArrowRight } from 'lucide-react';

interface SimilarityExplorerProps {
  analysisId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const SimilarityExplorer: React.FC<SimilarityExplorerProps> = ({ analysisId, onNavigate }) => {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (analysisId) {
      getAnalysisResults(analysisId).then(setJob).catch(console.error);
    }
  }, [analysisId]);

  const allMatches: SimilarityResult[] = [
    ...(job?.currentMatches || []),
    ...(job?.previousMatches || []),
  ];

  const filteredMatches = allMatches.filter((m) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameA = m.submissionA.repositoryName.toLowerCase();
      const ownerA = m.submissionA.owner.toLowerCase();
      const nameB = m.submissionB.repositoryName.toLowerCase();
      const ownerB = m.submissionB.owner.toLowerCase();
      if (!nameA.includes(q) && !ownerA.includes(q) && !nameB.includes(q) && !ownerB.includes(q)) {
        return false;
      }
    }

    // Score
    if (scoreFilter === '90') {
      if (m.overallSimilarity < 90) return false;
    } else if (scoreFilter === '70-90') {
      if (m.overallSimilarity < 70 || m.overallSimilarity >= 90) return false;
    } else if (scoreFilter === 'below70') {
      if (m.overallSimilarity >= 70) return false;
    }

    // Match type
    if (matchTypeFilter !== 'all' && m.matchType !== matchTypeFilter) {
      return false;
    }

    // Status
    if (statusFilter !== 'all' && m.reviewStatus !== statusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Similarity Explorer</h1>
        <p className="text-sm text-slate-600 mt-1">
          Filter and investigate calculated similarity signals across current and historical submissions.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search submissions by project or owner..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Similarity Range Filter */}
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
          >
            <option value="all">Similarity: All Scores</option>
            <option value="90">90%+ Similarity</option>
            <option value="70-90">70% – 90% Similarity</option>
            <option value="below70">Below 70% Similarity</option>
          </select>

          {/* Match Type */}
          <select
            value={matchTypeFilter}
            onChange={(e) => setMatchTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
          >
            <option value="all">Type: All Matches</option>
            <option value="current-current">Current vs Current</option>
            <option value="current-previous">Current vs Previous</option>
          </select>

          {/* Review Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
          >
            <option value="all">Status: All</option>
            <option value="review">Review Recommended</option>
            <option value="dismissed">Dismissed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Explorer Results List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            <GitCompare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">No similarity results match your filter criteria</h4>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the score range or search query.</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div
              key={match.id}
              onClick={() => onNavigate('comparison-detail', { id: match.id })}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer hover:border-indigo-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-base">{match.submissionA.repositoryName}</span>
                  <span className="text-slate-400 text-xs">↔</span>
                  <span className="font-bold text-slate-900 text-base">{match.submissionB.repositoryName}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {match.submissionA.owner} / {match.submissionA.repositoryName} &bull; {match.submissionB.owner} / {match.submissionB.repositoryName}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600">
                  <span>Functional: <strong>{match.functionalSimilarity}%</strong></span>
                  <span>Code: <strong>{match.codeSimilarity}%</strong></span>
                  <span>Workflow: <strong>{match.workflowSimilarity}%</strong></span>
                  <span>Structure: <strong>{match.structuralSimilarity}%</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0">
                <SimilarityBadge score={match.overallSimilarity} riskLevel={match.riskLevel} />
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
