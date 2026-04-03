# NovaWork Global - Project Rules

## Project Paths
- **Main repo:** `C:\Ubuntu\home\efraiprada\novaworkglobal\active`
- **Frontend:** `frontend/` (React + Vite + Tailwind)
- **Backend:** `backend/` (Node.js + Express)

## Running the App
- Frontend MUST run on **port 5173**. Before starting, kill any process using that port.
- Backend runs on its default port (check `backend/server.js`).
- To start frontend: `cd frontend && npm run dev`
- To start backend: `cd backend && npm run dev`
- When running in a worktree, always copy `.env` files from the main repo first.

## Permissions - Allowed Actions
- Kill processes on any port (`npx kill-port`, `lsof`, `netstat`, `taskkill`)
- Run `npm install`, `npm run dev`, `npm run build` in frontend and backend
- Run `ls`, `cat`, `cp`, `mv` and general file operations
- Run `git` commands (add, commit, status, diff, log, branch, checkout)
- Push to GitHub using Windows cmd.exe (NOT wsl git push — it hangs on credentials):
  ```
  cmd.exe /c "cd /d C:\Ubuntu\home\efraiprada\novaworkglobal\active && git push origin <branch>"
  ```
- Run batch/shell scripts in the project directory
- Run TypeScript compilation (`npx tsc`)
- Run Python scripts for tooling

## GitHub Workflow
- Use conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, etc.)
- Always push via `cmd.exe` to avoid WSL credential hangs (see `.agent/workflows/github.md`)

## Tech Stack
- Frontend: React, TypeScript, Tailwind CSS, Vite
- Backend: Node.js, Express, Supabase (PostgreSQL)
- AI: OpenAI API
- Auth: Supabase Auth
