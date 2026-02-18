import type { ProjectFilter } from '@/types/project.types';
import type { SettlementFilter } from '@/types/settlement.types';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  performance: (year?: number) => ['performance', year] as const,
  staffing: (year?: number, deptId?: string) => ['staffing', year, deptId] as const,
  projects: {
    all: ['projects'] as const,
    list: (filter?: ProjectFilter) => ['projects', 'list', filter] as const,
    detail: (id: string) => ['projects', id] as const,
    cost: (id: string) => ['projects', id, 'cost'] as const,
    staffing: (id: string) => ['projects', id, 'staffing'] as const,
    expenses: (id: string) => ['projects', id, 'expenses'] as const,
    settlements: (id: string) => ['projects', id, 'settlements'] as const,
    drafts: ['projects', 'drafts'] as const,
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
  permissionRequests: {
    all: ['permission-requests'] as const,
    list: (status?: string) => ['permission-requests', 'list', status] as const,
    mine: ['permission-requests', 'mine'] as const,
  },
  hr: {
    employees: (dept?: string, status?: string, search?: string) =>
      ['hr', 'employees', dept, status, search] as const,
    employeeProjects: (id: string) => ['hr', 'employees', id, 'projects'] as const,
    syncStatus: ['hr', 'sync-status'] as const,
  },
};
