export const DEPARTMENT_COLORS: Record<string, string> = {
  SE: '#3B82F6',       // blue-500
  SM: '#10B981',       // emerald-500
  AI: '#8B5CF6',       // violet-500
  CONTENT: '#F59E0B',  // amber-500
  RND: '#EF4444',      // red-500
};

export const DEPARTMENT_BG_CLASSES: Record<string, string> = {
  SE: 'bg-blue-100 text-blue-700',
  SM: 'bg-emerald-100 text-emerald-700',
  AI: 'bg-violet-100 text-violet-700',
  CONTENT: 'bg-amber-100 text-amber-700',
  RND: 'bg-red-100 text-red-700',
};

export function getDepartmentColor(departmentId: string): string {
  return DEPARTMENT_COLORS[departmentId] || '#6B7280';
}

export function getDepartmentBgClass(departmentId: string): string {
  return DEPARTMENT_BG_CLASSES[departmentId] || 'bg-gray-100 text-gray-700';
}
