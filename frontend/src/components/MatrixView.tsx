import React from 'react';
import type { Submission, SimilarityResult } from '../types/analysis';

interface MatrixViewProps {
  submissions: Submission[];
  matches: SimilarityResult[];
  onSelectComparison: (comparisonId: string) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  submissions,
  matches,
  onSelectComparison,
}) => {
  if (submissions.length === 0) return null;

  // Build matrix dictionary lookup: repoIdA_repoIdB -> score & comparisonId
  const matrixMap = new Map<string, { score: number; comparisonId?: string }>();

  matches.forEach(m => {
    const key1 = `${m.submissionA.id}__${m.submissionB.id}`;
    const key2 = `${m.submissionB.id}__${m.submissionA.id}`;
    matrixMap.set(key1, { score: m.overallSimilarity, comparisonId: m.id });
    matrixMap.set(key2, { score: m.overallSimilarity, comparisonId: m.id });
  });

  submissions.forEach(s => {
    matrixMap.set(`${s.id}__${s.id}`, { score: 100 });
  });

  const getCellColor = (score: number, isSelf: boolean) => {
    if (isSelf) return 'bg-slate-100 text-slate-400 font-normal';
    if (score >= 80) return 'bg-rose-100 text-rose-900 border-rose-200 font-bold hover:bg-rose-200';
    if (score >= 60) return 'bg-amber-100 text-amber-900 border-amber-200 font-semibold hover:bg-amber-200';
    if (score >= 35) return 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100';
    return 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">Pairwise Similarity Matrix</h3>
        <p className="text-xs text-slate-500">
          Click any cell to inspect the detailed similarity signals and evidence breakdown between two submissions.
        </p>
      </div>

      <table className="border-collapse text-xs font-mono">
        <thead>
          <tr>
            <th className="p-2 border border-slate-200 bg-slate-50 text-slate-500 font-semibold text-left">
              Project
            </th>
            {submissions.map((sub, idx) => (
              <th
                key={sub.id}
                className="p-2 border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-center min-w-[70px] max-w-[100px] truncate"
                title={`${sub.owner}/${sub.repositoryName}`}
              >
                P{idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((rowSub, rowIdx) => (
            <tr key={rowSub.id}>
              <td
                className="p-2 border border-slate-200 bg-slate-50 text-slate-800 font-semibold whitespace-nowrap"
                title={`${rowSub.owner}/${rowSub.repositoryName}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    P{rowIdx + 1}
                  </span>
                  <span className="font-sans font-medium text-xs text-slate-900 truncate max-w-[140px]">
                    {rowSub.repositoryName}
                  </span>
                </div>
              </td>

              {submissions.map((colSub) => {
                const isSelf = rowSub.id === colSub.id;
                const cellData = matrixMap.get(`${rowSub.id}__${colSub.id}`) || { score: 0 };
                const score = cellData.score;
                const colorClass = getCellColor(score, isSelf);

                return (
                  <td
                    key={colSub.id}
                    onClick={() => {
                      if (!isSelf && cellData.comparisonId) {
                        onSelectComparison(cellData.comparisonId);
                      }
                    }}
                    className={`p-3 border text-center transition-all matrix-cell ${colorClass} ${
                      !isSelf ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                    }`}
                  >
                    {isSelf ? '100%' : `${score}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Intensity Legend:</span>
        <div className="flex items-center space-x-1">
          <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300"></span>
          <span>High (≥80%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300"></span>
          <span>Moderate (60-79%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3.5 h-3.5 rounded bg-sky-50 border border-sky-300"></span>
          <span>Low-Mid (35-59%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300"></span>
          <span>Low (&lt;35%)</span>
        </div>
      </div>
    </div>
  );
};
