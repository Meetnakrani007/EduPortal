import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");

  const loadPosts = () => {
    setLoading(true);
    api
      .get("/posts", { params: { limit: 20 } })
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

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
        <h1 className={styles.title}>Helpful Posts</h1>
        {user?.role === "teacher" && (
          <Link to="/helpful-posts/create" className={styles.createBtn}>Create Post</Link>
        )}
      </div>

      {loading && <div className={styles.metaText}>Loading...</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

      <div className={styles.list}>
        {posts.map((p) => {
          const isTranscript = !!p.ticketId;
          const rawTitle = p.title || "";
          const displayTitle = rawTitle.replace(/^\s*Transcript:\s*/i, "").trim();
          const excerpt = makeExcerpt(p.content);
          return (
            <div key={p._id} className={styles.card}>
              {user?.role === 'teacher' && p.author && String((p.author && (p.author._id || p.author))) === String(user?.id || user?._id) && (
                <button className={styles.deleteBtn} onClick={() => setPendingDeleteId(p._id)}>Delete</button>
              )}
              <h2 className={styles.cardTitle}>
                <span>Problem: </span>{displayTitle}
              </h2>
              <div className={styles.descBlock}>
                {!isTranscript && (
                  <div><span className={styles.descLabel}>Solution:</span> {excerpt}</div>
                )}
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <div className={styles.tagsRow}><span className={styles.descLabel}>Tags:</span> {p.tags.slice(0, 5).map((t) => (
                    <span key={t._id || t} className={styles.badge}>{t.displayName || t.name || t}</span>
                  ))}</div>
                )}
              </div>
              <div className={styles.meta} style={{ marginTop: 8 }}>
                {p.category && (
                  <span className={`${styles.badge} ${styles.badgeGray}`}>{p.category}</span>
                )}
                <span className={styles.metaText}>{timeAgo(p.createdAt)}</span>
                {p.author && (
                  <span className={styles.metaText}>by {p.author.name || p.author}</span>
                )}
                {typeof p.viewCount === "number" && (
                  <span className={styles.metaText}>{p.viewCount} views</span>
                )}
                {isTranscript && p.ticketId && (
                  <button className={styles.downloadBtn} onClick={() => downloadTranscript(p.ticketId)}>
                    📨 Download Transcript
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
