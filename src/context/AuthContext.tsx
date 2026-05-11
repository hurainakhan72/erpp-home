import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useData } from './DataContext';

export interface User {
  username: string;
  role: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee';
  employeeId?: string;
  branch?: string | null;
  departments?: string[];
}

interface AuthContextType {
  user: User | null;
  activeRole: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee';
  loading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACCOUNTS: Record<string, { password: string; role: 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee'; employeeId?: string; branch?: string | null; departments?: string[] }> = {
  superadmin: { password: 'admin123', role: 'super_admin' },
  head_hr: { password: 'headhr123', role: 'head_hr', departments: ['All'] },
  branch_hr_ho1: { password: 'branch123', role: 'branch_hr', branch: 'Head Office', departments: ['All'] },
  emp001: { password: 'emp123', role: 'employee', employeeId: 'EMP001' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('ems_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [activeRole, setActiveRole] = useState<'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee'>(() => {
    const stored = localStorage.getItem('ems_user');
    return stored ? JSON.parse(stored).role : 'employee';
  });
  const { hrAccounts } = useData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const lowerUser = username.toLowerCase();
    const hrAccount = hrAccounts.find((a: any) => a.username.toLowerCase() === lowerUser && a.password === password && a.status === 'Active');
    if (hrAccount) {
      const employeeId = hrAccount.linkedEmployee?.split(' ')[0];
      const u: User = {
        username: hrAccount.username,
        role: hrAccount.role as 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee',
        employeeId,
        branch: hrAccount.branch || null,
        departments: hrAccount.departments || ['All'],
      };
      setUser(u);
      setActiveRole(hrAccount.role as 'super_admin' | 'head_hr' | 'branch_hr' | 'department_hr' | 'employee');
      localStorage.setItem('ems_user', JSON.stringify(u));
      localStorage.setItem('ems_token', 'dummy');
      return true;
    }

    const account = ACCOUNTS[lowerUser];
    if (account && account.password === password) {
      const u: User = { 
        username, 
        role: account.role, 
        employeeId: account.employeeId, 
        branch: account.branch || null,
        departments: account.departments 
      };
      setUser(u);
      setActiveRole(u.role);
      localStorage.setItem('ems_user', JSON.stringify(u));
      localStorage.setItem('ems_token', 'dummy');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');
  };

  const switchRole = (role: 'super_admin' | 'hr' | 'employee') => {
    setActiveRole(role);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}











