const router = require('express').Router();
const { getBlogs, postBlogs, changeState, getOneBlog, myBlogs, myOneBlog, editBlog, deleteBlog } = require('../controller');
const {tokenAuth} = require('../middlewares/global.middleware')
const dir = require('../utils')

const express = require('express');
const path = require('path')
router.use(express.static(path.join(__dirname, '../public')));

// ----------------to authenticate user-----------------
router.use(tokenAuth);

// ---------------to post blogs--------------
router.get('/post', (req, res, next)=>{
    const user = req.user;
    const error = req.query.error;
    const errorParam = error ? new Error(decodeURIComponent(error)) : null;
    res.locals.errorParam = errorParam;
    res.render('newPost', {user, errorParam})
})
router.post('/post', postBlogs)

// -----------------to publish a blog--------
router.patch('/publish/:_id', changeState)

// ------------to get own personal blogs-----------
router.get('/users', myBlogs)

// -------------to get a single blog for editing--------
router.get('/user/:_id', myOneBlog)

//------------- to patch the edited blog into the database--------------
router.post('/user/edit', editBlog)

// --------------for user to delete its own blog both in draft and published state----------------
router.delete('/delete/:_id', deleteBlog)


module.exports = router;