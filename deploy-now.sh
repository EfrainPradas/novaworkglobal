#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_HOST="3.145.4.238"
SERVER_USER="admin"
SERVER_PORT="22"
SSH_KEY="/home/efraiprada/.ssh/OwnerIQ.pem"
SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CareerTipsAI Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}Error: Frontend build not found!${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Testing SSH connection...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} "echo 'SSH OK'" || {
    echo -e "${RED}Error: Cannot connect to server${NC}"
    exit 1
}

echo -e "${GREEN}Step 2: Creating directories on server...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
sudo mkdir -p /var/www/carreertips
sudo mkdir -p /home/${USER}/carreertips
sudo chown -R ${USER}:${USER} /home/${USER}/carreertips
sudo chown -R www-data:www-data /var/www/carreertips 2>/dev/null || sudo chown -R ${USER}:${USER} /var/www/carreertips
ENDSSH

echo -e "${GREEN}Step 3: Transferring frontend...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT} ${SSH_OPTS}" \
    frontend/dist/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/carreertips-frontend/

echo -e "${GREEN}Step 4: Transferring backend...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT} ${SSH_OPTS}" \
    --exclude 'node_modules' \
    --exclude '.env*' \
    backend/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/carreertips-backend/

echo -e "${GREEN}Step 5: Moving files to final location...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
# Frontend
sudo rm -rf /var/www/carreertips/*
sudo mv /tmp/carreertips-frontend/* /var/www/carreertips/
sudo chown -R www-data:www-data /var/www/carreertips 2>/dev/null || sudo chown -R ${USER}:${USER} /var/www/carreertips
sudo rm -rf /tmp/carreertips-frontend

# Backend
rm -rf /home/${USER}/carreertips/backend_new
mkdir -p /home/${USER}/carreertips/backend_new
mv /tmp/carreertips-backend/* /home/${USER}/carreertips/backend_new/
# Preserve current .env if it exists in the real backend folder
if [ -f "/home/${USER}/carreertips/backend/.env" ]; then
    cp /home/${USER}/carreertips/backend/.env /home/${USER}/carreertips/backend_new/
fi
# Swap folders
rm -rf /home/${USER}/carreertips/backend_old
[ -d "/home/${USER}/carreertips/backend" ] && mv /home/${USER}/carreertips/backend /home/${USER}/carreertips/backend_old
mv /home/${USER}/carreertips/backend_new /home/${USER}/carreertips/backend
rm -rf /tmp/carreertips-backend
ENDSSH

echo -e "${GREEN}Step 6: Installing backend dependencies & restarting...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/${USER}/carreertips/backend
npm install --production
pm2 restart carreertips-backend || pm2 start server.js --name carreertips-backend
sudo systemctl reload nginx
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}URL: https://3.145.4.238.nip.io/carreertips/dashboard${NC}"
echo -e "${YELLOW}Clear browser cache (Ctrl+Shift+R) to see changes${NC}"
