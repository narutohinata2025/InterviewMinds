<div align="center">
  <h1>InterviewMinds</h1>
  <p><b>AI-Powered Mock Interview Platform with Voice, Coding & Analytics</b></p>
  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/>
    <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white"/>
    <img alt="Gemini" src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
  </p>
</div>

## Overview

InterviewMinds is a full-stack AI mock interview platform that simulates real technical interviews. Upload your resume and a job description, and an AI interviewer asks personalized questions — including live coding challenges — then provides comprehensive performance analytics.

### Key Features

- **Resume + JD Parsing** — Upload your PDF resume and paste the job description. AI generates targeted interview questions
- **AI Avatar Interviewer** — Animated avatar with voice interaction using Web Speech API (free, browser built-in)
- **3 Interviewer Personas** — Alex (Strict Technical), Sarah (Supportive), James (System Architect)
- **Live Code Editor** — Monaco Editor with multi-language support and real-time execution via Piston API
- **Voice Interaction** — Speech-to-text (hold SPACE to talk) and text-to-speech responses
- **Post-Interview Analytics** — 5-dimensional scoring radar chart, strengths/improvements, detailed feedback
- **Difficulty Levels** — Easy, Medium, Hard interview modes

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | Node.js, Express, TypeScript |
| **AI** | Google Gemini API |
| **Speech** | Web Speech API (browser built-in, free) |
| **Code Editor** | Monaco Editor |
| **Code Execution** | Piston API |
| **Charts** | Recharts |
| **Monorepo** | TurboRepo, npm workspaces |

## Quick Start

### Prerequisites
- Node.js **v18+**
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
git clone https://github.com/theunstopabble/InterviewMinds.git
cd InterviewMinds
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### Environment Setup

**Backend** (`apps/api/.env`):
```env
PORT=8000
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

**Frontend** (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:8000/api
```

### Run Development

```bash
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## How It Works

1. **Upload Resume & JD** — Paste job description and upload your PDF resume
2. **Configure Interview** — Choose interviewer persona and difficulty level
3. **Interview** — AI asks resume-specific and JD-aligned questions via voice/text
4. **Code Challenges** — Switch to code editor when asked to solve coding problems
5. **Get Results** — End interview to receive detailed scoring with radar chart, strengths, improvements, and full transcript

## Project Structure

```
InterviewMinds/
├── apps/
│   ├── api/                 # Backend (Express + Gemini)
│   │   └── src/
│   │       ├── routes/      # chat, compiler, interview, resume
│   │       └── index.ts     # Server entry
│   └── web/                 # Frontend (React + Vite)
│       └── src/
│           ├── components/  # AIAvatar, CodeEditor, UI
│           ├── hooks/       # useSpeech
│           ├── pages/       # Setup, Interview, Feedback
│           └── lib/         # API client, constants
├── packages/
│   └── shared/              # Shared types
├── turbo.json
└── package.json
```

## License

MIT License. See [LICENSE](LICENSE) for details.
