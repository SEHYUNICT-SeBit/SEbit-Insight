-- ============================================================
-- SEbit Insight v1.0 - D1 Schema (SQLite)
-- Reference copy - canonical version in migrations/0001_initial.sql
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 부서
CREATE TABLE IF NOT EXISTS departments (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 직원
CREATE TABLE IF NOT EXISTS employees (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  department_id TEXT REFERENCES departments(id),
  position      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  nw_user_id    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 계약처
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  business_no TEXT,
  contact     TEXT,
  phone       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 직급별 단가 기준표
CREATE TABLE IF NOT EXISTS rate_cards (
  id           TEXT PRIMARY KEY,
  position     TEXT NOT NULL UNIQUE,
  monthly_rate REAL NOT NULL,
  is_default   INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 프로젝트
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
  pm_type         TEXT NOT NULL DEFAULT 'employee',
  pm_name         TEXT,
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

-- 투입 인력
CREATE TABLE IF NOT EXISTS project_staffing (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id  TEXT REFERENCES employees(id),
  position     TEXT NOT NULL,
  man_month    REAL NOT NULL CHECK(man_month > 0),
  monthly_rate REAL NOT NULL CHECK(monthly_rate > 0),
  total_cost   REAL GENERATED ALWAYS AS (man_month * monthly_rate * 10000) STORED,
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 경비
CREATE TABLE IF NOT EXISTS project_expenses (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK(category IN ('출장비','장비','외주','기타')),
  expense_type     TEXT NOT NULL DEFAULT 'other',
  amount           REAL NOT NULL CHECK(amount > 0),
  description      TEXT,
  expense_date     TEXT,
  freelancer_level TEXT,
  monthly_rate     REAL,
  man_month        REAL,
  company_name     TEXT,
  subcategory      TEXT,
  note             TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 매출 정산
CREATE TABLE IF NOT EXISTS settlements (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id),
  period           TEXT NOT NULL,
  revenue          REAL NOT NULL DEFAULT 0,
  total_labor      REAL NOT NULL DEFAULT 0,
  total_expense    REAL NOT NULL DEFAULT 0,
  operating_profit REAL GENERATED ALWAYS AS (revenue - total_labor - total_expense) STORED,
  profit_rate      REAL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','completed','on_hold')),
  note             TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
