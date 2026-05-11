import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Search, LogOut, ShieldCheck as ShieldIcon, LayoutDashboard, Users, CalendarCheck, CalendarDays, DollarSign, TrendingUp, ScrollText, Settings, ClipboardList, Clock, CalendarRange, Bell, Zap, Wallet } from "lucide-react";
import { useData } from "../../context/DataContext";
import { getVisibleEmployees } from "../../utils/utils";

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/launchpad": "Launchpad",
  "/hr/branch-dashboard": "Branch HR Dashboard",
  "/penalty-workflow": "Penalty Workflow",
  "/leave-capacity": "Leave Capacity",
  "/onboarding": "Onboarding",
  "/org-management": "Org Management",
  "/attendance-verification": "Attendance Verification",
  "/attendance-head-review": "Head HR Review",
  "/attendance-report": "Attendance Report",
  "/leave-wallet": "Leave Wallet",
  "/penalty-ledger": "Penalty Ledger",
  "/announcements": "Announcements",
  "/security-settings": "Security Settings",
  "/directory": "Branch Directory",
  "/employees": "Employees",
  "/employees/add": "Add Employee",
  "/attendance": "Attendance",
  "/leave": "Leave Management",
  "/payroll": "Payroll",
  "/promotions": "Promotions",
  "/accounts": "HR Accounts",
  "/audit-log": "Audit Log",
  "/my-dashboard": "My Dashboard",
  "/my-attendance": "My Attendance",
  "/my-payslips": "My Payslips",
  "/my-leave": "Leave",
  "/my-penalties": "My Penalties",
  "/my-profile": "My Profile",
};

export default function Topbar() {
  const auth = useAuth(); // Poora object le rahe hain error se bachne ke liye
  const { leaveRequests, employees } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
      navigate("/login", { replace: true });
    }
  };

  const pageName =
    routeNames[location.pathname] ||
    (location.pathname.startsWith("/settings/")
      ? location.pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Page");

  const dateStr = time.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Role display logic
  const displayRole = auth?.user?.displayRole ||
                      (auth?.user?.role === 'super_admin' ? 'Super Admin' : 
                      auth?.user?.role === 'hr' ? 'HR Module' : 'Employee');

  const routeIcons: Record<string, any> = {
    '/launchpad': Zap,
    '/dashboard': LayoutDashboard,
    '/hr/branch-dashboard': LayoutDashboard,
    '/penalty-workflow': ClipboardList,
    '/leave-capacity': CalendarDays,
    '/onboarding': Users,
    '/org-management': Settings,
    '/attendance-verification': CalendarCheck,
    '/attendance-head-review': ShieldIcon,
    '/attendance-report': ClipboardList,
    '/leave-wallet': Wallet,
    '/penalty-ledger': ClipboardList,
    '/announcements': Bell,
    '/security-settings': ShieldIcon,
    '/directory': Users,
    '/employees': Users,
    '/employees/add': Users,
    '/attendance': CalendarCheck,
    '/leave': CalendarDays,
    '/payroll': DollarSign,
    '/promotions': TrendingUp,
    '/accounts': ShieldIcon,
    '/audit-log': ScrollText,
    '/my-dashboard': LayoutDashboard,
    '/my-attendance': CalendarCheck,
    '/my-payslips': CalendarRange,
    '/my-leave': CalendarDays,
    '/my-leave-wallet': Wallet,
    '/my-penalties': ClipboardList,
    '/my-profile': Users,
  };

  const currentIcon = routeIcons[location.pathname] || (location.pathname.startsWith('/settings/') ? Settings : LayoutDashboard);
  const PageIcon = currentIcon;

  const visibleEmployees = getVisibleEmployees(auth.user, auth.activeRole, employees);
  const visibleEmployeeIds = new Set(visibleEmployees.map(e => e.id));
  const notifications = leaveRequests.filter((item: any) => item.status === "Pending" && visibleEmployeeIds.has(item.empId)).slice(0, 5);

  return (
    <div className="topbar">
      <div className="bc">
        <span className="bc-home">EMS</span>
        <span className="bc-sep">·</span>
        {PageIcon && <PageIcon size={14} className="bc-icon" />}
        <span className="bc-cur">{pageName}</span>
      </div>

      <div className="topbar-search" style={{ marginLeft: "auto", marginRight: 8 }}>
        <Search size={13} style={{ color: "var(--t3)" }} />
        <span>Search employees, records, reports...</span>
        <kbd>⌘K</kbd>
      </div>

      <div className="topbar-right">
        {/* Module Label - No more switcher */}
        <div className="active-role-display" style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(37, 99, 235, 0.1)', 
          padding: '4px 12px', 
          borderRadius: '8px',
          border: '1px solid rgba(37, 99, 235, 0.2)'
        }}>
          <ShieldIcon size={14} color="#2563eb" />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase' }}>
             {displayRole}
          </span>
        </div>

        <span className="tdate">{dateStr}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: "relative" }}>
            <button className="ico-btn" onClick={() => setShowNotifications((prev) => !prev)}>
              <Bell size={14} />
              {notifications.length > 0 && <span className="n-pip" />}
            </button>
            {showNotifications && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "#fff", border: "1px solid var(--br)", borderRadius: 12, boxShadow: "var(--sh2)", zIndex: 99 }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--br2)", fontSize: 12, fontWeight: 700 }}>
                  Pending Notifications
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {notifications.length ? notifications.map((note: any) => (
                    <button
                      key={note.id}
                      onClick={() => {
                        navigate("/leave");
                        setShowNotifications(false);
                      }}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "10px 12px", borderBottom: "1px solid var(--br2)", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>{note.empName}</div>
                      <div style={{ fontSize: 10, color: "var(--t3)" }}>{note.leaveType} leave request</div>
                    </button>
                  )) : <div style={{ padding: "12px", fontSize: 11, color: "var(--t3)" }}>No pending alerts</div>}
                </div>
              </div>
            )}
          </div>
          <div className="t-av">
            {auth?.user?.username?.substring(0, 2).toUpperCase() || "UN"}
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              background: '#fee2e2', 
              color: '#ef4444', 
              border: 'none', 
              padding: '6px', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}










