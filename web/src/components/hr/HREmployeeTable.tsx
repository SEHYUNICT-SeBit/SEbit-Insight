'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FolderKanban } from 'lucide-react';
import { useDepartments } from '@/hooks/useMasterData';
import { useUpdateEmployee } from '@/hooks/useHR';
import type { Employee, EmploymentStatus } from '@/types/master.types';
import { EMPLOYMENT_STATUS_CONFIG } from '@/types/master.types';

const roleLabels: Record<string, string> = {
  master: '마스터',
  admin: '어드민',
  manager: '매니저',
  user: '사용자',
};

interface HREmployeeTableProps {
  employees: Employee[];
  onViewProjects: (employeeId: string) => void;
}

export function HREmployeeTable({ employees, onViewProjects }: HREmployeeTableProps) {
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.data || [];
  const updateMutation = useUpdateEmployee();

  const handleDeptChange = (employeeId: string, departmentId: string) => {
    updateMutation.mutate({ id: employeeId, data: { department_id: departmentId } });
  };

  const handleStatusChange = (employeeId: string, status: string) => {
    updateMutation.mutate({ id: employeeId, data: { employment_status: status as EmploymentStatus } });
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        조건에 맞는 직원이 없습니다.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">이름</th>
            <th className="text-left px-4 py-3 font-medium">이메일</th>
            <th className="text-left px-4 py-3 font-medium">부서</th>
            <th className="text-left px-4 py-3 font-medium">직급</th>
            <th className="text-left px-4 py-3 font-medium">재직상태</th>
            <th className="text-left px-4 py-3 font-medium">역할</th>
            <th className="text-center px-4 py-3 font-medium">투입 과제</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const statusConfig = EMPLOYMENT_STATUS_CONFIG[emp.employment_status] || EMPLOYMENT_STATUS_CONFIG['재직'];
            return (
              <tr key={emp.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{emp.email}</td>
                <td className="px-4 py-2">
                  <Select
                    className="h-8 text-xs w-36"
                    value={emp.department_id || ''}
                    onValueChange={(value) => handleDeptChange(emp.id, value)}
                  >
                    <option value="">미배정</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">{emp.position}</td>
                <td className="px-4 py-2">
                  <Select
                    className="h-8 text-xs w-24"
                    value={emp.employment_status || '재직'}
                    onValueChange={(value) => handleStatusChange(emp.id, value)}
                  >
                    <option value="재직">재직</option>
                    <option value="휴직">휴직</option>
                    <option value="병가">병가</option>
                    <option value="퇴직">퇴직</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${statusConfig.className}`}>
                    {roleLabels[emp.role] || emp.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewProjects(emp.id)}
                    title="투입 과제 보기"
                  >
                    <FolderKanban className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
