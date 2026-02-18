-- ============================================================
-- SEbit Insight v1.0 - D1 Schema (SQLite)
-- ============================================================

-- Note: PRAGMA statements removed - D1 manages these automatically

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
  total_cost   REAL DEFAULT 0,  -- Calculated: man_month * monthly_rate * 10000
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
  operating_profit REAL DEFAULT 0,  -- Calculated: revenue - total_labor - total_expense
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
