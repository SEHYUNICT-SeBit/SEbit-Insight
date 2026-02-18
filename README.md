# SEbit Insight v1.0

세현ICT 전사 프로젝트 수주 관리 및 매출 대시보드 시스템

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Cloudflare Workers, Hono |
| Database | Cloudflare D1 (SQLite) |
| Auth | Cloudflare Access |
| HR Sync | 네이버 웍스 API |

## Features

- **대시보드** - 전사현황, 부서성과, PM성과, 영업성과, 투입현황 5개 탭
- **프로젝트 관리** - CRUD, 4단계 위저드 등록, 원가분석 시뮬레이션
- **정산 관리** - 월별 매출/영업이익 정산
- **인사 관리** - 네이버 웍스 구성원 자동 동기화
- **설정** - 부서, 단가표, 거래처 관리

## Directory Structure

```
SEbit Insight/
├── api/                    # Backend (Cloudflare Workers + Hono)
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (nw-sync 등)
│   │   ├── middleware/     # Auth, CORS, Role
│   │   ├── db/             # Schema, seed, helpers
│   │   └── types/          # TypeScript types
│   ├── migrations/         # D1 migration files
│   └── wrangler.toml       # Workers config
├── web/                    # Frontend (Next.js 15)
│   └── src/
│       ├── app/            # Pages (App Router)
│       ├── components/     # UI components
│       ├── hooks/          # React Query hooks
│       ├── services/       # API client services
│       ├── lib/            # Utilities
│       └── types/          # TypeScript types
└── docs/                   # PDCA documents
```

## Getting Started

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# API dependencies
cd api && npm install

# Web dependencies
cd web && npm install
```

### Database Setup

```bash
cd api

# Create D1 database
wrangler d1 create sebit-insight

# Run migrations
wrangler d1 migrations apply sebit-insight --local

# Seed data
wrangler d1 execute sebit-insight --local --file=src/db/seed.sql
```

### Development

```bash
# Backend (port 8800)
cd api && wrangler dev --port 8800

# Frontend (port 3100)
cd web && npm run dev -- --port 3100
```

- Frontend: http://localhost:3100
- API: http://localhost:8800

### 네이버 웍스 연동

`api/.dev.vars` 파일에 크레덴셜 설정:

```
NW_CLIENT_ID=your_client_id
NW_CLIENT_SECRET=your_client_secret
NW_SERVICE_ACCOUNT_ID=your_service_account_id
NW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

> `NW_SERVICE_ACCOUNT_ID`가 비어있으면 샘플 데이터로 Dev 모드 동작

## Departments

| ID | Name |
|----|------|
| SE | SE 사업부 |
| SM | SM 사업부 |
| AI | AI 인프라 사업부 |
| CONTENT | 콘텐츠 사업부 |
| RND | R&D Lab |
| MGMT | 경영기획그룹 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard/summary | 대시보드 요약 |
| GET | /api/dashboard/performance | 성과 데이터 (PM, 영업, 투입, 부서) |
| GET | /api/dashboard/performance/staffing | 투입현황 상세 (부서필터, 잉여인력) |
| GET/POST | /api/projects | 프로젝트 목록/등록 |
| GET/PUT/DELETE | /api/projects/:id | 프로젝트 상세/수정/삭제 |
| GET/POST | /api/settlements | 정산 목록/등록 |
| GET/POST | /api/employees | 직원 목록/등록 |
| POST | /api/admin/sync-employees | 네이버 웍스 동기화 실행 |
| GET | /api/departments | 부서 목록 |
| GET | /api/rate-cards | 단가표 |
| GET | /api/clients | 거래처 목록 |

## Deployment

```bash
# API deploy to Cloudflare Workers
cd api && wrangler deploy

# Web deploy (Vercel / Cloudflare Pages)
cd web && npm run build
```

Production 환경변수는 Cloudflare Dashboard 또는 `wrangler secret put`으로 설정.
