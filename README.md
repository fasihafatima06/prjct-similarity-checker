# 🛡️ Hackathon Integrity — Originality & Similarity Intelligence System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://prjc-similarity-checker.netlify.app/)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/dY87gKsYJMs)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

**Hackathon Integrity** is an advanced, automated originality and similarity detection system built specifically for hackathon organizers, judges, and code reviewers. It analyzes public GitHub repository submissions using a deterministic multi-signal comparison engine to identify code reuse, structural overlaps, and historical project re-submissions.

🌐 **Live Web Application**: [https://prjc-similarity-checker.netlify.app/](https://prjc-similarity-checker.netlify.app/)  
🎬 **Demo Video**: [https://youtu.be/dY87gKsYJMs](https://youtu.be/dY87gKsYJMs)

---

## 🌟 Key Features

* 🔬 **Multi-Signal Similarity Engine**: Analyzes submissions across multiple layers:
  * **Code Token Similarity**: AST-based code normalization and token overlap.
  * **Directory & File Structure**: Compares file paths, tree depth, and file type distributions.
  * **Dependency & Tech Stack Matching**: Identifies shared libraries, frameworks, and manifests.
  * **Functional & API Fingerprinting**: Extracts key features, API routes, workflow steps, and documentation terms.
* 📚 **Persistent Previous Projects Database**: Fingerprints historical hackathon submissions to detect recycled projects in future events.
* 📊 **Interactive Analysis Dashboard**:
  * **Similarity Explorer**: Comprehensive match rankings with granular percentage breakdowns.
  * **Matrix & Network Visualizer**: Interactive graph representations of submission relationships.
  * **Side-by-Side Code Viewer**: Line-by-line file overlap and evidence cards.
* ⚖️ **Human-in-the-Loop Review Workflow**: Designed for fair, non-accusatory review with customizable review status tags and judge notes.

---

## 🏗️ Tech Stack & Architecture

### **Frontend**
* **Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Deployment**: Netlify

### **Backend API**
* **Runtime**: Node.js + Express 5 + TypeScript
* **Data Layer**: Supabase PostgreSQL Database with local JSON persistent fallback
* **GitHub Data Engine**: Octokit / Live GitHub API Client

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: v18 or higher
* **npm**: v9 or higher

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/fasihafatima06/prjct-similarity-checker.git
   cd prjct-similarity-checker
   ```

2. **Install Dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   cd ..
   ```

3. **Environment Setup (Optional)**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=3001
   GITHUB_TOKEN=your_github_personal_access_token # Increases GitHub API rate limits
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   ```

4. **Run Development Mode**:
   From the root folder, launch both frontend and backend concurrently:
   ```bash
   npm run dev
   ```
   * **Frontend**: `http://localhost:5173`
   * **Backend API**: `http://localhost:3001`

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).
