const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const PORT = process.env.PORT
const db = require('./db');
const path = require('path')

const { getBlogs,getOneBlog} = require('./controller');
const { resetPassword, resetToken, login, createUser } = require('./users/user.controller');
const userMiddlewares = require('./users/user.middleware');

const blogRouter = require('./routers/blogs.router');
const logger = require('./logger');





db.connect();

app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views' , __dirname + '/views');



// -------------to get blogs------------
app.get('/', getBlogs);
// -----------------to get a single blog---------------
app.get('/blog/:_id', getOneBlog);

// ------------------to signup------------
app.get("/signup", (req, res, next) => { 
  const error = req.query.error;
    const UserError = error ? new Error(decodeURIComponent(error)) : null;
    res.locals.UserError = UserError;
    if(req.cookies.token){
      res.redirect('/blogs/users')
      return
    }
    res.render('signup', {UserError})
})
app.post("/v1/signup", userMiddlewares.validateUserCreation, createUser);


// ----------------------to login------------
app.get("/login", (req, res, next) => {
    const error = req.query.error;
    const invalidCredentials = error ? new Error(decodeURIComponent(error)) : null;
    res.locals.invalidCredentials = invalidCredentials;
    if(req.cookies.token){
      res.redirect('/blogs/users')
      return
    }
    res.render('login',{ invalidCredentials } )
})
app.post("/v1/login", userMiddlewares.loginValidation, login);


// -------------------to generate reset token-----------------
app.get("/forgot_password", (req, res, next)=>{
  const error = req.query.error;
  const errorParam = error ? new Error(decodeURIComponent(error)) : null;
  res.locals.errorParam = errorParam;
  if(req.cookies.token){
    res.redirect('/blogs/users')
    return
  }
  res.render('forgotPassword', {errorParam})
})
app.post("/v1/request-reset", resetToken); //--------to generate email-------

// -----------------------to reset password--------------
app.get("/reset/:token", (req, res, next)=>{
  const urlSafeToken = req.params.token;
  const error = req.query.error;
    const errorParam = error ? new Error(decodeURIComponent(error)) : null;
    res.locals.errorParam = errorParam;
  if(req.cookies.token){
    res.redirect('/blogs/users')
    return
  }
  res.render('newPassword', {urlSafeToken, errorParam})
})
app.post("/v1/reset/:token", resetPassword); //--------------to create new password






app.use('/blogs', blogRouter)




app.get('/logout', (req, res) => {    
    res.clearCookie('token')
    res.redirect('/')
});



 //-------------- when I navigate to “{random}.html” it should return with a 404 page-----------------
 app.get("*", (req, res) => {
  res.status(404);
  res.render('404')
});

  
  app.use((error, req, res, next) => {
    if (error.status == 404) return res.status(404).sendFile(404);
    res.status(error.status ?? 500)
    logger.error({ErrorHandler: error})
    res.send(error.message)
  })







app.listen(PORT, ()=>{
    logger.info (`server started at PORT: ${PORT}`)
});

module.exports = app;