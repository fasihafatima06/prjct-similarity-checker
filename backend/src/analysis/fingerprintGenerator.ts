import { RepositoryAnalysisInput, ProjectFingerprint } from '../types/analysis.js';
import { normalizeText } from './featureExtractor.js';

export function buildProjectFingerprint(repo: RepositoryAnalysisInput): ProjectFingerprint {
  const repositoryId = `${repo.owner}/${repo.name}`.toLowerCase();
  
  // 1. Detect Frameworks & Technologies
  const frameworksSet = new Set<string>();
  const depsLower = repo.dependencies.map(d => d.toLowerCase());

  // JavaScript / TypeScript Frameworks
  if (depsLower.some(d => d.includes('react'))) frameworksSet.add('React');
  if (depsLower.some(d => d.includes('next'))) frameworksSet.add('Next.js');
  if (depsLower.some(d => d.includes('vue'))) frameworksSet.add('Vue');
  if (depsLower.some(d => d.includes('angular'))) frameworksSet.add('Angular');
  if (depsLower.some(d => d.includes('express'))) frameworksSet.add('Express');
  if (depsLower.some(d => d.includes('@nestjs') || d.includes('nestjs'))) frameworksSet.add('NestJS');
  if (depsLower.some(d => d.includes('svelte'))) frameworksSet.add('Svelte');
  if (depsLower.some(d => d.includes('vite'))) frameworksSet.add('Vite');
  if (depsLower.some(d => d.includes('tailwindcss'))) frameworksSet.add('Tailwind CSS');

  // Python Frameworks
  if (depsLower.some(d => d === 'fastapi' || d.includes('fastapi'))) frameworksSet.add('FastAPI');
  if (depsLower.some(d => d === 'django' || d.includes('django'))) frameworksSet.add('Django');
  if (depsLower.some(d => d === 'flask' || d.includes('flask'))) frameworksSet.add('Flask');
  if (depsLower.some(d => d.includes('sqlalchemy'))) frameworksSet.add('SQLAlchemy');
  if (depsLower.some(d => d.includes('torch') || d.includes('pytorch'))) frameworksSet.add('PyTorch');
  if (depsLower.some(d => d.includes('tensorflow'))) frameworksSet.add('TensorFlow');

  // Java Frameworks
  if (depsLower.some(d => d.includes('spring-boot') || d.includes('springframework'))) frameworksSet.add('Spring Boot');

  // Go Frameworks
  if (depsLower.some(d => d.includes('gin-gonic') || d === 'gin')) frameworksSet.add('Gin');
  if (depsLower.some(d => d.includes('gofiber') || d === 'fiber')) frameworksSet.add('Fiber');

  // Rust Frameworks
  if (depsLower.some(d => d.includes('actix'))) frameworksSet.add('Actix');
  if (depsLower.some(d => d.includes('axum'))) frameworksSet.add('Axum');

  // PHP Frameworks
  if (depsLower.some(d => d.includes('laravel'))) frameworksSet.add('Laravel');

  // Code inspection fallback for framework detection
  repo.files.forEach(f => {
    if (!f.content) return;
    const content = f.content.toLowerCase();
    if (content.includes('from "react"') || content.includes("from 'react'")) frameworksSet.add('React');
    if (content.includes('from "next') || content.includes("from 'next")) frameworksSet.add('Next.js');
    if (content.includes('from "express"') || content.includes("require('express')")) frameworksSet.add('Express');
    if (content.includes('import fastapi') || content.includes('from fastapi')) frameworksSet.add('FastAPI');
    if (content.includes('import django') || content.includes('from django')) frameworksSet.add('Django');
    if (content.includes('import flask') || content.includes('from flask')) frameworksSet.add('Flask');
  });

  // 2. Extract API Patterns & Routes
  const routesSet = new Set<string>();
  const apiPatternsSet = new Set<string>();
  const entitiesSet = new Set<string>();

  repo.files.forEach(file => {
    if (!file.content) return;

    // Detect endpoint strings (e.g. /api/todos, /users, /auth/login)
    const routeMatches = file.content.match(/['"`]\/(?:api\/)?[a-zA-Z0-9_\-\/]{3,}['"`]/gi);
    if (routeMatches) {
      routeMatches.forEach(rm => {
        const clean = rm.replace(/['"`]/g, '');
        if (clean.length > 3 && !clean.includes('node_modules')) {
          routesSet.add(clean);
          const topSegment = clean.split('/')[1] || clean.split('/')[2];
          if (topSegment) apiPatternsSet.add(topSegment.toLowerCase());
        }
      });
    }

    // Detect Entities / Model classes (e.g. class User, interface Task, entity/model files)
    const entityMatches = file.content.match(/(?:class|interface|type|model)\s+([A-Z][a-zA-Z0-9_]{2,})/g);
    if (entityMatches) {
      entityMatches.forEach(em => {
        const name = em.split(/\s+/)[1];
        if (name && !['Props', 'State', 'Config', 'Options', 'Response', 'Request', 'Error', 'Service'].includes(name)) {
          entitiesSet.add(name);
        }
      });
    }
  });

  // 3. File Type Distribution
  const fileTypeDistribution: Record<string, number> = {};
  repo.structure.filePaths.forEach(path => {
    const ext = path.split('.').pop()?.toLowerCase() || 'other';
    fileTypeDistribution[ext] = (fileTypeDistribution[ext] || 0) + 1;
  });

  // 4. Project Type Inference
  const projectTypesSet = new Set<string>();
  if (frameworksSet.has('React') || frameworksSet.has('Next.js') || frameworksSet.has('Vue') || frameworksSet.has('Angular')) {
    projectTypesSet.add('frontend-web');
  }
  if (frameworksSet.has('Express') || frameworksSet.has('FastAPI') || frameworksSet.has('Django') || frameworksSet.has('Flask') || frameworksSet.has('Spring Boot')) {
    projectTypesSet.add('backend-api');
  }
  if (projectTypesSet.has('frontend-web') && projectTypesSet.has('backend-api')) {
    projectTypesSet.add('fullstack');
  }
  if (projectTypesSet.size === 0) {
    projectTypesSet.add('software-project');
  }

  // 5. Documentation Terms
  const docText = `${repo.metadata.description} ${repo.readme}`;
  const documentationTerms = normalizeText(docText);

  const fingerprint: ProjectFingerprint = {
    repositoryId,
    repositoryUrl: repo.url,
    owner: repo.owner,
    name: repo.name,
    description: repo.metadata.description,
    primaryLanguage: repo.metadata.language,
    languages: repo.metadata.languages,
    frameworks: Array.from(frameworksSet),
    dependencies: repo.dependencies,
    projectType: Array.from(projectTypesSet),
    features: repo.functionalConcepts,
    workflowSteps: repo.workflowSteps,
    apiPatterns: Array.from(apiPatternsSet),
    entities: Array.from(entitiesSet).slice(0, 25),
    routes: Array.from(routesSet).slice(0, 25),
    directoryStructure: repo.structure.directories,
    documentationTerms: Array.from(new Set(documentationTerms)).slice(0, 50),
    codeTokens: Array.from(new Set(repo.normalizedTokens)).slice(0, 200),
    fileTypeDistribution,
    metadata: {
      stars: repo.metadata.stars,
      forks: repo.metadata.forks,
      createdAt: repo.metadata.createdAt,
      updatedAt: repo.metadata.updatedAt,
      pushedAt: repo.metadata.pushedAt,
    },
    gitHistory: {
      firstObservedAt: repo.metadata.createdAt,
      latestCommit: repo.metadata.pushedAt,
    },
    firstAnalyzedAt: new Date().toISOString(),
    lastAnalyzedAt: new Date().toISOString(),
  };

  return fingerprint;
}
