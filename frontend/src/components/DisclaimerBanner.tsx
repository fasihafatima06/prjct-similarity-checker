import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DisclaimerBannerProps {
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ className = '' }) => {
  return (
    <div className={`bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-amber-900 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-amber-950 mb-0.5">Originality Signal & Human Review Guidance</p>
          <p className="text-amber-900/90 text-xs sm:text-sm">
            «This is an originality signal, not a plagiarism verdict. Similarity can occur legitimately when teams respond to the same challenge, use common templates, or independently develop similar solutions. Review the evidence and applicable hackathon rules before taking action.»
          </p>
        </div>
      </div>
    </div>
  );
};
