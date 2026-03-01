#!/bin/bash
set -e

# Configuration
SERVER_HOST="3.145.4.238"
SERVER_USER="admin"
SERVER_PORT="22"
SSH_KEY="/home/efraiprada/.ssh/OwnerIQ.pem"
SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no"

APP_NAME="novaworkglobal"
API_NAME="novaworkglobal-api"
BACKEND_PORT="5002"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}NovaWork Global QUICK Deployment${NC}"
echo -e "${GREEN}Target: ${APP_NAME} on ${SERVER_HOST}${NC}"
echo -e "${YELLOW}Skipping heavy assets (videos, webp)${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for frontend build
if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}Error: Frontend build not found!${NC}"
    echo "Please run: cd frontend && npx vite build"
    exit 1
fi

echo -e "${GREEN}Step 1: Testing SSH connection...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} "echo 'SSH Connection Successful'" || {
    echo -e "${RED}Error: Cannot connect to server${NC}"
    exit 1
}

echo -e "${GREEN}Step 2: Transferring Frontend Code Only...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT} ${SSH_OPTS}" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'assets/videos' \
    --exclude '*.mp4' \
    --exclude '*.webm' \
    --exclude '*.webp' \
    frontend/dist/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/${APP_NAME}-frontend/

echo -e "${GREEN}Step 3: Transferring Backend...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT} ${SSH_OPTS}" \
    --exclude 'node_modules' \
    --exclude '.env*' \
    --exclude '.git' \
    --exclude 'uploads' \
    --exclude 'logs' \
    --exclude 'tmp' \
    backend/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/${APP_NAME}-backend/

echo -e "${GREEN}Step 4: Deploying Files (Update Only)...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
# Frontend - Update without wiping assets
echo "Updating frontend..."
sudo cp -r /tmp/${APP_NAME}-frontend/* /var/www/${APP_NAME}/
sudo chown -R www-data:www-data /var/www/${APP_NAME} 2>/dev/null || sudo chown -R \${USER}:\${USER} /var/www/${APP_NAME}
rm -rf /tmp/${APP_NAME}-frontend

# Backend
echo "Updating backend..."
# Backup
# cp -r /home/\${USER}/${APP_NAME}/backend /home/\${USER}/${APP_NAME}/backend_backup_\$(date +%s)
# Copy new files over old
cp -r /tmp/${APP_NAME}-backend/* /home/\${USER}/${APP_NAME}/backend/
mkdir -p /home/\${USER}/${APP_NAME}/backend/uploads
rm -rf /tmp/${APP_NAME}-backend
ENDSSH

echo -e "${GREEN}Step 5: Restarting Backend...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
cd /home/\${USER}/${APP_NAME}/backend
pm2 restart ${APP_NAME}-backend 2>/dev/null || pm2 start server.js --name ${APP_NAME}-backend --env production
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Quick Deployment Complete!${NC}"
echo -e "${YELLOW}URL: https://${SERVER_HOST}.nip.io/${APP_NAME}/${NC}"
