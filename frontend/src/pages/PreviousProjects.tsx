import React, { useEffect, useState } from 'react';
import { PlusCircle, ExternalLink, Trash2, Database, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPreviousProjects, addPreviousProject, deletePreviousProject } from '../services/analysisService';
import type { ProjectFingerprint } from '../types/analysis';

interface PreviousProjectsProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const DEFAULT_BASELINE_SUGGESTIONS = [
  'https://github.com/facebook/react',
  'https://github.com/expressjs/express',
  'https://github.com/vercel/next.js',
  'https://github.com/fastapi/fastapi',
];

export const PreviousProjects: React.FC<PreviousProjectsProps> = () => {
  const [projects, setProjects] = useState<ProjectFingerprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getPreviousProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load previous projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsAdding(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const saved = await addPreviousProject(newUrl.trim());
      setSuccessMsg(`Repository ${saved.repositoryId} added to Previous Project Database!`);
      setNewUrl('');
      setShowAddModal(false);
      loadProjects();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add project to database.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (repositoryId: string) => {
    if (!confirm(`Are you sure you want to remove ${repositoryId} from the previous project database?`)) return;

    try {
      await deletePreviousProject(repositoryId);
      setProjects(prev => prev.filter(p => p.repositoryId !== repositoryId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Persistent Project Memory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Previous Projects Database</h1>
          <p className="text-sm text-slate-600 mt-1">
            Stored repository fingerprints used to detect historical submission matches in future hackathons.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setSuccessMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Baseline Repository</span>
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Baseline Repository to Database</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter a public GitHub repository URL to analyze, extract signals, and store its fingerprint in the persistent previous project database.
            </p>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Repository URL</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_BASELINE_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewUrl(s)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-mono text-slate-700"
                    >
                      {s.replace('https://github.com/', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !newUrl.trim()}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing & Saving...</span>
                    </>
                  ) : (
                    <span>Extract & Save Fingerprint</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Database Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600 border-b border-slate-200">
          <span>Repository Baseline ({projects.length} stored)</span>
          <span>Primary Signals & Tech Stack</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs">Loading stored project fingerprints from database...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No stored previous projects yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              When you run analyses on new hackathon submissions, their fingerprints will be automatically stored here for future comparison. You can also manually add baseline repositories above.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add First Baseline Repo</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((p) => (
              <div key={p.repositoryId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{p.repositoryId}</span>
                    <a href={p.repositoryUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {p.description || 'Public GitHub repository stored in similarity baseline database.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.frameworks.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded text-[10px] font-semibold">
                        {f}
                      </span>
                    ))}
                    {p.features.slice(0, 4).map((feat, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right text-xs">
                    <span className="block font-mono font-semibold text-slate-800">
                      {p.primaryLanguage || 'Multi-language'}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Analyzed {p.lastAnalyzedAt ? new Date(p.lastAnalyzedAt).toLocaleDateString() : 'recently'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(p.repositoryId)}
                    title="Delete project fingerprint"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
