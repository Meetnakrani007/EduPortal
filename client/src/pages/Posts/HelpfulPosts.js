import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./HelpfulPosts.module.css";

const timeAgo = (iso) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000; // seconds
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
};

const stripTranscriptBoiler = (text = "") => {
  let t = text;
  t = t.replace(/^\s*Ticket:[^\n]*\n?/i, "");
  t = t.replace(/^\s*Category:[^\n]*\n?/i, "");
  t = t.replace(/^\s*Student:[^\n]*\n?/i, "");
  t = t.replace(/^\s*Teacher:[^\n]*\n?/i, "");
  t = t.replace(/\[[^\]]+\]/g, ""); // remove [timestamp]
  return t;
};

export default function HelpfulPosts() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const loadPosts = useCallback(() => {
    setLoading(true);
    // Show only 4 posts for non-authenticated users, 20 for authenticated users
    const limit = user ? 20 : 4;
    const params = { limit };
    
    // Add search parameter if present
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    
    api
      .get("/posts", { params })
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoading(false));
  }, [user, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]); // Reload when user authentication status changes

  const makeExcerpt = (content = "") => {
    const cleaned = stripTranscriptBoiler(content)
      .replace(/[#*_`>\-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, 180) + (cleaned.length > 180 ? "…" : "");
  };

  const downloadTranscript = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}/transcript`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}-transcript.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      // optional: toast
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      // Optimistically remove, then refresh to be sure
      setPosts(prev => prev.filter(p => p._id !== postId));
      loadPosts();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete post');
    } finally {
      setPendingDeleteId("");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Helpful Posts'}
        </h1>
        {user?.role === "teacher" && (
          <Link to="/helpful-posts/create" className={styles.createBtn}>Create Post</Link>
        )}
      </div>
      
      {/* Search Bar */}
      {user && (
        <div style={{ 
          marginBottom: '24px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          maxWidth: '520px'
        }}>
          <input
            type="text"
            placeholder="Search posts by tags, problems, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadPosts(); }}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={loadPosts}
            style={{
              background: '#2563EB',
              color: '#fff',
              border: '1px solid #1d4ed8',
              borderRadius: '12px',
              padding: '10px 16px',
              fontWeight: 700,
              boxShadow: '0 6px 18px rgba(37,99,235,.18)'
            }}
          >
            Search
          </button>
        </div>
      )}

      {loading && <div className={styles.metaText}>Loading...</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      {!loading && !error && posts.length === 0 && (
        <div style={{
          color: '#64748b',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 24,
          marginTop: 8,
          maxWidth: 520
        }}>
          {searchQuery.trim() ? `No results found for "${searchQuery}"` : 'No posts yet.'}
        </div>
      )}

      <div className={styles.list}>
        {posts.map((p) => {
          const isTranscript = !!p.ticketId || /^\s*Transcript:/i.test(p.title || "");
          const rawTitle = p.title || "";
          const displayTitle = rawTitle.replace(/^\s*Transcript:\s*/i, "").trim();
          const excerpt = makeExcerpt(p.content);
          return (
            <div key={p._id} className={styles.card}>
              {(user?.role === 'admin' || (user?.role === 'teacher' && p.author && String((p.author && (p.author._id || p.author))) === String(user?.id || user?._id))) && (
                <button className={styles.deleteBtn} onClick={() => setPendingDeleteId(p._id)}>Delete</button>
              )}
              <h2 className={styles.cardTitle}>
                Problem: {displayTitle}
              </h2>
              <div className={styles.meta} style={{ marginTop: 8 }}>
                {p.category && (
                  <span className={`${styles.badge} ${styles.badgeGray}`}>{p.category}</span>
                )}
                <span className={styles.metaText}>{timeAgo(p.createdAt)}</span>
                {p.author && (
                  <span className={styles.metaText}>by {p.author.name || p.author}</span>
                )}
                {/* views removed */}
              </div>
              <div className={styles.descBlock}>
                {!isTranscript && (
                  <div><span className={styles.descLabel}>Solution:</span> {excerpt}</div>
                )}
                
                {/* Tags Display Below Solution */}
                {p.tags && Array.isArray(p.tags) && p.tags.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    {p.tags.slice(0, 5).map((t) => (
                      <span 
                        key={t._id || t} 
                        style={{
                          backgroundColor: t.color || '#e0f2fe',
                          color: t.color ? '#ffffff' : '#1d4ed8',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '1px solid',
                          borderColor: t.color ? 'transparent' : '#bfdbfe',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        {t.displayName || t.name || t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isTranscript && (
                <button
                  className={styles.downloadBtnRight}
                  title="Download Transcript"
                  onClick={() => {
                    if (p.ticketId) {
                      downloadTranscript(p.ticketId);
                    } else {
                      alert('Transcript PDF is unavailable because this post is not linked to a ticket.');
                    }
                  }}
                >
                  📨 Download Transcript
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Show More Button for Non-Authenticated Users */}
      {!user && posts.length === 4 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px',
          padding: '24px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#0f172a',
            marginBottom: '12px'
          }}>
            Want to see more helpful posts?
          </h3>
          <p style={{ 
            color: '#64748b', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            Sign up or log in to access all posts and create your own helpful content.
          </p>
          <Link 
            to="/login" 
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-block'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            Show More
          </Link>
        </div>
      )}
      
      {pendingDeleteId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            <h3 className={styles.modalTitle}>Delete Post?</h3>
            <p className={styles.modalText}>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setPendingDeleteId("")}>Cancel</button>
              <button className={styles.modalDelete} onClick={() => deletePost(pendingDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
