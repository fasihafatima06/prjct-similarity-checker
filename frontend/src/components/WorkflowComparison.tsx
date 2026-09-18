import React from 'react';
import { ArrowRight, Check, GitBranch } from 'lucide-react';

interface WorkflowComparisonProps {
  workflowA: string[];
  workflowB: string[];
  repoNameA: string;
  repoNameB: string;
  workflowScore: number;
}

export const WorkflowComparison: React.FC<WorkflowComparisonProps> = ({
  workflowA,
  workflowB,
  repoNameA,
  repoNameB,
  workflowScore,
}) => {
  const stepsA = workflowA.length > 0 ? workflowA : ['create', 'process', 'render'];
  const stepsB = workflowB.length > 0 ? workflowB : ['create', 'process', 'render'];

  const setB = new Set(stepsB);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Inferred Workflow Sequence Alignment</h4>
            <p className="text-xs text-slate-500">Comparing detected route handlers and service step pipelines</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {workflowScore}% Workflow Match
        </span>
      </div>

      <div className="space-y-4">
        {/* Workflow Project A */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">{repoNameA} Pipeline:</span>
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {stepsA.map((step, idx) => {
              const isMatch = setB.has(step);
              return (
                <React.Fragment key={idx}>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border ${
                      isMatch
                        ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {isMatch && <Check className="w-3 h-3 text-purple-600" />}
                    {step}
                  </span>
                  {idx < stepsA.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Workflow Project B */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">{repoNameB} Pipeline:</span>
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {stepsB.map((step, idx) => {
              const isMatch = stepsA.includes(step);
              return (
                <React.Fragment key={idx}>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border ${
                      isMatch
                        ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {isMatch && <Check className="w-3 h-3 text-purple-600" />}
                    {step}
                  </span>
                  {idx < stepsB.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
