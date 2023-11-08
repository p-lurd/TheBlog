const mongoose = require('mongoose');
const shortid = require('shortid');


const Schema = mongoose.Schema;

const Blog = new Schema ({
    _id: {
        type: String,
        default: shortid.generate
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    state: {
        type: String, 
        required: true,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    tags: {
        type: [String],
        required: true
    },
    author: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    },
    read_count: {
        type: Number,
        required: true,
        default: 0
    },
    reading_time: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    user_id: { type: String, required: true, ref: "users"}
})




const BlogModel = mongoose.model('blogs', Blog);
module.exports = BlogModel
