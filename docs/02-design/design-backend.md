# SEbit Insight v1.0 - Backend Design

*Tech Stack: Cloudflare Workers + Hono + D1 (SQLite) + Cloudflare Access*
*Created: 2026-02-17*

---

## 1. API 엔드포인트 전체 목록

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | /api/departments | 부서 목록 | all |
| POST | /api/departments | 부서 등록 | admin |
| GET | /api/employees | 직원 목록 | all |
| POST | /api/employees | 직원 등록 | admin |
| GET | /api/clients | 계약처 목록 | all |
| POST | /api/clients | 계약처 등록 | manager, admin |
| GET | /api/projects | 프로젝트 목록 (필터/검색) | all |
| POST | /api/projects | 프로젝트 등록 | manager, admin |
| GET | /api/projects/:id | 프로젝트 상세 | all |
| PUT | /api/projects/:id | 프로젝트 전체 수정 | manager, admin |
| DELETE | /api/projects/:id | 프로젝트 삭제 | admin |
| PUT | /api/projects/:id/status | 상태 인라인 변경 | manager, admin |
| GET | /api/projects/drafts | 임시 저장 목록 | user(본인) |
| POST | /api/projects/drafts | 임시 저장 생성/갱신 | user |
| GET | /api/projects/:id/staffing | 투입 인력 목록 | all |
| POST | /api/projects/:id/staffing | 투입 인력 추가 | manager, admin |
| PUT | /api/projects/:id/staffing/:sid | 투입 인력 수정 | manager, admin |
| GET | /api/projects/:id/expenses | 경비 목록 | all |
| POST | /api/projects/:id/expenses | 경비 추가 | manager, admin |
| PUT | /api/projects/:id/expenses/:eid | 경비 수정 | manager, admin |
| GET | /api/projects/:id/cost-analysis | 원가 분석 조회 | all |
| POST | /api/projects/:id/cost-analysis | 원가 분석 저장 | manager, admin |
| PUT | /api/projects/:id/cost-analysis | 원가 분석 갱신 | manager, admin |
| GET | /api/settlements | 정산 목록 | all |
| POST | /api/settlements | 정산 등록 | manager, admin |
| PUT | /api/settlements/:id | 정산 수정/상태 변경 | manager, admin |
| GET | /api/dashboard/summary | 대시보드 요약 | all |
| GET | /api/rate-cards | 직급별 단가 기준표 | all |

---

## 2. 엔드포인트별 Request / Response 스키마

### 2.1 부서 (Departments)

**GET /api/departments**
```json
// Response 200
{
  "data": [
    { "id": "SE", "name": "SE 사업부", "created_at": "2026-01-01T00:00:00Z" }
  ]
}
```

**POST /api/departments**
```json
// Request Body
{ "id": "SE", "name": "SE 사업부" }

// Response 201
{ "id": "SE", "name": "SE 사업부", "created_at": "2026-02-17T00:00:00Z" }
```

---

### 2.2 직원 (Employees)

**GET /api/employees**
```
Query Params:
  department_id  TEXT    (optional) 부서 필터
  is_active      0|1     (optional, default: 1)
  search         TEXT    (optional) 이름 검색
```
```json
// Response 200
{
  "data": [
    {
      "id": "emp_001",
      "name": "홍길동",
      "email": "gildong@sebit.co.kr",
      "department_id": "SE",
      "department_name": "SE 사업부",
      "position": "과장",
      "role": "user",
      "is_active": 1
    }
  ]
}
```

**POST /api/employees**
```json
// Request Body
{
  "name": "홍길동",
  "email": "gildong@sebit.co.kr",
  "department_id": "SE",
  "position": "과장",
  "role": "user"
}

// Response 201
{ "id": "emp_001", ...same as above }
```

---

### 2.3 계약처 (Clients)

**GET /api/clients**
```
Query Params:
  search  TEXT  (optional) 회사명/담당자 검색
```
```json
// Response 200
{
  "data": [
    {
      "id": "cli_001",
      "name": "삼성전자",
      "business_no": "124-81-00998",
      "contact": "김담당",
      "phone": "02-1234-5678"
    }
  ]
}
```

**POST /api/clients**
```json
// Request Body
{
  "name": "삼성전자",
  "business_no": "124-81-00998",
  "contact": "김담당",
  "phone": "02-1234-5678"
}
// Response 201: 생성된 객체
```

---

### 2.4 프로젝트 (Projects)

**GET /api/projects**
```
Query Params:
  department_id  TEXT       부서 필터
  status         TEXT       상태 필터 (draft|active|settlement_pending|settled|on_hold|cancelled)
  type           TEXT       SI|SM
  start_from     DATE       시작일 범위 (YYYY-MM-DD)
  start_to       DATE
  search         TEXT       프로젝트명/코드 검색
  page           INT        (default: 1)
  limit          INT        (default: 20)
  is_draft       0|1        임시 저장 제외 여부 (default: 0 = 제외)
```
```json
// Response 200
{
  "data": [
    {
      "id": "proj_001",
      "project_code": "SE-2026-001",
      "name": "삼성 MES 고도화",
      "type": "SI",
      "status": "active",
      "department_id": "SE",
      "department_name": "SE 사업부",
      "client_id": "cli_001",
      "client_name": "삼성전자",
      "sales_rep_id": "emp_002",
      "sales_rep_name": "이영업",
      "pm_id": "emp_001",
      "pm_name": "홍길동",
      "contract_amount": 150000000,
      "start_date": "2026-01-01",
      "end_date": "2026-06-30",
      "is_draft": 0,
      "created_at": "2026-01-15T09:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

**POST /api/projects**
```json
// Request Body
{
  "name": "삼성 MES 고도화",
  "type": "SI",
  "department_id": "SE",
  "client_id": "cli_001",
  "sales_rep_id": "emp_002",
  "pm_id": "emp_001",
  "contract_amount": 150000000,
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "description": "MES 시스템 고도화 프로젝트",
  "is_draft": 0
}
// Response 201: 생성된 프로젝트 객체 (project_code 자동 생성)
```

**PUT /api/projects/:id/status** (인라인 상태 변경)
```json
// Request Body
{ "status": "settled" }

// Response 200
{ "id": "proj_001", "status": "settled", "updated_at": "2026-02-17T12:00:00Z" }
```

---

### 2.5 임시 저장 (Drafts)

**GET /api/projects/drafts**
```json
// Response 200 (본인이 생성한 draft 프로젝트만)
{
  "data": [
    {
      "id": "proj_draft_001",
      "name": "임시 프로젝트명",
      "draft_step": 2,
      "updated_at": "2026-02-17T11:30:00Z"
    }
  ]
}
```

**POST /api/projects/drafts**
```json
// Request Body (현재 단계 데이터 전체)
{
  "id": "proj_draft_001",   // 기존 draft 갱신 시 필요, 신규 시 omit
  "draft_step": 2,
  "name": "임시 프로젝트명",
  "type": "SI",
  "department_id": "SE"
  // ...단계별 수집된 필드들
}

// Response 200/201
{ "id": "proj_draft_001", "draft_step": 2, "updated_at": "..." }
```

---

### 2.6 투입 인력 (Staffing)

**GET /api/projects/:id/staffing**
```json
// Response 200
{
  "data": [
    {
      "id": "staff_001",
      "project_id": "proj_001",
      "employee_id": "emp_001",
      "employee_name": "홍길동",
      "position": "과장",
      "man_month": 3.5,
      "monthly_rate": 550,
      "total_cost": 19250000,
      "note": "설계 담당"
    }
  ],
  "summary": {
    "total_man_month": 8.0,
    "total_labor_cost": 44000000
  }
}
```

**POST /api/projects/:id/staffing**
```json
// Request Body
{
  "employee_id": "emp_001",
  "position": "과장",
  "man_month": 3.5,
  "monthly_rate": 550,
  "note": "설계 담당"
}
// Response 201: 생성된 staffing 객체 (total_cost는 DB computed column)
```

**PUT /api/projects/:id/staffing/:sid**
```json
// Request Body (변경 필드만)
{ "man_month": 4.0, "monthly_rate": 580 }
// Response 200: 수정된 staffing 객체
```

---

### 2.7 경비 (Expenses)

**GET /api/projects/:id/expenses**
```json
// Response 200
{
  "data": [
    {
      "id": "exp_001",
      "project_id": "proj_001",
      "category": "출장비",
      "amount": 500000,
      "description": "울산 현장 출장",
      "expense_date": "2026-02-10"
    }
  ],
  "summary": {
    "total_expense": 1500000,
    "by_category": {
      "출장비": 500000,
      "장비": 800000,
      "기타": 200000
    }
  }
}
```

**POST /api/projects/:id/expenses**
```json
// Request Body
{
  "category": "출장비",
  "amount": 500000,
  "description": "울산 현장 출장",
  "expense_date": "2026-02-10"
}
// Response 201: 생성된 expense 객체
```

---

### 2.8 원가 분석 (Cost Analysis)

**GET /api/projects/:id/cost-analysis**
```json
// Response 200
{
  "project_id": "proj_001",
  "project_name": "삼성 MES 고도화",
  "type": "SI",
  "contract_amount": 150000000,
  "total_labor_cost": 44000000,
  "total_expense": 1500000,
  "total_cost": 45500000,
  "operating_profit": 104500000,
  "profit_rate": 69.67,
  "staffing": [...],
  "expenses": [...]
}
```

**POST /api/projects/:id/cost-analysis** (원가 분석 결과 저장/갱신)
```json
// Request Body: staffing 및 expenses 일괄 upsert
{
  "staffing": [
    { "employee_id": "emp_001", "position": "과장", "man_month": 3.5, "monthly_rate": 550 }
  ],
  "expenses": [
    { "category": "출장비", "amount": 500000, "expense_date": "2026-02-10" }
  ]
}
// Response 200: cost-analysis GET 응답과 동일
```

---

### 2.9 정산 (Settlements)

**GET /api/settlements**
```
Query Params:
  project_id  TEXT  프로젝트 필터
  period      TEXT  월별 필터 (YYYY-MM)
  status      TEXT  pending|completed|on_hold
  page        INT
  limit       INT
```
```json
// Response 200
{
  "data": [
    {
      "id": "stl_001",
      "project_id": "proj_001",
      "project_name": "삼성 MES 고도화",
      "period": "2026-01",
      "revenue": 25000000,
      "total_labor": 7500000,
      "total_expense": 250000,
      "operating_profit": 17250000,
      "profit_rate": 69.0,
      "status": "pending",
      "note": "",
      "created_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

**POST /api/settlements**
```json
// Request Body
{
  "project_id": "proj_001",
  "period": "2026-01",
  "revenue": 25000000,
  "total_labor": 7500000,
  "total_expense": 250000,
  "status": "pending",
  "note": ""
}
// Response 201: 생성된 정산 객체 (operating_profit은 DB computed)
```

**PUT /api/settlements/:id**
```json
// Request Body (변경 필드만)
{ "status": "completed", "note": "1월 정산 완료" }
// Response 200: 수정된 정산 객체
```

---

### 2.10 대시보드 요약 (Dashboard)

**GET /api/dashboard/summary**
```
Query Params:
  year   INT   (default: 현재 연도)
  month  INT   (optional) 특정 월만
```
```json
// Response 200
{
  "total_contract_amount": 850000000,
  "total_revenue_ytd": 420000000,
  "total_operating_profit_ytd": 280000000,
  "avg_profit_rate": 66.7,
  "project_counts": {
    "total": 24,
    "active": 15,
    "settlement_pending": 4,
    "settled": 3,
    "on_hold": 1,
    "cancelled": 1
  },
  "by_department": [
    {
      "department_id": "SE",
      "department_name": "SE 사업부",
      "project_count": 8,
      "contract_amount": 320000000,
      "revenue_ytd": 180000000,
      "operating_profit_ytd": 120000000,
      "profit_rate": 66.7
    }
  ],
  "by_type": {
    "SI": { "count": 18, "contract_amount": 620000000 },
    "SM": { "count": 6, "contract_amount": 230000000 }
  },
  "recent_projects": [
    { "id": "proj_001", "name": "삼성 MES 고도화", "status": "active", "updated_at": "..." }
  ]
}
```

---

### 2.11 단가 기준표 (Rate Cards)

**GET /api/rate-cards**
```json
// Response 200
{
  "data": [
    { "id": "rc_001", "position": "사원", "monthly_rate": 350, "is_default": 1 },
    { "id": "rc_002", "position": "대리", "monthly_rate": 420, "is_default": 1 },
    { "id": "rc_003", "position": "과장", "monthly_rate": 550, "is_default": 1 },
    { "id": "rc_004", "position": "차장", "monthly_rate": 650, "is_default": 1 },
    { "id": "rc_005", "position": "부장", "monthly_rate": 750, "is_default": 1 },
    { "id": "rc_006", "position": "이사", "monthly_rate": 900, "is_default": 1 },
    { "id": "rc_007", "position": "대표", "monthly_rate": 1200, "is_default": 1 }
  ]
}
```

---

### 공통 에러 응답

```json
// 400 Bad Request
{ "error": "VALIDATION_ERROR", "message": "contract_amount must be a positive number" }

// 401 Unauthorized
{ "error": "UNAUTHORIZED", "message": "Missing or invalid JWT" }

// 403 Forbidden
{ "error": "FORBIDDEN", "message": "Insufficient role" }

// 404 Not Found
{ "error": "NOT_FOUND", "message": "Project not found" }

// 409 Conflict
{ "error": "CONFLICT", "message": "project_code already exists" }

// 500 Internal Server Error
{ "error": "INTERNAL_ERROR", "message": "Database error" }
```

---

## 3. D1 스키마 최종본

```sql
-- ============================================================
-- SEbit Insight v1.0 - D1 Schema (SQLite)
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ------------------------------------------------------------
-- 부서
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- 직원
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  department_id TEXT REFERENCES departments(id),
  position      TEXT NOT NULL,  -- 사원|대리|과장|차장|부장|이사|대표
  role          TEXT NOT NULL DEFAULT 'user',  -- admin|manager|user
  nw_user_id    TEXT,           -- Naver Works (v1.1)
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

-- ------------------------------------------------------------
-- 계약처 (고객사)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  business_no TEXT,
  contact     TEXT,
  phone       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- ------------------------------------------------------------
-- 직급별 단가 기준표
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_cards (
  id           TEXT PRIMARY KEY,
  position     TEXT NOT NULL UNIQUE,
  monthly_rate REAL NOT NULL,   -- 만원 단위
  is_default   INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- 프로젝트 (핵심 테이블)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  project_code    TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK(type IN ('SI', 'SM')),
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','active','settlement_pending','settled','on_hold','cancelled')),
  department_id   TEXT REFERENCES departments(id),
  client_id       TEXT REFERENCES clients(id),
  sales_rep_id    TEXT REFERENCES employees(id),
  pm_id           TEXT REFERENCES employees(id),
  contract_amount REAL NOT NULL DEFAULT 0,
  start_date      TEXT,
  end_date        TEXT,
  description     TEXT,
  is_draft        INTEGER NOT NULL DEFAULT 1,
  draft_step      INTEGER NOT NULL DEFAULT 1 CHECK(draft_step BETWEEN 1 AND 4),
  created_by      TEXT REFERENCES employees(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_department ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_pm ON projects(pm_id);
CREATE INDEX IF NOT EXISTS idx_projects_draft ON projects(is_draft, created_by);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

-- ------------------------------------------------------------
-- 투입 인력
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_staffing (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id  TEXT REFERENCES employees(id),
  position     TEXT NOT NULL,
  man_month    REAL NOT NULL CHECK(man_month > 0),
  monthly_rate REAL NOT NULL CHECK(monthly_rate > 0),  -- 만원 단위
  total_cost   REAL GENERATED ALWAYS AS (man_month * monthly_rate * 10000) STORED,
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staffing_project ON project_staffing(project_id);
CREATE INDEX IF NOT EXISTS idx_staffing_employee ON project_staffing(employee_id);

-- ------------------------------------------------------------
-- 경비
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_expenses (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category     TEXT NOT NULL CHECK(category IN ('출장비','장비','외주','기타')),
  amount       REAL NOT NULL CHECK(amount > 0),
  description  TEXT,
  expense_date TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON project_expenses(expense_date);

-- ------------------------------------------------------------
-- 매출 정산
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settlements (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id),
  period           TEXT NOT NULL,   -- 'YYYY-MM'
  revenue          REAL NOT NULL DEFAULT 0,
  total_labor      REAL NOT NULL DEFAULT 0,
  total_expense    REAL NOT NULL DEFAULT 0,
  operating_profit REAL GENERATED ALWAYS AS (revenue - total_labor - total_expense) STORED,
  profit_rate      REAL,            -- 클라이언트에서 계산 후 저장
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','completed','on_hold')),
  note             TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settlements_project_period ON settlements(project_id, period);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
```

### 3.1 시드 데이터

```sql
-- ============================================================
-- Seed Data
-- ============================================================

-- 부서 5개
INSERT OR IGNORE INTO departments (id, name) VALUES
  ('SE',      'SE 사업부'),
  ('SM',      'SM 사업부'),
  ('AI',      'AI 사업부'),
  ('CONTENT', '콘텐츠 사업부'),
  ('RND',     'R&D 연구소');

-- 직급별 기본 단가 (만원/월)
INSERT OR IGNORE INTO rate_cards (id, position, monthly_rate, is_default) VALUES
  ('rc_001', '사원', 350,  1),
  ('rc_002', '대리', 420,  1),
  ('rc_003', '과장', 550,  1),
  ('rc_004', '차장', 650,  1),
  ('rc_005', '부장', 750,  1),
  ('rc_006', '이사', 900,  1),
  ('rc_007', '대표', 1200, 1);

-- 테스트 계약처
INSERT OR IGNORE INTO clients (id, name, business_no, contact, phone) VALUES
  ('cli_test_001', '테스트 고객사 A', '000-00-00001', '김담당', '02-0000-0001'),
  ('cli_test_002', '테스트 고객사 B', '000-00-00002', '이담당', '02-0000-0002');
```

---

## 4. Workers 프로젝트 구조

```
api/
├── src/
│   ├── index.ts                  # Hono 앱 진입점, 라우터 마운트
│   ├── routes/
│   │   ├── departments.ts        # GET, POST /api/departments
│   │   ├── employees.ts          # GET, POST /api/employees
│   │   ├── clients.ts            # GET, POST /api/clients
│   │   ├── projects.ts           # CRUD + status + drafts
│   │   ├── staffing.ts           # GET, POST, PUT /api/projects/:id/staffing
│   │   ├── expenses.ts           # GET, POST, PUT /api/projects/:id/expenses
│   │   ├── cost-analysis.ts      # GET, POST, PUT /api/projects/:id/cost-analysis
│   │   ├── settlements.ts        # GET, POST, PUT /api/settlements
│   │   ├── dashboard.ts          # GET /api/dashboard/summary
│   │   └── rate-cards.ts         # GET /api/rate-cards
│   ├── middleware/
│   │   ├── auth.ts               # Cloudflare Access JWT 검증
│   │   ├── role.ts               # 역할 기반 접근 제어
│   │   └── cors.ts               # CORS 설정
│   ├── db/
│   │   ├── schema.sql            # D1 스키마 파일
│   │   ├── seed.sql              # 시드 데이터
│   │   └── helpers.ts            # 공통 쿼리 헬퍼 (nanoid, pagination 등)
│   └── types/
│       └── index.ts              # 공유 TypeScript 타입 정의
├── migrations/
│   └── 0001_initial.sql          # 초기 마이그레이션
├── wrangler.toml
└── package.json
```

### 4.1 index.ts (진입점)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import departmentsRoute from './routes/departments';
import employeesRoute from './routes/employees';
import clientsRoute from './routes/clients';
import projectsRoute from './routes/projects';
import staffingRoute from './routes/staffing';
import expensesRoute from './routes/expenses';
import costAnalysisRoute from './routes/cost-analysis';
import settlementsRoute from './routes/settlements';
import dashboardRoute from './routes/dashboard';
import rateCardsRoute from './routes/rate-cards';

export type Env = { DB: D1Database };

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: ['https://insight.sebit.co.kr'], credentials: true }));
app.use('/api/*', authMiddleware);

app.route('/api/departments',  departmentsRoute);
app.route('/api/employees',    employeesRoute);
app.route('/api/clients',      clientsRoute);
app.route('/api/projects',     projectsRoute);
app.route('/api/projects',     staffingRoute);
app.route('/api/projects',     expensesRoute);
app.route('/api/projects',     costAnalysisRoute);
app.route('/api/settlements',  settlementsRoute);
app.route('/api/dashboard',    dashboardRoute);
app.route('/api/rate-cards',   rateCardsRoute);

export default app;
```

### 4.2 wrangler.toml

```toml
name = "sebit-insight-api"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "sebit-insight"
database_id = "<D1_DATABASE_ID>"

[vars]
ENVIRONMENT = "production"
ACCESS_TEAM_DOMAIN = "sebit.cloudflareaccess.com"
```

### 4.3 package.json

```json
{
  "name": "sebit-insight-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":     "wrangler dev",
    "deploy":  "wrangler deploy",
    "db:migrate": "wrangler d1 migrations apply sebit-insight",
    "db:seed":    "wrangler d1 execute sebit-insight --file=src/db/seed.sql"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241106.0",
    "typescript": "^5.5.0",
    "wrangler": "^3.80.0"
  }
}
```

---

## 5. 인증/인가 설계

### 5.1 Cloudflare Access JWT 검증

Cloudflare Access는 보호된 경로에 접근 시 `CF_Authorization` 쿠키 또는 `Cf-Access-Jwt-Assertion` 헤더로 JWT를 전달한다.

```typescript
// middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import type { Env } from '../index';

const CERTS_URL = 'https://<TEAM_DOMAIN>/cdn-cgi/access/certs';

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const token =
    c.req.header('Cf-Access-Jwt-Assertion') ||
    getCookie(c, 'CF_Authorization');

  if (!token) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Missing JWT' }, 401);
  }

  try {
    const payload = await verifyAccessJWT(token, CERTS_URL);
    // payload.email로 employees 테이블에서 role 조회
    const employee = await c.env.DB
      .prepare('SELECT id, name, role FROM employees WHERE email = ? AND is_active = 1')
      .bind(payload.email)
      .first();

    if (!employee) {
      return c.json({ error: 'FORBIDDEN', message: 'User not registered' }, 403);
    }

    c.set('user', employee);
    await next();
  } catch {
    return c.json({ error: 'UNAUTHORIZED', message: 'Invalid JWT' }, 401);
  }
});
```

### 5.2 역할 기반 접근 제어 (RBAC)

| 역할 | 권한 |
|------|------|
| admin | 모든 CRUD + 직원/부서 관리 + 삭제 |
| manager | 프로젝트/정산/인력/경비 CRUD (삭제 제외) |
| user | 조회 전용 + 본인 임시 저장 |

```typescript
// middleware/role.ts
import { createMiddleware } from 'hono/factory';

export const requireRole = (...roles: string[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      return c.json({ error: 'FORBIDDEN', message: 'Insufficient role' }, 403);
    }
    await next();
  });

// 사용 예
projectsRoute.post('/', requireRole('manager', 'admin'), createProject);
projectsRoute.delete('/:id', requireRole('admin'), deleteProject);
```

### 5.3 인증 플로우

```
브라우저 → Cloudflare Access 로그인 (사내 이메일 OTP)
         → Access JWT 발급 (CF_Authorization 쿠키)
         → Workers API 요청 시 JWT 자동 포함
         → authMiddleware: JWT 서명 검증 → employees 테이블에서 role 조회
         → c.set('user', { id, name, role })
         → 이후 각 라우트에서 requireRole 미들웨어로 역할 확인
```

---

## 6. 영업이익 계산 로직

### 6.1 SI (System Integration) - 프로젝트성

```
영업이익 = 계약금액 - (투입인력 인건비 합계 + 경비 합계)
영업이익률(%) = 영업이익 / 계약금액 × 100

투입인력 인건비 합계 = Σ (man_month × monthly_rate × 10,000)
경비 합계 = Σ amount (project_expenses)
```

### 6.2 SM (System Maintenance) - 유지보수

```
월 영업이익 = 월 매출 - (해당 월 투입인력 월 인건비 합계 + 해당 월 경비 합계)
월 영업이익률(%) = 월 영업이익 / 월 매출 × 100

해당 월 투입인력 월 인건비 = Σ (man_month × monthly_rate × 10,000)  [해당 월 기준]
해당 월 경비 합계 = Σ amount WHERE expense_date LIKE 'YYYY-MM-%'
```

### 6.3 서버 사이드 계산 함수 (cost-analysis.ts)

```typescript
// types/index.ts
interface CostAnalysisResult {
  project_id: string;
  type: 'SI' | 'SM';
  contract_amount: number;
  total_labor_cost: number;    // 원
  total_expense: number;       // 원
  total_cost: number;          // 원
  operating_profit: number;    // 원
  profit_rate: number;         // %
}

// routes/cost-analysis.ts
async function calcCostAnalysis(projectId: string, db: D1Database): Promise<CostAnalysisResult> {
  const project = await db
    .prepare('SELECT * FROM projects WHERE id = ?')
    .bind(projectId).first<Project>();

  const staffingRows = await db
    .prepare('SELECT SUM(total_cost) as labor FROM project_staffing WHERE project_id = ?')
    .bind(projectId).first<{ labor: number }>();

  const expenseRows = await db
    .prepare('SELECT SUM(amount) as expense FROM project_expenses WHERE project_id = ?')
    .bind(projectId).first<{ expense: number }>();

  const totalLabor   = staffingRows?.labor   ?? 0;
  const totalExpense = expenseRows?.expense  ?? 0;
  const totalCost    = totalLabor + totalExpense;
  const contractAmt  = project!.contract_amount;
  const profit       = contractAmt - totalCost;
  const profitRate   = contractAmt > 0 ? (profit / contractAmt) * 100 : 0;

  return {
    project_id: projectId,
    type: project!.type,
    contract_amount: contractAmt,
    total_labor_cost: totalLabor,
    total_expense: totalExpense,
    total_cost: totalCost,
    operating_profit: profit,
    profit_rate: Math.round(profitRate * 100) / 100,
  };
}
```

### 6.4 영업이익률 색상 기준 (프론트엔드 참고)

| 이익률 | 색상 | 의미 |
|--------|------|------|
| 70% 이상 | green | 양호 |
| 50~70% | yellow | 주의 |
| 50% 미만 | red | 위험 |
| 음수 | red (bold) | 손실 |

---

## 7. 프로젝트 코드 자동 생성 규칙

```
형식: {부서ID}-{YYYY}-{순번 3자리}
예시: SE-2026-001, AI-2026-012, SM-2026-003

생성 로직 (db/helpers.ts):
1. SELECT COUNT(*) FROM projects WHERE department_id = ? AND project_code LIKE '{dept}-{year}-%'
2. 다음 순번 = count + 1
3. 패딩: String(seq).padStart(3, '0')
4. INSERT 시 unique constraint 위반 시 재시도 (최대 3회)
```

---

## 8. 주요 쿼리 패턴

### 8.1 프로젝트 목록 (조인 포함)

```sql
SELECT
  p.*,
  d.name AS department_name,
  c.name AS client_name,
  sr.name AS sales_rep_name,
  pm.name AS pm_name
FROM projects p
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN clients c     ON p.client_id = c.id
LEFT JOIN employees sr  ON p.sales_rep_id = sr.id
LEFT JOIN employees pm  ON p.pm_id = pm.id
WHERE p.is_draft = 0
  AND (? IS NULL OR p.department_id = ?)
  AND (? IS NULL OR p.status = ?)
  AND (? IS NULL OR p.type = ?)
  AND (? IS NULL OR p.name LIKE '%' || ? || '%' OR p.project_code LIKE '%' || ? || '%')
ORDER BY p.updated_at DESC
LIMIT ? OFFSET ?;
```

### 8.2 대시보드 부서별 집계

```sql
SELECT
  d.id AS department_id,
  d.name AS department_name,
  COUNT(p.id) AS project_count,
  SUM(p.contract_amount) AS contract_amount,
  COALESCE(SUM(s.revenue), 0) AS revenue_ytd,
  COALESCE(SUM(s.operating_profit), 0) AS operating_profit_ytd
FROM departments d
LEFT JOIN projects p ON p.department_id = d.id AND p.is_draft = 0
LEFT JOIN settlements s ON s.project_id = p.id AND s.period LIKE ? -- 'YYYY-%'
GROUP BY d.id, d.name
ORDER BY d.id;
```

---

*Document: SEbit Insight v1.0 Backend Design*
*Created: 2026-02-17*
*Status: Ready for Implementation*
