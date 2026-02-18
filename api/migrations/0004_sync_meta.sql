-- ============================================================
-- 네이버 웍스 인사정보 동기화 메타데이터
-- ============================================================

-- 동기화 메타 정보 (key-value)
CREATE TABLE IF NOT EXISTS sync_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- nw_user_id 인덱스 (동기화 시 빠른 매칭용)
CREATE INDEX IF NOT EXISTS idx_employees_nw_user_id ON employees(nw_user_id);

-- 초기 동기화 상태
INSERT OR IGNORE INTO sync_meta (key, value)
  VALUES ('last_sync', '{"status":"never","synced_at":null}');
