import React, { useState } from "react";
import { useData } from "../context/DataContext";

export default function OrgManagement() {
  const { departments, setDepartments, designations, setDesignations } = useData();
  const [branches, setBranches] = useState(["Head Office", "Branch B"]);
  const [branchName, setBranchName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [desigName, setDesigName] = useState("");

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Branch / Department / Designation Management</div>
          <div className="pg-sub">Central org structure management for HR modules.</div>
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <div className="ct">Branches</div>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            <input className="input" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            <button className="btn btn-sm btn-primary" onClick={() => branchName && setBranches((p) => [...p, branchName])}>Add</button>
          </div>
          {branches.map((b) => <div key={b} className="mono" style={{ padding: "6px 0" }}>{b}</div>)}
        </div>

        <div className="card">
          <div className="ct">Departments</div>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            <input className="input" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
            <button className="btn btn-sm btn-primary" onClick={() => deptName && setDepartments((p) => [...p, deptName])}>Add</button>
          </div>
          {departments.map((d) => <div key={d} className="mono" style={{ padding: "6px 0" }}>{d}</div>)}
        </div>

        <div className="card">
          <div className="ct">Designations</div>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            <input className="input" value={desigName} onChange={(e) => setDesigName(e.target.value)} />
            <button className="btn btn-sm btn-primary" onClick={() => desigName && setDesignations((p) => [...p, desigName])}>Add</button>
          </div>
          {designations.map((d) => <div key={d} className="mono" style={{ padding: "6px 0" }}>{d}</div>)}
        </div>
      </div>
    </div>
  );
}
