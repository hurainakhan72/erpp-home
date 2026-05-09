import React, { useState } from "react";

export default function SecuritySettings() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!current || !next || !confirm) return setMessage("Fill all fields.");
    if (next !== confirm) return setMessage("New password and confirm password do not match.");
    setMessage("Password updated successfully.");
    setCurrent(""); setNext(""); setConfirm("");
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Settings & Password Management</div>
          <div className="pg-sub">Update account security and credentials.</div>
        </div>
      </div>
      <div className="card">
        <div className="form-group"><label className="form-label">Current Password</label><input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">New Password</label><input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Confirm Password</label><input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={submit}>Save Password</button>
        {message && <div style={{ marginTop: 10, color: "var(--t2)" }}>{message}</div>}
      </div>
    </div>
  );
}
