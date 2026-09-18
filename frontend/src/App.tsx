import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { NewAnalysis } from './pages/NewAnalysis';
import { Processing } from './pages/Processing';
import { ResultsOverview } from './pages/ResultsOverview';
import { SimilarityExplorer } from './pages/SimilarityExplorer';
import { ComparisonDetail } from './pages/ComparisonDetail';
import { SubmissionDetail } from './pages/SubmissionDetail';
import { PreviousProjects } from './pages/PreviousProjects';
import { SettingsAbout } from './pages/SettingsAbout';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | undefined>(undefined);
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  const handleNavigate = (page: string, params?: Record<string, string>) => {
    setCurrentPage(page);
    if (params) {
      setPageParams(params);
      if (params.id) {
        // If analysis id is passed
        if (page === 'results' || page === 'processing' || page === 'explorer') {
          setActiveAnalysisId(params.id);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        activeAnalysisId={activeAnalysisId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}

        {currentPage === 'new-analysis' && (
          <NewAnalysis onNavigate={handleNavigate} preset={pageParams.preset} />
        )}

        {currentPage === 'processing' && pageParams.id && (
          <Processing analysisId={pageParams.id} onNavigate={handleNavigate} />
        )}

        {currentPage === 'results' && pageParams.id && (
          <ResultsOverview analysisId={pageParams.id} onNavigate={handleNavigate} />
        )}

        {currentPage === 'explorer' && (
          <SimilarityExplorer analysisId={activeAnalysisId} onNavigate={handleNavigate} />
        )}

        {currentPage === 'comparison-detail' && pageParams.id && (
          <ComparisonDetail comparisonId={pageParams.id} onNavigate={handleNavigate} />
        )}

        {currentPage === 'submission-detail' && pageParams.id && (
          <SubmissionDetail
            submissionId={pageParams.id}
            analysisId={pageParams.analysisId || activeAnalysisId}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'previous-projects' && <PreviousProjects onNavigate={handleNavigate} />}

        {currentPage === 'about' && <SettingsAbout />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Hackathon Originality & Similarity Analyzer</span>
            <span>&bull; Live Public GitHub Data Engine</span>
          </div>

          <p className="text-slate-400 text-center sm:text-right">
            Designed for Hackathon Organizers & Judges &bull; Non-accusatory Human Review Workflow
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
