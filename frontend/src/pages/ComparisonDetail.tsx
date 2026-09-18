import React, { useEffect, useState } from 'react';
import { getComparison, updateReviewStatus } from '../services/analysisService';
import type { SimilarityResult, ReviewStatus } from '../types/analysis';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { SimilarityBadge } from '../components/SimilarityBadge';
import { EvidenceCard } from '../components/EvidenceCard';
import { WorkflowComparison } from '../components/WorkflowComparison';
import { CodeOverlapViewer } from '../components/CodeOverlapViewer';
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Star } from 'lucide-react';

interface ComparisonDetailProps {
  comparisonId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const ComparisonDetail: React.FC<ComparisonDetailProps> = ({ comparisonId, onNavigate }) => {
  const [match, setMatch] = useState<SimilarityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    getComparison(comparisonId)
      .then(data => {
        setMatch(data);
        setReviewNote(data.reviewNotes || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [comparisonId]);

  const handleStatusChange = async (newStatus: ReviewStatus) => {
    if (!match || !match.analysisId) return;
    setIsUpdating(true);
    try {
      const updated = await updateReviewStatus(match.id, match.analysisId, newStatus, reviewNote);
      setMatch({ ...match, reviewStatus: updated.reviewStatus, reviewNotes: updated.reviewNotes });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-sm">Loading comparison details...</div>;
  }

  if (!match) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-900 text-lg">Comparison Record Not Found</h3>
        <button
          onClick={() => onNavigate('explorer')}
          className="mt-4 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
        >
          Back to Explorer
        </button>
      </div>
    );
  }

  const { submissionA, submissionB, overallSimilarity, riskLevel, evidence = [] } = match;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => onNavigate(match.analysisId ? 'results' : 'explorer', { id: match.analysisId || '' })}
        className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Results Overview</span>
      </button>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {match.matchType === 'current-previous' ? 'Current vs Previous Match' : 'Current Submission Pair'}
              </span>
              <SimilarityBadge score={overallSimilarity} riskLevel={riskLevel} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {overallSimilarity >= 50 ? 'Potential similarity detected' : 'Low similarity detected'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Deterministic similarity calculation across 7 independent repository signals.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
            <div className="text-center px-3 border-r border-slate-200">
              <span className="text-2xl font-black text-slate-900">{overallSimilarity}%</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Overall Similarity</span>
            </div>
            <div className="text-xs space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase ${
                match.reviewStatus === 'review'
                  ? 'bg-rose-100 text-rose-800'
                  : match.reviewStatus === 'dismissed'
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {match.reviewStatus}
              </span>
              <p className="text-slate-500 text-[11px]">Organizer Action Status</p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Repositories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project A */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Project A</span>
              <a
                href={submissionA.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">{submissionA.repositoryName}</h3>
            <p className="text-xs font-mono text-slate-500 mb-2">{submissionA.owner}/{submissionA.repositoryName}</p>
            <p className="text-xs text-slate-600 line-clamp-2 mb-3">{submissionA.description || 'No description provided.'}</p>
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span>Lang: <strong>{submissionA.primaryLanguage || 'Unknown'}</strong></span>
              <span>Files: <strong>{submissionA.fileCount || 0}</strong></span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {submissionA.stars}</span>
            </div>
          </div>

          {/* Project B */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {submissionB.isPrevious ? 'Previous Project B' : 'Project B'}
              </span>
              <a
                href={submissionB.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">{submissionB.repositoryName}</h3>
            <p className="text-xs font-mono text-slate-500 mb-2">{submissionB.owner}/{submissionB.repositoryName}</p>
            <p className="text-xs text-slate-600 line-clamp-2 mb-3">{submissionB.description || 'No description provided.'}</p>
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span>Lang: <strong>{submissionB.primaryLanguage || 'Unknown'}</strong></span>
              <span>Files: <strong>{submissionB.fileCount || 0}</strong></span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {submissionB.stars}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Human Review Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 7 Component Signal Scores Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Signal Metrics Breakdown</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-center">
            <span className="text-xl font-extrabold text-indigo-900 block">{match.functionalSimilarity}%</span>
            <span className="text-[11px] font-medium text-indigo-700 block mt-0.5">Functional</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-center">
            <span className="text-xl font-extrabold text-purple-900 block">{match.workflowSimilarity}%</span>
            <span className="text-[11px] font-medium text-purple-700 block mt-0.5">Workflow</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-center">
            <span className="text-xl font-extrabold text-rose-900 block">{match.codeSimilarity}%</span>
            <span className="text-[11px] font-medium text-rose-700 block mt-0.5">Source Code</span>
          </div>

          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 text-center">
            <span className="text-xl font-extrabold text-sky-900 block">{match.structuralSimilarity}%</span>
            <span className="text-[11px] font-medium text-sky-700 block mt-0.5">Structure</span>
          </div>

          <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3 text-center">
            <span className="text-xl font-extrabold text-teal-900 block">{match.documentationSimilarity}%</span>
            <span className="text-[11px] font-medium text-teal-700 block mt-0.5">Documentation</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-center">
            <span className="text-xl font-extrabold text-amber-900 block">{match.technologySimilarity}%</span>
            <span className="text-[11px] font-medium text-amber-700 block mt-0.5">Technology</span>
          </div>
        </div>
      </div>

      {/* Workflow & Code Overlap Visualizers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WorkflowComparison
          workflowA={[]}
          workflowB={[]}
          repoNameA={submissionA.repositoryName}
          repoNameB={submissionB.repositoryName}
          workflowScore={match.workflowSimilarity}
        />
        <CodeOverlapViewer
          matchedFiles={match.matchedFiles}
          codeScore={match.codeSimilarity}
        />
      </div>

      {/* Derived Evidence Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Extracted Repository Evidence</h3>

        <div className="grid grid-cols-1 gap-4">
          {evidence.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-xs text-center">
              No significant overlapping evidence signals detected for this pair.
            </div>
          ) : (
            evidence.map((ev) => <EvidenceCard key={ev.id} evidence={ev} />)
          )}
        </div>
      </div>

      {/* Review Actions Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Organizer Review Actions</h3>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Add Organizer Review Notes:</label>
          <textarea
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Record review notes or decision reasoning for judges..."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleStatusChange('review')}
            disabled={isUpdating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold border ${
              match.reviewStatus === 'review'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Mark for Review</span>
          </button>

          <button
            onClick={() => handleStatusChange('dismissed')}
            disabled={isUpdating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold border ${
              match.reviewStatus === 'dismissed'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Dismiss (Legitimate / Template)</span>
          </button>

          <button
            onClick={() => handleStatusChange('resolved')}
            disabled={isUpdating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold border ${
              match.reviewStatus === 'resolved'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Resolve / Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
