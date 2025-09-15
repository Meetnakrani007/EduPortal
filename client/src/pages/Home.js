import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

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
        const postsResponse = await axios.get('/api/posts?limit=3&sort=-createdAt');
        setFeaturedPosts(postsResponse.data.posts || []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Debounced search function
  useEffect(() => {
    const searchPosts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await axios.get(`/api/posts?search=${encodeURIComponent(searchQuery)}&limit=5`);
        setSearchResults(response.data.posts || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPosts, 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results - for now, redirect to helpful posts with search
      window.location.href = `/helpful-posts?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchResultClick = (postId) => {
    setShowSearchResults(false);
    setSearchQuery('');
    // Navigate to the specific post
    window.location.href = `/helpful-posts/${postId}`;
  };

  const handleSearchInputFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleSearchInputBlur = () => {
    // Delay hiding to allow clicking on results
    setTimeout(() => setShowSearchResults(false), 200);
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
          {isAuthenticated && (
            <div style={{ 
              maxWidth: '500px', 
              margin: '0 auto 40px',
              position: 'relative'
            }}>
              <form onSubmit={handleSearch} style={{ 
                display: 'flex',
                gap: '12px'
              }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search posts by tags, problems, or content..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchInputFocus}
                    onBlur={handleSearchInputBlur}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      fontSize: '16px',
                      border: 'none',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginTop: '4px',
                      textAlign: 'left'
                    }}>
                      {searchLoading ? (
                        <div style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          color: '#64748b' 
                        }}>
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((post) => (
                          <div
                            key={post._id}
                            onClick={() => handleSearchResultClick(post._id)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#0f172a',
                              marginBottom: '4px',
                              fontSize: '14px'
                            }}>
                              Problem: {post.title.replace(/^\s*Transcript:\s*/i, "").trim()}
                            </div>
                            <div style={{ 
                              color: '#64748b', 
                              fontSize: '12px',
                              marginBottom: '4px'
                            }}>
                              {post.category && (
                                <span style={{
                                  backgroundColor: '#dbeafe',
                                  color: '#1d4ed8',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  marginRight: '8px'
                                }}>
                                  {post.category}
                                </span>
                              )}
                              {timeAgo(post.createdAt)}
                            </div>
                            {post.tags && post.tags.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {post.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      backgroundColor: tag.color || '#e0f2fe',
                                      color: tag.color ? '#ffffff' : '#1d4ed8',
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: '500'
                                    }}
                                  >
                                    {tag.displayName || tag.name || tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : searchQuery.trim().length >= 2 ? (
                        <div style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          color: '#64748b' 
                        }}>
                          No posts found for "{searchQuery}"
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-secondary" style={{
                  padding: '14px 24px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Search
                </button>
              </form>
            </div>
          )}

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
        <section style={{ 
          padding: '80px 0', 
          backgroundColor: '#f8fafc' // Light gray background like in the image
        }}>
          <div className="container">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '40px'
            }}>
              <h2 style={{ 
                fontSize: '32px',
                fontWeight: '700',
                color: '#0f172a',
                margin: 0
              }}>
                Featured Helpful Posts
              </h2>
              <Link 
                to="/helpful-posts" 
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                View All Posts
              </Link>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px'
            }}>
              {featuredPosts.slice(0, 2).map(post => (
                <div 
                  key={post._id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  <h3 style={{ 
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#0f172a',
                    margin: '0 0 12px 0',
                    lineHeight: '1.3'
                  }}>
                    <Link 
                      to={`/helpful-posts/${post._id}`}
                      style={{ 
                        color: '#0f172a', 
                        textDecoration: 'none',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.color = '#2563eb'}
                      onMouseOut={(e) => e.target.style.color = '#0f172a'}
                    >
                      Problem: {post.title.replace(/^\s*Transcript:\s*/i, "").trim()}
                    </Link>
                  </h3>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    flexWrap: 'wrap',
                    marginBottom: '16px'
                  }}>
                    {post.category && (
                      <span style={{ 
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #bfdbfe'
                      }}>
                        {post.category}
                      </span>
                    )}
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{timeAgo(post.createdAt)}</span>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>by {post.author?.name || 'Unknown'}</span>
                  </div>
                  
                  <p style={{ 
                    color: '#475569',
                    lineHeight: '1.6',
                    fontSize: '15px',
                    margin: '0 0 12px 0'
                  }}>
                    {post.content.includes('Ticket:') ? 
                      (() => {
                        const afterDash = post.content.split('---')[1];
                        if (afterDash) {
                          const lines = afterDash.split('\n').filter(line => line.trim());
                          const firstMessage = lines.find(line => 
                            line.includes(':') && !line.includes('[') && !line.includes('📎')
                          );
                          if (firstMessage) {
                            const message = firstMessage.split(':').slice(1).join(':').trim();
                            return `Solution: ${message}`;
                          }
                        }
                        return 'Solution: ' + (post.content.substring(0, 100).replace(/Ticket:.*?---/s, '').trim() || 'No solution available');
                      })() : 
                      post.content.substring(0, 200)
                    }...
                  </p>
                  
                  {/* Tags Display */}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px',
                      marginTop: '8px'
                    }}>
                      {post.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag._id || tag} 
                          style={{
                            backgroundColor: tag.color || '#e0f2fe',
                            color: tag.color ? '#ffffff' : '#1d4ed8',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
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
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Tags Section */}

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