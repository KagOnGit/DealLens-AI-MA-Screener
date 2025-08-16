# DealLens AI M&A Screener

A comprehensive M&A deal screening platform with AI-powered analysis, featuring a Bloomberg Terminal-inspired interface.

## 🏗️ Architecture

This is a monorepo containing:

- **apps/web** - Next.js frontend with Bloomberg Terminal-style UI
- **apps/api** - FastAPI backend with ML/AI capabilities
- **apps/worker** - Background task processing with Celery
- **packages/db** - Shared database schema and utilities

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.17.0
- Python >= 3.11
- Docker & Docker Compose

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd DealLens-AI-MA-Screener
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start infrastructure**
   ```bash
   npm run docker:up
   ```

4. **Database setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## 📦 Services

- **Frontend (Next.js)**: http://localhost:3000
- **API (FastAPI)**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all applications
- `npm run lint` - Lint all code
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations

### Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # FastAPI backend
│   └── worker/       # Celery worker
├── packages/
│   └── db/           # Database schema & utilities
├── docker-compose.yml
└── turbo.json
```

## 🎨 Design System

The UI is inspired by Bloomberg Terminal with:
- Dark theme with financial data emphasis
- Real-time data displays
- Professional trading interface aesthetics
- Responsive design for desktop and tablet

## 📊 Features

- M&A Deal Screening & Analysis
- Company Financial Metrics
- Market Data Visualization
- AI-Powered Deal Recommendations
- Real-time Data Processing
- Advanced Filtering & Search

## 🔧 Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, Pydantic
- **Database**: PostgreSQL, Prisma, Alembic
- **Cache/Queue**: Redis, Celery
- **Infrastructure**: Docker, Turbo
- **AI/ML**: TensorFlow/PyTorch (planned)
DealLens – An AI-powered M&amp;A deal screener that automates investment banking workflows. Combines financial ratio screening, NLP on news &amp; filings, synergy detection, and backtesting to identify acquisition targets. Generates analyst-style memos via Next.js, FastAPI, PostgreSQL, and ML/NLP.
