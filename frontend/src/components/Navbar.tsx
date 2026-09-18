import React, { useEffect, useState } from 'react';
import { ShieldCheck, GitCompare, PlusCircle, LayoutDashboard, History, Info, Key } from 'lucide-react';
import { checkBackendHealth } from '../services/analysisService';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  activeAnalysisId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, activeAnalysisId }) => {
  const [health, setHealth] = useState<{ status: string; githubTokenConfigured: boolean }>({
    status: 'checking',
    githubTokenConfigured: false,
  });

  useEffect(() => {
    checkBackendHealth().then(setHealth);
    const interval = setInterval(() => {
      checkBackendHealth().then(setHealth);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'explorer', label: 'Similarity Explorer', icon: GitCompare },
    { id: 'previous-projects', label: 'Previous Projects', icon: History },
    { id: 'about', label: 'About & Methodology', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight">
                  Hackathon Integrity
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Analysis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">Originality & Similarity Intelligence System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || (item.id === 'explorer' && currentPage === 'results');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id, activeAnalysisId ? { id: activeAnalysisId } : undefined)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action & System Badges */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* GitHub Token Indicator */}
            <div
              title={
                health.githubTokenConfigured
                  ? 'Server GITHUB_TOKEN active (5,000 requests/hr)'
                  : 'Unauthenticated GitHub mode active (60 requests/hr). Add GITHUB_TOKEN to backend env for higher rate limits.'
              }
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border ${
                health.githubTokenConfigured
                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{health.githubTokenConfigured ? 'GitHub Token Active' : 'Public API Mode'}</span>
            </div>

            {/* Primary Action Button: New Analysis */}
            <button
              onClick={() => onNavigate('new-analysis')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all ${
                currentPage === 'new-analysis'
                  ? 'bg-indigo-700 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
