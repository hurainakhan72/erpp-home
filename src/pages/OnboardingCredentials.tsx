import React, { useState } from "react";

export default function OnboardingCredentials() {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("EMP100");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const generate = () => {
    const u = name.toLowerCase().replace(/\s+/g, ".") || "new.user";
    setUsername(u);
    setPassword(`Temp@${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Onboarding & Credential Generation</div>
          <div className="pg-sub">Create employee profile and generate temporary credentials.</div>
        </div>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Employee Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={generate}>Generate Credentials</button>

        {(username || password) && (
          <div style={{ marginTop: 14, background: "var(--pl)", padding: 12, borderRadius: 10 }}>
            <div className="mono">Username: {username}</div>
            <div className="mono">Temp Password: {password}</div>
          </div>
        )}
      </div>
    </div>
  );
}
