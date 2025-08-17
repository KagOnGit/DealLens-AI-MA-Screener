# DealLens AI M&A Screener - Demo Script

This document provides step-by-step verification of the production-ready application.

## 🎯 Demo Overview

**Expected Demo Duration**: 15-20 minutes
**Prerequisites**: Docker, Node.js 18.20.4, Python 3.11
**Goal**: Demonstrate all production hardening features and integrations

---

## 🚀 Quick Start Demo

### 1. Environment Setup (2 minutes)

```bash
# Clone repository
git clone <repository-url>
cd deallens-ai-ma-screener

# Start infrastructure services
docker run -d --name demo-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
docker run -d --name demo-redis -p 6379:6379 redis:7

# Install dependencies
pnpm install
```

### 2. Configure Environment (1 minute)

```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env.local

# Quick configuration (for demo - replace with real keys for production)
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deallens" > apps/api/.env
echo "REDIS_URL=redis://localhost:6379" >> apps/api/.env
echo "JWT_SECRET=demo-jwt-secret-minimum-32-characters-long-12345" >> apps/api/.env
echo "ENVIRONMENT=development" >> apps/api/.env

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > apps/web/.env.local
```

### 3. Start Services (3 minutes)

**Terminal 1 - API Service:**
```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Expected: Server starts with JSON logs, environment validation passes*

**Terminal 2 - Worker Service:**
```bash
cd apps/worker  
pip install -r requirements.txt
celery -A celery_app.app worker -B --loglevel=info --concurrency=2
```
*Expected: Worker connects to Redis, beat scheduler shows periodic tasks*

**Terminal 3 - Web Application:**
```bash
pnpm --filter @deallens/web dev
```
*Expected: Next.js starts on port 3000, no build errors*

---

## 🧪 Production Feature Demonstrations

### 4. API Health & Monitoring (3 minutes)

**Health Endpoints:**
```bash
# Fast health check
curl http://localhost:8000/healthz
# Expected: {"status":"ok","timestamp":"2024-...","service":"deallens-api","version":"0.1.0"}

# Readiness check  
curl http://localhost:8000/readyz
# Expected: {"status":"ok","timestamp":"...","checks":{"database":"ok","redis":"ok"}}

# API documentation
open http://localhost:8000/docs
```

**Rate Limiting Demo:**
```bash
# Test rate limiting (should start failing after 100 requests/minute)
echo "Testing rate limiting..."
for i in {1..105}; do
  response=$(curl -s -w "%{http_code}" http://localhost:8000/healthz -o /dev/null)
  if [ "$response" = "429" ]; then
    echo "✅ Rate limiting activated at request $i"
    break
  fi
done
```

**Request Tracing:**
```bash
# Make request with custom request ID
curl -H "X-Request-ID: demo-trace-123" http://localhost:8000/healthz
```
*Expected: Same request ID in response headers and server logs*

### 5. Worker Task Monitoring (2 minutes)

```bash
cd apps/worker

# Check worker status
celery -A celery_app.app inspect ping
# Expected: {"worker-hostname": "pong"}

# View active tasks
celery -A celery_app.app inspect active

# View scheduled periodic tasks
celery -A celery_app.app inspect scheduled
```

**Monitor Worker Logs:**
*Look for structured JSON logs showing:*
- ✅ Task start/completion with duration
- ✅ Rate limiting enforcement  
- ✅ Cost tracking messages
- ✅ Idempotency cache operations

### 6. Frontend Integration (3 minutes)

**Open Web Application:**
```bash
open http://localhost:3000
```

**Visual Verification Checklist:**
- [ ] **Page loads** without console errors
- [ ] **API Status Badge** shows in header (green = connected, red = disconnected)
- [ ] **Terminal theme** renders correctly (dark background, green/yellow accents)
- [ ] **Navigation works** (Dashboard, Companies, Deals, Analytics, Alerts, Settings)
- [ ] **404 page** works with terminal styling (visit /nonexistent)

**API Integration Test:**
1. Open browser developer tools (F12)
2. Go to Network tab
3. Refresh page
4. Look for API health check requests every 30 seconds
5. Verify request headers include correlation IDs

### 7. Error Handling Demo (2 minutes)

**Stop API service** and observe:
```bash
# Stop API (Ctrl+C in Terminal 1)
```
- [ ] API Status Badge turns red within 30 seconds
- [ ] Frontend shows graceful "API Unreachable" message
- [ ] No JavaScript console errors

**Restart API service:**
- [ ] Badge turns green again
- [ ] No page refresh required

### 8. Security Features (2 minutes)

**JWT Validation:**
```bash
# Try accessing protected endpoint without token (if implemented)
curl http://localhost:8000/api/v1/protected
```

**CORS Testing:**
```bash
# Test CORS from browser console
fetch('http://localhost:8000/healthz', {
  method: 'GET',
  headers: {'Origin': 'http://localhost:3000'}
})
```

**Environment Security:**
```bash
# Verify environment validation
cd apps/api
JWT_SECRET=short uvicorn main:app --port 8001
```
*Expected: Should fail with "JWT_SECRET must be at least 32 characters long"*

---

## 🏭 Production Deployment Simulation

### 9. Build Verification (2 minutes)

**Frontend Production Build:**
```bash
cd apps/web
pnpm build
```
*Expected: Clean build with optimized bundle sizes shown*

**API Import Validation:**
```bash
cd apps/api
python -c "from main import app; print('✅ API imports successfully')"
```

**Worker Task Validation:**
```bash
cd apps/worker
python -c "from celery_app import app; print('✅ Worker configured with', len(app.conf.beat_schedule), 'scheduled tasks')"
```

---

## 📊 Observability Demo

### 10. Structured Logging (1 minute)

**View JSON Logs:**
All services output structured JSON logs. Example log entry:
```json
{
  "timestamp": "2024-08-17T10:32:58Z",
  "level": "INFO", 
  "logger": "uvicorn.access",
  "message": "GET /healthz 200",
  "request_id": "abc-123-def",
  "method": "GET",
  "path": "/healthz", 
  "status_code": 200,
  "duration_ms": 5.2
}
```

### 11. Optional Metrics (1 minute)

**Enable Prometheus metrics:**
```bash
cd apps/api
METRICS_ENABLED=true uvicorn main:app --port 8000
curl http://localhost:8000/metrics
```
*Expected: Prometheus format metrics output*

---

## ✅ Demo Success Criteria

**By the end of this demo, you should observe:**

### Infrastructure
- [x] All services start without errors
- [x] Database and Redis connections established  
- [x] Environment validation passes

### API Service
- [x] Health checks return 200 OK
- [x] Rate limiting enforces after 100 requests/minute
- [x] Request tracing works with correlation IDs
- [x] Structured JSON logging active
- [x] CORS configured for frontend domain

### Worker Service  
- [x] Celery worker connects to broker
- [x] Beat scheduler shows 7+ periodic tasks
- [x] Task execution logs show duration/status
- [x] Idempotency and cost controls active

### Frontend
- [x] Next.js builds and runs without errors
- [x] API health monitoring works
- [x] Terminal theme renders correctly
- [x] Navigation and routing functional
- [x] Error boundaries handle API failures gracefully

### Production Readiness
- [x] CI/CD workflows validate on GitHub
- [x] Environment example files comprehensive
- [x] Documentation provides clear setup steps
- [x] Security measures prevent common vulnerabilities

---

## 🎬 Demo Talking Points

1. **"This is production-ready"** - Point out health checks, monitoring, rate limiting
2. **"Fault tolerance built-in"** - Show API failure handling, worker retry logic
3. **"Cost-conscious"** - Highlight API cost tracking and caching
4. **"Developer friendly"** - Show structured logs, clear errors, good DX
5. **"Security-first"** - JWT validation, CORS, environment checks
6. **"Scalable architecture"** - Microservices, queue-based processing, stateless design

---

## 🔧 Troubleshooting

**If API won't start:**
- Check PostgreSQL is running on port 5432
- Verify Redis is running on port 6379  
- Ensure JWT_SECRET is 32+ characters

**If Worker won't start:**
- Verify Redis connection
- Check for missing Python dependencies
- Ensure all task modules can be imported

**If Frontend API badge shows disconnected:**
- Verify API is running on port 8000
- Check browser network tab for CORS errors
- Confirm NEXT_PUBLIC_API_URL is set correctly

**Common Docker issues:**
```bash
# Clean up demo containers
docker stop demo-postgres demo-redis
docker rm demo-postgres demo-redis
```

This demo showcases a production-ready application with enterprise-grade reliability, security, and observability features.
