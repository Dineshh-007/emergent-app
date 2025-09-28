# 🚀 Deployment Guide - Image Distortion Corrector

*Developed by: Dinesh, Iniyan, Sudharshan, Arjun, Boophesh*

---

## 📋 Quick Start Options

### Option 1: Docker Deployment (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-username/image-distortion-corrector.git
cd image-distortion-corrector

# Deploy with Docker
./deploy.sh docker
```

### Option 2: Development Setup
```bash
# Setup development environment
./deploy.sh dev

# Start development servers
./run-dev.sh
```

### Option 3: Manual Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend (new terminal)
cd frontend
yarn install
yarn start
```

---

## 🐳 Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 2GB free disk space

### Deployment Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/image-distortion-corrector.git
   cd image-distortion-corrector
   ```

2. **Configure Environment**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit configuration (optional)
   nano backend/.env
   nano frontend/.env
   ```

3. **Deploy Services**
   ```bash
   # Build and start all services
   docker-compose up --build -d
   
   # Or use deployment script
   chmod +x deploy.sh
   ./deploy.sh docker
   ```

4. **Verify Deployment**
   ```bash
   # Check service status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   
   # Test endpoints
   curl http://localhost:8001/api/health
   curl http://localhost:3000/health
   ```

### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **MongoDB**: mongodb://localhost:27017

---

## 💻 Development Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 5.0+
- Git

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URL

# Start development server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install  # or npm install

# Setup environment
cp .env.example .env
# Edit .env with backend URL

# Start development server
yarn start  # or npm start
```

### MongoDB Setup
```bash
# Local MongoDB
mongod --dbpath /path/to/data/db

# Or use Docker
docker run -d -p 27017:27017 --name mongo mongo:5.0

# Or MongoDB Atlas (cloud)
# Update MONGO_URL in backend/.env
```

---

## ☁️ Cloud Deployment

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
# REACT_APP_BACKEND_URL=https://your-api-domain.com
```

### Railway (Backend)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set environment variables
railway variables set MONGO_URL=mongodb://...
```

### Heroku (Full Stack)
```bash
# Install Heroku CLI
# Create Heroku apps
heroku create your-app-backend
heroku create your-app-frontend

# Deploy backend
cd backend
heroku git:remote -a your-app-backend
git push heroku main

# Deploy frontend
cd frontend
heroku git:remote -a your-app-frontend
heroku buildpacks:set mars/create-react-app
git push heroku main
```

### AWS/Google Cloud
```bash
# Use Docker images with cloud services
# Build images
docker build -t image-corrector-backend ./backend
docker build -t image-corrector-frontend ./frontend

# Push to container registry
# Deploy to ECS, Cloud Run, etc.
```

---

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=image_corrector

# Server
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=production

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png

# Image Processing
MAX_IMAGE_WIDTH=4000
MAX_IMAGE_HEIGHT=4000
JPEG_QUALITY=95

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Frontend Environment Variables
```env
# API Configuration
REACT_APP_BACKEND_URL=http://localhost:8001

# App Settings
REACT_APP_NAME=Image Distortion Corrector
REACT_APP_VERSION=1.0.0

# Upload Settings
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FORMATS=image/jpeg,image/png
```

---

## 🔍 Monitoring & Logging

### Docker Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View logs with timestamps
docker-compose logs -f -t
```

### Health Checks
```bash
# Backend health
curl http://localhost:8001/api/health

# Frontend health  
curl http://localhost:3000/health

# MongoDB connection
mongosh --eval "db.adminCommand('ping')"
```

### Performance Monitoring
```bash
# System resources
docker stats

# Service status
docker-compose ps

# Disk usage
df -h
du -sh data/
```

---

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Check virtual environment
which python
which pip

# Reinstall dependencies
pip install -r requirements.txt

# Check MongoDB connection
mongosh $MONGO_URL
```

#### Frontend Build Fails
```bash
# Clear cache
yarn cache clean
rm -rf node_modules
yarn install

# Check Node version
node --version
npm --version

# Build with verbose output
yarn build --verbose
```

#### OpenCV Issues
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install libglib2.0-0 libsm6 libxext6 libxrender-dev

# Reinstall OpenCV
pip uninstall opencv-python
pip install opencv-python

# Test OpenCV installation
python -c "import cv2; print(cv2.__version__)"
```

#### MongoDB Connection
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection
mongosh --eval "db.runCommand({ping: 1})"

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -f
docker-compose up --build

# Check Docker resources
docker system df
docker stats

# View container logs
docker logs <container_name>
```

---

## 📊 Performance Optimization

### Backend Optimization
- Use Redis for caching processed images
- Implement image compression
- Add request rate limiting
- Use CDN for static assets
- Enable database connection pooling

### Frontend Optimization
- Enable gzip compression
- Use lazy loading for images
- Implement service worker caching
- Optimize bundle size
- Use image CDN

### Infrastructure Optimization
- Use load balancers for high traffic
- Implement horizontal scaling
- Set up monitoring and alerts
- Use container orchestration (Kubernetes)
- Implement backup strategies

---

## 🔐 Security Considerations

### Production Security
- Use HTTPS for all endpoints
- Implement proper CORS policies
- Add rate limiting and DDoS protection
- Use environment variables for secrets
- Regular security updates
- Input validation and sanitization
- File upload restrictions
- Database access controls

### Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000";
```

---

## 📞 Support

For deployment issues or questions:

1. **Check the logs** first using the commands above
2. **Review the troubleshooting** section
3. **Create an issue** on GitHub with:
   - Error messages
   - System information
   - Steps to reproduce
   - Logs (sanitized)

---

*Deployment guide by the Image Distortion Corrector Team*