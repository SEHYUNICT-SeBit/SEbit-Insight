export interface ColumnMapping {
  csvColumn: string;
  targetField: string | null;
}

export const TARGET_FIELDS = [
  { key: 'name', label: '프로젝트명', required: true },
  { key: 'type', label: '유형 (SI/SM)', required: true },
  { key: 'department', label: '부서', required: true },
  { key: 'client_name', label: '계약처', required: true },
  { key: 'contract_amount', label: '계약금액', required: true },
  { key: 'start_date', label: '시작일', required: true },
  { key: 'end_date', label: '종료일', required: true },
  { key: 'sales_rep_name', label: '영업대표', required: false },
  { key: 'pm_name', label: 'PM', required: false },
  { key: 'description', label: '설명/비고', required: false },
  { key: 'status', label: '상태', required: false },
] as const;

const FIELD_ALIASES: Record<string, string[]> = {
  name: ['프로젝트명', '프로젝트 명', 'project_name', '과제명', '사업명', '프로젝트이름'],
  type: ['유형', 'type', '구분', 'SI/SM', '사업유형', '프로젝트유형'],
  department: ['부서', 'department', '부서명', '담당부서', '사업부', '소속부서'],
  client_name: ['계약처', '고객사', 'client', '계약처명', '발주처', '고객', '거래처'],
  contract_amount: ['계약금액', '수주금액', 'contract_amount', '금액', '계약액', '수주액'],
  start_date: ['시작일', 'start_date', '착수일', '개시일', '시작', '계약시작일'],
  end_date: ['종료일', 'end_date', '완료일', '마감일', '종료', '계약종료일'],
  sales_rep_name: ['영업대표', '영업담당', 'sales_rep', '영업', '수주담당', '영업담당자'],
  pm_name: ['PM', 'pm', '프로젝트매니저', '담당PM', '담당자', 'PM명'],
  description: ['설명', 'description', '비고', '메모', '내용', '프로젝트설명'],
  status: ['상태', 'status', '진행상태', '프로젝트상태'],
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[\s_-]+/g, '');
}

export function autoMapColumns(csvHeaders: string[]): ColumnMapping[] {
  const usedTargets = new Set<string>();

  return csvHeaders.map((header) => {
    const norm = normalize(header);
    let bestMatch: string | null = null;

    for (const [targetField, aliases] of Object.entries(FIELD_ALIASES)) {
      if (usedTargets.has(targetField)) continue;

      if (norm === normalize(targetField)) {
        bestMatch = targetField;
        break;
      }

      for (const alias of aliases) {
        const normAlias = normalize(alias);
        if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
          bestMatch = targetField;
          break;
        }
      }
      if (bestMatch) break;
    }

    if (bestMatch) usedTargets.add(bestMatch);
    return { csvColumn: header, targetField: bestMatch };
  });
}
