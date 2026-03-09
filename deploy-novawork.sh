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
echo -e "${GREEN}NovaWork Global Deployment${NC}"
echo -e "${GREEN}Target: ${APP_NAME} on ${SERVER_HOST}${NC}"
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

echo -e "${GREEN}Step 2: Preparing server directories...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
sudo mkdir -p /var/www/${APP_NAME}
sudo mkdir -p /home/\${USER}/${APP_NAME}
sudo chown -R \${USER}:\${USER} /home/\${USER}/${APP_NAME}
sudo chown -R www-data:www-data /var/www/${APP_NAME} 2>/dev/null || sudo chown -R \${USER}:\${USER} /var/www/${APP_NAME}
ENDSSH

echo -e "${GREEN}Step 3: Transferring Frontend...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT} ${SSH_OPTS}" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.mp4' \
    frontend/dist/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/${APP_NAME}-frontend/

echo -e "${GREEN}Step 4: Transferring Backend...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT} ${SSH_OPTS}" \
    --exclude 'node_modules' \
    --exclude 'node_modules' \
    --exclude '.env*' \
    --exclude '.git' \
    --exclude 'uploads' \
    --exclude 'logs' \
    --exclude 'tmp' \
    backend/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/${APP_NAME}-backend/

echo -e "${GREEN}Step 5: Transferring .env...${NC}"
# Use the root .env.production
scp -P ${SERVER_PORT} ${SSH_OPTS} .env.production ${SERVER_USER}@${SERVER_HOST}:/tmp/${APP_NAME}.env

echo -e "${GREEN}Step 6: Deploying Files...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
# Frontend
echo "Deploying frontend..."
sudo rm -rf /var/www/${APP_NAME}/*
sudo mv /tmp/${APP_NAME}-frontend/* /var/www/${APP_NAME}/
sudo chown -R www-data:www-data /var/www/${APP_NAME} 2>/dev/null || sudo chown -R \${USER}:\${USER} /var/www/${APP_NAME}
rm -rf /tmp/${APP_NAME}-frontend

# Backend
echo "Deploying backend..."
rm -rf /home/\${USER}/${APP_NAME}/backend
mkdir -p /home/\${USER}/${APP_NAME}/backend
mv /tmp/${APP_NAME}-backend/* /home/\${USER}/${APP_NAME}/backend/
mv /tmp/${APP_NAME}.env /home/\${USER}/${APP_NAME}/backend/.env
mkdir -p /home/\${USER}/${APP_NAME}/backend/uploads
rm -rf /tmp/${APP_NAME}-backend
ENDSSH

echo -e "${GREEN}Step 7: Installing Backend Dependencies...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
cd /home/\${USER}/${APP_NAME}/backend
npm install --production
ENDSSH

echo -e "${GREEN}Step 8: Updating Nginx Configuration...${NC}"
# Create Nginx config locally
# USING ROOT INSTEAD OF ALIAS to fix try_files issue with subdirectories
cat > /tmp/${APP_NAME}-nginx.conf << 'ENDNGINX'
    # NovaWork Global
    location /${APP_NAME} {
        root /var/www;
        index index.html;
        try_files \$uri \$uri/ /${APP_NAME}/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /${API_NAME} {
        rewrite ^/${API_NAME}/(.*) /\$1 break;
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
ENDNGINX

scp -P ${SERVER_PORT} ${SSH_OPTS} /tmp/${APP_NAME}-nginx.conf ${SERVER_USER}@${SERVER_HOST}:/tmp/

ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
echo "Applying Nginx config..."

# Backup
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.\$(date +%Y%m%d_%H%M%S)

# We use sed to insert if not present, but since we are changing implementation (alias -> root)
# we should try to replace the existing block if it exists.
# Limitation: sed replacement of multi-line blocks is hard.
# Strategy: We will append the new config. If the old one exists, it might conflict or take precedence depending on order.
# However, usually 'location /foo' matches the most specific. If we have duplicate 'location /novaworkglobal', nginx might complain or use first.

# Check if we already have a configuration for this app
if grep -q "location /${APP_NAME}" /etc/nginx/sites-available/default; then
    echo "Configuration for /${APP_NAME} found. Attempting to remove old block before appending new one..."
    # Warning: simple removal might be risky.
    # Let's just notify user to check manually if it fails, OR we can try to reload.
    # Actually, let's try to reload and see.
    # A cleaner way is to use a separate file in sites-enabled if possible, but we are hacking default.
fi

# Append the new configuration
sudo sed -i '/location \/ {/r /tmp/${APP_NAME}-nginx.conf' /etc/nginx/sites-available/default

echo "Testing Nginx configuration..."
sudo nginx -t

if [ \$? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully."
else
    echo "Nginx configuration failed. Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.\$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    exit 1
fi
ENDSSH

echo -e "${GREEN}Step 9: Starting Backend with PM2...${NC}"
ssh -p ${SERVER_PORT} ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} << ENDSSH
cd /home/\${USER}/${APP_NAME}/backend
pm2 stop ${APP_NAME}-backend 2>/dev/null || true
pm2 delete ${APP_NAME}-backend 2>/dev/null || true
pm2 start server.js --name ${APP_NAME}-backend --env production --update-env
pm2 save
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${YELLOW}URL: https://${SERVER_HOST}.nip.io/${APP_NAME}/${NC}"
echo -e "${YELLOW}API: https://${SERVER_HOST}.nip.io/${API_NAME}/${NC}"
