import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVisibleEmployees(user: { role: string; departments?: string[] } | null, activeRole: string, employees: any[]) {
  if (!user || activeRole !== 'hr' || user.role !== 'hr') return employees;
  if (!user.departments || user.departments.length === 0 || user.departments.includes('All')) return employees;
  return employees.filter(emp => user.departments?.includes(emp.department));
}











