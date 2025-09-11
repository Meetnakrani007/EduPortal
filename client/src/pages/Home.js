import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [postsResponse, tagsResponse] = await Promise.all([
          axios.get('/api/posts?limit=3&sort=views'),
          axios.get('/api/tags/popular')
        ]);
        
        setFeaturedPosts(postsResponse.data.posts || []);
        setPopularTags(tagsResponse.data || []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results - for now, redirect to helpful posts with search
      window.location.href = `/helpful-posts?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '700', 
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Welcome to EduSupport Portal
          </h1>
          <p style={{ 
            fontSize: '20px', 
            marginBottom: '40px',
            opacity: '0.9',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Your one-stop solution for academic support, knowledge sharing, and seamless communication between students and faculty.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ 
            maxWidth: '500px', 
            margin: '0 auto 40px',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              placeholder="Search tickets, posts, articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '8px'
              }}
            />
            <button type="submit" className="btn btn-secondary" style={{
              padding: '14px 24px',
              fontSize: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white'
            }}>
              Search
            </button>
          </form>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-lg" style={{
                  backgroundColor: 'white',
                  color: 'var(--primary-color)',
                  fontWeight: '600'
                }}>
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-lg" style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '2px solid white'
                }}>
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-lg" style={{
                  backgroundColor: 'white',
                  color: 'var(--primary-color)',
                  fontWeight: '600'
                }}>
                  Go to Dashboard
                </Link>
                {user?.role === 'student' && (
                  <Link to="/submit-ticket" className="btn btn-lg" style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '2px solid white'
                  }}>
                    Submit Ticket
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '60px',
            fontSize: '36px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            How We Help You Succeed
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px'
          }}>
            <div className="feature-card" style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎫</div>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                Support Tickets
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Submit and track support requests with our comprehensive ticketing system. Get help from faculty and staff efficiently.
              </p>
            </div>

            <div className="feature-card" style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                Private Chat
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Connect directly with teachers through secure, one-on-one messaging for personalized academic support.
              </p>
            </div>

            <div className="feature-card" style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                Knowledge Base
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Access comprehensive articles and guides covering academic procedures, technical help, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '40px'
            }}>
              <h2 style={{ 
                fontSize: '32px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Featured Helpful Posts
              </h2>
              <Link to="/helpful-posts" className="btn btn-primary">
                View All Posts
              </Link>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {featuredPosts.map(post => (
                <div key={post._id} className="card" style={{ height: 'fit-content' }}>
                  <div className="card-header">
                    <h3 className="card-title">
                      <Link 
                        to={`/helpful-posts/${post._id}`}
                        style={{ 
                          color: 'var(--text-primary)', 
                          textDecoration: 'none'
                        }}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {post.category && (
                        <span className="tag" style={{ backgroundColor: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1' }}>{post.category}</span>
                      )}
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{timeAgo(post.createdAt)}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>by {post.author?.name}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{post.viewCount || 0} views</span>
                    </div>
                  </div>
                  <p style={{ 
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '16px'
                  }}>
                    {post.content.substring(0, 150)}...
                  </p>
                  <div className="tag-list">
                    {post.tags?.slice(0, 3).map(tag => (
                      <span 
                        key={tag._id} 
                        className="tag"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.displayName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Tags Section */}
      {popularTags.length > 0 && (
        <section style={{ 
          padding: '60px 0', 
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div className="container">
            <h2 style={{ 
              textAlign: 'center',
              marginBottom: '40px',
              fontSize: '28px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Popular Topics
            </h2>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              gap: '12px'
            }}>
              {popularTags.map(tag => (
                <span 
                  key={tag._id}
                  className="tag"
                  style={{ 
                    backgroundColor: tag.color,
                    fontSize: '14px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    window.location.href = `/helpful-posts?tag=${tag.name}`;
                  }}
                >
                  {tag.displayName} ({tag.usageCount})
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section style={{ 
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ 
            fontSize: '36px',
            fontWeight: '600',
            marginBottom: '20px',
            color: 'var(--text-primary)'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{ 
            fontSize: '18px',
            marginBottom: '40px',
            color: 'var(--text-secondary)',
            maxWidth: '500px',
            margin: '0 auto 40px'
          }}>
            Join thousands of students and faculty already using EduSupport Portal to enhance their academic experience.
          </p>
          
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Account
              </Link>
              <Link to="/helpful-posts" className="btn btn-secondary btn-lg">
                Explore Posts
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;