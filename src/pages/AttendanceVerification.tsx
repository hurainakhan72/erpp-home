import React, { useState } from "react";
import { useData } from "../context/DataContext";

export default function AttendanceVerification() {
  const { allAttendanceToday } = useData();
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const toggleAck = (empId: string) =>
    setAcknowledged((prev) => (prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]));

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Employee Verification & Attendance Acknowledge</div>
          <div className="pg-sub">Verify daily records and acknowledge exceptions.</div>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Emp ID</th><th>Name</th><th>Status</th><th>Verify</th><th>Acknowledge</th></tr></thead>
          <tbody>
            {allAttendanceToday.map((row: any) => (
              <tr key={row.empId}>
                <td className="mono">{row.empId}</td>
                <td>{row.name}</td>
                <td><span className="pill pill-blue">{row.status}</span></td>
                <td><span className="pill pill-green">Verified</span></td>
                <td>
                  <button className={`btn btn-sm ${acknowledged.includes(row.empId) ? "btn-secondary" : "btn-primary"}`} onClick={() => toggleAck(row.empId)}>
                    {acknowledged.includes(row.empId) ? "Acknowledged" : "Acknowledge"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
