import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api";

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/posts/${id}`)
      .then((res) => {
        setPost(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const timeAgo = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000; // seconds
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#64748b', marginBottom: '16px' }}>Post Not Found</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          The post you're looking for doesn't exist or has been removed.
        </p>
        <Link 
          to="/helpful-posts" 
          style={{ 
            color: '#2563eb', 
            textDecoration: 'none',
            fontWeight: '600',
            padding: '8px 16px',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#2563eb';
          }}
        >
          Back to Posts
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '2rem auto', 
      padding: '0 1rem' 
    }}>
      {/* Back Button */}
      <Link 
        to="/helpful-posts" 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#2563eb', 
          textDecoration: 'none',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        ← Back to Posts
      </Link>

      {/* Post Content */}
      <article style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 16px 0',
          lineHeight: '1.3'
        }}>
          Problem: {post.title.replace(/^\s*Transcript:\s*/i, "").trim()}
        </h1>

        {/* Meta Information */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          flexWrap: 'wrap',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {post.category && (
            <span style={{ 
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #bfdbfe'
            }}>
              {post.category}
            </span>
          )}
          <span style={{ fontSize: '14px', color: '#64748b' }}>
            {timeAgo(post.createdAt)}
          </span>
          <span style={{ fontSize: '14px', color: '#64748b' }}>
            by {post.author?.name || 'Unknown'}
          </span>
          <span style={{ fontSize: '14px', color: '#64748b' }}>
            {post.viewCount || 0} views
          </span>
        </div>

        {/* Tags */}
        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginBottom: '24px'
          }}>
            {post.tags.map(tag => (
              <span 
                key={tag._id || tag} 
                style={{
                  backgroundColor: tag.color || '#e0f2fe',
                  color: tag.color ? '#ffffff' : '#1d4ed8',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: '1px solid',
                  borderColor: tag.color ? 'transparent' : '#bfdbfe'
                }}
              >
                {tag.displayName || tag.name || tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#374151'
        }}>
          {post.content.includes('Ticket:') ? (
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#0f172a',
                marginBottom: '16px'
              }}>
                Solution:
              </h3>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                {post.content}
              </div>
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {post.content}
            </div>
          )}
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#0f172a',
              marginBottom: '12px'
            }}>
              Attachments:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {post.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={`/uploads/${attachment.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#2563eb',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#dbeafe';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#f8fafc';
                  }}
                >
                  📎 {attachment.originalName || attachment.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default PostDetail;
