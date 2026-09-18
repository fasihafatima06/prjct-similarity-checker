import React, { useEffect, useState } from 'react';
import { ShieldCheck, Key, Code2 } from 'lucide-react';
import { checkBackendHealth } from '../services/analysisService';

export const SettingsAbout: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    checkBackendHealth().then(setHealth);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About & Methodology</h1>
        <p className="text-sm text-slate-600 mt-1">
          Hackathon Integrity Assistant design principles, deterministic scoring formulas, and ethical guidance.
        </p>
      </div>

      {/* Human Review Principles */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Core Ethical Product Philosophy</span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          This system is an <strong>originality assistant for hackathon organizers and judges</strong>, not an automated plagiarism judge. High similarity scores are signals designed to prompt thoughtful human review, not proof of wrongdoing.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2 text-slate-700">
          <p className="font-semibold text-slate-900">Mandatory Human Review Disclaimer:</p>
          <p className="italic bg-white p-3 rounded border border-slate-200 text-slate-800">
            «This is an originality signal, not a plagiarism verdict. Similarity can occur legitimately when teams respond to the same challenge, use common templates, or independently develop similar solutions. Review the evidence and applicable hackathon rules before taking action.»
          </p>
        </div>
      </div>

      {/* Scoring Math Constants */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
          <Code2 className="w-5 h-5" />
          <span>Deterministic Weight Matrix</span>
        </div>

        <p className="text-sm text-slate-600">
          Overall similarity is calculated from 7 independent component signals using a transparent, deterministic weighted formula:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block">Functional Similarity (25%)</span>
            <span className="text-slate-500">Domain nouns, verbs, route endpoints, component names</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block">Workflow Similarity (20%)</span>
            <span className="text-slate-500">Inferred action pipelines (e.g. create → edit → filter)</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block">Documentation (15%)</span>
            <span className="text-slate-500">README terminology and feature list TF-IDF overlap</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block">Structural (15%)</span>
            <span className="text-slate-500">Directory structure and file tree Jaccard index</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block">Source Code (15%)</span>
            <span className="text-slate-500">Normalized token shingling across fetched source files</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block">Technology (10%)</span>
            <span className="text-slate-500">Package dependency overlap, weighting rare packages</span>
          </div>
        </div>
      </div>

      {/* GitHub API Token Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
            <Key className="w-5 h-5" />
            <span>GitHub API Rate Limit Configuration</span>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
            health?.githubTokenConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {health?.githubTokenConfigured ? 'GITHUB_TOKEN Active ✅' : 'Public Unauthenticated Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Public GitHub API requests without authentication are limited to 60 requests per hour per IP. To analyze larger hackathon batches, add a personal GitHub token to your server environment:
        </p>

        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
          <span className="text-slate-500"># In backend/.env file:</span><br />
          <span>GITHUB_TOKEN=github_pat_11AAAAAA_...</span>
        </div>
      </div>
    </div>
  );
};
