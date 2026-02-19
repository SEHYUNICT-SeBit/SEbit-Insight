import type { ColumnMapping } from './column-mapper';

export interface ValidationMessage {
  field: string;
  message: string;
}

export interface RowValidation {
  status: 'valid' | 'warning' | 'error';
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export interface MappedProject {
  name: string;
  type: string;
  department_names: string[];
  department_ids: string[];
  client_name: string;
  client_id: string | null;
  sales_rep_name: string;
  sales_rep_id: string | null;
  pm_name: string;
  pm_id: string | null;
  pm_type: 'employee' | 'freelancer';
  contract_amount: number;
  start_date: string;
  end_date: string;
  description: string;
  status: string;
}

export interface ParsedRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: MappedProject;
  validation: RowValidation;
  selected: boolean;
}

interface RefData {
  departments: { id: string; name: string }[];
  employees: { id: string; name: string; department_id?: string }[];
  clients: { id: string; name: string }[];
}

function normalizeDate(value: string): string | null {
  if (!value) return null;
  const v = value.trim();

  // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const isoMatch = v.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // YYYYMMDD
  const compactMatch = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  return null;
}

function parseAmount(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[,\s원]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeType(value: string): string {
  const v = value.trim().toUpperCase();
  if (v === 'SI' || v === 'SM') return v;
  if (v.includes('SI')) return 'SI';
  if (v.includes('SM')) return 'SM';
  return v;
}

function findDepartment(name: string, departments: RefData['departments']): { id: string; name: string } | null {
  const norm = name.trim().toLowerCase();
  // exact match
  const exact = departments.find((d) => d.name.toLowerCase() === norm || d.id.toLowerCase() === norm);
  if (exact) return exact;
  // partial match
  const partial = departments.find((d) => d.name.toLowerCase().includes(norm) || norm.includes(d.name.toLowerCase()));
  return partial || null;
}

function findEmployee(name: string, employees: RefData['employees']): { id: string; name: string } | null {
  const norm = name.trim();
  return employees.find((e) => e.name === norm) || null;
}

function findClient(name: string, clients: RefData['clients']): { id: string; name: string } | null {
  const norm = name.trim().toLowerCase();
  return clients.find((c) => c.name.toLowerCase() === norm) || null;
}

export function applyMapping(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  refData: RefData,
  autoCreateClients: boolean,
): ParsedRow[] {
  const fieldMap = new Map<string, string>();
  for (const m of mappings) {
    if (m.targetField) fieldMap.set(m.targetField, m.csvColumn);
  }

  const getValue = (row: Record<string, string>, field: string): string => {
    const col = fieldMap.get(field);
    return col ? (row[col] || '').trim() : '';
  };

  return rows.map((row, idx) => {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];

    // Extract values
    const name = getValue(row, 'name');
    const typeRaw = getValue(row, 'type');
    const deptRaw = getValue(row, 'department');
    const clientRaw = getValue(row, 'client_name');
    const amountRaw = getValue(row, 'contract_amount');
    const startRaw = getValue(row, 'start_date');
    const endRaw = getValue(row, 'end_date');
    const salesRepRaw = getValue(row, 'sales_rep_name');
    const pmRaw = getValue(row, 'pm_name');
    const description = getValue(row, 'description');
    const statusRaw = getValue(row, 'status');

    // Validate required fields
    if (!name) errors.push({ field: 'name', message: '프로젝트명 필수' });

    const type = normalizeType(typeRaw);
    if (!['SI', 'SM'].includes(type)) {
      errors.push({ field: 'type', message: `유형이 올바르지 않음: "${typeRaw}"` });
    }

    // Department resolution
    const deptNames = deptRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    const deptIds: string[] = [];
    const resolvedDeptNames: string[] = [];
    if (deptNames.length === 0) {
      errors.push({ field: 'department', message: '부서 필수' });
    } else {
      for (const dn of deptNames) {
        const found = findDepartment(dn, refData.departments);
        if (found) {
          deptIds.push(found.id);
          resolvedDeptNames.push(found.name);
        } else {
          errors.push({ field: 'department', message: `부서를 찾을 수 없음: "${dn}"` });
        }
      }
    }

    // Client resolution
    let clientId: string | null = null;
    if (!clientRaw) {
      errors.push({ field: 'client_name', message: '계약처 필수' });
    } else {
      const foundClient = findClient(clientRaw, refData.clients);
      if (foundClient) {
        clientId = foundClient.id;
      } else if (autoCreateClients) {
        warnings.push({ field: 'client_name', message: `미등록 계약처 자동 생성: "${clientRaw}"` });
      } else {
        errors.push({ field: 'client_name', message: `계약처를 찾을 수 없음: "${clientRaw}"` });
      }
    }

    // Amount
    const contractAmount = parseAmount(amountRaw);
    if (!amountRaw || contractAmount <= 0) {
      errors.push({ field: 'contract_amount', message: '계약금액 필수 (양수)' });
    }

    // Dates
    const startDate = normalizeDate(startRaw);
    const endDate = normalizeDate(endRaw);
    if (!startDate) errors.push({ field: 'start_date', message: `시작일 형식 오류: "${startRaw}"` });
    if (!endDate) errors.push({ field: 'end_date', message: `종료일 형식 오류: "${endRaw}"` });

    // Optional: sales rep
    let salesRepId: string | null = null;
    if (salesRepRaw) {
      const found = findEmployee(salesRepRaw, refData.employees);
      if (found) {
        salesRepId = found.id;
      } else {
        warnings.push({ field: 'sales_rep_name', message: `직원을 찾을 수 없음: "${salesRepRaw}"` });
      }
    }

    // Optional: PM
    let pmId: string | null = null;
    let pmType: 'employee' | 'freelancer' = 'employee';
    if (pmRaw) {
      const found = findEmployee(pmRaw, refData.employees);
      if (found) {
        pmId = found.id;
      } else {
        pmType = 'freelancer';
        warnings.push({ field: 'pm_name', message: `직원 미매칭, 프리랜서로 처리: "${pmRaw}"` });
      }
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

    return {
      rowIndex: idx + 1,
      raw: row,
      mapped: {
        name,
        type,
        department_names: resolvedDeptNames,
        department_ids: deptIds,
        client_name: clientRaw,
        client_id: clientId,
        sales_rep_name: salesRepRaw,
        sales_rep_id: salesRepId,
        pm_name: pmRaw,
        pm_id: pmId,
        pm_type: pmType,
        contract_amount: contractAmount,
        start_date: startDate || '',
        end_date: endDate || '',
        description,
        status: statusRaw || 'active',
      },
      validation: { status, errors, warnings },
      selected: status !== 'error',
    };
  });
}
