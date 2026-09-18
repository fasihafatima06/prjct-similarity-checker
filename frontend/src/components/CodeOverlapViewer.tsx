import React from 'react';
import { Code, FileCode, CheckCircle2 } from 'lucide-react';

interface CodeOverlapViewerProps {
  matchedFiles?: { pathA: string; pathB: string; similarity: number }[];
  codeScore: number;
}

export const CodeOverlapViewer: React.FC<CodeOverlapViewerProps> = ({ matchedFiles = [], codeScore }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Source Code Structural Overlap</h4>
            <p className="text-xs text-slate-500">Normalized token shingling across fetched application files</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {codeScore}% Code Similarity
        </span>
      </div>

      {codeScore < 30 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 flex items-start space-x-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Low Source-Level Overlap Detected</p>
            <p className="mt-0.5">
              The normalized source code files display low token similarity. The projects appear to implement functionality using substantially different code syntax or standard template libraries.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Identified potential source file alignment based on matching paths and normalized identifier structures:
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {matchedFiles.length > 0 ? (
              matchedFiles.slice(0, 5).map((match, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2 truncate max-w-[70%]">
                    <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-slate-800 truncate">{match.pathA}</span>
                    <span className="text-slate-400 font-sans">↔</span>
                    <span className="text-slate-800 truncate">{match.pathB}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px]">
                    {match.similarity}% overlap
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 text-xs font-mono text-center">
                Structural token similarity spread across general application source files.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
