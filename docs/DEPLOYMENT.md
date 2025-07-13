# 🚀 Deployment Guide

## Overview

This guide covers deploying the Order Matching System to various environments, from local development to production.

## Prerequisites

- Node.js v24.4.0+
- npm v11.4.2+
- Git
- Docker (optional)
- SSL certificates (production)

## Local Development Deployment

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd Order-Matching-S

# Install dependencies
npm run install-all

# Setup database
npm run setup-db

# Start development servers
.\start.bat  # Windows
./start.sh   # Linux/Mac
```

### Manual Start
```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Mobile (optional)
cd mobile && npm start
```

## Docker Deployment

### Single Container
```bash
# Build image
docker build -t order-matching-system .

# Run container
docker run -p 5000:5000 -p 3000:3000 order-matching-system
```

### Multi-Container (Docker Compose)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

## Production Deployment

### Environment Setup

**Production Environment Variables** (`.env.production`):
```env
NODE_ENV=production
PORT=5000
DB_PATH=/var/lib/orders/orders.db
LOG_LEVEL=error
FRONTEND_URL=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
```

### SSL/TLS Configuration

**Generate SSL Certificate**:
```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d yourdomain.com

# Or self-signed for testing
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**HTTPS Server Configuration**:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

https.createServer(options, app).listen(443);
```

### Nginx Configuration

**Nginx Config** (`nginx.conf`):
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server localhost:5000;
    }

    upstream frontend {
        server localhost:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/ssl/certs/yourdomain.crt;
        ssl_certificate_key /etc/ssl/private/yourdomain.key;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Process Management (PM2)

**Install PM2**:
```bash
npm install -g pm2
```

**PM2 Configuration** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'order-matching-backend',
    script: 'backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10
  }]
};
```

**PM2 Commands**:
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart order-matching-backend

# Stop application
pm2 stop order-matching-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

## Cloud Deployment

### AWS Deployment

**EC2 Setup**:
```bash
# Update system
sudo yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <repository-url>
cd Order-Matching-S

# Install dependencies
npm run install-all

# Setup database
npm run setup-db

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

**Security Group Configuration**:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 5000 (API - optional)

### Heroku Deployment

**Heroku Configuration** (`Procfile`):
```
web: node backend/server.js
```

**Heroku Commands**:
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=5000

# Deploy
git push heroku main

# Open app
heroku open
```

### DigitalOcean Deployment

**Droplet Setup**:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Deploy application
git clone <repository-url>
cd Order-Matching-S
npm run install-all
npm run setup-db
pm2 start ecosystem.config.js --env production
```

## Database Deployment

### SQLite (Development)
```bash
# Database is automatically created
npm run setup-db
```

### PostgreSQL (Production)

**Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql postgresql-server
```

**Database Setup**:
```sql
-- Create database
CREATE DATABASE order_matching;

-- Create user
CREATE USER order_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE order_matching TO order_user;
```

**Update Configuration**:
```javascript
// database/connection.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

## Monitoring & Logging

### Application Monitoring

**Health Check Endpoint**:
```bash
curl https://yourdomain.com/health
```

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "used": "50MB",
    "total": "512MB"
  }
}
```

### Log Management

**Log Rotation**:
```bash
# Install logrotate
sudo apt-get install logrotate

# Configure log rotation
sudo nano /etc/logrotate.d/order-matching
```

**Logrotate Configuration**:
```
/path/to/Order-Matching-S/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Performance Monitoring

**PM2 Monitoring**:
```bash
# Real-time monitoring
pm2 monit

# Performance metrics
pm2 show order-matching-backend
```

**System Monitoring**:
```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tulpn
```

## Backup & Recovery

### Database Backup

**SQLite Backup**:
```bash
# Create backup
cp data/orders.db data/orders-backup-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/orders"
DATE=$(date +%Y%m%d_%H%M%S)
cp data/orders.db "$BACKUP_DIR/orders-$DATE.db"
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete
```

**PostgreSQL Backup**:
```bash
# Create backup
pg_dump order_matching > backup-$(date +%Y%m%d).sql

# Restore backup
psql order_matching < backup-20240101.sql
```

### Application Backup

**Full Application Backup**:
```bash
#!/bin/bash
BACKUP_DIR="/backups/applications"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/order-matching-$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=data \
    /path/to/Order-Matching-S
```

## Security Hardening

### Firewall Configuration

**UFW (Ubuntu)**:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

**iptables (CentOS)**:
```bash
# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Drop all other traffic
iptables -A INPUT -j DROP

# Save rules
service iptables save
```

### SSL/TLS Hardening

**Strong SSL Configuration**:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Find process
sudo netstat -tulpn | grep :5000

# Kill process
sudo kill -9 <PID>
```

**Permission Denied**:
```bash
# Fix file permissions
sudo chown -R www-data:www-data /path/to/Order-Matching-S
sudo chmod -R 755 /path/to/Order-Matching-S
```

**Database Connection Issues**:
```bash
# Check database file
ls -la data/orders.db

# Reset database
rm data/orders.db
npm run setup-db
```

**PM2 Issues**:
```bash
# Reset PM2
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save
```

### Performance Issues

**High Memory Usage**:
```bash
# Increase Node.js heap size
node --max-old-space-size=4096 backend/server.js

# Monitor memory
pm2 monit
```

**Slow Response Times**:
```bash
# Check database performance
sqlite3 data/orders.db "PRAGMA query_only = 0;"

# Monitor network
iftop
```

## Rollback Procedures

### Application Rollback

**Git Rollback**:
```bash
# Check previous commits
git log --oneline

# Rollback to previous version
git reset --hard <commit-hash>

# Restart application
pm2 restart order-matching-backend
```

**Docker Rollback**:
```bash
# List images
docker images

# Rollback to previous image
docker run -p 5000:5000 order-matching-system:previous-version
```

### Database Rollback

**SQLite Rollback**:
```bash
# Restore from backup
cp data/orders-backup-20240101.db data/orders.db

# Restart application
pm2 restart order-matching-backend
```

---

**Deployment Complete! 🎉** 