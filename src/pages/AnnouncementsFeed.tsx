import React, { useState, useEffect } from "react";


export default function AnnouncementsFeed() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [notificationType, setNotificationType] = useState("announcement");
  const [pendingActions, setPendingActions] = useState([]);
  const [urgentAlerts, setUrgentAlerts] = useState([]);


  // Load announcements from localStorage when component mounts
  useEffect(() => {
    const savedAnnouncements = localStorage.getItem("announcements");
    if (savedAnnouncements) {
      setPosts(JSON.parse(savedAnnouncements));
    } else {
      // Default notifications including system-generated ones
      const defaultPosts = [
        {
          id: "AN-1",
          title: "Eid Office Timings",
          body: "Adjusted office timings for Eid week.",
          audience: "All",
          type: "announcement",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: "PA-1",
          title: "Attendance Acknowledgment Required",
          body: "Your attendance for May 9, 2026 needs to be acknowledged. Please review and confirm.",
          audience: "Employee",
          type: "pending_action",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          actionRequired: true,
          actionUrl: "/attendance"
        },
        {
          id: "UA-1",
          title: "System Maintenance Alert",
          body: "Scheduled system maintenance tonight from 11 PM to 1 AM. Services may be unavailable.",
          audience: "All",
          type: "urgent_alert",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          priority: "high"
        },
        {
          id: "PA-2",
          title: "Leave Request Pending Approval",
          body: "Your leave request for May 15-16 is pending manager approval.",
          audience: "Employee",
          type: "pending_action",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          actionRequired: true,
          actionUrl: "/leave"
        }
      ];
      setPosts(defaultPosts);
      localStorage.setItem("announcements", JSON.stringify(defaultPosts));
    }
  }, []);


  // Save to localStorage whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem("announcements", JSON.stringify(posts));
      // Dispatch custom event to notify Dashboard
      window.dispatchEvent(new Event("announcementUpdate"));
    }
  }, [posts]);


  // Add new notification
  const addAnnouncement = () => {
    if (!title.trim() || !body.trim()) return;
    const newPost = {
      id: `${notificationType.toUpperCase().slice(0, 2)}-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      audience: "All",
      type: notificationType,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...(notificationType === "pending_action" && { actionRequired: true, actionUrl: "/dashboard" }),
      ...(notificationType === "urgent_alert" && { priority: "medium" })
    };
    setPosts((prev) => [newPost, ...prev]);
    setTitle("");
    setBody("");
    setNotificationType("announcement");
  };


  // Delete announcement
  const deleteAnnouncement = (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      setPosts((prev) => prev.filter((post) => post.id !== id));
    }
  };


  // Start editing
  const startEdit = (post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  };


  // Save edited announcement
  const saveEdit = (id) => {
    if (!editTitle.trim() || !editBody.trim()) return;
    setPosts((prev) => prev.map((post) =>
      post.id === id
        ? {
            ...post,
            title: editTitle.trim(),
            body: editBody.trim(),
            updatedAt: new Date().toISOString()
          }
        : post
    ));
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };


  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };


  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };


  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Notifications Center</div>
          <div className="pg-sub">Announcements, pending actions, and urgent alerts for the organization.</div>
        </div>
      </div>


      {/* Add Announcement Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Create New Notification</h3>
        <div className="form-group">
          <label className="form-label">Type *</label>
          <select
            className="input"
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
          >
            <option value="announcement">📢 Announcement</option>
            <option value="pending_action">⏰ Pending Action</option>
            <option value="urgent_alert">🚨 Urgent Alert</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea
            className="input"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message"
          />
        </div>
        <button className="btn btn-primary" onClick={addAnnouncement}>
          Post Notification
        </button>
      </div>


      {/* Announcements List */}
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>
          All Notifications ({posts.length})
        </h3>
       
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--t3)", padding: "40px 0" }}>
            No notifications yet. Create your first notification above!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--br2)",
                borderRadius: "8px",
                marginBottom: "12px",
                background: post.type === "urgent_alert" ? "#fef2f2" : post.type === "pending_action" ? "#fefce8" : "#f8fafc",
                border: post.type === "urgent_alert" ? "1px solid #fecaca" : post.type === "pending_action" ? "1px solid #fde68a" : "1px solid var(--br2)"
              }}
            >
              {editingId === post.id ? (
                // Edit Mode
                <div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Title</label>
                    <input
                      className="input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Message</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => saveEdit(post.id)}
                      style={{ padding: "6px 12px", fontSize: 14 }}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={cancelEdit}
                      style={{ padding: "6px 12px", fontSize: 14 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                        {post.type === "announcement" && "📢 "}
                        {post.type === "pending_action" && "⏰ "}
                        {post.type === "urgent_alert" && "🚨 "}
                        {post.title}
                        <span style={{
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          background: post.type === "urgent_alert" ? "#dc2626" : post.type === "pending_action" ? "#d97706" : "#6366f1",
                          color: "white"
                        }}>
                          {post.type.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 8, lineHeight: 1.5 }}>
                        {post.body}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--t4)" }}>
                        {formatDate(post.timestamp)}
                        {post.updatedAt && (
                          <span style={{ marginLeft: 8 }}>• Edited</span>
                        )}
                      </div>
                      {post.actionRequired && (
                        <div style={{ marginTop: 8 }}>
                          <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                            Take Action
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
                      <button
                        onClick={() => startEdit(post)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--primary)",
                          fontSize: 14,
                          padding: "4px 8px"
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(post.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#dc2626",
                          fontSize: 14,
                          padding: "4px 8px"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
