import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api";
import styles from "./CreateHelpfulPost.module.css";

const TAG_SUGGESTIONS = ["#ExamTips", "#ProjectHelp", "#DoubtClear", "#Resource", "#FAQ"];

export default function CreateHelpfulPost() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState('General');
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resolvedTickets, setResolvedTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [ticketAttachments, setTicketAttachments] = useState([]);

  useEffect(() => {
    if (!loading && user?.role !== "teacher") {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Fetch resolved tickets for this teacher
  useEffect(() => {
    if (user?.role === "teacher") {
      api.get(`/tickets?status=resolved`)
        .then(res => setResolvedTickets(res.data.tickets || []))
        .catch(() => setResolvedTickets([]));
    }
  }, [user]);

  // On mount, if fromTicket param is present, select that ticket
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromTicket = params.get('fromTicket');
    if (fromTicket && resolvedTickets.some(t => t._id === fromTicket)) {
      setSelectedTicket(fromTicket);
    }
  }, [location.search, resolvedTickets]);

  // Prefill form when a ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      const ticket = resolvedTickets.find(t => t._id === selectedTicket);
      if (ticket) {
        setTitle(ticket.title || "");
        setContent(ticket.description || "");
        setTags(ticket.tags ? ticket.tags.map(tag => tag.displayName || tag.name || tag) : []);
        setTicketAttachments(ticket.attachments || []);
      }
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setTicketAttachments([]);
    }
  }, [selectedTicket, resolvedTickets]);

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleTagRemove = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category || 'General');
      formData.append("isPublic", isPublic);
      // Send tags as JSON for backend flexibility
      formData.append("tags", JSON.stringify(tags));
      if (file) formData.append("attachments", file);
      if (selectedTicket) formData.append("fromTicketId", selectedTicket);
      // Attach ticket attachments if any
      ticketAttachments.forEach(att => {
        // Only attach if not already uploaded (new file)
        if (att instanceof File) {
          formData.append("attachment", att);
        }
      });
      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess("Post created successfully! 🎉");
      setTimeout(() => navigate("/helpful-posts"), 1500);
    } catch (err) {
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (user && user.role !== "teacher") return null;

  return (
    <div className={styles["create-post-container"]}>
      <div className={styles["create-post-header"]}>
        <div className={styles["create-post-header-icon"]}>📘</div>
        <div>
          <h2 className={styles["create-post-title"]}>Create Helpful Post</h2>
          <p className={styles["create-post-subtitle"]}>Share solved answers with students. Convert a resolved ticket or write from scratch.</p>
        </div>
      </div>
      {/* Convert from Resolved Ticket Dropdown */}
      {resolvedTickets.length > 0 && (
        <div className={styles["create-post-field"]}>
          <label className={styles["create-post-label"]}>Convert from Resolved Ticket</label>
          <select
            value={selectedTicket}
            onChange={e => setSelectedTicket(e.target.value)}
            className={styles["create-post-select"]}
          >
            <option value="">-- Select a resolved ticket --</option>
            {resolvedTickets.map(ticket => (
              <option key={ticket._id} value={ticket._id}>
                {ticket.title} ({ticket.category})
              </option>
            ))}
          </select>
        </div>
      )}
      <form className={styles["create-post-form"]} onSubmit={handleSubmit}>
        <label className={styles["create-post-label"]}>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className={styles["create-post-select"]}
        >
          <option value="General">General</option>
          <option value="Study Tips">Study Tips</option>
          <option value="Exam Help">Exam Help</option>
          <option value="Technical Guide">Technical Guide</option>
          <option value="Administrative">Administrative</option>
        </select>
        <label className={styles["create-post-label"]}>Problem<span className={styles["create-post-required"]}>*</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className={styles["create-post-input"]}
        />
        <label className={styles["create-post-label"]}>Solution<span className={styles["create-post-required"]}>*</span></label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          rows={6}
          className={styles["create-post-textarea"]}
        />
        <label className={styles["create-post-label"]}>Tags</label>
        <div className={styles["create-post-tags"]}>
          {tags.map(tag => (
            <span key={tag} className={styles["create-post-tag"]}>
              {tag} <button type="button" onClick={() => handleTagRemove(tag)}>×</button>
            </span>
          ))}
          <form onSubmit={handleTagAdd} style={{ display: 'inline' }}>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="#Tag"
              list="tag-suggestions"
              className={styles["create-post-tag-input"]}
            />
            <datalist id="tag-suggestions">
              {TAG_SUGGESTIONS.map(tag => <option key={tag} value={tag} />)}
            </datalist>
          </form>
        </div>
        <label className={styles["create-post-label"]}>Attachment</label>
        {/* Show ticket attachments if any */}
        {ticketAttachments.length > 0 && (
          <div className={styles["create-post-attachments"]}>
            <b>Ticket Attachments:</b>
            <ul>
              {ticketAttachments.map((att, i) => (
                <li key={i}>
                  {att.originalName || att.filename || (att.name || '')}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={styles["create-post-dropzone"]}>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={e => setFile(e.target.files[0])}
          />
          <div className={styles["create-post-file-preview"]}>{file?.name}</div>
        </div>
        <div className={styles["create-post-toggle"]}>
          <div
            className={`${styles["create-post-switch"]} ${isPublic ? styles["on"] : ''}`}
            onClick={() => setIsPublic(v => !v)}
            role="switch"
            aria-checked={isPublic}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsPublic(v => !v); }}
          >
            <div className={styles["create-post-switch-knob"]} />
          </div>
          <span>Make Post Public</span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={styles["create-post-submit"]}
        >
          📤 Publish Post
        </button>
        {error && <div className={styles["create-post-error"]}>{error}</div>}
        {success && <div className={styles["create-post-success"]}>{success}</div>}
      </form>
      {/* Optional: Live Preview */}
      {preview && (
        <div className={styles["create-post-preview"]}>
          <h3>Preview</h3>
          <h4>{title}</h4>
          <div>{content}</div>
          <div>{tags.join(' ')}</div>
        </div>
      )}
    </div>
  );
} 