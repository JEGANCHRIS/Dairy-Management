const Blog = require('../models/Blog');

// Get all blogs with pagination
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const tag = req.query.tag;

    const filter = {};
    if (tag) filter.tags = tag;

    const blogs = await Blog.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(filter);

    res.json({
      blogs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlogs: total
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ error: 'Error fetching blogs' });
  }
};

// Get featured blogs
const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name')
      .sort({ views: -1, createdAt: -1 })
      .limit(6);

    res.json(blogs);
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({ error: 'Error fetching featured blogs' });
  }
};

// Get single blog by ID
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({ error: 'Error fetching blog' });
  }
};

// Increment blog views
const incrementViews = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({ views: blog.views });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ error: 'Error updating views' });
  }
};

// Create new blog (Admin/SuperAdmin only)
const createBlog = async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      author: req.userId
    };

    const blog = new Blog(blogData);
    await blog.save();

    await blog.populate('author', 'name');

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ error: 'Error creating blog' });
  }
};

// Update blog (Admin/SuperAdmin only)
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    updates.updatedAt = Date.now();

    const blog = await Blog.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'name');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ error: 'Error updating blog' });
  }
};

// Delete blog (Admin/SuperAdmin only)
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Error deleting blog' });
  }
};

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  incrementViews
};