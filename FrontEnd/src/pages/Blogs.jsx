import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/blogs.css';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, [page, selectedTag]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs', {
        params: { 
          page, 
          limit: 9,
          tag: selectedTag 
        }
      });
      setBlogs(response.data.blogs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? null : tag);
    setPage(1);
  };

  const allTags = [...new Set(blogs.flatMap(blog => blog.tags || []))];

  return (
    <section className="blogs-page">
      <div className="container">
        <h1>Our Blogs</h1>
        
        {allTags.length > 0 && (
          <div className="blog-tags">
            <button 
              className={`tag-btn ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading blogs...</div>
        ) : (
          <>
            <div className="blogs-grid">
              {blogs.map(blog => (
                <article key={blog._id} className="blog-card">
                  <Link to={`/blog/${blog._id}`}>
                    <div className="blog-image">
                      <img src={blog.image} alt={blog.title} />
                    </div>
                    <div className="blog-content">
                      <h2>{blog.title}</h2>
                      <div className="blog-meta">
                        <span className="blog-author">By {blog.author?.name}</span>
                        <span className="blog-date">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span className="blog-views">👁️ {blog.views} views</span>
                      </div>
                      <p className="blog-excerpt">{blog.excerpt}</p>
                      <div className="blog-tags">
                        {blog.tags?.map(tag => (
                          <span key={tag} className="blog-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                
                <button 
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Blogs;