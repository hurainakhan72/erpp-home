import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVisibleEmployees(user: { role: string; departments?: string[]; branch?: string } | null, activeRole: string, employees: any[]) {
  if (!user || activeRole !== 'hr' || user.role !== 'hr') return employees;
  let filtered = employees;
  if (user.branch && user.branch !== 'All') {
    filtered = filtered.filter(emp => emp.workLocation === user.branch);
  }
  if (user.departments && user.departments.length > 0 && !user.departments.includes('All')) {
    filtered = filtered.filter(emp => user.departments?.includes(emp.department));
  }
  return filtered;
}











