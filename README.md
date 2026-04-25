# AI Interview Pro

Production-grade AI Interview Platform with a Live2D avatar interviewer, continuous voice activity detection, live code editor, and comprehensive post-interview analytics.

## Features

- **Live2D AI Avatar (Haru)** — Animated interviewer with real-time lip-sync, eye blink, and motion animations using Cubism SDK. Displayed as upper-half only with glow effects.
- **Continuous Voice Activity Detection** — No press-to-speak button. The system listens continuously via Web Audio API, detects speech through RMS volume analysis, and auto-submits your answer after 1.5s of silence.
- **AI-Powered Interview** — Groq (Llama 3.3-70b) generates personalized questions based on your resume and job description. 5 interviewer personas: Strict, Friendly, Panel, Behavioral, Technical.
- **Live Code Editor** — Monaco Editor with syntax highlighting and real-time execution via Piston API. Supports JavaScript, Python, TypeScript, Java, C++.
- **Proctoring** — Tab-switch detection with warning counter, webcam monitoring with live feed, recording indicator.
- **Post-Interview Analytics** — Gemini AI scores across 5 dimensions (Content, Communication, Behavior, Domain, Technical). Radar charts, strengths/improvements lists, detailed AI assessment, full transcript replay, and downloadable report.
- **Web Speech API** — Free browser-native STT (SpeechRecognition) and TTS (SpeechSynthesis). No external voice service required.

## Architecture

```
├── frontend/              # Vite + React + TypeScript
│   ├── public/live2d/     # Cubism SDK Core + Haru model assets
│   └── src/
│       ├── pages/         # Landing, Setup, InterviewRoom, Feedback
│       ├── components/    # Live2DAvatar, UserCamera, ChatPanel, CodeEditor, etc.
│       ├── hooks/         # useContinuousSpeech, useAvatarLipSync, useProctoring
│       └── services/      # API client (axios)
├── backend/               # Node.js + Express + TypeScript
│   ├── routes/            # /api/chat, /api/resume, /api/interview
│   └── services/          # Groq LLM, Gemini scoring
└── package.json           # Root scripts
```

## Quick Start

### Prerequisites
- Node.js 18+
- A modern browser (Chrome recommended for Web Speech API)

### Setup

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys:
# GEMINI_API_KEY=your_key
# GROQ_API_KEY=your_key

# Start development servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

### Build

```bash
npm run build
```

## Interview Flow

1. **Landing Page** — Upload your resume (PDF)
2. **Setup Page** — Choose interviewer persona, difficulty level, paste job description, check mic/camera permissions
3. **Interview Room** — Speak naturally (no buttons), AI avatar responds with lip-sync, chat transcript builds in real-time
4. **Feedback Page** — View scores, radar chart, strengths, improvements, full transcript, download report

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/resume/upload` | POST | Upload PDF resume, returns `resumeId` |
| `/api/resume/:id` | GET | Get parsed resume text |
| `/api/chat/init` | POST | Initialize interview session |
| `/api/chat` | POST | Send message, get AI response |
| `/api/chat/history/:sessionId` | GET | Get chat history |
| `/api/interview/end` | POST | End interview, generate Gemini feedback |
| `/api/interview/:id` | GET | Get interview result |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, pixi.js + pixi-live2d-display, Monaco Editor, Recharts
- **Backend**: Express, TypeScript, Groq SDK, Gemini API
- **AI**: Groq Llama 3.3-70b (live chat), Google Gemini (post-interview scoring)
- **Voice**: Web Speech API (free, browser-native STT + TTS)
- **Avatar**: Live2D Cubism SDK with Haru model

## Production Scaling

The current implementation uses in-memory Maps for session storage, suitable for single-instance deployment (~500 concurrent users per instance).

For 100+ concurrent users at scale:
- Deploy multiple backend instances behind a load balancer
- Replace in-memory Maps with Redis for session persistence
- Add rate limiting per session
- Consider WebSocket for real-time communication instead of polling

## License

MIT
