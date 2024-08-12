// models/Blog.js
const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    createDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', BlogSchema);
