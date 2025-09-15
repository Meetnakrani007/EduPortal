import React, { useState, useEffect } from "react";
import api from "../../api";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import ConfirmModal from "../../components/ConfirmModal";
import './tickets.css';

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
  const [deletingId, setDeletingId] = useState("");
  const [confirmId, setConfirmId] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role === 'teacher') {
      api
        .get(`/tickets?assignedTo=${user._id}`)
        .then((res) => setTickets(res.data.tickets || []))
        .catch((err) => console.error(err));
    } else if (user.role === 'admin') {
      api
        .get('/tickets', { params: { limit: 1000 } })
        .then((res) => setTickets(res.data.tickets || res.data))
        .catch((err) => console.error(err));
    } else {
      api
        .get('/tickets')
        .then((res) => setTickets(res.data.tickets || res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  const deleteTicket = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/tickets/${id}`);
      setTickets(prev => prev.filter(t => t._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete ticket');
    } finally {
      setDeletingId("");
      setConfirmId("");
    }
  };

  return (
    <div className="tickets-wrap">
      <h2 className="tickets-title">
        {user?.role === 'teacher' ? 'Tickets Assigned to Me' : user?.role === 'admin' ? 'All Tickets' : 'My Tickets'}
      </h2>
      {tickets.length === 0 ? (
        <div className="tickets-empty">No tickets found.</div>
      ) : (
        <div className="table-scroll">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              {user?.role === 'teacher' && <th>Student</th>}
              {user?.role === 'admin' && (
                <>
                  <th>Student</th>
                  <th>Assigned To</th>
                </>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
        {tickets.map((ticket) => (
              <tr key={ticket._id}>
                <td className="cell-strong">
                  <Link to={`/tickets/${ticket._id}`} className="link">
                    {ticket.subject || ticket.title}
                  </Link>
                </td>
                <td>{ticket.category}</td>
                <td>
                  <span className={`pill ${ticket.status === 'open' ? 'pill-green' : ticket.status === 'under review' ? 'pill-amber' : ticket.status === 'closed' ? 'pill-red' : 'pill-gray'}`}>
                    {ticket.status === 'under review' ? 'Ticket Under Review' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </td>
                {user?.role === 'teacher' && (
                  <td>
                    {ticket.student?.name} <br />
                    <span style={{ color: '#888', fontSize: 13 }}>{ticket.student?.email}</span>
                  </td>
                )}
                {user?.role === 'admin' && (
                  <>
                    <td>
                      {ticket.student?.name} <br />
                      <span style={{ color: '#888', fontSize: 13 }}>{ticket.student?.email}</span>
                    </td>
                    <td>
                      {ticket.assignedTo?.name || '—'} <br />
                      {ticket.assignedTo?.email && <span style={{ color: '#888', fontSize: 13 }}>{ticket.assignedTo?.email}</span>}
                    </td>
                  </>
                )}
                <td>
                  <Link to={`/tickets/${ticket._id}`} className="btn-primary">View</Link>
                  <button 
                    onClick={() => setConfirmId(ticket._id)}
                    className="btn-danger ml8"
                    disabled={!!deletingId}
                  >
                    Delete
                  </button>
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
        </div>
      )}
      <ConfirmModal
        open={!!confirmId}
        title="Delete Ticket?"
        message="This action cannot be undone."
        confirmText={deletingId ? 'Deleting...' : 'Delete'}
        onCancel={() => setConfirmId("")}
        onConfirm={() => deleteTicket(confirmId)}
      />
    </div>
  );
};

export default MyTickets;
