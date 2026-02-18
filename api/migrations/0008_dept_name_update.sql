-- ============================================================
-- 0008: 부서명 실제 네이버웍스 조직도 반영
-- AI 사업부 → AI 인프라 사업부
-- R&D 연구소 → R&D Lab
-- 경영기획그룹 신규 추가
-- ============================================================

UPDATE departments SET name = 'AI 인프라 사업부' WHERE id = 'AI';
UPDATE departments SET name = 'R&D Lab' WHERE id = 'RND';
INSERT OR IGNORE INTO departments (id, name) VALUES ('MGMT', '경영기획그룹');
