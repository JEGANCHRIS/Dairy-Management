import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/blogs.css';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  useEffect(() => {
    if (blog?.tags) {
      fetchRelatedBlogs();
    }
  }, [blog]);

  const fetchBlog = async () => {
    try {
      const response = await api.get(`/blogs/${id}`);
      setBlog(response.data);
      
      // Increment view count
      await api.put(`/blogs/${id}/view`);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    try {
      const response = await api.get('/blogs', {
        params: { 
          tag: blog.tags[0],
          limit: 3 
        }
      });
      setRelatedBlogs(response.data.blogs.filter(b => b._id !== id));
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  if (loading) {
    return (
      <section className="blog-detail-page">
        <div className="container">
          <div className="loading">Loading blog...</div>
        </div>
      </section>
    );
  }

  if (!blog) {
    return (
      <section className="blog-detail-page">
        <div className="container">
          <div className="error">Blog not found</div>
        </div>
      </section>
    );
  }

  return (
    <section className="blog-detail-page">
      <div className="container">
        <article className="blog-detail">
          <header className="blog-header">
            <h1>{blog.title}</h1>
            <div className="blog-meta">
              <span className="blog-author">By {blog.author?.name}</span>
              <span className="blog-date">
                {new Date(blog.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="blog-views">👁️ {blog.views} views</span>
            </div>
          </header>

          <div className="blog-featured-image">
            <img src={blog.image} alt={blog.title} />
          </div>

          <div className="blog-content" 
               dangerouslySetInnerHTML={{ __html: blog.content }} />

          <div className="blog-tags">
            {blog.tags?.map(tag => (
              <Link key={tag} to={`/blogs?tag=${tag}`} className="blog-tag">
                #{tag}
              </Link>
            ))}
          </div>
        </article>

        {relatedBlogs.length > 0 && (
          <section className="related-blogs">
            <h2>Related Blogs</h2>
            <div className="related-blogs-grid">
              {relatedBlogs.map(relatedBlog => (
                <Link key={relatedBlog._id} to={`/blog/${relatedBlog._id}`} className="related-blog-card">
                  <img src={relatedBlog.image} alt={relatedBlog.title} />
                  <h3>{relatedBlog.title}</h3>
                  <p>{relatedBlog.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
};

export default BlogDetail;