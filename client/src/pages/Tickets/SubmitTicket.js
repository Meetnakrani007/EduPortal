import React, { useState, useEffect } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast/ToastProvider";

const CATEGORIES = [
  "Study Help",
  "Exam Doubts",
  "Technical Issue",
  "Administrative",
  "Other"
];

const SubmitTicket = () => {
  const [category, setCategory] = useState("");
  const [teacher, setTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { show } = useToast();

  useEffect(() => {
    api.get("/users/teachers")
      .then(res => setTeachers(res.data))
      .catch(() => setTeachers([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!category || !teacher || !message) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      // 1. Create ticket
      const formData = new FormData();
      formData.append("category", category);
      formData.append("assignedTo", teacher);
      formData.append("message", message);
      const ticketRes = await api.post("/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess("Ticket submitted! Redirecting to your ticket...");
      show('success', 'Ticket submitted');
      setTimeout(() => navigate(`/tickets/${ticketRes.data._id}`), 1200);
    } catch (err) {
      setError("Failed to submit ticket. Please try again.");
      show('error', 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(30,136,229,0.07)", padding: 32 }}>
      <h2 style={{ color: "#1e88e5", textAlign: "center", marginBottom: 32 }}>Open a Support Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Select Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', background: '#f9f9f9' }}
          >
            <option value="">Select...</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Select Teacher</label>
          <select
            value={teacher}
            onChange={e => setTeacher(e.target.value)}
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', background: '#f9f9f9' }}
            disabled={teachers.length === 0}
          >
            <option value="">{teachers.length === 0 ? "No Teachers Available Right Now." : "Select..."}</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Problem Definition</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={4}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', background: '#f9f9f9', resize: 'vertical' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: '#1e88e5', color: '#fff', padding: 12, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 8 }}
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>}
        {success && null}
      </form>
    </div>
  );
};

export default SubmitTicket;
