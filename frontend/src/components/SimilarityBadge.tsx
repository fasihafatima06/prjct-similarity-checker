import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SimilarityBadgeProps {
  score: number;
  riskLevel?: 'low' | 'medium' | 'high';
  showText?: boolean;
}

export const SimilarityBadge: React.FC<SimilarityBadgeProps> = ({
  score,
  riskLevel,
  showText = true,
}) => {
  let level = riskLevel;
  if (!level) {
    if (score >= 75) level = 'high';
    else if (score >= 50) level = 'medium';
    else level = 'low';
  }

  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span className="font-bold">{score}%</span>
        {showText && <span className="text-rose-600 font-medium">· Review recommended</span>}
      </span>
    );
  }

  if (level === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <Info className="w-3.5 h-3.5 text-amber-600" />
        <span className="font-bold">{score}%</span>
        {showText && <span className="text-amber-700 font-medium">· Moderate similarity</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
      <span className="font-bold">{score}%</span>
      {showText && <span className="text-slate-600">· Low overlap</span>}
    </span>
  );
};
