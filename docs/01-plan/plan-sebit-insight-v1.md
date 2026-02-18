# SEbit Insight v1.0 - PDCA Plan

## 1. Project Overview

| 항목 | 내용 |
|------|------|
| 프로젝트명 | SEbit Insight |
| 버전 | v1.0 (초기 파일럿) |
| 레벨 | Dynamic |
| 목적 | 부서별 수주 현황/개인 성과를 실시간 대시보드로 전환, 데이터 기반 경영 의사결정 지원 |
| 주요 사용자 | 대표, 이사, 부서장, PM, 영업대표 |

## 2. Business Goals

### 2.1 핵심 목표
- **데이터 통합 및 가시화**: 수기 관리 → 실시간 대시보드 전환
- **수익성 분석 정밀화**: 투입 인력(M/M) + 경비 반영한 진짜 영업이익 산출
- **회의 효율화**: 대표/이사가 매출 상태를 즉시 변경, PM 회의에서 즉각 지표 확인

### 2.2 성공 지표 (KPI)
| 지표 | 현재(As-Is) | 목표(To-Be) |
|------|-------------|-------------|
| 매출 현황 파악 소요시간 | 수기 집계 1-2일 | 실시간 조회 |
| 영업이익률 산출 | 수동 엑셀 계산 | 자동 시뮬레이션 |
| PM 회의 데이터 준비 | 부서별 개별 취합 | 대시보드 즉시 조회 |
| 상태 변경 반영 | 담당자 요청 → 수정 | 인라인 즉시 편집 |

## 3. Organization Structure

```
세빗 (5개 부서)
├── SE 사업부
├── SM 사업부
├── AI 사업부
├── 콘텐츠 사업부
└── R&D 연구소
```

### 3.1 사업 구분
| 유형 | 설명 | 매출 인식 |
|------|------|-----------|
| SI (System Integration) | 프로젝트성 수주 | 계약 기간 기준 매출 인식 |
| SM (System Maintenance) | 유지보수 계약 | 월별 균등 매출 인식 |

## 4. Technical Architecture

### 4.1 기술 스택 (Hybrid Cloud)

```
[사용자 브라우저]
       │
       ▼
[Cloudflare Access] ── 사내 보안 인증 (SSO/이메일 기반)
       │
       ▼
[Cloudflare Pages] ── Next.js 정적 빌드 + CSR
       │
       ▼
[Cloudflare Workers] ── API 라우팅 & 비즈니스 로직
       │
       ├──▶ [Cloudflare D1] ── 프로젝트/매출/정산 데이터
       │
       ├──▶ [Naver Works API] ── 조직도/주소록 연동
       │
       └──▶ [Cloudflare Tunnel]
                  │
                  ▼
            [사내 서버: HPE DL380 Gen11]
            [Docker: FastAPI + OCP 엔진]
            └── CAD 데이터 처리 (ipt, rvt)
```

### 4.2 기술 스택 상세

| 레이어 | 기술 | 선정 사유 |
|--------|------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS | SSR/SSG 지원, Cloudflare Pages 최적화 |
| UI 컴포넌트 | shadcn/ui | 커스터마이징 용이, 인라인 에디팅 구현 적합 |
| API | Cloudflare Workers (Hono) | Edge 기반 저지연, D1 네이티브 바인딩 |
| Database | Cloudflare D1 (SQLite) | Workers 네이티브 연동, 무료 티어 충분 |
| 인증 | Cloudflare Access | 사내 이메일 기반 Zero Trust 인증 |
| External Engine | FastAPI (Python) | CAD 엔진 연동, 무거운 연산 처리 |
| Tunnel | Cloudflare Tunnel (cloudflared) | 사내 서버 안전 노출, 방화벽 우회 |
| 외부 API | Naver Works API | 조직도/인원 정보 자동 동기화 |

### 4.3 기술 스택 검증 결과

| 검증 항목 | 판정 | 비고 |
|-----------|------|------|
| Cloudflare Pages + Next.js | ✅ 적합 | `@cloudflare/next-on-pages` 어댑터 사용 |
| Workers + D1 바인딩 | ✅ 적합 | Hono 프레임워크로 REST API 구성 |
| D1 데이터 용량 | ✅ 충분 | 파일럿 규모에 무료 티어(5GB) 충분 |
| D1 동시 접속 | ⚠️ 주의 | 동시 쓰기 제한 있음, 읽기 위주 대시보드에는 적합 |
| Cloudflare Tunnel | ✅ 적합 | 사내 서버 노출 없이 안전한 연결 |
| Cloudflare Access | ✅ 적합 | 50명 이하 무료, 사내 이메일 인증 |
| Naver Works API | ⚠️ 확인 필요 | API 키 발급 및 권한 범위 사전 확인 필요 |

## 5. MVP Feature Priority (v1.0)

### 5.1 v1.0 필수 기능 (Must-Have)

| # | 기능 | 설명 | 복잡도 |
|---|------|------|--------|
| F1 | 대시보드 메인 | 부서별 수주 현황 요약, 매출 총액, 상태별 카운트 | 중 |
| F2 | 프로젝트 목록 | 전체 프로젝트 리스트 + 필터(부서/상태/기간) + 검색 | 중 |
| F3 | 프로젝트 등록 폼 | 멀티 스텝 폼 (기본정보 → 계약정보 → 인력투입 → 확인) | 상 |
| F4 | 원가 분석 시뮬레이션 | 직급별 단가 × M/M 입력 → 영업이익률 실시간 계산 | 상 |
| F5 | 인라인 상태 변경 | 목록에서 정산 상태(대기/완료/보류) 즉시 변경 | 하 |
| F6 | 임시 저장 | 멀티 스텝 폼 단계별 자동/수동 임시 저장 | 중 |
| F7 | Cloudflare Access 인증 | 사내 이메일 기반 로그인 + 역할 구분(관리자/일반) | 중 |

### 5.2 v1.1 후속 기능 (Nice-to-Have)

| # | 기능 | 설명 |
|---|------|------|
| F8 | Naver Works 연동 | 조직도/주소록 자동 동기화 |
| F9 | 개인별 성과 대시보드 | PM/영업대표별 실적 집계 |
| F10 | 월간 리포트 자동 생성 | PM 회의용 월간 매출/이익 리포트 PDF 출력 |
| F11 | CAD 엔진 연동 | Cloudflare Tunnel 경유 FastAPI 호출 |
| F12 | 알림/노티피케이션 | 상태 변경 시 관련자 알림 |
| F13 | 데이터 내보내기 | 엑셀/CSV 다운로드 기능 |

## 6. Database Schema (초안)

### 6.1 핵심 테이블

```sql
-- 부서
departments (
  id          TEXT PRIMARY KEY,    -- 'SE', 'SM', 'AI', 'CONTENT', 'RND'
  name        TEXT NOT NULL,       -- 'SE 사업부'
  created_at  TEXT DEFAULT (datetime('now'))
)

-- 직원 (Naver Works 연동 대비)
employees (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE,
  department_id   TEXT REFERENCES departments(id),
  position        TEXT,             -- 직급: 사원, 대리, 과장, 차장, 부장, 이사, 대표
  role            TEXT DEFAULT 'user',  -- admin, manager, user
  nw_user_id      TEXT,             -- Naver Works 사용자 ID (v1.1)
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now'))
)

-- 계약처 (고객사)
clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  business_no TEXT,               -- 사업자등록번호
  contact     TEXT,               -- 담당자
  phone       TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
)

-- 프로젝트 (핵심)
projects (
  id                TEXT PRIMARY KEY,
  project_code      TEXT UNIQUE NOT NULL,  -- 자동 생성 코드
  name              TEXT NOT NULL,
  type              TEXT NOT NULL,          -- 'SI' or 'SM'
  department_id     TEXT REFERENCES departments(id),
  client_id         TEXT REFERENCES clients(id),
  sales_rep_id      TEXT REFERENCES employees(id),   -- 영업대표
  pm_id             TEXT REFERENCES employees(id),   -- PM
  status            TEXT DEFAULT 'draft',  -- draft, active, settlement_pending, settled, on_hold, cancelled
  contract_amount   REAL DEFAULT 0,        -- 계약금액
  start_date        TEXT,                  -- 계약 시작일
  end_date          TEXT,                  -- 계약 종료일
  description       TEXT,
  is_draft          INTEGER DEFAULT 1,     -- 임시 저장 여부
  draft_step        INTEGER DEFAULT 1,     -- 임시 저장 단계 (1-4)
  created_by        TEXT REFERENCES employees(id),
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
)

-- 직급별 단가 기준표
rate_cards (
  id          TEXT PRIMARY KEY,
  position    TEXT NOT NULL,        -- 직급
  monthly_rate REAL NOT NULL,       -- 월 단가 (만원)
  is_default  INTEGER DEFAULT 1,   -- 기본 단가 여부
  created_at  TEXT DEFAULT (datetime('now'))
)

-- 프로젝트별 투입 인력
project_staffing (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  employee_id     TEXT REFERENCES employees(id),
  position        TEXT NOT NULL,        -- 투입 시 직급
  man_month       REAL NOT NULL,        -- M/M
  monthly_rate    REAL NOT NULL,        -- 적용 단가 (만원)
  total_cost      REAL GENERATED ALWAYS AS (man_month * monthly_rate * 10000) STORED,
  note            TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
)

-- 프로젝트별 경비
project_expenses (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,        -- 출장비, 장비, 외주, 기타
  amount      REAL NOT NULL,
  description TEXT,
  expense_date TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
)

-- 매출 정산
settlements (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id),
  period          TEXT NOT NULL,      -- '2026-01' 월별 기간
  revenue         REAL DEFAULT 0,    -- 매출액
  total_labor     REAL DEFAULT 0,    -- 총 인건비
  total_expense   REAL DEFAULT 0,    -- 총 경비
  operating_profit REAL GENERATED ALWAYS AS (revenue - total_labor - total_expense) STORED,
  profit_rate     REAL,              -- 영업이익률 (%)
  status          TEXT DEFAULT 'pending', -- pending, completed, on_hold
  note            TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
)
```

## 7. Implementation Phases (AI-Accelerated: 3일 스프린트)

> AI 기반 Vibecoding으로 기존 4주 → **3일**로 압축.
> Claude가 코드 생성, 스키마 마이그레이션, UI 컴포넌트를 병렬 처리.

### Day 1: 인프라 + 풀스택 골격 (오전/오후)
**오전**
- [ ] Next.js + Tailwind + shadcn/ui 프로젝트 초기화
- [ ] Cloudflare Workers (Hono) API 프로젝트 초기화
- [ ] D1 스키마 전체 마이그레이션 (7개 테이블 일괄)
- [ ] 시드 데이터 삽입 (부서 5개, 직급별 단가, 테스트 계약처)

**오후**
- [ ] 레이아웃 (사이드바 + 헤더 + 메인 컨텐츠)
- [ ] 마스터 데이터 API (departments, employees, clients, rate_cards)
- [ ] 프로젝트 목록 페이지 + 필터/검색 API
- [ ] Cloudflare Access 인증 연동

### Day 2: 핵심 비즈니스 로직
**오전**
- [ ] 프로젝트 등록 멀티 스텝 폼 (4단계 위저드)
- [ ] 임시 저장/불러오기 (단계별 draft 상태)
- [ ] 프로젝트 CRUD API 전체

**오후**
- [ ] 원가 분석 시뮬레이션 (직급별 단가 × M/M → 영업이익률 실시간 계산)
- [ ] 투입 인력/경비 등록 UI + API
- [ ] 인라인 상태 변경 (정산 대기/완료/보류)

### Day 3: 대시보드 + 정산 + 배포
**오전**
- [ ] 대시보드 메인 (부서별 수주 요약, 매출 총액, 상태별 카운트)
- [ ] 매출 정산 기능 (월별 정산 등록/관리)
- [ ] 역할별 접근 제어 (관리자/일반)

**오후**
- [ ] 전체 통합 테스트 및 버그 수정
- [ ] Cloudflare Pages 배포 + Workers 배포
- [ ] 대표님 리뷰용 데모 환경 세팅

## 8. Risk & Mitigation

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| D1 동시 쓰기 제한 | 다수 동시 편집 시 충돌 | 낙관적 잠금(optimistic locking) 적용 |
| Naver Works API 권한 | 연동 지연 | v1.0은 수동 입력, v1.1에서 연동 |
| Workers 실행 시간 제한 | 복잡한 계산 지연 | 원가 계산은 클라이언트 사이드에서 수행 |
| 사내 서버 Tunnel 안정성 | CAD 엔진 장애 | v1.0에서는 CAD 연동 제외, v1.1 대상 |

## 9. Project Timeline Summary

```
Day 1: 인프라 + 골격 ──── [Next.js + Workers + D1 + 레이아웃 + 마스터 API]
Day 2: 비즈니스 로직 ──── [등록 폼 + 원가 시뮬레이션 + 인라인 편집]
Day 3: 대시보드 + 배포 ── [대시보드 + 정산 + 테스트 + 배포]
```

---

*Document: SEbit Insight v1.0 PDCA Plan*
*Created: 2026-02-17*
*Level: Dynamic*
*Status: Draft - Pending Review*
