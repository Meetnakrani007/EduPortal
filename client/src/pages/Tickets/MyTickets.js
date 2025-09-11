import React, { useState, useEffect } from "react";
import api from "../../api";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

function TicketActions({ ticket }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.get(`/api/tickets/${ticket._id}/transcript`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticket._id}-transcript.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download transcript. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        onClick={handleDownload}
        disabled={loading}
      >
        📥 Download Transcript
      </button>
      {success && <span style={{ color: '#388e3c', fontSize: 13 }}>{success}</span>}
      {error && <span style={{ color: '#b71c1c', fontSize: 13 }}>{error}</span>}
    </div>
  );
}

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      api
        .get(`/tickets?assignedTo=${user._id}`)
        .then((res) => setTickets(res.data.tickets || []))
        .catch((err) => console.error(err));
    } else {
      api
      .get("/tickets")
      .then((res) => setTickets(res.data.tickets || res.data))
      .catch((err) => console.error(err));
    }
  }, [user]);

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(30,136,229,0.07)', padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>{user?.role === 'teacher' ? 'Tickets Assigned to Me' : 'My Tickets'}</h2>
      {tickets.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', margin: '40px 0' }}>No tickets found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f3f6fa' }}>
              <th style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'left' }}>Title</th>
              <th style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'left' }}>Category</th>
              <th style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'left' }}>Status</th>
              {user?.role === 'teacher' && <th style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'left' }}>Student</th>}
              <th style={{ padding: 10, border: '1px solid #e0e0e0' }}></th>
            </tr>
          </thead>
          <tbody>
        {tickets.map((ticket) => (
              <tr key={ticket._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', fontWeight: 500 }}>
                  <Link to={`/tickets/${ticket._id}`} style={{ color: '#1976d2', textDecoration: 'none' }}>{ticket.subject || ticket.title}</Link>
                </td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>{ticket.category}</td>
                <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>
                  <span style={{
                    background: ticket.status === 'open' ? '#d4edda' : ticket.status === 'under review' ? '#fff3cd' : ticket.status === 'closed' ? '#f8d7da' : '#e2e3e5',
                    color: ticket.status === 'open' ? '#155724' : ticket.status === 'under review' ? '#856404' : ticket.status === 'closed' ? '#721c24' : '#383d41',
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14
                  }}>
                    {ticket.status === 'under review' ? 'Ticket Under Review' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </td>
                {user?.role === 'teacher' && (
                  <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>
                    {ticket.student?.name} <br />
                    <span style={{ color: '#888', fontSize: 13 }}>{ticket.student?.email}</span>
                  </td>
                )}
                <td style={{ padding: 10, border: '1px solid #e0e0e0' }}>
                  <Link to={`/tickets/${ticket._id}`} style={{ background: '#1e88e5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 500, textDecoration: 'none' }}>View</Link>
                  {user?.role === 'teacher' && ticket.status && ticket.status.toLowerCase() === 'resolved' && (
                    <div style={{ marginTop: 8 }}>
                      <TicketActions ticket={ticket} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyTickets;
