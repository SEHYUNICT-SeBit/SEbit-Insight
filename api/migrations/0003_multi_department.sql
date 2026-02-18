-- ============================================================
-- 프로젝트 다중 부서 지원
-- ============================================================

-- 프로젝트-부서 연결 테이블 (N:M)
CREATE TABLE IF NOT EXISTS project_departments (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id),
  is_primary    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, department_id)
);
CREATE INDEX IF NOT EXISTS idx_proj_dept_project ON project_departments(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_dept_department ON project_departments(department_id);
