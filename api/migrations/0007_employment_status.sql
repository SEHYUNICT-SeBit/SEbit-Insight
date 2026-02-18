-- ============================================================
-- employment_status 컬럼 추가
-- 값: '재직', '휴직', '병가', '퇴직'
-- ============================================================

ALTER TABLE employees ADD COLUMN employment_status TEXT NOT NULL DEFAULT '재직';

-- 기존 is_active=0 직원을 퇴직으로 설정
UPDATE employees SET employment_status = '퇴직' WHERE is_active = 0;

-- 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);
