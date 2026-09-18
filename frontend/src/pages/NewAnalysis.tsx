import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { createAnalysis } from '../services/analysisService';

interface NewAnalysisProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  preset?: string;
}

const PRESET_REPOS: Record<string, { name: string; current: string[]; previous: string[] }> = {
  todo: {
    name: 'National Web App Hackathon 2026',
    current: [
      'https://github.com/liam-mcallister/todo',
      'https://github.com/mate-academy/react_todo-app',
      'https://github.com/jumaed/react-todo-app',
      'https://github.com/ShaifArfan/react-todo-app',
      'https://github.com/scrimba/react-todo-app-tutorial',
    ],
    previous: [],
  },
  resume: {
    name: 'AI Innovation Challenge 2026',
    current: [
      'https://github.com/liam-mcallister/todo',
      'https://github.com/mate-academy/react_todo-app',
      'https://github.com/jumaed/react-todo-app',
    ],
    previous: [
      'https://github.com/ShaifArfan/react-todo-app',
    ],
  },
  ecommerce: {
    name: 'Fintech & E-Commerce Summit 2026',
    current: [
      'https://github.com/liam-mcallister/todo',
      'https://github.com/mate-academy/react_todo-app',
      'https://github.com/jumaed/react-todo-app',
      'https://github.com/scrimba/react-todo-app-tutorial',
    ],
    previous: [],
  },
};

export const NewAnalysis: React.FC<NewAnalysisProps> = ({ onNavigate, preset }) => {
  const [hackathonName, setHackathonName] = useState('National Innovation Hackathon 2026');
  const [repositoriesText, setRepositoriesText] = useState('');
  const [previousText, setPreviousText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    compareCurrent: true,
    searchPrevious: true,
    analyzeHistory: true,
    compareFunctionality: true,
    compareStructure: true,
  });

  useEffect(() => {
    if (preset && PRESET_REPOS[preset]) {
      const p = PRESET_REPOS[preset];
      setHackathonName(p.name);
      setRepositoriesText(p.current.join('\n'));
      setPreviousText(p.previous.join('\n'));
    } else {
      // Default to demo set
      setRepositoriesText(PRESET_REPOS.todo.current.join('\n'));
    }
  }, [preset]);

  // Client-side parser and validation counter
  const parseLines = (text: string) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const currentLines = parseLines(repositoriesText);
  const previousLines = parseLines(previousText);

  const validateLine = (line: string) => {
    let cleaned = line;
    if (cleaned.endsWith('.git')) cleaned = cleaned.slice(0, -4);
    if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);

    const isMatch = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/[^\/]+\/[^\/]+(?:\/.*)?$/i) ||
                    cleaned.match(/^[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+$/);
    return !!isMatch;
  };

  const invalidCurrentCount = currentLines.filter(line => !validateLine(line)).length;

  const handlePresetSelect = (presetKey: string) => {
    const p = PRESET_REPOS[presetKey];
    if (p) {
      setHackathonName(p.name);
      setRepositoriesText(p.current.join('\n'));
      setPreviousText(p.previous.join('\n'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (currentLines.length === 0) {
      setErrorMsg('Please paste at least one public GitHub repository URL.');
      return;
    }

    if (invalidCurrentCount > 0) {
      setErrorMsg(`Please fix or remove the ${invalidCurrentCount} invalid GitHub repository URL(s).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAnalysis({
        hackathonName,
        repositories: currentLines,
        previousRepositories: previousLines,
        settings,
      });

      onNavigate('processing', { id: res.analysisId });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize analysis session.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>New Analysis Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analyze Submissions</h1>
        <p className="text-sm text-slate-600 mt-1">
          Compare current submissions with each other and identify potential matches with previous projects.
        </p>
      </div>

      {/* Quick Demo Preset Selection */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-100 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900 text-sm">Load Real Public GitHub Demo Presets</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handlePresetSelect('todo')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors shadow-2xs"
          >
            React Todo App Submissions (5 Repos)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('resume')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors shadow-2xs"
          >
            Current vs Previous Baseline Match
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Validation Error</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Hackathon Name */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5">
            Hackathon Name
          </label>
          <input
            type="text"
            value={hackathonName}
            onChange={(e) => setHackathonName(e.target.value)}
            placeholder="e.g. National Innovation Hackathon 2026"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Repositories Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-slate-900">
              Add GitHub Repositories (Current Submissions)
            </label>
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {currentLines.length} repository(ies) detected
              </span>
              {invalidCurrentCount > 0 && (
                <span className="font-semibold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  {invalidCurrentCount} invalid GitHub URL
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-2">
            Paste public GitHub repository URLs below (one URL per line).
          </p>

          <textarea
            rows={7}
            value={repositoriesText}
            onChange={(e) => setRepositoriesText(e.target.value)}
            placeholder={`https://github.com/liam-mcallister/todo\nhttps://github.com/mate-academy/react_todo-app\nhttps://github.com/jumaed/react-todo-app`}
            className="w-full font-mono text-xs sm:text-sm p-4 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 leading-relaxed"
            required
          />

          {/* Validated preview pills */}
          {currentLines.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
              {currentLines.map((line, idx) => {
                const isValid = validateLine(line);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border ${
                      isValid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {isValid ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                    )}
                    <span className="truncate max-w-[260px]">{line}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Previous Projects */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-slate-900">
              Previous Projects Baseline (Optional)
            </label>
            <span className="text-xs text-slate-500">
              {previousLines.length} baseline repository(ies)
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-2">
            Paste previous hackathon submission URLs to detect historical project matches.
          </p>

          <textarea
            rows={3}
            value={previousText}
            onChange={(e) => setPreviousText(e.target.value)}
            placeholder="https://github.com/previous-user/old-project"
            className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        {/* Analysis Settings */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Analysis Engine Configurations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={settings.compareCurrent}
                onChange={(e) => setSettings({ ...settings, compareCurrent: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="font-semibold text-slate-800">Compare current submissions</span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={settings.searchPrevious}
                onChange={(e) => setSettings({ ...settings, searchPrevious: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="font-semibold text-slate-800">Search previous projects</span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={settings.compareFunctionality}
                onChange={(e) => setSettings({ ...settings, compareFunctionality: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="font-semibold text-slate-800">Compare project functionality</span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={settings.compareStructure}
                onChange={(e) => setSettings({ ...settings, compareStructure: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="font-semibold text-slate-800">Compare project structure</span>
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || currentLines.length === 0 || invalidCurrentCount > 0}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105"
          >
            <span>{isSubmitting ? 'Initializing...' : 'Analyze Submissions'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
