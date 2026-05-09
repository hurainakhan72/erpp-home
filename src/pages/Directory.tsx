import React from "react";

const rows = [
  { name: "Head Office", contact: "042-111-000", manager: "Sara Khan", city: "Lahore" },
  { name: "Branch B", contact: "021-111-000", manager: "Usman Malik", city: "Karachi" },
];

export default function Directory() {
  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Office Phonebook / Branch Directory</div>
          <div className="pg-sub">Branch contacts and point-of-contact directory.</div>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Branch</th><th>Contact</th><th>Manager</th><th>City</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className="mono">{row.contact}</td>
                <td>{row.manager}</td>
                <td>{row.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
