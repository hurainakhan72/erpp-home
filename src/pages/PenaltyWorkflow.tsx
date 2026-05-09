import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type PenaltyCase = {
  id: string;
  employee: string;
  branch: string;
  amount: number;
  reason: string;
  status: "branch_pending" | "ho_pending" | "approved" | "rejected";
};

const seed: PenaltyCase[] = [
  { id: "PNW-001", employee: "Usman Malik", branch: "Head Office", amount: 2500, reason: "Late attendance 5 days", status: "branch_pending" },
  { id: "PNW-002", employee: "Fatima Raza", branch: "Branch B", amount: 1500, reason: "Policy breach", status: "ho_pending" },
];

export default function PenaltyWorkflow() {
  const [cases, setCases] = useState(seed);

  const move = (id: string, to: PenaltyCase["status"]) =>
    setCases((prev) => prev.map((row) => (row.id === id ? { ...row, status: to } : row)));

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Approval Workflow</div>
          <div className="pg-sub">Branch review, HO approval and rejection tracking.</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Employee</th><th>Branch</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td>{row.employee}</td>
                <td>{row.branch}</td>
                <td className="mono">PKR {row.amount.toLocaleString()}</td>
                <td>{row.reason}</td>
                <td>
                  <span className={`pill ${row.status === "approved" ? "pill-green" : row.status === "rejected" ? "pill-red" : "pill-amber"}`}>
                    {row.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {row.status === "branch_pending" && (
                      <button className="btn btn-sm btn-secondary" onClick={() => move(row.id, "ho_pending")}>
                        Send to HO
                      </button>
                    )}
                    {row.status === "ho_pending" && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => move(row.id, "approved")}>
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => move(row.id, "rejected")}>
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
