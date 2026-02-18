-- ============================================================
-- 단가표 직급명 변경 + 이사 단가 수정
-- ============================================================

UPDATE rate_cards SET position = '프로 (E2)', monthly_rate = 350 WHERE id = 'rc_001';
UPDATE rate_cards SET position = '프로 (E3)', monthly_rate = 420 WHERE id = 'rc_002';
UPDATE rate_cards SET position = '프로 (E4)', monthly_rate = 600 WHERE id = 'rc_003';
UPDATE rate_cards SET position = '프로 (E5)', monthly_rate = 700 WHERE id = 'rc_004';
UPDATE rate_cards SET position = '프로 (E6)', monthly_rate = 800 WHERE id = 'rc_005';
UPDATE rate_cards SET position = '이사', monthly_rate = 950 WHERE id = 'rc_006';
UPDATE rate_cards SET position = '대표이사', monthly_rate = 1000 WHERE id = 'rc_007';
