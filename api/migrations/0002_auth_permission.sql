-- ============================================================
-- SEbit Insight v1.0 - Auth & Permission System Migration
-- ============================================================

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_employee ON sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 권한 요청 (메모결재)
CREATE TABLE IF NOT EXISTS permission_requests (
  id              TEXT PRIMARY KEY,
  requester_id    TEXT NOT NULL REFERENCES employees(id),
  requested_role  TEXT NOT NULL CHECK(requested_role IN ('admin','manager')),
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  reviewer_id     TEXT REFERENCES employees(id),
  review_comment  TEXT,
  reviewed_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_perm_req_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_perm_req_requester ON permission_requests(requester_id);

-- 마스터 계정
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role)
VALUES ('emp_ceo', '대표이사', 'ceo@sehyunict.com', 'SE', '대표', 'master');
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role)
VALUES ('emp_hjkim', '김혁진', 'hjkim@sehyunict.com', 'SE', '이사', 'master');
