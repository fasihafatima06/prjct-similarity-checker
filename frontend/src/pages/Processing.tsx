import React, { useEffect, useState } from 'react';
import { getAnalysisStatus } from '../services/analysisService';
import { Loader2, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ProcessingProps {
  analysisId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const STAGES = [
  { name: 'Collecting repositories', desc: 'Validating public GitHub repository URLs' },
  { name: 'Fetching repository content', desc: 'Retrieving README files, commit dates, and metadata' },
  { name: 'Analyzing project signals', desc: 'Extracting file trees, dependencies & code tokens' },
  { name: 'Comparing repositories', desc: 'Calculating deterministic multi-signal similarity scores' },
  { name: 'Generating evidence', desc: 'Synthesizing evidence cards & review recommendations' },
];

export const Processing: React.FC<ProcessingProps> = ({ analysisId, onNavigate }) => {
  const [status, setStatus] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: any = null;

    const checkStatus = async () => {
      try {
        const data = await getAnalysisStatus(analysisId);
        setStatus(data);

        if (data.status === 'complete') {
          setTimeout(() => {
            onNavigate('results', { id: analysisId });
          }, 800);
        } else if (data.status === 'failed') {
          setErrorMsg(data.stageMessage || 'Analysis failed to process repositories.');
        } else {
          timer = setTimeout(checkStatus, 1500);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error communicating with analysis API.');
      }
    };

    checkStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [analysisId, onNavigate]);

  const progress = status?.progress || 10;
  const currentStageName = status?.currentStage || 'Initializing';
  const stageMessage = status?.stageMessage || 'Connecting to backend similarity engine...';

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Real Live GitHub Analysis</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analyzing Submissions</h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          We're retrieving public repository data and comparing projects across documentation, functional, workflow, code, and structural signals.
        </p>
      </div>

      {/* Main Progress Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Animated Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-indigo-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              {currentStageName}
            </span>
            <span className="text-slate-500 font-mono font-bold text-sm">{progress}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-xs text-slate-500 font-mono mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
            {stageMessage}
          </p>
        </div>

        {/* Stage Checklist */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {STAGES.map((stg, idx) => {
            const stageProgressThreshold = (idx + 1) * 20;
            const isFinished = progress >= stageProgressThreshold;
            const isCurrent = progress < stageProgressThreshold && progress >= stageProgressThreshold - 20;

            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition-colors ${
                  isFinished
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : isCurrent
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 shadow-2xs'
                    : 'bg-slate-50/40 border-slate-100 text-slate-400'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isFinished ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold">{stg.name}</h4>
                  <p className="text-xs opacity-80">{stg.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error State if failed */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-0.5">Analysis Failed</h4>
              <p className="text-xs text-rose-700 leading-relaxed mb-3">{errorMsg}</p>
              <button
                onClick={() => onNavigate('new-analysis')}
                className="bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-700"
              >
                Back to New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
