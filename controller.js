const mongoose = require('mongoose');
const joi = require('joi');
const BlogModel = require('./models/blog');
const {calculateReadingTime} = require('./utilities/reading_time');
const { readCount } = require('./utilities/read_count');
const logger = require('./logger/index')




// -----------------to get list of blogs-------------------
const getBlogs = async (req, res, next) => {
    try {
        logger.info('[getBlogs function] => started')
        const user = req.user;
        const token = req.cookies.token;
        const pageEncoded = req.query.page || 1;
        const page = decodeURIComponent(pageEncoded);
        const blogsPerPage = 20;
        const skip = (page - 1) * blogsPerPage;

        const searchQuery = {}; // Initializing an empty search query
        const filterBy = req.query.filterBy;

        // Checking for search parameters and adding them to the query
        if (filterBy === 'author') {
            const author = req.query.searchValue;
            searchQuery.author = author;
        }
        if (filterBy === 'title') {
            const title = req.query.searchValue;
            searchQuery.title = { $regex: title, $options: 'i' }; // Case-insensitive title search
        }
        if (filterBy === 'tags') {
            const tags = req.query.searchValue;
            searchQuery.tags = { $in: tags.split(',') }; // Search for multiple tags
        }

        // Check for ordering parameters and create a sorting object
        const sorting = {};
        if (req.query.orderBy === 'read_count') {
            sorting.read_count = -1; // Descending order by read_count
        }
        if (req.query.orderBy === 'reading_time') {
            sorting.reading_time = 1; // Ascending order by reading_time
        }
        if (req.query.orderBy === 'timestamp') {
            sorting.timestamp = -1; // Descending order by timestamp
        }

        const blogsList = await BlogModel
            .find({ state: "published", ...searchQuery }) // Apply search parameters
            .skip(skip)
            .limit(blogsPerPage)
            .sort(sorting); // sorting

        if (!blogsList) {
            const noBlogError = new Error("No blog Found");
            noBlogError.status = 404;
            logger.info(noBlogError)
            throw noBlogError;
        }

        const totalBlogs = await BlogModel.countDocuments({ state: "published", ...searchQuery });
        const totalPages = Math.ceil(totalBlogs / blogsPerPage);
        logger.info('[getBlogs function] => ended')

        res.status(200)
        res.render('index', { // Rendering the EJS template with data
            token,
            user: user,
            blogsList: blogsList,
            currentPage: page,
            totalPages: totalPages
        });
        // res.json({
        //     status: 200,
        //     user,
        //     blogsList,
        //     currentPage: page,
        //     totalPages
        // })
    } catch (error) {
        next(error);
    }
};





// --------------------to get a single blog----------------
const getOneBlog = async(req, res, next) => {
    try {
        logger.info('[getOneBlog function] => started')
        const token = req.cookies.token;
        // ------to increase the read count per request-------
        const pageId = req.params._id
        const singleBlog = await BlogModel.findOne({_id: pageId});
        const previousReadCount = singleBlog.read_count
        const new_read_count = readCount(previousReadCount);
        const countUpdate = await BlogModel.updateOne({_id: pageId}, {$set: {read_count: new_read_count}});
        if (countUpdate.nModified === 0) {
            // If no documents were modified (nModified is 0)
            logger.info('[get blog] => no blog found')
            return res.status(403).json({
              message: "Update condition not met. Blog not updated."
            });
          }
          logger.info('[getOneBlog function] => ended')
        res.status(201)
        res.render('viewBlog', {singleBlog, token})
        // .json({
        //     message: "blog gotten successfully",
        //     singleBlog
        // })  
        
    } catch (error) {
        next(error)
    }
};


//   ------------------------------to  post  blogs-----------------
const postBlogs = async(req, res, next) => {
    try {
        logger.info('[postBlog function] => started')
        const user = req.user

        const schema = joi.object({
            title: joi.string().required(),
            body: joi.string().required(),
            description: joi.string().required(),
            tags: joi.string().required()
        })
        const valid = await schema.validate(req.body, { abortEarly: true })
            if (valid.error){
                const loginError = new Error (valid.error.message);
                loginError.status = 422;
                // throw loginError;
                logger.info(loginError)
                const errorParam = encodeURIComponent(loginError.message); // Encode the error message
          return res.redirect(`/blogs/post?error=${errorParam}`);
            }
        const {title, description, body, tags}= req.body;
        const tagsArray = tags.split(',').map(tag => tag.trim());
        const author = `${user.first_name} ${user.last_name}`
        const timestamp = new Date().toLocaleString();
        const user_id = user._id
        
        const reading_time = calculateReadingTime(body)
        // console.log({reading_time})
        const blog = await BlogModel.create({
          title,
          description,
          user_id,
          tags: tagsArray,
          author,
          timestamp,
          reading_time,
          body
        });
        logger.info('[postBlog function] => ended')
        res.status(201)
        // res.json({
        //     blog
        // })
        res.redirect('/blogs/users')
      } catch (error) {
        next(error)
      }
}


// ----------------------to change state---------------
const changeState = async(req, res, next) => {
    try {
        logger.info('[changeState function] => started')
        const _id = req.params._id
        const user = req.user
        const newState = "published"
        const stateUpdate = await BlogModel.updateOne({_id: _id, user_id: user._id }, {$set: {state: newState}})
    
        if (stateUpdate.nModified === 0) {
            // If no documents were modified (nModified is 0), it means the update condition was not met
            logger.info('[publish blog] => blog not published')
            return res.status(403).json({
              message: "Update condition not met. Blog not updated."
            });
          }
          logger.info('[changeState function] => ended')
        // const blog = await BlogModel.findOne({_id: _id})
        res.status(200);
        // .json({
        //     message: "published successfully",
        //     blog
        // })
        res.redirect('/blogs/users')
    } catch (error) {
        next(error);
    }
    
}




const myBlogs = async(req, res, next) => {
    try {
        logger.info('[myBlogs function] => started')
        const user = req.user;
        const page = req.query.page || 1;
        const blogsPerPage = 20;
        const skip = (page - 1) * blogsPerPage;

        const state = req.query.state
        const searchQuery = {};
        if (state){
            searchQuery.state = state;
        }



        const blogsList = await BlogModel
            .find({ user_id: user._id, ...searchQuery }) // Apply search parameters
            .skip(skip)
            .limit(blogsPerPage)

        if (!blogsList) {
            const noBlogError = new Error("No post Found");
            noBlogError.status = 404;
            logger.info(noBlogError)
            throw noBlogError;
        }

        const totalBlogs = await BlogModel.countDocuments({user_id: user._id, ...searchQuery });
        const totalPages = Math.ceil(totalBlogs / blogsPerPage);
        logger.info('[myBlogs function] => ended')
        // res.json({
        //     status: 200,
        //     user,
        //     blogsList,
        //     currentPage: page,
        //     totalPages
        // })
        res.status(200)
        res.render('myBlogs', { // Rendering the EJS template with data
            user: user,
            blogsList: blogsList,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        next(error);
    }
}


// ---------------------to view a single blog--------------
const myOneBlog = async(req, res, next)=>{
    try {
        logger.info('[myOneBlog function] => started')
    const blogId = req.params._id
    const user = req.user
    const blog = await BlogModel.findOne({_id: blogId, user_id: user._id});
    if (!blog) {
        const noBlogError = new Error("No post Found");
        noBlogError.status = 404;
        // throw noBlogError;
        logger.info(noBlogError)
    }
    res.status(200)
    const error = req.query.error;
    const errorParam = error ? new Error(decodeURIComponent(error)) : null;
    res.locals.errorParam = errorParam;
    logger.info('[myOneBlog function] => ended')
    res.render('singleUserPost', {user, singleBlog: blog, errorParam})
    // res.json({
    //     user,
    //     blog
    // })
    } catch (error) {
       next(error) 
    }
    


}

// -------------------to patch blog-------------------
const editBlog = async(req, res, next)=>{
    try {
        logger.info('[editBlog function] => started')
        const {title, description, body, tags, _id}= req.body;
        const user = req.user
        const schema = joi.object({
            title: joi.string().required(),
            body: joi.string().required(),
            description: joi.string().required(),
            tags: joi.string().required(),
            _id: joi.string().required()
        })
        const valid = await schema.validate(req.body, { abortEarly: true })
            if (valid.error){
                const loginError = new Error (valid.error.message);
                loginError.status = 422;
                // throw loginError;
                logger.info(loginError)
                const errorParam = encodeURIComponent(loginError.message); // Encode the error message
          return res.redirect(`/blogs/user/${_id}?error=${errorParam}`);
            }
        
        const tagsArray = tags.split(',').map(tag => tag.trim());
        const author = `${user.first_name} ${user.last_name}`
        const timestamp = new Date().toLocaleString();
        const user_id = user._id
        const reading_time = calculateReadingTime(body)
        const blog = await BlogModel.updateOne({_id, user_id},{$set:{
          title,
          description,
          user_id,
          tags: tagsArray,
          author,
          timestamp,
          reading_time,
          body
        }});
        if(user._id !== user_id){
            res.status(401)
            res.json({
                message: "Unauthorized",
            })
        }
        logger.info('[editBlog function] => ended')
        res.status(200)
        // res.json({
        //     message: 'edit successful',
        //     blog
        // })
        const error = req.query.error;
    const errorParam = error ? new Error(decodeURIComponent(error)) : null;
    res.locals.errorParam = errorParam;
        res.redirect('/blogs/users')
    } catch (error) {
        next(error)
    }
    
}

// ----------------to delete blog----------------
const deleteBlog = async(req, res, next)=>{
    try {
        logger.info('[deleteBlog function] => started')
    const user = req.user;
    const _id = req.params._id
    const deletedBlog = await BlogModel.findOneAndDelete({_id, user_id: user._id})
    res.status(200)
    res.json({
        message: 'post deleted successfully',
        deletedBlog
    })
    if(!deleteBlog){
        logger.info('[deleteBlog] => blog not deleted')
    }
    logger.info('[deleteBlog function] => ended')
    } catch (error) {
        next(error)
    }
    
}



module.exports= {
    getBlogs,
    postBlogs,
    changeState,
    getOneBlog,
    myBlogs,
    myOneBlog,
    editBlog,
    deleteBlog
}