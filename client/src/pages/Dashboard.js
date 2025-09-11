import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tickets: { total: 0, open: 0, resolved: 0 },
    chats: { total: 0, active: 0 },
    posts: { total: 0, likes: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ticketsResponse, chatsResponse] = await Promise.all([
          axios.get('/api/tickets?limit=5'),
          axios.get('/api/chats')
        ]);

        // Calculate stats
        const tickets = ticketsResponse.data.tickets || [];
        const chats = chatsResponse.data || [];

        // Only count tickets that are open or under review
        const openOrReviewTickets = tickets.filter(t => t.status === 'open' || t.status === 'under review');
        setStats({
          tickets: {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            resolved: tickets.filter(t => t.status === 'resolved').length
          },
          chats: {
            total: openOrReviewTickets.length,
            active: openOrReviewTickets.length // For display, use same count
          },
          posts: { total: 0, likes: 0 } // Placeholder
        });

        // Set recent activity
        const activity = tickets.slice(0, 5).map(ticket => ({
            id: ticket._id,
            type: 'ticket',
            title: ticket.title,
            status: ticket.status,
            date: ticket.createdAt,
            link: `/tickets/${ticket._id}`
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ padding: '40px 20px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            {getGreeting()}, {user?.name}!
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '16px'
          }}>
            Welcome to your {user?.role} dashboard. Here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎫</div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              {stats.tickets.total}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Total Tickets
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '14px' }}>
              <span style={{ color: 'var(--warning-color)' }}>
                {stats.tickets.open} Open
              </span>
              <span style={{ color: 'var(--success-color)' }}>
                {stats.tickets.resolved} Resolved
              </span>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              {stats.chats.total}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Chat Conversations
            </p>
            <div style={{ fontSize: '14px' }}>
              <span style={{ color: 'var(--primary-color)' }}>
                {stats.chats.active} Active
              </span>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              {user?.role === 'student' ? 'Active' : 'Published'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {user?.role === 'student' ? 'Support Requests' : 'Content'}
            </p>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              This week
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: '40px' }}>
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
            <p className="card-subtitle">Common tasks for your role</p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {user?.role === 'student' && (
              <>
                <Link to="/submit-ticket" className="btn btn-primary">
                  🎫 Submit New Ticket
                </Link>
                <Link to="/my-tickets" className="btn btn-secondary">
                  📋 View My Tickets
                </Link>
                <Link to="/helpful-posts" className="btn btn-secondary">
                  📰 Browse Posts
                </Link>
              </>
            )}
            
            {user?.role === 'teacher' && (
              <>
                <Link to="/my-tickets" className="btn btn-primary">
                  🎫 Review Tickets
                </Link>
                <Link to="/helpful-posts/create" className="btn btn-secondary">
                  ✍️ Create Post
                </Link>
                {null}
              </>
            )}
            
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="btn btn-primary">
                  ⚙️ Admin Panel
                </Link>
                <Link to="/my-tickets" className="btn btn-secondary">
                  🎫 All Tickets
                </Link>
                <Link to="/helpful-posts/create" className="btn btn-secondary">
                  ✍️ Create Post
                </Link>
                {null}
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <p className="card-subtitle">Your latest interactions</p>
          </div>
          
          {recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentActivity.map(item => (
                <div 
                  key={`${item.type}-${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>
                      {item.type === 'ticket' ? '🎫' : '💬'}
                    </div>
                    <div>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        marginBottom: '4px',
                        color: 'var(--text-primary)'
                      }}>
                        {item.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`status-badge status-${item.status}`}>
                          {item.status}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)'
                        }}>
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={item.link} 
                    className="btn btn-sm btn-secondary"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p>No recent activity to show.</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Start by creating a ticket or joining a conversation!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;