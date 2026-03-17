# Environment Setup Guide

To run NovaWork Global safely, environment properties should be isolated. 
**NEVER commit your raw `.env` or `.env.production` files.** Keep them physically secure.

## Local Frontend (`frontend/.env.local`)
The primary keys your Vite application requires are public endpoints and Supabase identifiers.

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5001/carreertips-api
VITE_USE_MOCK_DATA=false
```

## Local Backend (`backend/.env`)
The Node.js Express server requires sensitive secrets to interface with external APIs securely.

```bash
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:5173

# API Secrets
OPENAI_API_KEY=sk_...
ANTHROPIC_API_KEY=sk_ant_...

# Payments
STRIPE_SECRET_KEY=sk_test_...

# Supabase (Admin functions)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Production Properties
When running on the server (e.g., via `deploy-to-server.sh`), the script typically looks for `.env.production` in the root folder to push up remotely. Ensure `NODE_ENV=production` inside this file, and ensure the paths point to the final domain URL.
