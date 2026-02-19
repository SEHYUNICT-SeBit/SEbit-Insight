# SEbit Insight v1.0

> **세현ICT 전사 프로젝트 수주 관리 및 매출 대시보드 시스템**
>
> 사업부의 프로젝트 수주 현황, 부서별 매출/영업이익, PM·영업 성과, 인력 투입률을 하나의 대시보드에서 실시간으로 조회·분석할 수 있는 사내 서비스입니다.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                       │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌──────────────────────┐      ┌──────────────────────────────┐
│   Cloudflare Pages   │      │     Cloudflare Workers       │
│   (Frontend)         │      │     (Backend API)            │
│                      │      │                              │
│  Next.js 15          │ ───▶ │  Hono Framework              │
│  Tailwind CSS        │ API  │  RESTful Endpoints           │
│  shadcn/ui           │      │  OAuth 2.0 + OIDC            │
│  React Query         │      │  Role-based Access Control   │
└──────────────────────┘      └──────────────┬───────────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                 ┌──────────────────┐         ┌──────────────────┐
                 │  Cloudflare D1   │         │  네이버 웍스 API  │
                 │  (SQLite)        │         │  (HR Sync)       │
                 │                  │         │                  │
                 │  12 Tables       │         │  OAuth 로그인     │
                 │  프로젝트/정산/인사 │         │  구성원 자동 동기화 │
                 └──────────────────┘         └──────────────────┘
```

## Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend** | Next.js 15 (App Router) | Static Export → Cloudflare Pages |
| **UI** | Tailwind CSS + shadcn/ui | 다크/라이트 모드, 반응형 레이아웃 |
| **State** | React Query (TanStack) | 서버 상태 관리, 캐싱, 자동 갱신 |
| **Backend** | Hono on Cloudflare Workers | Edge 기반 API, 초저지연 |
| **Database** | Cloudflare D1 (SQLite) | 서버리스 SQL, 자동 복제 |
| **Auth** | 네이버 웍스 OAuth 2.0 + OIDC | 사내 이메일 기반 SSO 로그인 |
| **HR Sync** | 네이버 웍스 Directory API | 구성원/부서 일일 자동 동기화 |
| **Infra** | Cloudflare (Pages + Workers + D1) | 완전 서버리스, Zero Cold Start |

## Features

### 대시보드 (5개 탭)

| 탭 | 설명 |
|----|------|
| **전사현황** | 전체 수주액, 매출, 영업이익, 부서별 비교, 월별 매출 추이 차트 |
| **부서성과** | 부서별 인원, 프로젝트 수, 가동률, 원가율, 1인당 매출 |
| **PM성과** | PM별 담당 프로젝트 수, 수주액, 매출, 영업이익률, 완료율 |
| **영업성과** | 영업대표별 수주 실적, SI/SM 비율, 매출 기여도 |
| **투입현황** | 전 직원 프로젝트 투입 상태 (미투입/부분/완전/초과), 부서별 필터 |

### 프로젝트 관리
- **4단계 위저드 등록**: 기본정보 → 계약정보 → 인력투입 → 확인
- **CSV/Excel 일괄 업로드**: 기존 인트라넷 데이터 마이그레이션 (Master 전용)
  - 4단계: 파일업로드 → 컬럼 자동매핑 → 검증 미리보기 → 등록 결과
  - 부서/직원/계약처 자동 매칭, 미등록 계약처 자동 생성
- **원가 분석 시뮬레이션**: 인건비, 외주비, 경비 시뮬레이션
- **상태 관리**: draft → active → settlement_pending → settled

### 정산 관리
- 월별 매출/영업이익 정산
- SI 프로젝트: 마일스톤별 매출 인식 (착수금, 중도금, 잔금)
- SM 프로젝트: 12개월 균등 배분

### 인사 관리
- 네이버 웍스 구성원 자동 동기화 (매일 09:00 KST)
- 부서별 인원 현황, 재직/휴직/병가/퇴직 상태

### UI/UX
- 다크/라이트 모드 (OS 기본값 존중, localStorage 저장)
- 사이드바 접기/펼치기 (localStorage 저장)
- 모바일 반응형 (Sheet 기반 모바일 메뉴)

### 권한 체계

| Role | 설명 | 주요 권한 |
|------|------|----------|
| **Master** | 시스템 관리자 | 전체 기능 + 권한 관리 + 일괄 업로드 |
| **Admin** | 부서 관리자 | 프로젝트 관리 + 인사정보 열람 |
| **Manager** | PM/영업 | 프로젝트 등록·수정 |
| **User** | 일반 사용자 | 대시보드 열람 |

## Organization

| 순서 | ID | 부서명 | 비고 |
|------|-----|--------|------|
| 1 | SE | SE 사업부 | |
| 2 | SM | SM 사업부 | |
| 3 | AI | AI 인프라 사업부 | |
| 4 | RND | R&D Lab | |
| 5 | CONTENT | 콘텐츠 사업부 | |
| - | MGMT | 경영기획그룹 | 매출 비발생, 대시보드 제외 |

## Directory Structure

```
SEbit Insight/
├── api/                          # Backend (Cloudflare Workers + Hono)
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth.ts           #   네이버 웍스 OAuth 로그인
│   │   │   ├── dashboard.ts      #   대시보드 요약
│   │   │   ├── performance.ts    #   성과 (부서/PM/영업/투입)
│   │   │   ├── projects.ts       #   프로젝트 CRUD + 일괄 업로드
│   │   │   └── settlements.ts    #   정산 관리
│   │   ├── services/             # Business logic
│   │   │   └── nw-sync.ts        #   네이버 웍스 동기화
│   │   ├── middleware/           # Auth, CORS, Role
│   │   └── db/                   # Schema, seed, helpers
│   ├── migrations/               # D1 migration files (0001~0008)
│   └── wrangler.toml             # Workers config
├── web/                          # Frontend (Next.js 15)
│   └── src/
│       ├── app/                  # Pages (App Router)
│       │   ├── page.tsx          #   대시보드 (5 tabs)
│       │   ├── projects/         #   프로젝트 목록/등록/상세/일괄업로드
│       │   ├── settlements/      #   정산 관리
│       │   ├── hr/               #   인사정보
│       │   ├── admin/            #   권한 관리
│       │   └── settings/         #   마스터 데이터
│       ├── components/           # UI components
│       │   ├── dashboard/        #   대시보드 탭 컴포넌트
│       │   ├── projects/         #   프로젝트 폼/테이블/일괄업로드
│       │   ├── layout/           #   Sidebar, Header, AppLayout
│       │   └── ui/               #   shadcn/ui 기본 컴포넌트
│       ├── hooks/                # React Query hooks
│       ├── services/             # API client services
│       ├── lib/                  # Utilities (csv-parser, column-mapper 등)
│       └── contexts/             # UserContext (인증 상태)
└── docs/                         # PDCA documents
```

## API Endpoints

### 인증
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/login` | 네이버 웍스 OAuth 로그인 리다이렉트 |
| GET | `/api/auth/callback` | OAuth 콜백 (토큰 발급) |
| POST | `/api/auth/logout` | 로그아웃 (세션 삭제) |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### 대시보드
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/summary` | 전사 요약 (수주/매출/이익/부서별) |
| GET | `/api/dashboard/performance` | 성과 (PM/영업/투입/부서) |
| GET | `/api/dashboard/performance/staffing` | 투입현황 상세 |

### 프로젝트
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | 프로젝트 목록 (필터/페이지네이션) |
| POST | `/api/projects` | 프로젝트 등록 |
| POST | `/api/projects/bulk` | CSV/Excel 일괄 등록 (최대 100건) |
| GET | `/api/projects/:id` | 프로젝트 상세 |
| PUT | `/api/projects/:id` | 프로젝트 수정 |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |

### 정산 / 마스터 데이터
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/settlements` | 정산 목록/등록 |
| GET | `/api/departments` | 부서 목록 |
| GET | `/api/employees` | 직원 목록 |
| GET | `/api/clients` | 거래처 목록 |
| GET | `/api/rate-cards` | 단가표 |
| POST | `/api/admin/sync-employees` | 네이버 웍스 동기화 (Master) |

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

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3100 |
| API | http://localhost:8800 |

### 네이버 웍스 연동

`api/.dev.vars` 파일에 크레덴셜 설정:

```env
NW_CLIENT_ID=your_client_id
NW_CLIENT_SECRET=your_client_secret
NW_REDIRECT_URI=http://localhost:8800/api/auth/callback
NW_SERVICE_ACCOUNT_ID=your_service_account_id
NW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

> `NW_SERVICE_ACCOUNT_ID`가 비어있으면 샘플 데이터로 Dev 모드 동작

## Deployment

### Frontend (Cloudflare Pages)

git push 시 자동 배포됩니다.

**필수 환경변수** (Cloudflare Pages > Settings > Environment variables):

| Key | Value | 비고 |
|-----|-------|------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.workers.dev` | 미설정 시 localhost로 빌드됨 |

### Backend (Cloudflare Workers)

```bash
cd api

# Secrets 설정
echo "your_value" | npx wrangler secret put NW_CLIENT_ID
echo "your_value" | npx wrangler secret put NW_CLIENT_SECRET
echo "your_value" | npx wrangler secret put NW_REDIRECT_URI

# 배포
npx wrangler deploy
```

> **주의**: 시크릿 변경 후 반드시 `wrangler deploy`로 재배포해야 반영됩니다.

## Database Schema

```
departments ──┐
              ├── employees ──┐
clients ──────┤               ├── project_staffing
              ├── projects ───┤
rate_cards    │               ├── project_expenses
              │               ├── project_departments
              │               └── settlements
              │
              ├── sessions
              └── permission_requests
```

**12 Tables**: departments, employees, clients, projects, rate_cards, project_staffing, project_expenses, settlements, project_departments, sync_meta, sessions, permission_requests

---

Built with Cloudflare (Pages + Workers + D1) — fully serverless, zero cold start.
