import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import ChatRoom from '../Chat/ChatRoom';

const statusColors = {
  open: { bg: '#d4edda', color: '#155724', label: 'Open' },
  'under review': { bg: '#fff3cd', color: '#856404', label: 'Ticket Under Review' },
  closed: { bg: '#f8d7da', color: '#721c24', label: 'Closed' },
  'in-progress': { bg: '#ffeeba', color: '#856404', label: 'In Progress' },
  resolved: { bg: '#d1ecf1', color: '#0c5460', label: 'Resolved' }
};

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/tickets/${id}`)
      .then(res => {
        setTicket(res.data);
        setStatus(res.data.status);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleStatusChange = e => {
    const newStatus = e.target.value;
    // Optimistically update UI immediately
    setStatus(newStatus);
    setTicket(prev => ({ ...(prev || {}), status: newStatus }));
    setSaving(true);
    api.put(`/tickets/${id}/status`, { status: newStatus })
      .catch(() => {
        // Revert on error by refetching
        api.get(`/tickets/${id}`).then(r => {
          setStatus(r.data.status);
          setTicket(r.data);
        });
      })
      .finally(() => setSaving(false));
  };

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found.</div>;

  const statusObj = statusColors[status || ticket.status] || { bg: '#e2e3e5', color: '#383d41', label: status || ticket.status };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(30,136,229,0.07)', padding: 32 }}>
      <h2 style={{ marginBottom: 12 }}>{ticket.title}</h2>
      <div style={{ marginBottom: 18 }}>
        <span style={{ background: statusObj.bg, color: statusObj.color, padding: '4px 12px', borderRadius: 6, fontWeight: 600, fontSize: 15 }}>
          {statusObj.label}
        </span>
        {user?.role === 'teacher' && (
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={saving}
            style={{ marginLeft: 16, padding: '4px 10px', borderRadius: 4 }}
          >
            <option value="open">Open</option>
            <option value="under review">Under Review</option>
            <option value="closed">Closed</option>
            <option value="resolved">Resolved</option>
          </select>
        )}
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Category:</b> {ticket.category}
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Problem Definition:</b>
        <div style={{ marginTop: 6, background: '#f9f9f9', padding: 12, borderRadius: 8 }}>{ticket.description}</div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Student:</b> {ticket.student?.name} ({ticket.student?.email})
      </div>
      {ticket.assignedTo && (
        <div style={{ marginBottom: 18 }}>
          <b>Assigned To:</b> {ticket.assignedTo?.name} ({ticket.assignedTo?.email})
        </div>
      )}
      {/* You can add more ticket details here if needed */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Live Chat</h3>
        <ChatRoom 
          ticketId={ticket._id}
          onStatusChange={(newStatus) => {
            setStatus(newStatus);
            setTicket(prev => ({ ...prev, status: newStatus }));
          }}
        />
      </div>
    </div>
  );
};

export default TicketDetail;
