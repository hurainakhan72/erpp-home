import React, { useMemo, useState } from "react";
import { Lock, LockOpen, ShieldAlert } from "lucide-react";
import { useData } from "../context/DataContext";

const statuses = ["Present", "Late", "Absent", "On Leave"];

export default function BranchHRDashboard() {
  const { allAttendanceToday, attendanceLocks, setAttendanceLocks } = useData();
  const [selectedBranch, setSelectedBranch] = useState("Head Office");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const branches = useMemo(() => {
    const unique = Array.from(new Set(allAttendanceToday.map((row: any) => row.branch || "Head Office")));
    return unique.length ? unique : ["Head Office"];
  }, [allAttendanceToday]);

  const rows = allAttendanceToday.filter(
    (row: any) => (row.branch || "Head Office") === selectedBranch
  );

  const lockKey = `${selectedBranch}-${selectedDate}`;
  const lockState = attendanceLocks[lockKey] || { status: "unlocked", lockedBy: "", lockedAt: "" };
  const isLocked = lockState.status === "locked";

  const breakdown = statuses.map((status) => ({
    status,
    count: rows.filter((row: any) => row.status === status).length,
  }));

  const toggleLock = () => {
    const now = new Date().toISOString();
    setAttendanceLocks((prev: any) => ({
      ...prev,
      [lockKey]: isLocked
        ? { status: "unlocked", lockedBy: "", lockedAt: "" }
        : { status: "locked", lockedBy: "Branch HR", lockedAt: now },
    }));
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Branch-wise HR Dashboard</div>
          <div className="pg-sub">Monitor attendance and lock sheets branch by branch.</div>
        </div>
        <button className={`btn ${isLocked ? "btn-danger" : "btn-primary"}`} onClick={toggleLock}>
          {isLocked ? <LockOpen size={14} /> : <Lock size={14} />}
          {isLocked ? "Unlock Sheet" : "Lock Sheet"}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="form-label">Branch</label>
            <select
              className="select-input"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Attendance Date</label>
            <input
              className="input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div
        className="attendance-banner"
        style={{
          marginBottom: 14,
          background: isLocked ? "rgba(239,68,68,.12)" : "rgba(16,185,129,.12)",
          borderColor: isLocked ? "rgba(239,68,68,.25)" : "rgba(16,185,129,.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={14} />
          <span>
            {isLocked ? "Sheet Locked" : "Sheet Open"} for <b>{selectedBranch}</b> on <b>{selectedDate}</b>
          </span>
        </div>
        <span className={`pill ${isLocked ? "pill-red" : "pill-green"}`}>
          {isLocked ? "LOCKED" : "UNLOCKED"}
        </span>
      </div>

      <div className="attendance-summary-cards">
        {breakdown.map((item) => (
          <div key={item.status} className="summary-card summary-card-blue">
            <div className="summary-label">{item.status}</div>
            <div className="summary-value">{item.count}</div>
          </div>
        ))}
      </div>

      <div className="card attendance-table-card" style={{ marginTop: 14 }}>
        <div className="table-wrap" style={{ maxHeight: "unset" }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.empId}>
                  <td>{row.name}</td>
                  <td>{row.dept}</td>
                  <td>{row.shift}</td>
                  <td>{row.checkIn}</td>
                  <td>
                    <span className="pill pill-blue">{row.status}</span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--t3)" }}>
                    No attendance records available for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
