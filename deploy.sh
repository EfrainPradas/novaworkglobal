#!/bin/bash

# A simple script to automatically deploy/push changes to GitHub.
# Usage: ./deploy.sh "Your commit message here" (or just ./deploy.sh for default message)

echo "🚀 Iniciando proceso de subida a GitHub..."

# Get the commit message from arguments or use a default
COMMIT_MSG="${1:-update: cambios y mejoras generales}"

# Move to the project root directory (where the script is located)
cd "$(dirname "$0")"

# Show the current status briefly
echo "📊 Estado de los archivos:"
git status --short

# Add all changes
echo "📦 Agregando archivos..."
git add .

# Commit with the provided message
echo "📝 Creando commit: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

# Push to origin main
echo "☁️ Subiendo a GitHub (rama main)..."
git push origin main

echo "✅ ¡Listo! Cambios subidos correctamente."
