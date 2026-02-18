-- ============================================================
-- PM 유형 (정직원/외주개발자) + 단가표 갱신 + 경비 구조 변경
-- ============================================================

-- 프로젝트 PM 유형 지원
ALTER TABLE projects ADD COLUMN pm_type TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE projects ADD COLUMN pm_name TEXT;

-- 경비 구조 변경 (3가지 유형: freelancer, subcontract, other)
ALTER TABLE project_expenses ADD COLUMN expense_type TEXT NOT NULL DEFAULT 'other';
ALTER TABLE project_expenses ADD COLUMN freelancer_level TEXT;
ALTER TABLE project_expenses ADD COLUMN monthly_rate REAL;
ALTER TABLE project_expenses ADD COLUMN man_month REAL;
ALTER TABLE project_expenses ADD COLUMN company_name TEXT;
ALTER TABLE project_expenses ADD COLUMN subcategory TEXT;
ALTER TABLE project_expenses ADD COLUMN note TEXT;

-- 단가표 갱신 (기존 직급명 → 등급 체계)
UPDATE rate_cards SET position = 'E2', monthly_rate = 350 WHERE id = 'rc_001';
UPDATE rate_cards SET position = 'E3', monthly_rate = 420 WHERE id = 'rc_002';
UPDATE rate_cards SET position = 'E4', monthly_rate = 600 WHERE id = 'rc_003';
UPDATE rate_cards SET position = 'E5', monthly_rate = 700 WHERE id = 'rc_004';
UPDATE rate_cards SET position = 'E6', monthly_rate = 800 WHERE id = 'rc_005';
UPDATE rate_cards SET position = '이사', monthly_rate = 930 WHERE id = 'rc_006';
UPDATE rate_cards SET position = '대표이사', monthly_rate = 1000 WHERE id = 'rc_007';
