const router = require('express').Router();
const Blog = require('../models/blogsModel');
const User = require('../models/userModel');
const {auth} = require('../middlewares/authMiddleware');

// Create Blog
router.post('/', auth, async (req, res) => {
    const { title, description } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newBlog = new Blog({
            title,
            description,
            author: req.user.id,
            authorName: user.name,
        });
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Read Blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name');
        res.json(blogs);
    } catch (error) {
        res.status(400).json({ message: error.message, msg: "this is private route" });
    }
});

// Update Blog
router.put('/:id', auth, async (req, res) => {
    const { title, description } = req.body;

    try {
        const blog = await Blog.findById(req.params.id);
        if (blog.author.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        blog.title = title || blog.title;
        blog.description = description || blog.description;

        await blog.save();
        res.json(blog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete Blog
router.delete('/:id', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (blog.author.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Blog deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;