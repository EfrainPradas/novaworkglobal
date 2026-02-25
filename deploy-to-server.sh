#!/bin/bash
# CareerTipsAI Deployment Script
# This script deploys CareerTipsAI to the same server as OwnerIQ

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CareerTipsAI Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if frontend build exists
if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}Error: Frontend build not found!${NC}"
    echo "Please run: cd frontend && npx vite build"
    exit 1
fi

# Prompt for server details
echo -e "${YELLOW}Enter server details:${NC}"
read -p "Server IP or domain: " SERVER_HOST
read -p "SSH username: " SERVER_USER
read -p "SSH port (default 22): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-22}

echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  Server: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PORT}"
echo "  Frontend source: frontend/dist/ (71MB)"
echo "  Backend source: backend/"
echo ""
read -p "Continue with deployment? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Testing SSH connection...${NC}"
ssh -p ${SERVER_PORT} -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_HOST} "echo 'SSH connection successful'" || {
    echo -e "${RED}Error: Cannot connect to server${NC}"
    exit 1
}

echo -e "${GREEN}Step 2: Creating directories on server...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
sudo mkdir -p /var/www/carreertips
sudo mkdir -p /home/${USER}/carreertips
sudo chown -R ${USER}:${USER} /home/${USER}/carreertips
sudo chown -R www-data:www-data /var/www/carreertips || sudo chown -R ${USER}:${USER} /var/www/carreertips
echo "Directories created successfully"
ENDSSH

echo -e "${GREEN}Step 3: Transferring frontend (71MB, may take a few minutes)...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT}" \
    frontend/dist/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/carreertips-frontend/

echo -e "${GREEN}Step 4: Transferring backend...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT}" \
    --exclude 'node_modules' \
    --exclude '.env*' \
    backend/ \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/carreertips-backend/

echo -e "${GREEN}Step 5: Transferring production .env...${NC}"
scp -P ${SERVER_PORT} .env.production \
    ${SERVER_USER}@${SERVER_HOST}:/tmp/carreertips.env

echo -e "${GREEN}Step 6: Moving files to final location on server...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
# Move frontend
echo "Moving frontend files..."
sudo rm -rf /var/www/carreertips/*
sudo mv /tmp/carreertips-frontend/* /var/www/carreertips/
sudo chown -R www-data:www-data /var/www/carreertips 2>/dev/null || sudo chown -R ${USER}:${USER} /var/www/carreertips

# Move backend
echo "Moving backend files..."
rm -rf /home/${USER}/carreertips/backend
mkdir -p /home/${USER}/carreertips/backend
mv /tmp/carreertips-backend/* /home/${USER}/carreertips/backend/
mv /tmp/carreertips.env /home/${USER}/carreertips/backend/.env

echo "Files moved successfully"
ENDSSH

echo -e "${GREEN}Step 7: Installing backend dependencies...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/${USER}/carreertips/backend
echo "Installing Node.js dependencies..."
npm install --production
echo "Dependencies installed"
ENDSSH

echo -e "${GREEN}Step 8: Configuring Nginx...${NC}"
echo "Creating Nginx configuration..."

# Create Nginx config locally
cat > /tmp/carreertips-nginx.conf << 'ENDNGINX'
    # CareerTipsAI - Subdirectory /carreertips/
    location /carreertips {
        alias /var/www/carreertips;
        index index.html;
        try_files $uri $uri/ /carreertips/index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Videos
        location ~* \.(mp4|webm|ogg)$ {
            expires 7d;
            add_header Cache-Control "public";
        }
    }

    # CareerTipsAI API proxy
    location /carreertips-api {
        rewrite ^/carreertips-api/(.*) /$1 break;
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
ENDNGINX

# Transfer and apply Nginx config
scp -P ${SERVER_PORT} /tmp/carreertips-nginx.conf ${SERVER_USER}@${SERVER_HOST}:/tmp/

ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
echo "Backing up Nginx config..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

echo "Adding CareerTipsAI configuration to Nginx..."
# Insert CareerTipsAI config before the OwnerIQ location / block
sudo sed -i '/location \/ {/r /tmp/carreertips-nginx.conf' /etc/nginx/sites-available/default

echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Nginx configured and reloaded successfully"
else
    echo "Error in Nginx configuration. Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    exit 1
fi
ENDSSH

echo -e "${GREEN}Step 9: Starting backend with PM2...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /home/${USER}/carreertips/backend

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
fi

# Stop existing process if any
pm2 stop carreertips-backend 2>/dev/null || true
pm2 delete carreertips-backend 2>/dev/null || true

# Start new process
echo "Starting CareerTipsAI backend..."
pm2 start server.js --name carreertips-backend --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup (if not already done)
pm2 startup | grep "sudo" | bash || echo "PM2 startup already configured"

echo "Backend started successfully"
ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Verification Steps:${NC}"
echo "1. Check PM2 status:"
echo "   ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} 'pm2 status'"
echo ""
echo "2. Check PM2 logs:"
echo "   ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} 'pm2 logs carreertips-backend'"
echo ""
echo "3. Test frontend (replace with your server domain):"
echo "   http://${SERVER_HOST}/carreertips/"
echo ""
echo "4. Test API:"
echo "   http://${SERVER_HOST}/carreertips-api/"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "   - PM2 logs: ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 logs'"
echo "   - Nginx logs: ssh ${SERVER_USER}@${SERVER_HOST} 'sudo tail -f /var/log/nginx/error.log'"
echo ""
echo -e "${GREEN}Deployment script completed successfully!${NC}"
