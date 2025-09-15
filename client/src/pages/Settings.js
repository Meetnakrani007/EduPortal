import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import api from "../api";
import { useNavigate } from "react-router-dom";

const fontSizes = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const defaultProfilePic =
  "https://ui-avatars.com/api/?name=User&background=3B82F6&color=fff&size=128";

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { fontSize, setFontSize } = useTheme();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profilePic, setProfilePic] = useState(user?.avatar || "");
  const [picPreview, setPicPreview] = useState(user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${user.avatar}`) : "");
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Handle profile picture upload
  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only .jpg, .jpeg, .png files are allowed");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const avatarUrl = res.data.url.startsWith('http') ? res.data.url : `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${res.data.url}`;
      setProfilePic(avatarUrl);
      setPicPreview(avatarUrl);
      updateUser({ avatar: res.data.url });
      setSuccess("Profile picture updated!");
    } catch (err) {
      setError("Failed to upload profile picture.");
    }
  };

  // Save theme/font size preferences
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const res = await api.put("/users/preferences", {
        fontSize,
      });
      updateUser({ preferences: res.data.user.preferences });
      setSuccess("Preferences updated!");
    } catch (err) {
      setError("Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return <div className="settings-page">Loading...</div>;

  return (
    <div className="settings-page" style={{ maxWidth: 480, margin: "2rem auto", padding: 0 }}>
      <div className="card" style={{ padding: 32, borderRadius: 16, boxShadow: "var(--shadow-md)", background: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-center" style={{ marginBottom: 32, fontWeight: 700, color: "var(--primary-color)" }}>Settings</h2>
        <div className="profile-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <img
              src={picPreview || profilePic || defaultProfilePic}
              alt="Profile"
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary-color)", background: "#e5e7eb" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: "var(--primary-color)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                fontSize: 18,
              }}
              title="Change profile picture"
            >
              <span role="img" aria-label="edit">✏️</span>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handlePicChange}
            />
          </div>
          <div style={{ fontWeight: 600, fontSize: 20, color: "var(--text-primary)", marginBottom: 4 }}>{user.name}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 2 }}>{user.email}</div>
          <div style={{ color: "var(--primary-color)", fontWeight: 500, fontSize: 14, letterSpacing: 1 }}>{user.role}</div>
        </div>
        <form onSubmit={handleSave} style={{ marginBottom: 24 }}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" htmlFor="font-size-select" style={{ marginRight: 12 }}>Font Size:</label>
            <select
              id="font-size-select"
              className="form-select"
              value={fontSize}
              onChange={e => setFontSize(e.target.value)}
              style={{ minWidth: 120 }}
            >
              {fontSizes.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%", marginTop: 8 }}>
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          {success && <div style={{ color: "green", marginTop: 8, textAlign: "center" }}>{success}</div>}
          {error && <div style={{ color: "red", marginTop: 8, textAlign: "center" }}>{error}</div>}
        </form>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ width: "100%" }}>Logout</button>
      </div>
    </div>
  );
};

export default Settings;
