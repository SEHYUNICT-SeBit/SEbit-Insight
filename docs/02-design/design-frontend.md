# SEbit Insight v1.0 - Frontend Design

> Next.js (App Router) + Tailwind CSS + shadcn/ui + Cloudflare Pages

*Created: 2026-02-17 | Status: Draft*

---

## 1. Page Structure (Route Map)

```
app/
├── layout.tsx                    # RootLayout (사이드바 + 헤더 포함)
├── page.tsx                      # / 대시보드 메인
├── projects/
│   ├── page.tsx                  # /projects 프로젝트 목록
│   ├── new/
│   │   └── page.tsx              # /projects/new 프로젝트 등록 (멀티스텝)
│   └── [id]/
│       ├── page.tsx              # /projects/[id] 프로젝트 상세
│       └── cost/
│           └── page.tsx          # /projects/[id]/cost 원가 분석
├── settlements/
│   └── page.tsx                  # /settlements 정산 관리
└── settings/
    └── page.tsx                  # /settings 마스터 데이터 관리
```

### 페이지별 역할 요약

| Route | 페이지 | 주요 기능 |
|-------|--------|-----------|
| `/` | 대시보드 | 부서별 수주 요약, 매출 총액, 상태별 카운트, 최근 프로젝트 |
| `/projects` | 프로젝트 목록 | 전체 목록 + 필터(부서/상태/기간) + 검색 + 인라인 상태 변경 |
| `/projects/new` | 프로젝트 등록 | 4단계 위저드 폼 + 임시 저장 |
| `/projects/[id]` | 프로젝트 상세 | 기본정보, 투입인력, 경비 조회/편집 |
| `/projects/[id]/cost` | 원가 분석 | M/M × 단가 시뮬레이션, 영업이익률 실시간 계산 |
| `/settlements` | 정산 관리 | 월별 정산 등록/상태 관리 |
| `/settings` | 마스터 데이터 | 부서, 직급별 단가, 계약처 관리 |

---

## 2. Layout Design

### 2.1 전체 레이아웃 구조

```
┌──────────────────────────────────────────────────────┐
│  Header (h-14)                                        │
│  [SEbit Insight]          [사용자명] [역할 Badge]     │
├────────────┬─────────────────────────────────────────┤
│            │                                          │
│  Sidebar   │  Main Content                            │
│  (w-60)    │  (flex-1, p-6)                           │
│            │                                          │
│  nav items │                                          │
│            │                                          │
└────────────┴─────────────────────────────────────────┘
```

### 2.2 사이드바 네비게이션

```
[SEbit Insight] (로고/타이틀)

Navigation:
- [LayoutDashboard] 대시보드         /
- [FolderKanban]    프로젝트          /projects
- [Receipt]         정산 관리         /settlements
- [Settings]        마스터 데이터     /settings

Bottom:
- [User]            사용자명 + 역할
```

**구현 파일**: `components/layout/Sidebar.tsx`

### 2.3 헤더

- 좌측: 현재 페이지명 (breadcrumb)
- 우측: 사용자 이름 + 역할 Badge (관리자 / 일반)
  - Cloudflare Access JWT에서 이메일/역할 추출
  - 역할 표시: `<Badge variant="outline">관리자</Badge>`

**구현 파일**: `components/layout/Header.tsx`

### 2.4 반응형 기준

| 브레이크포인트 | 너비 | 레이아웃 |
|--------------|------|---------|
| Desktop | >= 1280px | 사이드바 고정 (w-60) + 메인 컨텐츠 |
| Tablet | 768px - 1279px | 사이드바 고정 (w-48) + 메인 컨텐츠 |
| Mobile | < 768px | 사이드바 Sheet(드로어)로 전환 |

> v1.0 파일럿은 사내 내부툴 용도로 Desktop 우선. Mobile은 기본 지원 수준.

---

## 3. Core Components

### 3.1 레이아웃 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|---------|------|------|
| `RootLayout` | `app/layout.tsx` | HTML 루트, 폰트, Provider 주입 |
| `AppLayout` | `components/layout/AppLayout.tsx` | Sidebar + Header + main 조합 |
| `Sidebar` | `components/layout/Sidebar.tsx` | 네비게이션 메뉴 |
| `Header` | `components/layout/Header.tsx` | 상단 헤더, 사용자 정보 |

### 3.2 대시보드 컴포넌트

| 컴포넌트 | 설명 | 사용 shadcn |
|---------|------|-------------|
| `DashboardPage` | 대시보드 메인 페이지 | - |
| `SummaryCards` | 매출 총액, 프로젝트 수 요약 카드 그룹 | `Card` |
| `StatusCountBadges` | 상태별 카운트 (진행중/정산대기/완료) | `Badge`, `Card` |
| `DepartmentRevenueChart` | 부서별 수주 현황 바 차트 | `Card` (recharts 직접 사용) |
| `RecentProjectsTable` | 최근 등록 프로젝트 5건 | `Table` |

**대시보드 카드 레이아웃 (Bento Grid):**
```
┌─────────────┬─────────────┬─────────────┐
│  총 계약액   │  진행중 프젝 │  이번달 매출 │  ← SummaryCards (3열)
├─────────────┴─────────────┴─────────────┤
│         부서별 수주 현황 (Bar Chart)       │  ← DepartmentRevenueChart (전폭)
├──────────────────────┬──────────────────┤
│    최근 프로젝트       │   상태별 카운트   │  ← 2열 분할
└──────────────────────┴──────────────────┘
```

### 3.3 프로젝트 목록 컴포넌트

| 컴포넌트 | 설명 | 사용 shadcn |
|---------|------|-------------|
| `ProjectListPage` | 프로젝트 목록 페이지 | - |
| `ProjectFilterBar` | 부서/상태/기간/검색 필터 UI | `Select`, `Input`, `Button` |
| `ProjectTable` | 프로젝트 목록 테이블 (메인) | `Table` |
| `ProjectTableRow` | 개별 행 - 인라인 상태 변경 포함 | `Badge`, `Select` |
| `ProjectStatusSelect` | 인라인 상태 드롭다운 (즉시 저장) | `Select` |

**ProjectTable 컬럼 정의:**
```
프로젝트코드 | 프로젝트명 | 부서 | 유형(SI/SM) | 계약금액 | PM | 기간 | 상태 | 액션
```

**인라인 상태 변경 패턴:**
```tsx
// ProjectStatusSelect.tsx
// Select 변경 시 → PATCH /api/projects/:id/status → optimistic update
const [status, setStatus] = useState(project.status);
const mutation = useUpdateProjectStatus();

const handleChange = (newStatus: string) => {
  setStatus(newStatus); // optimistic
  mutation.mutate({ id: project.id, status: newStatus });
};
```

### 3.4 프로젝트 등록 (멀티스텝 폼)

**4단계 위저드 구조:**

```
Step 1: 기본정보        Step 2: 계약정보        Step 3: 인력투입        Step 4: 확인
──────────────────────────────────────────────────────────────────────────────────
프로젝트명             계약금액               직급 선택             전체 요약
부서 선택              계약기간(시작/종료)     M/M 입력              원가 미리보기
유형(SI/SM)           계약처                 단가 적용             영업이익률
영업대표               담당 PM               경비 항목             임시저장 확인
설명                                        소계 표시
```

| 컴포넌트 | 설명 | 사용 shadcn |
|---------|------|-------------|
| `ProjectNewPage` | 멀티스텝 폼 페이지 컨테이너 | - |
| `StepIndicator` | 현재 단계 표시 (1/2/3/4) | `Progress` 또는 커스텀 |
| `Step1BasicInfo` | 기본정보 입력 폼 | `Form`, `Input`, `Select` |
| `Step2ContractInfo` | 계약정보 입력 폼 | `Form`, `Input`, `DatePicker` |
| `Step3Staffing` | 투입인력 + 경비 입력 | `Form`, `Table`, `Input`, `Select` |
| `Step4Confirm` | 최종 확인 및 제출 | `Card`, `Button` |
| `DraftSaveIndicator` | 임시 저장 상태 표시 | `Badge` |

**StepIndicator 구조:**
```tsx
// 커스텀 구현 (shadcn Stepper 없음)
<div className="flex items-center gap-2">
  {steps.map((step, i) => (
    <div key={i} className={cn(
      "flex items-center gap-2",
      i < currentStep ? "text-primary" : "text-muted-foreground"
    )}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
        i === currentStep ? "bg-primary text-white" :
        i < currentStep ? "bg-primary/20 text-primary" : "bg-muted"
      )}>
        {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
      </div>
      <span className="text-sm">{step.label}</span>
      {i < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
    </div>
  ))}
</div>
```

### 3.5 원가 분석 시뮬레이션

| 컴포넌트 | 설명 | 사용 shadcn |
|---------|------|-------------|
| `CostAnalysisPage` | 원가 분석 페이지 | - |
| `StaffingCostTable` | 직급별 M/M × 단가 입력 테이블 | `Table`, `Input` |
| `ExpenseTable` | 경비 항목 테이블 | `Table`, `Input`, `Select` |
| `ProfitSummaryCard` | 영업이익률 실시간 계산 결과 | `Card` |
| `ProfitRateGauge` | 영업이익률 시각화 (색상 구분) | 커스텀 |

**실시간 계산 로직 (클라이언트 사이드):**
```typescript
// lib/cost-calculator.ts
export function calculateCost(staffing: Staffing[], expenses: Expense[], contractAmount: number) {
  const totalLabor = staffing.reduce((sum, s) => sum + s.manMonth * s.monthlyRate * 10000, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCost = totalLabor + totalExpense;
  const operatingProfit = contractAmount - totalCost;
  const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0;
  return { totalLabor, totalExpense, totalCost, operatingProfit, profitRate };
}
```

**영업이익률 색상 기준:**
```
>= 30%  → text-green-600  (우수)
15-29%  → text-blue-600   (양호)
0-14%   → text-yellow-600 (주의)
< 0%    → text-red-600    (손실)
```

### 3.6 정산 관리

| 컴포넌트 | 설명 | 사용 shadcn |
|---------|------|-------------|
| `SettlementsPage` | 정산 관리 페이지 | - |
| `SettlementFilterBar` | 기간/부서/상태 필터 | `Select`, `Input` |
| `SettlementTable` | 월별 정산 목록 테이블 | `Table` |
| `SettlementStatusBadge` | 정산 상태 Badge (대기/완료/보류) | `Badge` |
| `SettlementDialog` | 정산 등록/편집 모달 | `Dialog`, `Form` |

**정산 상태 Badge 색상:**
```
pending    → Badge variant="outline"  (회색)
completed  → Badge variant="default"  (초록)
on_hold    → Badge variant="secondary" (노랑)
```

### 3.7 공통 컴포넌트

| 컴포넌트 | 설명 | 사용 shadcn |
|---------|------|-------------|
| `PageHeader` | 페이지 제목 + 액션 버튼 영역 | - |
| `EmptyState` | 데이터 없을 때 빈 상태 UI | `Card` |
| `LoadingSkeleton` | 로딩 중 Skeleton UI | `Skeleton` |
| `ErrorBoundary` | 에러 경계 처리 | - |
| `ConfirmDialog` | 삭제/변경 확인 모달 | `AlertDialog` |
| `DepartmentBadge` | 부서명 Badge | `Badge` |
| `ProjectTypeBadge` | SI/SM 타입 Badge | `Badge` |

---

## 4. State Management Strategy

### 4.1 상태 종류별 전략

| 상태 종류 | 도구 | 용도 |
|----------|------|------|
| 서버 상태 (API 데이터) | TanStack Query (React Query) | 프로젝트 목록, 대시보드 데이터 |
| 폼 상태 | React Hook Form + Zod | 프로젝트 등록, 정산 등록 |
| 멀티스텝 임시 저장 | localStorage + API 동기화 | 4단계 폼 draft 상태 |
| UI 상태 (모달/필터) | useState | 로컬 UI 토글 |
| 사용자 정보 | Context API | Cloudflare Access JWT 파싱 결과 |

### 4.2 TanStack Query 쿼리 키 설계

```typescript
// lib/query-keys.ts
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  projects: {
    all: ['projects'] as const,
    list: (filter?: ProjectFilter) => ['projects', 'list', filter] as const,
    detail: (id: string) => ['projects', id] as const,
    cost: (id: string) => ['projects', id, 'cost'] as const,
  },
  settlements: {
    all: ['settlements'] as const,
    list: (filter?: SettlementFilter) => ['settlements', 'list', filter] as const,
  },
  master: {
    departments: ['master', 'departments'] as const,
    employees: ['master', 'employees'] as const,
    rateCards: ['master', 'rate-cards'] as const,
    clients: ['master', 'clients'] as const,
  },
};
```

### 4.3 임시 저장 전략 (멀티스텝 폼)

```typescript
// 우선순위: API draft > localStorage draft
// 1. 폼 진입 시 localStorage에서 draft 복원
// 2. 각 단계 "다음" 클릭 시 localStorage 저장
// 3. 명시적 "임시저장" 클릭 시 API PATCH (is_draft=1)
// 4. 최종 제출 시 is_draft=0으로 업데이트

const DRAFT_KEY = 'project-form-draft';

// 저장
localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, data, savedAt: new Date() }));

// 복원
const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
```

### 4.4 사용자 Context

```typescript
// contexts/UserContext.tsx
interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  departmentId: string;
}

// Cloudflare Access: cf-access-jwt-assertion 헤더에서 파싱
// API /api/auth/me 에서 employees 테이블 조회하여 역할/부서 반환
```

---

## 5. Zod Schema (폼 검증)

```typescript
// lib/validations/project.ts
import { z } from 'zod';

export const step1Schema = z.object({
  name: z.string().min(2, '2자 이상 입력하세요').max(100),
  type: z.enum(['SI', 'SM']),
  departmentId: z.string().min(1, '부서를 선택하세요'),
  salesRepId: z.string().min(1, '영업대표를 선택하세요'),
  description: z.string().optional(),
});

export const step2Schema = z.object({
  contractAmount: z.number().min(0, '계약금액을 입력하세요'),
  startDate: z.string().min(1, '시작일을 선택하세요'),
  endDate: z.string().min(1, '종료일을 선택하세요'),
  clientId: z.string().min(1, '계약처를 선택하세요'),
  pmId: z.string().min(1, 'PM을 선택하세요'),
});

export const staffingRowSchema = z.object({
  employeeId: z.string().optional(),
  position: z.string().min(1),
  manMonth: z.number().min(0.1).max(24),
  monthlyRate: z.number().min(0),
  note: z.string().optional(),
});

export const step3Schema = z.object({
  staffing: z.array(staffingRowSchema).min(1, '투입 인력을 1명 이상 입력하세요'),
  expenses: z.array(z.object({
    category: z.enum(['출장비', '장비', '외주', '기타']),
    amount: z.number().min(0),
    description: z.string().optional(),
  })).optional(),
});
```

---

## 6. shadcn/ui 사용 컴포넌트 목록

```bash
# 설치할 shadcn 컴포넌트
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add sheet
npx shadcn@latest add skeleton
npx shadcn@latest add progress
npx shadcn@latest add separator
npx shadcn@latest add popover
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
npx shadcn@latest add toast
npx shadcn@latest add sonner
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
```

### 컴포넌트 용도 매핑

| shadcn 컴포넌트 | 사용 위치 |
|----------------|---------|
| `Table` | 프로젝트 목록, 정산 목록, 투입인력/경비 테이블 |
| `Form` | 프로젝트 등록 각 단계, 정산 등록 |
| `Dialog` | 정산 등록/편집 모달 |
| `AlertDialog` | 삭제 확인, 상태 변경 확인 |
| `Select` | 부서, 유형, 직급, 상태 선택 |
| `Badge` | 프로젝트 상태, 부서, SI/SM 유형, 역할 |
| `Card` | 대시보드 위젯, 원가 분석 요약 |
| `Tabs` | 프로젝트 상세 (기본정보/투입인력/경비) |
| `Sheet` | 모바일 사이드바 드로어 |
| `Skeleton` | 데이터 로딩 중 플레이스홀더 |
| `Progress` | 멀티스텝 폼 진행 표시 |
| `Sonner` | API 성공/실패 토스트 알림 |
| `Calendar` / `DatePicker` | 계약 시작/종료일 선택 |
| `DropdownMenu` | 테이블 행 액션 메뉴 (편집/삭제) |

---

## 7. API Client & Hooks

### 7.1 서비스 레이어

```
src/
├── lib/
│   ├── api-client.ts           # fetch 래퍼 (baseURL, auth header)
│   └── cost-calculator.ts      # 원가 계산 순수 함수
├── services/
│   ├── project.service.ts      # 프로젝트 CRUD API
│   ├── settlement.service.ts   # 정산 API
│   ├── dashboard.service.ts    # 대시보드 집계 API
│   └── master.service.ts       # 마스터 데이터 API
└── hooks/
    ├── useProjects.ts           # 프로젝트 목록/상세 쿼리
    ├── useProjectMutations.ts   # 프로젝트 생성/수정/삭제
    ├── useSettlements.ts        # 정산 쿼리/뮤테이션
    ├── useDashboard.ts          # 대시보드 데이터
    └── useMasterData.ts         # 부서/직원/단가 조회
```

### 7.2 핵심 훅 패턴

```typescript
// hooks/useProjects.ts
export function useProjects(filter?: ProjectFilter) {
  return useQuery({
    queryKey: queryKeys.projects.list(filter),
    queryFn: () => projectService.getList(filter),
    staleTime: 1000 * 60, // 1분
  });
}

// 인라인 상태 변경 - Optimistic Update
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all });
      const prev = queryClient.getQueryData(queryKeys.projects.list());
      queryClient.setQueryData(queryKeys.projects.list(), (old: any) => ({
        ...old,
        data: old.data.map((p: Project) => p.id === id ? { ...p, status } : p),
      }));
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKeys.projects.list(), ctx?.prev);
      toast.error('상태 변경에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
```

---

## 8. Design Tokens (Tailwind 커스터마이징)

```css
/* app/globals.css */
@layer base {
  :root {
    /* shadcn 기본값 사용, 브랜드 컬러만 오버라이드 */
    --primary: 221.2 83.2% 53.3%;       /* SEbit 브랜드 블루 */
    --primary-foreground: 210 40% 98%;
    --radius: 0.5rem;
  }
}
```

**부서별 색상 (배지/차트):**
```typescript
// lib/department-colors.ts
export const DEPARTMENT_COLORS: Record<string, string> = {
  SE:      '#3B82F6',  // blue-500
  SM:      '#10B981',  // emerald-500
  AI:      '#8B5CF6',  // violet-500
  CONTENT: '#F59E0B',  // amber-500
  RND:     '#EF4444',  // red-500
};
```

---

## 9. 파일 구조 전체

```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                          # 대시보드
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── cost/page.tsx
│   ├── settlements/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── DepartmentRevenueChart.tsx
│   │   ├── StatusCountBadges.tsx
│   │   └── RecentProjectsTable.tsx
│   ├── projects/
│   │   ├── ProjectFilterBar.tsx
│   │   ├── ProjectTable.tsx
│   │   ├── ProjectTableRow.tsx
│   │   ├── ProjectStatusSelect.tsx
│   │   ├── form/
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── Step1BasicInfo.tsx
│   │   │   ├── Step2ContractInfo.tsx
│   │   │   ├── Step3Staffing.tsx
│   │   │   └── Step4Confirm.tsx
│   │   └── detail/
│   │       ├── ProjectDetailTabs.tsx
│   │       ├── StaffingTable.tsx
│   │       └── ExpenseTable.tsx
│   ├── cost/
│   │   ├── StaffingCostTable.tsx
│   │   ├── ExpenseInputTable.tsx
│   │   └── ProfitSummaryCard.tsx
│   ├── settlements/
│   │   ├── SettlementFilterBar.tsx
│   │   ├── SettlementTable.tsx
│   │   └── SettlementDialog.tsx
│   ├── settings/
│   │   ├── DepartmentSettings.tsx
│   │   ├── RateCardSettings.tsx
│   │   └── ClientSettings.tsx
│   └── ui/                              # shadcn/ui (자동 생성)
├── hooks/
│   ├── useProjects.ts
│   ├── useProjectMutations.ts
│   ├── useSettlements.ts
│   ├── useDashboard.ts
│   └── useMasterData.ts
├── services/
│   ├── project.service.ts
│   ├── settlement.service.ts
│   ├── dashboard.service.ts
│   └── master.service.ts
├── lib/
│   ├── api-client.ts
│   ├── cost-calculator.ts
│   ├── query-keys.ts
│   ├── department-colors.ts
│   └── utils.ts
├── types/
│   ├── project.types.ts
│   ├── settlement.types.ts
│   ├── master.types.ts
│   └── api.types.ts
├── contexts/
│   └── UserContext.tsx
└── validations/
    ├── project.ts
    └── settlement.ts
```

---

## 10. 역할별 접근 제어

| 기능 | admin | manager | user |
|------|-------|---------|------|
| 대시보드 조회 | O | O | O |
| 프로젝트 목록 조회 | O | O | O (본인 부서) |
| 프로젝트 등록 | O | O | O |
| 프로젝트 삭제 | O | X | X |
| 상태 인라인 변경 | O | O | X |
| 정산 등록/수정 | O | O | X |
| 마스터 데이터 관리 | O | X | X |

> 역할 체크는 Workers API에서 수행. 프론트는 UI 요소 hide/disable로 UX 보조.

---

*Document: SEbit Insight v1.0 Frontend Design*
*Created: 2026-02-17*
*Author: Frontend Architect Agent*
