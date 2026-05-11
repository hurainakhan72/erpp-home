// pages/Dashboard.tsx
// ──────────────────────────────────────────────────────────────────────────────
// Role-based greetings & data:
//   SuperAdmin  → badge "Super Admin"         — full company, branch dropdown
//   HeadHR      → badge "Head HR"             — full company, branch dropdown
//   hr (branch) → badge "Branch HR · KHI"     — only branch data
//   hr (dept)   → badge "Dept HR · Eng · KHI" — only dept data, dept wheel shown
//   employee    → badge "Employee"            — own data only
//
// Calendar: reads `calendarEvents` from DataContext
//   Shape: { id, title, date: "YYYY-MM-DD", color?: string }[]
//   Mini-calendar shows coloured dots on event days.
//   Clicking a day with events shows a small popover.
//   If DataContext doesn't expose calendarEvents yet, add it and default to [].
//
// Birthdays: each row is clickable → navigates to /employees/:id
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { getVisibleEmployees } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, CalendarDays, AlertTriangle,
  Activity, Cake, TrendingUp, BarChart3, Plus,
  Megaphone, Bell, ShieldAlert, FileText,
  Target, Award, Building2, ChevronRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  { title: "Office Closure — Eid ul Fitr", date: "Mar 20, 2026", text: "Office closed March 28–April 1 for Eid ul Fitr celebrations." },
  { title: "Annual Performance Review",    date: "Mar 15, 2026", text: "FY 2025-26 reviews begin April 5. All managers should prepare evaluations." },
  { title: "New Health Insurance Policy",  date: "Mar 10, 2026", text: "Updated coverage now includes dental and vision for all full-time employees." },
];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const AV_COLORS   = ["#6366f1","#ec4899","#f97316","#14b8a6","#a855f7","#06b6d4","#10b981","#f59e0b"];
const WDAYS       = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const G = `
  *{box-sizing:border-box;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  .pg{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;}
  .hc{cursor:pointer;transition:transform .18s,box-shadow .18s;}
  .hc:hover{transform:translateY(-5px) scale(1.015);}
  .hc:active{transform:scale(.97);}
  .fc{animation:fadeUp .4s ease both;}
  .rh{transition:background .12s;border-radius:8px;}
  .rh:hover{background:#f5f7ff;}
  .rh-bd{transition:background .12s;border-radius:8px;}
  .rh-bd:hover{background:#fdf2f8;}
  .nb{transition:opacity .15s,transform .15s;}
  .nb:hover{opacity:.85;transform:translateY(-1px);}
  .ni:hover{background:#f0f4ff!important;}
  .cal-day{
    width:28px;height:28px;border-radius:7px;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-size:11px;cursor:pointer;transition:background .12s;position:relative;
    gap:1px;
  }
  .cal-day:hover{background:#ede9fe;}
  .cal-day.today{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;}
  .cal-day.today .ev-dot{background:rgba(255,255,255,.9)!important;}
  .cal-day.other-month{color:#d1d5db;}
  .cal-day.has-ev{font-weight:600;}
  .ev-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0;}
  .ev-pop{
    animation:popIn .15s ease both;
    position:absolute;top:34px;left:50%;transform:translateX(-50%);
    background:#1e1b4b;color:#fff;border-radius:10px;
    padding:8px 12px;min-width:148px;max-width:210px;
    z-index:300;box-shadow:0 10px 28px rgba(0,0,0,.22);
    font-size:10px;line-height:1.5;white-space:normal;
  }
  .ev-pop::before{
    content:'';position:absolute;top:-5px;left:50%;transform:translateX(-50%);
    width:10px;height:5px;background:#1e1b4b;
    clip-path:polygon(50% 0%,0% 100%,100% 100%);
  }
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
`;

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const Chip = ({ bg, fg, children }: { bg:string; fg:string; children:React.ReactNode }) => (
  <span style={{background:bg,color:fg,padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>
);
const Prog = ({ pct, color }: { pct:number; color:string }) => (
  <div style={{height:5,background:"#f1f5f9",borderRadius:4,overflow:"hidden",marginTop:5}}>
    <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,borderRadius:4,transition:"width .8s ease"}}/>
  </div>
);
const Av = ({ ini, color, size=32 }: { ini:string; color:string; size?:number }) => (
  <div style={{width:size,height:size,borderRadius:size*.3,background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.29,fontWeight:700,flexShrink:0}}>{ini}</div>
);
const WCard = ({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) => (
  <div className="fc" style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 10px rgba(0,0,0,.07)",...style}}>{children}</div>
);
const SHead = ({ icon, title, right }: { icon:React.ReactNode; title:string; right?:React.ReactNode }) => (
  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
    {icon}
    <span style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>{title}</span>
    {right && <div style={{marginLeft:"auto"}}>{right}</div>}
  </div>
);

// ─── Role detection ───────────────────────────────────────────────────────────
function detectRoleKind(activeRole: string, user: any): string {
  const branch  = user?.branch || "";
  const depts: string[] = user?.departments || [];
  const noB  = !branch || branch === "All";
  const noD  = !depts.length || depts.includes("All");

  if (activeRole === "SuperAdmin") return "super_admin";
  if (activeRole === "HeadHR")     return "head_hr";
  if (activeRole === "hr") {
    if (noB)        return "head_hr";
    if (!noB && noD) return "branch_hr";
    return "dept_hr";
  }
  return "employee";
}

// ─── Role UI config ───────────────────────────────────────────────────────────
function getRoleInfo(kind: string, user: any) {
  const branch  = user?.branch || "";
  const depts   = ((user?.departments || []) as string[]).filter(d => d !== "All");
  const deptLbl = depts.join(", ") || "All Departments";

  switch (kind) {
    case "super_admin": return {
      greetLabel:     "Super Admin",
      badgeText:      "Super Admin",
      badgeBg: "#ede9fe", badgeFg: "#6d28d9",
      scopeBanner:    null as string|null,
      showBranchDrop: true,
      isAdmin:        true,
    };
    case "head_hr": return {
      greetLabel:     "Head HR",
      badgeText:      "Head HR",
      badgeBg: "#dbeafe", badgeFg: "#1d4ed8",
      scopeBanner:    "Full company access · All branches & departments",
      showBranchDrop: true,
      isAdmin:        true,
    };
    case "branch_hr": return {
      greetLabel:     `Branch HR — ${branch}`,
      badgeText:      `Branch HR · ${branch}`,
      badgeBg: "#d1fae5", badgeFg: "#065f46",
      scopeBanner:    `Branch: ${branch} · All departments`,
      showBranchDrop: false,
      isAdmin:        true,
    };
    case "dept_hr": return {
      greetLabel:     `Dept HR — ${deptLbl} · ${branch}`,
      badgeText:      `Dept HR · ${deptLbl} · ${branch}`,
      badgeBg: "#fff7ed", badgeFg: "#c2410c",
      scopeBanner:    `Branch: ${branch} · Department: ${deptLbl}`,
      showBranchDrop: false,
      isAdmin:        true,
    };
    default: return {
      greetLabel:     "Employee",
      badgeText:      "Employee",
      badgeBg: "#f3f4f6", badgeFg: "#6b7280",
      scopeBanner:    null as string|null,
      showBranchDrop: false,
      isAdmin:        false,
    };
  }
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
// events: { id, title, date: "YYYY-MM-DD", color?: string }[]
type CalEvent = { id: string|number; title: string; date: string; color?: string };

function MiniCalendar({ events, onNavigate }: { events: CalEvent[]; onNavigate: ()=>void }) {
  const [view,   setView]   = useState(new Date());
  const [popIdx, setPopIdx] = useState<number|null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const today   = new Date();
  const year    = view.getFullYear();
  const month   = view.getMonth();

  // Close popover on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPopIdx(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // "YYYY-MM-DD" → events[]
  const evMap = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    events.forEach(ev => {
      if (!m[ev.date]) m[ev.date] = [];
      m[ev.date].push(ev);
    });
    return m;
  }, [events]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const cells: { day:number; cur:boolean }[] = [];
  for (let i = firstDay-1; i >= 0; i--) cells.push({ day: daysInPrev-i, cur: false });
  for (let d = 1; d <= daysInMonth; d++)  cells.push({ day: d, cur: true });
  while (cells.length < 42) cells.push({ day: cells.length-daysInMonth-firstDay+1, cur: false });

  return (
    <div ref={wrapRef}>
      {/* Month navigation */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>setView(new Date(year,month-1,1))} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 8px",borderRadius:7,fontSize:15,color:"#6b7280",fontWeight:700}}>‹</button>
        <span style={{fontSize:12,fontWeight:700,color:"#1e1b4b"}}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={()=>setView(new Date(year,month+1,1))} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 8px",borderRadius:7,fontSize:15,color:"#6b7280",fontWeight:700}}>›</button>
      </div>

      {/* Weekday headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {WDAYS.map(d => <div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#9ca3af",padding:"2px 0"}}>{d}</div>)}
      </div>

      {/* Day grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((c, idx) => {
          const isToday = c.cur && c.day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
          const key = c.cur
            ? `${year}-${String(month+1).padStart(2,"0")}-${String(c.day).padStart(2,"0")}`
            : "";
          const dayEvs = key ? (evMap[key] || []) : [];
          const hasEv  = dayEvs.length > 0;
          const open   = popIdx === idx;

          return (
            <div
              key={idx}
              className={["cal-day", isToday?"today":"", !c.cur?"other-month":"", hasEv&&c.cur?"has-ev":""].join(" ")}
              style={{margin:"0 auto",position:"relative"}}
              onClick={() => { if (c.cur && hasEv) setPopIdx(open ? null : idx); }}
            >
              <span style={{lineHeight:1,fontSize:11}}>{c.day}</span>

              {/* Event dots */}
              {hasEv && c.cur && (
                <div style={{display:"flex",gap:2,alignItems:"center",height:5}}>
                  {dayEvs.slice(0,3).map((ev,ei) => (
                    <span key={ei} className="ev-dot" style={{background:ev.color||"#6366f1"}}/>
                  ))}
                </div>
              )}

              {/* Popover */}
              {open && hasEv && (
                <div className="ev-pop">
                  <div style={{fontWeight:700,marginBottom:5,fontSize:11,borderBottom:"1px solid rgba(255,255,255,.18)",paddingBottom:4}}>
                    {MONTH_NAMES[month].slice(0,3)} {c.day}
                  </div>
                  {dayEvs.map((ev,ei) => (
                    <div key={ei} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:ev.color||"#a5b4fc",flexShrink:0}}/>
                      <span>{ev.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{textAlign:"center",marginTop:13}}>
        <button
          onClick={onNavigate}
          style={{background:"linear-gradient(135deg,#eef2ff,#ede9fe)",border:"1px solid #c7d2fe",borderRadius:20,padding:"5px 20px",fontSize:11,fontWeight:700,color:"#6366f1",cursor:"pointer"}}
        >
          📅 View Full Calendar →
        </button>
      </div>
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ data, total, title, subtitle }: {
  data: {name:string;value:number;color:string}[];
  total: number;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <SHead icon={<Users size={14} color="#a855f7"/>} title={title}/>
      <p style={{margin:"-10px 0 12px",fontSize:10,color:"#9ca3af"}}>{subtitle}</p>
      {data.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af",fontSize:12}}>No data available</div>
      ) : (
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{position:"relative",width:140,height:140,flexShrink:0}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" stroke="none">
                  {data.map((_,i) => <Cell key={i} fill={data[i].color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:800,color:"#1e1b4b"}}>{total}</div>
              <div style={{fontSize:8,color:"#9ca3af"}}>TOTAL</div>
            </div>
          </div>
          <div style={{flex:1}}>
            {data.map((d,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",fontSize:11,borderBottom:"1px solid #f8fafc"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:d.color,flexShrink:0}}/>
                <span style={{flex:1,color:"#374151"}}>{d.name}</span>
                <span style={{fontWeight:700,color:"#1e1b4b"}}>{d.value}</span>
                <span style={{color:"#d1d5db",fontSize:10,width:28,textAlign:"right"}}>
                  {total>0?Math.round((d.value/total)*100):0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user, activeRole } = useAuth();

  // calendarEvents default [] — add it to DataContext if not present yet
  // Shape: { id, title, date: "YYYY-MM-DD", color?: string }[]
  const { leaveRequests, employees, calendarEvents = [] } = useData() as any;
  const navigate = useNavigate();

  const [now,         setNow]         = useState(new Date());
  const [showNotif,   setShowNotif]   = useState(false);
  const [hovCard,     setHovCard]     = useState<number|null>(null);
  const [chartBranch, setChartBranch] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Role ──────────────────────────────────────────────────────────────────────
  const roleKind = useMemo(() => detectRoleKind(activeRole, user), [activeRole, user]);
  const roleInfo = useMemo(() => getRoleInfo(roleKind, user),      [roleKind, user]);

  const { greetLabel, badgeText, badgeBg, badgeFg,
          scopeBanner, showBranchDrop, isAdmin } = roleInfo;

  const isBranchHR = roleKind === "branch_hr";
  const isDeptHR   = roleKind === "dept_hr";

  const bannerBg    = isDeptHR ? "#fff7ed" : isBranchHR ? "#f0fdf4" : "#eef2ff";
  const bannerBdr   = isDeptHR ? "#fed7aa" : isBranchHR ? "#bbf7d0" : "#c7d2fe";
  const bannerColor = isDeptHR ? "#c2410c" : isBranchHR ? "#15803d" : "#6366f1";
  const bannerIcon  = isDeptHR ? "#ea580c" : isBranchHR ? "#16a34a" : "#6366f1";

  // ── Employees scoped to role ──────────────────────────────────────────────────
  const visEmp = useMemo(
    () => getVisibleEmployees(user, activeRole, employees) as any[],
    [user, activeRole, employees]
  );

  const allBranches = useMemo(() => {
    const s = new Set<string>();
    (employees as any[]).forEach(e => { if (e.branch) s.add(e.branch); });
    return Array.from(s).sort();
  }, [employees]);

  const chartEmps = useMemo(() => {
    if (showBranchDrop && chartBranch)
      return visEmp.filter(e => (e.branch || "Head Office") === chartBranch);
    return visEmp;
  }, [visEmp, showBranchDrop, chartBranch]);

  // ── Leave ─────────────────────────────────────────────────────────────────────
  const visIds   = useMemo(() => new Set(visEmp.map((e:any) => e.id)), [visEmp]);
  const visLeave = useMemo(
    () => (leaveRequests || []).filter((l:any) => visIds.has(l.empId)),
    [leaveRequests, visIds]
  );

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const totalEmp  = visEmp.length;
  const activeEmp = visEmp.filter((e:any) => e.status === "active").length;
  const pendingLv = visLeave.filter((l:any) => l.status === "Pending").length;
  const attendPct = totalEmp > 0 ? Math.round((activeEmp/totalEmp)*100) : 88;

  // ── Header strings ────────────────────────────────────────────────────────────
  const uName     = (user as any)?.name || "User";
  const h         = now.getHours();
  const greetWord = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dateStr   = now.toLocaleDateString("en-PK",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const timeStr   = now.toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});

  // ── Chart data ────────────────────────────────────────────────────────────────
  const deptData = useMemo(() => {
    const c: Record<string,number> = {};
    chartEmps.forEach((e:any) => { c[e.department]=(c[e.department]||0)+1; });
    return Object.entries(c).map(([name,value],i) => ({name,value,color:AV_COLORS[i%AV_COLORS.length]}));
  }, [chartEmps]);

  const branchData = useMemo(() => {
    const c: Record<string,number> = {};
    visEmp.forEach((e:any) => { const b=e.branch||"Head Office"; c[b]=(c[b]||0)+1; });
    return Object.entries(c).map(([name,value],i) => ({name,value,color:AV_COLORS[i%AV_COLORS.length]}));
  }, [visEmp]);

  // ── Wheel config per role ─────────────────────────────────────────────────────
  const wheelCfg = useMemo(() => {
    const branch  = (user as any)?.branch || "";
    const depts   = ((user as any)?.departments||[]).filter((d:string)=>d!=="All") as string[];
    const deptLbl = depts.join(", ") || "Department";

    // SA / HeadHR
    if (showBranchDrop) {
      if (chartBranch) return {
        data: deptData, total: chartEmps.length,
        title: `Dept Distribution — ${chartBranch}`,
        sub: `Headcount by department in ${chartBranch}`,
      };
      return {
        data: branchData, total: totalEmp,
        title: "Branch Distribution",
        sub: "Headcount by branch · All company",
      };
    }
    // Branch HR
    if (isBranchHR) return {
      data: deptData, total: visEmp.length,
      title: `Dept Distribution — ${branch}`,
      sub: `Headcount by department · ${branch}`,
    };
    // Dept HR — always show wheel, fallback to single slice if data empty
    if (isDeptHR) {
      const fallback = [{ name: deptLbl, value: visEmp.length, color: AV_COLORS[0] }];
      return {
        data: deptData.length ? deptData : fallback,
        total: visEmp.length,
        title: `${deptLbl} · ${branch}`,
        sub: `Dept headcount · Branch: ${branch}`,
      };
    }
    // Employee
    return {
      data: deptData, total: visEmp.length,
      title: "Department Distribution",
      sub: "Your department overview",
    };
  }, [showBranchDrop, chartBranch, isBranchHR, isDeptHR, user,
      deptData, branchData, chartEmps, visEmp, totalEmp]);

  // Attendance chart
  const attendChart = useMemo(() => {
    const base = Math.max(chartEmps.length, 8);
    return MONTH_NAMES.slice(-6).map((m,i) => {
      const present = Math.max(base-Math.round(base*.1)-(i%2), 1);
      return {month:m.slice(0,3), present, absent:Math.max(base-present,0)};
    });
  }, [chartEmps.length]);

  // Growth chart
  const growthChart = useMemo(() => {
    const base = Math.max(totalEmp, 24);
    return MONTH_NAMES.slice(-6).map((m,i) => ({month:m.slice(0,3), count:Math.max(1,base-2+i)}));
  }, [totalEmp]);

  // Leave breakdown
  const leaveChart = useMemo(() => {
    const totals = {Annual:120, Casual:80, Sick:60, Maternity:30};
    const colors  = {Annual:"#6366f1", Casual:"#f97316", Sick:"#ef4444", Maternity:"#ec4899"};
    const used: Record<string,number> = {};
    visLeave.forEach((l:any) => { used[l.leaveType]=(used[l.leaveType]||0)+l.days; });
    return (Object.keys(totals) as (keyof typeof totals)[]).map(t => ({
      type:t, used:used[t]||0, total:totals[t], color:colors[t],
    }));
  }, [visLeave]);

  // Top performers
  const topP = useMemo(() => {
    const src = visEmp.length ? visEmp.slice(0,4) : [
      {name:"Sara Khan",  department:"Sales",       color:"#f97316"},
      {name:"Ali Raza",   department:"Engineering", color:"#6366f1"},
      {name:"Hina Malik", department:"HR",          color:"#ec4899"},
      {name:"Bilal Ahmed",department:"Marketing",   color:"#14b8a6"},
    ];
    return src.map((e:any,i:number) => ({
      name:  e.name||"—", dept: e.department||"—",
      score: 88+Math.floor((i*3.5)%11),
      ini:   (e.name||"?").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase(),
      color: e.color||AV_COLORS[i%AV_COLORS.length],
    }));
  }, [visEmp]);

  // Upcoming birthdays (next 30 days)
  const birthdays = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const list: any[] = [];
    visEmp.forEach((emp:any, idx:number) => {
      if (!emp.dob) return;
      const dob  = new Date(emp.dob);
      let bday   = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (bday < today) bday = new Date(today.getFullYear()+1, dob.getMonth(), dob.getDate());
      const days = Math.ceil((bday.getTime()-today.getTime())/86400000);
      if (days <= 30) list.push({
        name: emp.name, dept: emp.department||"—", daysUntil: days, empId: emp.id,
        ini:  (emp.name||"?").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase(),
        color: AV_COLORS[idx%AV_COLORS.length],
      });
    });
    return list.sort((a,b) => a.daysUntil-b.daysUntil);
  }, [visEmp]);

  // Notifications
  const notifs = useMemo(() => [
    {id:1, title:"Leave Request Pending",   msg:`${pendingLv} requests awaiting approval`,     time:"Just now",   link:"/leave",      read:false},
    {id:2, title:"Incomplete Attendance",   msg:"3 employees haven't marked attendance today", time:"2 hrs ago",  link:"/attendance", read:false},
    {id:3, title:"Contract Expiry Alert",   msg:"Usman Malik's contract expires in 8 days",    time:"Yesterday",  link:"/employees",  read:false},
    {id:4, title:"New Employee Onboarded",  msg:"Bilal Ahmed added successfully",              time:"Yesterday",  link:"/employees",  read:true },
    {id:5, title:"Probation Period Ending", msg:"Fatima Raza's probation ends in 12 days",     time:"2 days ago", link:"/employees",  read:true },
  ], [pendingLv]);
  const unread = notifs.filter(n=>!n.read).length;

  // Hero cards
  const hCards = [
    {grad:"linear-gradient(135deg,#667eea,#764ba2)",glow:"rgba(102,126,234,.45)",icon:<Users size={20} color="#fff"/>,        val:totalEmp,  label:"Total Employees",sub:"Within your scope", chip:"Scoped",       link:"/employees" },
    {grad:"linear-gradient(135deg,#11998e,#38ef7d)", glow:"rgba(17,153,142,.4)", icon:<UserCheck size={20} color="#fff"/>,    val:activeEmp, label:"Active Today",   sub:"Live attendance",  chip:"● Live",       link:"/attendance"},
    {grad:"linear-gradient(135deg,#b721ff,#21d4fd)", glow:"rgba(183,33,255,.35)",icon:<CalendarDays size={20} color="#fff"/>, val:pendingLv, label:"Pending Leaves", sub:"Need approval",    chip:"Action Needed",link:"/leave"     },
  ];
  const kpis = [
    {label:"Attendance Rate",   pct:attendPct, color:"#10b981", target:90},
    {label:"Leave Utilization", pct:42,        color:"#f97316", target:60},
    {label:"On-time Rate",      pct:93,        color:"#6366f1", target:95},
    {label:"Staff Retention",   pct:94,        color:"#ec4899", target:95},
  ];
  const actions = [
    {emoji:"📋", text:`${pendingLv||2} leave requests awaiting approval`, cta:"Review →", link:"/leave"     },
    {emoji:"⏰", text:"Attendance incomplete — 3 employees",              cta:"Mark →",   link:"/attendance"},
    {emoji:"🏦", text:"Bank info missing — EMP004, EMP005",               cta:"Fix →",    link:"/employees" },
  ];
  const alerts = [
    {name:"Usman Malik",sub:"Contract expiry in 8 days", chip:"URGENT",    bg:"#fef2f2",fg:"#dc2626"},
    {name:"Fatima Raza",sub:"Probation ends in 12 days", chip:"PROBATION", bg:"#fefce8",fg:"#ca8a04"},
    {name:"Bilal Ahmed",sub:"Bank info missing",          chip:"MISSING",   bg:"#eff6ff",fg:"#2563eb"},
    {name:"Ahmed Ali",  sub:"Absent 3 consecutive days",  chip:"ABSENT",    bg:"#fef2f2",fg:"#dc2626"},
  ];
  const activity = [
    {ini:"SK",color:"#f97316",text:"Sara Khan's leave approved", time:"2 hrs ago", by:"Super Admin",chip:"Approved",cBg:"#dcfce7",cFg:"#166534"},
    {ini:"BA",color:"#6366f1",text:"Bilal Ahmed added",          time:"Yesterday", by:"HR",         chip:"New Hire",cBg:"#eff6ff",cFg:"#2563eb"},
    {ini:"UM",color:"#ef4444",text:"Usman's leave rejected",     time:"3 days ago",by:"HR",         chip:"Rejected",cBg:"#fef2f2",cFg:"#dc2626"},
    {ini:"FR",color:"#14b8a6",text:"Fatima's salary updated",    time:"4 days ago",by:"Super Admin",chip:"Updated", cBg:"#f0fdf4",cFg:"#166534"},
  ];

  // Attendance subtitle
  const attendSub = (() => {
    let s = "Present vs Absent · Last 6 months";
    if (showBranchDrop && chartBranch) return s+` · ${chartBranch}`;
    if (isBranchHR) return s+` · ${(user as any)?.branch||""}`;
    if (isDeptHR)   return s+` · ${((user as any)?.departments||[]).filter((d:string)=>d!=="All").join(", ")}`;
    return s;
  })();

  // Branch dropdown component
  const BranchDrop = () => (
    <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}>
      <span style={{fontSize:10,color:"#6b7280",fontWeight:600}}>Branch:</span>
      <select
        value={chartBranch}
        onChange={e=>setChartBranch(e.target.value)}
        style={{padding:"4px 10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:11,color:"#374151",background:"#fff",cursor:"pointer",fontWeight:500,outline:"none"}}
      >
        <option value="">All Branches</option>
        {allBranches.map(b=><option key={b} value={b}>{b}</option>)}
      </select>
      {chartBranch && (
        <button onClick={()=>setChartBranch("")} style={{fontSize:11,color:"#9ca3af",background:"none",border:"none",cursor:"pointer",fontWeight:700,lineHeight:1}}>✕</button>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{G}</style>
      <div className="pg" style={{padding:"22px 28px",background:"#f8f9fc",minHeight:"100vh"}}>

        {/* ── Scope banner ── */}
        {scopeBanner && (
          <div style={{
            background:bannerBg, border:`1px solid ${bannerBdr}`,
            borderRadius:12, padding:"9px 16px", marginBottom:16,
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
          }}>
            <Building2 size={14} color={bannerIcon}/>
            <span style={{fontSize:12,fontWeight:700,color:bannerColor}}>{scopeBanner}</span>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <p style={{margin:0,fontSize:12,color:"#9ca3af"}}>{greetWord},</p>
            <h1 style={{margin:"2px 0 0",fontSize:27,fontWeight:800,color:"#1e1b4b",display:"flex",alignItems:"center",gap:10,lineHeight:1.15,flexWrap:"wrap"}}>
              {uName} 👋
              <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"#dcfce7",padding:"3px 10px",borderRadius:20,fontSize:9,fontWeight:700,color:"#166534"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s infinite"}}/>
                LIVE
              </span>
            </h1>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,flexWrap:"wrap"}}>
              {/* Role badge — exact role, never "User" */}
              <span style={{background:badgeBg,color:badgeFg,padding:"4px 14px",borderRadius:20,fontSize:11,fontWeight:700,border:`1px solid ${badgeFg}22`}}>
                {badgeText}
              </span>
              {/* Role subtitle — "Branch HR — Karachi" / "Dept HR — Eng · KHI" etc. */}
              <span style={{fontSize:12,fontWeight:600,color:"#6b7280"}}>{greetLabel}</span>
              <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>📅 {dateStr} &nbsp;·&nbsp; 🕐 {timeStr} PKT</p>
            </div>
          </div>

          {/* Notifications + Add Employee */}
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <button className="nb" onClick={()=>setShowNotif(v=>!v)} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:40,padding:"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#374151",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                <Bell size={15} color="#6b7280"/> Alerts
                {unread>0&&<span style={{position:"absolute",top:-6,right:-6,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:20,minWidth:18,textAlign:"center"}}>{unread}</span>}
              </button>
              {showNotif&&(
                <>
                  <div style={{position:"fixed",inset:0,zIndex:990}} onClick={()=>setShowNotif(false)}/>
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:310,background:"#fff",borderRadius:14,boxShadow:"0 16px 40px rgba(0,0,0,.14)",zIndex:999,overflow:"hidden"}}>
                    <div style={{padding:"11px 14px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>Notifications</span>
                      <span style={{fontSize:10,color:"#9ca3af"}}>{unread} unread</span>
                    </div>
                    <div style={{maxHeight:320,overflowY:"auto"}}>
                      {notifs.map(n=>(
                        <div key={n.id} className="ni" style={{padding:"11px 14px",borderBottom:"1px solid #f3f4f6",cursor:"pointer",background:n.read?"#fff":"#fffbeb"}} onClick={()=>{navigate(n.link);setShowNotif(false);}}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                            <div style={{fontSize:12,fontWeight:600,color:"#1e1b4b"}}>{n.title}</div>
                            {!n.read&&<span style={{width:6,height:6,borderRadius:"50%",background:"#3b82f6",flexShrink:0,marginTop:3}}/>}
                          </div>
                          <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{n.msg}</div>
                          <div style={{fontSize:9,color:"#d1d5db",marginTop:3}}>{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {isAdmin&&(
              <button className="nb" onClick={()=>navigate("/employees/add")} style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:30,padding:"9px 20px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 14px rgba(99,102,241,.4)"}}>
                <Plus size={13}/> Add Employee
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:18}}>
          {hCards.map((c,i)=>(
            <div key={i} className="hc" style={{background:c.grad,borderRadius:18,padding:"20px",color:"#fff",position:"relative",overflow:"hidden",minHeight:130,boxShadow:hovCard===i?`0 20px 44px ${c.glow}`:"0 6px 20px rgba(0,0,0,.10)"}} onClick={()=>navigate(c.link)} onMouseEnter={()=>setHovCard(i)} onMouseLeave={()=>setHovCard(null)}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,.22)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>{c.icon}</div>
              <div style={{fontSize:32,fontWeight:800,lineHeight:1}}>{c.val}</div>
              <div style={{fontSize:11,opacity:.9,marginTop:4}}>{c.label}</div>
              <div style={{fontSize:10,opacity:.65,marginTop:2}}>{c.sub}</div>
              <span style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.22)",borderRadius:20,padding:"3px 9px",fontSize:9,fontWeight:700}}>{c.chip}</span>
              <div style={{position:"absolute",width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.07)",bottom:-18,right:-18}}/>
              <div style={{position:"absolute",width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.06)",bottom:20,right:28}}/>
              <div style={{position:"absolute",bottom:12,right:14,fontSize:9,opacity:.5,display:"flex",alignItems:"center",gap:3}}>View <span style={{fontSize:11}}>↗</span></div>
            </div>
          ))}
        </div>

        {/* ── KPI Strip ── */}
        <WCard style={{marginBottom:18,padding:"14px 22px"}}>
          <SHead icon={<Target size={14} color="#6366f1"/>} title="Key Performance Indicators" right={<span style={{fontSize:10,color:"#9ca3af"}}>Monthly targets</span>}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
            {kpis.map((k,i)=>(
              <div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:11,color:"#6b7280"}}>{k.label}</span>
                  <span style={{fontSize:16,fontWeight:800,color:k.color}}>{k.pct}%</span>
                </div>
                <Prog pct={k.pct} color={k.color}/>
                <div style={{fontSize:9,color:"#d1d5db",marginTop:3}}>Target {k.target}%</div>
              </div>
            ))}
          </div>
        </WCard>

        {/* ── Charts Row 1 ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>

          {/* Attendance bar */}
          <WCard>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
              <BarChart3 size={14} color="#6366f1"/>
              <span style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>Monthly Attendance</span>
              <Chip bg="#dcfce7" fg="#166634">↗ +5.2%</Chip>
              {showBranchDrop && <BranchDrop/>}
            </div>
            <p style={{margin:"0 0 10px",fontSize:10,color:"#9ca3af"}}>{attendSub}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={attendChart} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:10,border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.1)",fontSize:11}} cursor={{fill:"#f8fafc"}}/>
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4,4,0,0]} barSize={18}/>
                <Bar dataKey="absent"  name="Absent"  fill="#ef4444" radius={[4,4,0,0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </WCard>

          {/* Donut wheel — all roles */}
          <WCard>
            <DonutChart data={wheelCfg.data} total={wheelCfg.total} title={wheelCfg.title} subtitle={wheelCfg.sub}/>
            {showBranchDrop && (
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:"#6b7280"}}>Viewing:</span>
                <span style={{fontSize:11,fontWeight:700,color:"#6366f1"}}>{chartBranch||"All Branches"}</span>
                {chartBranch&&<button onClick={()=>setChartBranch("")} style={{fontSize:10,color:"#9ca3af",background:"none",border:"none",cursor:"pointer"}}>✕ Clear</button>}
              </div>
            )}
          </WCard>
        </div>

        {/* ── Charts Row 2 ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <WCard>
            <SHead icon={<TrendingUp size={14} color="#10b981"/>} title="Headcount Growth" right={<span style={{fontSize:12,fontWeight:800,color:"#10b981"}}>{totalEmp} ↑</span>}/>
            <ResponsiveContainer width="100%" height={185}>
              <AreaChart data={growthChart}>
                <defs>
                  <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a855f7" stopOpacity={.18}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:"#9ca3af"}} axisLine={false} tickLine={false} domain={["dataMin - 10","dataMax + 10"]}/>
                <Tooltip contentStyle={{borderRadius:10,border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.1)",fontSize:11}} cursor={{stroke:"#e2e8f0"}}/>
                <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5} fill="url(#gr1)" dot={{r:4,fill:"#a855f7",stroke:"#fff",strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </WCard>

          <WCard>
            <SHead icon={<FileText size={14} color="#f97316"/>} title="Leave Breakdown" right={pendingLv>0?<Chip bg="#fef3c7" fg="#d97706">{pendingLv} Pending</Chip>:undefined}/>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <div style={{position:"relative",width:130,height:130,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leaveChart} cx="50%" cy="50%" innerRadius={35} outerRadius={53} dataKey="used" stroke="none">
                      {leaveChart.map((_,i)=><Cell key={i} fill={leaveChart[i].color}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#1e1b4b"}}>{leaveChart.reduce((a,b)=>a+b.used,0)}</div>
                  <div style={{fontSize:8,color:"#9ca3af"}}>TOTAL</div>
                </div>
              </div>
              <div style={{flex:1}}>
                {leaveChart.map((d,i)=>(
                  <div key={i} style={{marginBottom:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                      <span style={{color:"#374151",display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:d.color,display:"inline-block"}}/>
                        {d.type}
                      </span>
                      <span style={{fontWeight:700,color:"#1e1b4b"}}>{d.used}<span style={{color:"#d1d5db",fontWeight:400}}>/{d.total}</span></span>
                    </div>
                    <Prog pct={(d.used/d.total)*100} color={d.color}/>
                  </div>
                ))}
              </div>
            </div>
          </WCard>
        </div>

        {/* ── 3-Col Row ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
          <WCard>
            <SHead icon={<AlertTriangle size={14} color="#f59e0b"/>} title="Pending Actions" right={<Chip bg="#fef3c7" fg="#d97706">{actions.length}</Chip>}/>
            {actions.map((a,i)=>(
              <div key={i} className="rh" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 6px",borderBottom:i<actions.length-1?"1px solid #f3f4f6":"none"}}>
                <span style={{fontSize:15}}>{a.emoji}</span>
                <span style={{flex:1,fontSize:11,color:"#374151",lineHeight:1.4}}>{a.text}</span>
                <button onClick={()=>navigate(a.link)} style={{background:"none",border:"none",color:"#6366f1",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{a.cta}</button>
              </div>
            ))}
          </WCard>

          <WCard>
            <SHead icon={<ShieldAlert size={14} color="#ef4444"/>} title="Urgent Alerts" right={<Chip bg="#fef2f2" fg="#dc2626">{alerts.length}</Chip>}/>
            {alerts.map((a,i)=>(
              <div key={i} className="rh" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 6px",borderBottom:i<alerts.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#1e1b4b"}}>{a.name}</div>
                  <div style={{fontSize:9,color:"#9ca3af",marginTop:2}}>{a.sub}</div>
                </div>
                <Chip bg={a.bg} fg={a.fg}>{a.chip}</Chip>
              </div>
            ))}
          </WCard>

          <WCard>
            <SHead icon={<Award size={14} color="#f59e0b"/>} title="Top Performers" right={<Chip bg="#fefce8" fg="#ca8a04">This Month</Chip>}/>
            {topP.map((p,i)=>(
              <div key={i} className="rh" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 6px",borderBottom:i<topP.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{width:30,height:30,borderRadius:8,background:p.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?14:9,fontWeight:700,flexShrink:0}}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":p.ini}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#1e1b4b"}}>{p.name}</div>
                  <div style={{fontSize:9,color:"#9ca3af"}}>{p.dept}</div>
                </div>
                <span style={{fontSize:13,fontWeight:800,color:"#10b981"}}>{p.score}%</span>
              </div>
            ))}
          </WCard>
        </div>

        {/* ── Activity + Announcements ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <WCard>
            <SHead icon={<Activity size={14} color="#6b7280"/>} title="Recent Activity" right={<button onClick={()=>navigate("/audit-log")} style={{background:"none",border:"none",fontSize:10,color:"#6366f1",fontWeight:600,cursor:"pointer",padding:0}}>View All →</button>}/>
            {activity.map((a,i)=>(
              <div key={i} className="rh" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 6px",borderBottom:i<activity.length-1?"1px solid #f3f4f6":"none"}}>
                <Av ini={a.ini} color={a.color} size={32}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#374151"}}>{a.text}</div>
                  <div style={{fontSize:9,color:"#d1d5db",marginTop:2}}>{a.time} · {a.by}</div>
                </div>
                <Chip bg={a.cBg} fg={a.cFg}>{a.chip}</Chip>
              </div>
            ))}
          </WCard>

          <WCard>
            <SHead icon={<Megaphone size={14} color="#f59e0b"/>} title="Announcements"/>
            {ANNOUNCEMENTS.map((a,i)=>(
              <div key={i} style={{padding:"10px 0",borderBottom:i<ANNOUNCEMENTS.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#1e1b4b",lineHeight:1.3}}>{a.title}</span>
                  <span style={{fontSize:9,color:"#d1d5db",whiteSpace:"nowrap",marginTop:2}}>{a.date}</span>
                </div>
                <p style={{margin:"4px 0 0",fontSize:10,color:"#9ca3af",lineHeight:1.55}}>{a.text}</p>
              </div>
            ))}
          </WCard>
        </div>

        {/* ── Calendar + Birthdays ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>

          {/* ── Mini Calendar — events from DataContext ── */}
          <WCard>
            <SHead
              icon={<CalendarDays size={14} color="#6366f1"/>}
              title="Calendar"
              right={
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {/* Show total event count if any exist */}
                  {calendarEvents.length > 0 && (
                    <span style={{background:"#eef2ff",color:"#6366f1",padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>
                      {calendarEvents.length} events
                    </span>
                  )}
                  <button onClick={()=>navigate("/calendar")} style={{fontSize:11,color:"#6366f1",fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>
                    View Full →
                  </button>
                </div>
              }
            />
            {/*
              Colour legend for event types (if events exist)
              Uses unique colors from calendarEvents
            */}
            {calendarEvents.length > 0 && (
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                {Array.from(
                  new Map((calendarEvents as CalEvent[]).map(e => [e.color||"#6366f1", e.title])).entries()
                ).slice(0,5).map(([color, title], i) => (
                  <span key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#6b7280"}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:color as string,flexShrink:0}}/>
                    {String(title).split(" ")[0]}
                  </span>
                ))}
              </div>
            )}
            <MiniCalendar events={calendarEvents} onNavigate={()=>navigate("/calendar")}/>
          </WCard>

          {/* ── Upcoming Birthdays — each row clickable ── */}
          <WCard>
            <SHead
              icon={<Cake size={14} color="#ec4899"/>}
              title="Upcoming Birthdays"
              right={
                <span style={{background:"#fdf2f8",color:"#ec4899",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>
                  {birthdays.length} this month
                </span>
              }
            />
            {birthdays.length === 0 ? (
              <div
                style={{textAlign:"center",padding:"36px 20px",cursor:"pointer"}}
                onClick={()=>navigate("/employees")}
              >
                <div style={{fontSize:28}}>🎉</div>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:8}}>No birthdays in the next 30 days</div>
                <div style={{fontSize:10,color:"#c7d2fe",marginTop:5}}>View all employees →</div>
              </div>
            ) : (
              <div style={{maxHeight:340,overflowY:"auto"}}>
                {birthdays.map((b,i) => (
                  // ── Clickable row → /employees/:id ──
                  <div
                    key={i}
                    className="rh-bd"
                    onClick={()=>navigate(b.empId ? `/employees/${b.empId}` : "/employees")}
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"10px 6px", cursor:"pointer",
                      borderBottom:i<birthdays.length-1?"1px solid #f3f4f6":"none",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width:36,height:36,borderRadius:10,flexShrink:0,
                      background:b.daysUntil===0
                        ?"linear-gradient(135deg,#ec4899,#fbcfe8)"
                        :"linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color:"#fff",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:b.daysUntil===0?16:11,fontWeight:700,
                    }}>
                      {b.daysUntil===0?"🎂":b.ini}
                    </div>

                    {/* Name + dept */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#1e1b4b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</div>
                      <div style={{fontSize:9,color:"#9ca3af",marginTop:1}}>{b.dept}</div>
                    </div>

                    {/* Days badge */}
                    <div style={{
                      background:b.daysUntil===0?"#ec4899":b.daysUntil<=3?"#f59e0b":"#eff6ff",
                      color:b.daysUntil<=3?"#fff":"#6366f1",
                      padding:"3px 8px",borderRadius:16,fontSize:9,fontWeight:600,
                      whiteSpace:"nowrap",flexShrink:0,
                    }}>
                      {b.daysUntil===0?"Today":b.daysUntil===1?"Tomorrow":`${b.daysUntil}d`}
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={12} color="#d1d5db" style={{flexShrink:0}}/>
                  </div>
                ))}
              </div>
            )}
          </WCard>
        </div>

      </div>
    </>
  );
}