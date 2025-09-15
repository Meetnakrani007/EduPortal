import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import './admin.css';
import ConfirmModal from "../../components/ConfirmModal";

const socket = io("http://localhost:8080");

const AdminDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({});
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [chats, setChats] = useState([]);
  const [usersWithStats, setUsersWithStats] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [deletingId, setDeletingId] = useState('');
  const [confirmUserId, setConfirmUserId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get("/users/admin/summary").then((res) => setSummary(res.data)).catch(() => {});
      api.get('/users/admin/users-with-stats').then(res => setUsersWithStats(res.data.users || [])).catch(() => setUsersWithStats([]));
    }
    if (user?.role === 'teacher') {
      // Fetch tickets assigned to this teacher
      api.get('/tickets?assignedTo=' + user._id)
        .then(res => setAssignedTickets(res.data.tickets || []))
        .catch(() => setAssignedTickets([]));
      // Fetch chats for this teacher
      api.get('/chats')
        .then(res => setChats(res.data))
        .catch(() => setChats([]));
    }
  }, [user]);

  const handleStatusChange = (ticketId, newStatus) => {
    api.put(`/tickets/${ticketId}/status`, { status: newStatus })
      .then(() => {
        setAssignedTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
        socket.emit('ticketStatusChanged', { ticketId, newStatus });
      })
      .catch(err => alert('Failed to update status'));
  };

  const deleteUser = async (userId) => {
    setDeletingId(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsersWithStats(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId('');
      setConfirmUserId('');
    }
  };

  if (user?.role === 'teacher') {
    return (
      <div>
        <h2>Teacher Dashboard</h2>
        <section style={{ marginBottom: 32 }}>
          <h3>Tickets Assigned to Me</h3>
          {assignedTickets.length === 0 ? (
            <p>No tickets assigned to you.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#f3f6fa' }}>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Student</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Category</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Status</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedTickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{ticket.student?.name} <br /><span style={{ color: '#888', fontSize: 13 }}>{ticket.student?.email}</span></td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{ticket.category}</td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>
                      <span style={{
                        background: ticket.status === 'open' ? '#d4edda' : ticket.status === 'under review' ? '#fff3cd' : ticket.status === 'closed' ? '#f8d7da' : '#e2e3e5',
                        color: ticket.status === 'open' ? '#155724' : ticket.status === 'under review' ? '#856404' : ticket.status === 'closed' ? '#721c24' : '#383d41',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 600
                      }}>{ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</span>
                      <br />
                      <select
                        value={ticket.status}
                        onChange={e => handleStatusChange(ticket._id, e.target.value)}
                        style={{ marginTop: 6, padding: '2px 8px', borderRadius: 4 }}
                      >
                        <option value="open">Open</option>
                        <option value="under review">Under Review</option>
                        <option value="closed">Closed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>
                      <button onClick={() => navigate(`/chat/${ticket.student?._id}`)} style={{ background: '#1e88e5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Chat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section>
          <h3>Chats with Students</h3>
          {chats.length === 0 ? (
            <p>No active chats.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {chats.map(chat => (
                <li key={chat._id} style={{ marginBottom: 12, background: '#f3f6fa', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{chat.student?.name}</span> <span style={{ color: '#888', fontSize: 13 }}>({chat.student?.email})</span>
                  </div>
                  <button onClick={() => navigate(`/chat/${chat.student?._id}`)} style={{ background: '#1e88e5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 500 }}>Open Chat</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  // Default admin dashboard
  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-label">Users</div>
            <div className="kpi-value">{summary.totalUsers ?? 0}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Tickets</div>
            <div className="kpi-value">{summary.totalTickets ?? 0}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Posts</div>
            <div className="kpi-value">{summary.totalPosts ?? 0}</div>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="card-title">Users Overview</div>
        <div className="filter-row">
          <label htmlFor="role-filter" className="filter-label">Filter by role</label>
          <select id="role-filter" className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Tickets
                  <span className="th-sub">resolved / under review / open</span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usersWithStats
                .filter(u => roleFilter === 'all' ? true : (u.role === roleFilter))
                .map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td className="capitalize">{u.role}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className="pill pill-green">{u.tickets.resolved}</span>
                    <span className="pill pill-amber">{u.tickets.underReview}</span>
                    <span className="pill pill-blue">{u.tickets.open}</span>
                  </td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => setConfirmUserId(u.id)}
                      disabled={deletingId === u.id || (user && (user.id === u.id || user._id === u.id))}
                      title={user && (user.id === u.id || user._id === u.id) ? 'Cannot delete yourself' : 'Delete user'}
                    >
                      {deletingId === u.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {usersWithStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <ConfirmModal
        open={!!confirmUserId}
        title="Delete User?"
        message="This action cannot be undone."
        confirmText={deletingId ? 'Deleting...' : 'Delete'}
        onCancel={() => setConfirmUserId('')}
        onConfirm={() => deleteUser(confirmUserId)}
      />
    </div>
  );
};

export default AdminDashboard;
