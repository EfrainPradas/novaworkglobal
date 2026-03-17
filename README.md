# NovaWork Global

NovaWork Global is an AI-powered Career Management Platform designed to streamline candidate preparation through automated resumes, coaching, ATS keyword optimization, and data-driven profiles.

## Core Features
1. **Resume Builder:** A guided progression flow (Work Experience -> Accomplishment Bank -> Profile Generator) that allows users to seamlessly assemble and format professional resumes tailored to ATS standards.
2. **Coach Administration:** An internal module to track scheduled sessions, coach feedback, and analytics metrics for users engaging with the platform's professional coaching features.
3. **AI Video & Generation:** Leverages advanced parsing and language generation capabilities with integrated Video prompts for user onboarding.

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Supported OS: Windows (via WSL) or macOS.

### Running with PM2 and Vite
To start both the API backend and the React frontend simultaneously:
```bash
# In the active/ folder:
./start_dev.sh
```

Alternatively, you can run them manually:
```bash
# Terminal 1: Frontend
cd frontend
npm install
npm run dev

# Terminal 2: Backend
cd backend
npm install
npm run dev
```

## Contributing
We enforce a structured GitFlow. See `ARCHITECTURE.md` for technical deep-dives and `.github/PULL_REQUEST_TEMPLATE.md` to format your submissions.

1. Create a `feature/[name]` branch from `main`.
2. Ensure you have the `.env` variables loaded based on `docs/ENV_SETUP.md`.
3. Submit a Pull Request targeting `main`. Do not push directly to `main`.
