import React, { useEffect, useRef } from 'react';
import type { Submission, SimilarityResult } from '../types/analysis';

interface NetworkGraphProps {
  submissions: Submission[];
  matches: SimilarityResult[];
  onSelectComparison: (comparisonId: string) => void;
  threshold?: number;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  submissions,
  matches,
  onSelectComparison: _onSelectComparison,
  threshold = 30,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas resolution for crisp DPI
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Calculate circular layout node positions
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const nodePositions = new Map<string, { x: number; y: number; name: string; owner: string }>();

    submissions.forEach((sub, idx) => {
      const angle = (idx / submissions.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.set(sub.id, {
        x,
        y,
        name: sub.repositoryName,
        owner: sub.owner,
      });
    });

    ctx.clearRect(0, 0, width, height);

    // Draw Edges (Similarity links)
    const filteredMatches = matches.filter(m => m.overallSimilarity >= threshold);

    filteredMatches.forEach(m => {
      const posA = nodePositions.get(m.submissionA.id);
      const posB = nodePositions.get(m.submissionB.id);
      if (!posA || !posB) return;

      const score = m.overallSimilarity;
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);

      if (score >= 80) {
        ctx.strokeStyle = 'rgba(225, 29, 72, 0.7)';
        ctx.lineWidth = 3;
      } else if (score >= 60) {
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Edge label
      const midX = (posA.x + posB.x) / 2;
      const midY = (posA.y + posB.y) / 2;
      ctx.fillStyle = score >= 75 ? '#9f1239' : '#334155';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${score}%`, midX, midY);
    });

    // Draw Nodes
    nodePositions.forEach((node) => {
      // Circle background
      ctx.beginPath();
      ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#4f46e5';
      ctx.shadowColor = 'rgba(79, 70, 229, 0.3)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Circle border
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Label text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 32);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(node.owner, node.x, node.y + 44);
    });
  }, [submissions, matches, threshold]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Similarity Network Graph</h3>
          <p className="text-xs text-slate-500">Visual topology of pairwise connections above {threshold}% overall similarity.</p>
        </div>
      </div>

      <div className="relative w-full h-[360px] bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};
