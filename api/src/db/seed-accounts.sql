-- 기존 테스트 계정 정리
DELETE FROM sessions;
DELETE FROM permission_requests;
DELETE FROM employees WHERE id IN ('master_001','admin_001','user_001');

-- 실제 마스터 계정
INSERT OR REPLACE INTO employees (id, name, email, department_id, position, role)
VALUES ('emp_ceo', '대표이사', 'ceo@sehyunict.com', 'SE', '대표', 'master');

INSERT OR REPLACE INTO employees (id, name, email, department_id, position, role)
VALUES ('emp_hjkim', '김혁진', 'hjkim@sehyunict.com', 'SE', '이사', 'master');
