# Architecture Outline

NovaWork Global is split into a decoupled frontend and backend.

## Frontend (`/frontend`)
*   **Framework:** React 18 + Vite.
*   **Styling:** Tailwind CSS with extensive use of Lucide-React for iconography.
*   **Routing:** React Router v6.
*   **Key Responsibilities:** Managing complex guided wizards (like the 4-step Resume Builder), handling user authentication state locally, and rendering PDF data dynamically on the client side using components like `@react-pdf/renderer`.

## Backend (`/backend`)
*   **Framework:** Node.js with Express.
*   **Key Responsibilities:** Validating incoming payloads, serving as a secure proxy to external AI services (OpenAI, Anthropic), handling intensive file manipulation (such as `.docx` generation from raw payload data), and processing authenticated API requests via JWT validation from Supabase.

## Database
*   **Provider:** Supabase (PostgreSQL).
*   **Key Responsibilities:** User Authentication (Auth schema), User Resumes, Work Experience, PAR Stories (Accomplishment Bank), and Coach Bookings.
*   **Security:** Row Level Security (RLS) is extensively used to isolate tenant data. Ensure migration scripts update the `.sql` policies properly.

## Deployment & CI/CD
*   **Production Deployment:** Managed via bash deployment scripts (`deploy-to-server.sh`, `deploy-now.sh`) onto a managed Linux (Debian) instance using Nginx for reverse proxying and PM2 for Node process management.
*   **Checks:** GitHub Actions run basic Node CI tests on PRs pushed against the `main` branch to ensure compilation.
