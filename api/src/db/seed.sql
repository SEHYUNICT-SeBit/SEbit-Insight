-- ============================================================
-- Seed Data
-- ============================================================

-- 부서 6개
INSERT OR IGNORE INTO departments (id, name) VALUES
  ('SE',      'SE 사업부'),
  ('SM',      'SM 사업부'),
  ('AI',      'AI 인프라 사업부'),
  ('CONTENT', '콘텐츠 사업부'),
  ('RND',     'R&D Lab'),
  ('MGMT',    '경영기획그룹');

-- 등급별 기본 단가 (만원/월)
INSERT OR IGNORE INTO rate_cards (id, position, monthly_rate, is_default) VALUES
  ('rc_001', '프로 (E2)', 350,  1),
  ('rc_002', '프로 (E3)', 420,  1),
  ('rc_003', '프로 (E4)', 600,  1),
  ('rc_004', '프로 (E5)', 700,  1),
  ('rc_005', '프로 (E6)', 800,  1),
  ('rc_006', '이사',      950,  1),
  ('rc_007', '대표이사', 1000,  1);

-- 테스트 계약처
INSERT OR IGNORE INTO clients (id, name, business_no, contact, phone) VALUES
  ('cli_test_001', '테스트 고객사 A', '000-00-00001', '김담당', '02-0000-0001'),
  ('cli_test_002', '테스트 고객사 B', '000-00-00002', '이담당', '02-0000-0002');

-- 개발용 직원 데이터 (5개 부서 × 2~4명 = 15명)
-- SE 사업부
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role) VALUES
  ('emp_se_001', '박준혁', 'jhpark@sehyunict.com',  'SE', '부장', 'user'),
  ('emp_se_002', '김유진', 'yjkim@sehyunict.com',   'SE', '과장', 'user'),
  ('emp_se_003', '이성우', 'swlee@sehyunict.com',   'SE', '대리', 'user'),
  ('emp_se_004', '최민준', 'mjchoi@sehyunict.com',  'SE', '사원', 'user');
-- SM 사업부
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role) VALUES
  ('emp_sm_001', '윤현수', 'hsyoon@sehyunict.com',  'SM', '차장', 'user'),
  ('emp_sm_002', '정은희', 'ehjung@sehyunict.com',  'SM', '과장', 'user'),
  ('emp_sm_003', '한기원', 'kwhan@sehyunict.com',   'SM', '사원', 'user');
-- AI 사업부
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role) VALUES
  ('emp_ai_001', '고태경', 'tkoh@sehyunict.com',    'AI', '이사', 'user'),
  ('emp_ai_002', '백서연', 'syback@sehyunict.com',  'AI', '대리', 'user'),
  ('emp_ai_003', '남지수', 'jsnam@sehyunict.com',   'AI', '사원', 'user');
-- 콘텐츠 사업부
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role) VALUES
  ('emp_ct_001', '신민래', 'mrshin@sehyunict.com',  'CONTENT', '과장', 'user'),
  ('emp_ct_002', '강유현', 'yhkang@sehyunict.com',  'CONTENT', '사원', 'user');
-- R&D 연구소
INSERT OR IGNORE INTO employees (id, name, email, department_id, position, role) VALUES
  ('emp_rnd_001', '임동준', 'djlim@sehyunict.com',  'RND', '부장', 'user'),
  ('emp_rnd_002', '전혜선', 'hsjeon@sehyunict.com', 'RND', '차장', 'user'),
  ('emp_rnd_003', '서원범', 'wbseo@sehyunict.com',  'RND', '대리', 'user');
