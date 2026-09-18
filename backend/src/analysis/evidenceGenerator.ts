import { RepositoryAnalysisInput, Evidence, EvidenceStrength } from '../types/analysis.js';

export function generateEvidenceForPair(
  repoA: RepositoryAnalysisInput,
  repoB: RepositoryAnalysisInput,
  scores: {
    documentationSimilarity: number;
    functionalSimilarity: number;
    workflowSimilarity: number;
    codeSimilarity: number;
    structuralSimilarity: number;
    technologySimilarity: number;
    overallSimilarity: number;
  }
): Evidence[] {
  const evidenceList: Evidence[] = [];

  // 1. Functional Evidence
  const setA = new Set(repoA.functionalConcepts);
  const sharedConcepts = repoB.functionalConcepts.filter(c => setA.has(c));
  if (sharedConcepts.length > 0) {
    let strength: EvidenceStrength = 'weak';
    if (scores.functionalSimilarity >= 75 && sharedConcepts.length >= 4) strength = 'strong';
    else if (scores.functionalSimilarity >= 50 || sharedConcepts.length >= 2) strength = 'moderate';

    evidenceList.push({
      id: `ev_func_${repoA.name}_${repoB.name}`,
      type: 'functional',
      title: 'Functional Concept Overlap',
      description: `Both projects implement features and domain concepts related to: ${sharedConcepts.slice(0, 6).join(', ')}.`,
      strength,
      sourceA: repoA.functionalConcepts.slice(0, 6),
      sourceB: repoB.functionalConcepts.slice(0, 6),
      details: { sharedConcepts: sharedConcepts.slice(0, 10), score: scores.functionalSimilarity },
    });
  }

  // 2. Workflow Evidence
  const workflowA = repoA.workflowSteps;
  const workflowB = repoB.workflowSteps;
  const sharedSteps = workflowA.filter(s => workflowB.includes(s));
  if (sharedSteps.length >= 2) {
    let strength: EvidenceStrength = 'weak';
    if (scores.workflowSimilarity >= 75) strength = 'strong';
    else if (scores.workflowSimilarity >= 45) strength = 'moderate';

    evidenceList.push({
      id: `ev_work_${repoA.name}_${repoB.name}`,
      type: 'workflow',
      title: 'Inferred Workflow Pattern Similarity',
      description: `Both repositories contain code/route signals matching a workflow sequence (${sharedSteps.join(' → ')}).`,
      strength,
      sourceA: workflowA,
      sourceB: workflowB,
      details: { sharedWorkflow: sharedSteps, score: scores.workflowSimilarity },
    });
  }

  // 3. Structural Evidence
  const dirsA = new Set(repoA.structure.directories);
  const sharedDirs = repoB.structure.directories.filter(d => dirsA.has(d));
  if (sharedDirs.length > 0) {
    let strength: EvidenceStrength = 'weak';
    if (scores.structuralSimilarity >= 70 && sharedDirs.length >= 3) strength = 'strong';
    else if (scores.structuralSimilarity >= 40) strength = 'moderate';

    evidenceList.push({
      id: `ev_struct_${repoA.name}_${repoB.name}`,
      type: 'structure',
      title: 'Repository Structure Alignment',
      description: `Both projects share directory layouts and component paths: ${sharedDirs.slice(0, 5).join(', ')}.`,
      strength,
      sourceA: repoA.structure.directories.slice(0, 5),
      sourceB: repoB.structure.directories.slice(0, 5),
      details: { sharedDirs: sharedDirs.slice(0, 8), score: scores.structuralSimilarity },
    });
  }

  // 4. Technology & Dependency Evidence
  const depsA = new Set(repoA.dependencies);
  const sharedDeps = repoB.dependencies.filter(d => depsA.has(d));
  if (sharedDeps.length > 0) {
    let strength: EvidenceStrength = 'weak';
    if (scores.technologySimilarity >= 75) strength = 'strong';
    else if (scores.technologySimilarity >= 45) strength = 'moderate';

    evidenceList.push({
      id: `ev_tech_${repoA.name}_${repoB.name}`,
      type: 'technology',
      title: 'Technology & Dependency Stack Match',
      description: `Identified overlapping dependencies: ${sharedDeps.slice(0, 6).join(', ')}.`,
      strength,
      sourceA: repoA.dependencies.slice(0, 6),
      sourceB: repoB.dependencies.slice(0, 6),
      details: { sharedDeps, score: scores.technologySimilarity },
    });
  }

  // 5. Code Similarity Evidence
  if (scores.codeSimilarity > 10) {
    let strength: EvidenceStrength = 'weak';
    if (scores.codeSimilarity >= 65) strength = 'strong';
    else if (scores.codeSimilarity >= 35) strength = 'moderate';

    evidenceList.push({
      id: `ev_code_${repoA.name}_${repoB.name}`,
      type: 'code',
      title: scores.codeSimilarity >= 65 ? 'High Source Code Overlap' : 'Source Code Structure Signal',
      description: scores.codeSimilarity >= 65
        ? 'Significant token and sequence similarity detected across normalized source code files.'
        : 'Low to moderate source-level overlap detected. The projects implement similar functionality using mostly distinct source code.',
      strength,
      details: { score: scores.codeSimilarity },
    });
  }

  // 6. Documentation Evidence
  if (scores.documentationSimilarity >= 30) {
    let strength: EvidenceStrength = 'weak';
    if (scores.documentationSimilarity >= 70) strength = 'strong';
    else if (scores.documentationSimilarity >= 45) strength = 'moderate';

    evidenceList.push({
      id: `ev_doc_${repoA.name}_${repoB.name}`,
      type: 'documentation',
      title: 'Documentation & Terminology Overlap',
      description: `Both project README files share terminology and feature descriptions.`,
      strength,
      details: { score: scores.documentationSimilarity },
    });
  }

  // 7. Historical / Provenance Evidence
  const dateA = new Date(repoA.metadata.createdAt);
  const dateB = new Date(repoB.metadata.createdAt);
  const diffDays = Math.abs(Math.round((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24)));

  evidenceList.push({
    id: `ev_hist_${repoA.name}_${repoB.name}`,
    type: 'historical',
    title: 'Repository Timeline & Provenance',
    description: `${repoA.owner}/${repoA.name} created on ${dateA.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}; ${repoB.owner}/${repoB.name} created on ${dateB.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${diffDays} days apart). Earlier public activity does not by itself indicate a rules violation.`,
    strength: diffDays > 180 ? 'moderate' : 'weak',
    details: {
      repoA: { created: repoA.metadata.createdAt, pushed: repoA.metadata.pushedAt },
      repoB: { created: repoB.metadata.createdAt, pushed: repoB.metadata.pushedAt },
      diffDays,
    },
  });

  return evidenceList;
}
