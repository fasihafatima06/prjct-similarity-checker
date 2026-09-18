import React, { useEffect, useState } from 'react';
import { getAnalysisResults } from '../services/analysisService';
import type { AnalysisJob } from '../types/analysis';
import { SimilarityBadge } from '../components/SimilarityBadge';
import { MatrixView } from '../components/MatrixView';
import { NetworkGraph } from '../components/NetworkGraph';
import { GitCompare, Grid, Share2, ArrowRight, RefreshCw, AlertCircle, Database, CheckCircle2 } from 'lucide-react';

interface ResultsOverviewProps {
  analysisId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const ResultsOverview: React.FC<ResultsOverviewProps> = ({ analysisId, onNavigate }) => {
  const [results, setResults] = useState<AnalysisJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'matrix' | 'graph'>('table');

  useEffect(() => {
    getAnalysisResults(analysisId)
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [analysisId]);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
        <p className="text-sm font-semibold">Loading calculated analysis results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-lg">Analysis session not found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested analysis job could not be retrieved from memory.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const submissions = results.submissions || [];
  const currentMatches = results.currentMatches || [];
  const previousMatches = results.previousMatches || [];
  const previousSubmissions = results.previousSubmissions || [];
  const highPriorityCount = currentMatches.filter(m => m.riskLevel === 'high').length;
  const errorCount = results.errors ? results.errors.length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Live Analysis Complete</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{results.hackathonName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Analyzed {submissions.length} submission(s) & searched persistent Previous Projects Database ({previousSubmissions.length} baseline fingerprints).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('explorer', { id: analysisId })}
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <GitCompare className="w-4 h-4" />
            <span>Open Similarity Explorer</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Submissions Analyzed
          </span>
          <div className="text-2xl font-extrabold text-slate-900">{submissions.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Real GitHub repos inspected</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Current Pair Matches
          </span>
          <div className="text-2xl font-extrabold text-slate-900">{currentMatches.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Current submission pairs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Previous DB Matches
          </span>
          <div className="text-2xl font-extrabold text-purple-700">{previousMatches.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Matches against database library</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            High-Priority Reviews
          </span>
          <div className="text-2xl font-extrabold text-rose-700">{highPriorityCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Flagged for human review</p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Submissions Comparison Table</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Similarity Matrix Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'graph'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Topology Network Graph</span>
          </button>
        </div>

        {errorCount > 0 && (
          <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            {errorCount} repository error(s)
          </span>
        )}
      </div>

      {/* Tab Views */}
      {activeTab === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Current Submissions Pairwise Analysis (A ↔ B)</h3>
            <span className="text-xs text-slate-500">Sorted by calculated overall similarity</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Project A</th>
                  <th className="py-3 px-4">Similar to (Project B)</th>
                  <th className="py-3 px-4 text-center">Overall</th>
                  <th className="py-3 px-4 text-center">Functional</th>
                  <th className="py-3 px-4 text-center">Code</th>
                  <th className="py-3 px-4 text-center">Workflow</th>
                  <th className="py-3 px-4 text-center">Review Recommendation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Single repository submitted. See Previous Projects Database Matches section below for comparisons against stored historical projects.
                    </td>
                  </tr>
                ) : (
                  currentMatches.map((match) => (
                    <tr
                      key={match.id}
                      onClick={() => onNavigate('comparison-detail', { id: match.id })}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('submission-detail', { id: match.submissionA.id, analysisId });
                          }}
                          className="hover:underline hover:text-indigo-600"
                        >
                          {match.submissionA.repositoryName}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {match.submissionA.owner}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('submission-detail', { id: match.submissionB.id, analysisId });
                          }}
                          className="hover:underline hover:text-indigo-600"
                        >
                          {match.submissionB.repositoryName}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {match.submissionB.owner}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-900">
                        {match.overallSimilarity}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {match.functionalSimilarity}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {match.codeSimilarity}%
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {match.workflowSimilarity}%
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <SimilarityBadge score={match.overallSimilarity} riskLevel={match.riskLevel} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                          Investigate <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <MatrixView
          submissions={submissions}
          matches={currentMatches}
          onSelectComparison={(cid) => onNavigate('comparison-detail', { id: cid })}
        />
      )}

      {activeTab === 'graph' && (
        <NetworkGraph
          submissions={submissions}
          matches={currentMatches}
          onSelectComparison={(cid) => onNavigate('comparison-detail', { id: cid })}
        />
      )}

      {/* Previous Projects Database Library Matches Card (Always Visible) */}
      <div className="bg-gradient-to-r from-purple-900/5 via-indigo-900/5 to-purple-900/5 border border-purple-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-purple-100 bg-purple-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-700" />
            <div>
              <h3 className="text-sm font-bold text-purple-950">Previous Projects Database Library Comparisons</h3>
              <p className="text-xs text-purple-700">
                Searched {previousSubmissions.length} stored project fingerprints in persistent database library
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold font-mono">
            {previousMatches.length} Match(es) Found
          </span>
        </div>

        {previousMatches.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">
              Checked all {previousSubmissions.length} stored database project fingerprints.
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              No significant similarity signals detected between the current submission(s) and historical projects in the database library.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-purple-100 text-xs bg-white">
            {previousMatches.map((pm) => (
              <div
                key={pm.id}
                onClick={() => onNavigate('comparison-detail', { id: pm.id })}
                className="p-4 hover:bg-purple-50/40 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="font-bold text-slate-900 text-sm">{pm.submissionA.repositoryName}</span>
                    <span className="text-slate-400 font-mono text-xs">↔ Stored Database Baseline:</span>
                    <span className="font-bold text-purple-900 text-sm">{pm.submissionB.repositoryName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Owner: {pm.submissionA.owner} &bull; Baseline Owner: {pm.submissionB.owner}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="block font-bold text-slate-900 text-sm">{pm.overallSimilarity}%</span>
                    <span className="block text-[10px] text-slate-400">Overall Match</span>
                  </div>
                  <SimilarityBadge score={pm.overallSimilarity} riskLevel={pm.riskLevel} />
                  <ArrowRight className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
