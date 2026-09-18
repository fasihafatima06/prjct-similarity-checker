import React from 'react';
import type { Evidence, EvidenceType, EvidenceStrength } from '../types/analysis';
import { Layers, GitBranch, Code, FolderTree, FileText, Cpu, Clock, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Evidence;
}

const TYPE_CONFIG: Record<EvidenceType, { icon: any; color: string; label: string }> = {
  functional: { icon: Layers, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', label: 'Functional Overlap' },
  workflow: { icon: GitBranch, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Workflow Pattern' },
  code: { icon: Code, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Source Code Signal' },
  structure: { icon: FolderTree, color: 'text-sky-600 bg-sky-50 border-sky-200', label: 'Repository Structure' },
  documentation: { icon: FileText, color: 'text-teal-600 bg-teal-50 border-teal-200', label: 'Documentation Terms' },
  technology: { icon: Cpu, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Tech Stack Overlap' },
  historical: { icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Historical Timeline' },
};

const STRENGTH_CONFIG: Record<EvidenceStrength, { text: string; bg: string; icon: any }> = {
  strong: { text: 'Strong Evidence', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle },
  moderate: { text: 'Moderate Evidence', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: HelpCircle },
  weak: { text: 'Weak Signal', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: CheckCircle2 },
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const config = TYPE_CONFIG[evidence.type] || TYPE_CONFIG.functional;
  const strength = STRENGTH_CONFIG[evidence.strength] || STRENGTH_CONFIG.weak;
  const Icon = config.icon;
  const StrengthIcon = strength.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{config.label}</span>
            <h4 className="text-base font-semibold text-slate-900">{evidence.title}</h4>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${strength.bg}`}>
          <StrengthIcon className="w-3.5 h-3.5" />
          <span>{strength.text}</span>
        </span>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-4">{evidence.description}</p>

      {/* Source A / Source B tags if available */}
      {(evidence.sourceA || evidence.sourceB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-lg text-xs">
          {evidence.sourceA && (
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Project A Concepts:</span>
              <div className="flex flex-wrap gap-1">
                {evidence.sourceA.map((item, idx) => (
                  <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {evidence.sourceB && (
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Project B Concepts:</span>
              <div className="flex flex-wrap gap-1">
                {evidence.sourceB.map((item, idx) => (
                  <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
