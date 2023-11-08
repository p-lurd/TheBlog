const UserModel = require('../models/user');
const BlogModel = require('../models/blog');
const userMiddleware = require('./user.middleware');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const joi = require('joi');
const moment = require('moment');
const PORT = process.env.PORT;
const PASSWORD = process.env.PASSWORD;
const EMAIL = process.env.EMAIL;
const LINK = process.env.LINK
const logger = require('../logger/index')


// --------------------to create user----------------
const createUser = async (req, res, next)=>{
    try {
      logger.info('[createUser function] => started')
        const {first_name, last_name,password} = req.body
        const email = req.body.email.toLowerCase();
        const existedEmail = await UserModel.findOne({email});
        if (existedEmail){
            const duplicateUserError = new Error("User already exists");
            duplicateUserError.status = 409;
            // throw duplicateUserError;
            logger.info(duplicateUserError)
            const errorParam = encodeURIComponent(duplicateUserError.message); // Encode the error message
            return res.redirect(`/signup?error=${errorParam}`);
        }
        const user = await UserModel.create({
            first_name,
            last_name,
            email,
            password
        })

        const token = await jwt.sign({ email: user.email, _id: user.id}, process.env.JWT_SECRET)
        logger.info('[createUser function] => ended')
        res.status(201);
        // res.json({
        //  message: 'User created successfully',
        //     user,
        //     token
        //  })
         return res.redirect('/login')
    } catch (error) {
        next(error);
    }
}




// to login 
const login = async (req, res, next) => {
    try {
      logger.info('[login function] => started')
      const bodyOfRequest = req.body;
      const the_email = bodyOfRequest.email.toLowerCase();
      const user = await UserModel.findOne({
        email: the_email
      });
      if (!user){
        const userNotFound = new Error ("User not found, check email or password");
        userNotFound.status = 404;
        // throw userNotFound;
        logger.info(userNotFound)
        const errorParam = encodeURIComponent(userNotFound.message); // Encoding the error message
        return res.redirect(`/login?error=${errorParam}`);
      }
  
      const validPassword = await user.isValidPassword(bodyOfRequest.password);
      // console.log({validPassword})

      if (!validPassword) {
        const invalidCredentials = new Error("email or password is wrong");
        invalidCredentials.status = 422;
        // throw invalidCredentials
        logger.info(invalidCredentials)
        const errorParam = encodeURIComponent(invalidCredentials.message); // Encode the error message
        return res.redirect(`/login?error=${errorParam}`);
      }
      
  
      const token = await jwt.sign({ email: user.email, _id: user._id}, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' });
      // res.json({
      //   message: 'Login successful',
      //   code: 200,
      //   data: {
      //       user,
      //       token
      //   }
      //   })
      res.cookie('user_id', user._id);
      logger.info('[user login] => login successful')
      res.cookie('token', token); // Storing the token in a cookie for subsequent requests
      res.redirect('/blogs/users');
      
    } catch (error) {
      next(error)
    }
  }



//   ---------------------reset password--------------
const resetToken = async (req, res, next) => {
    try {
      logger.info('[resetToken] => started')
        const schema = joi.object({
            email: joi.string().required()
        })
        const valid = await schema.validate(req.body)
        // console.log({validError: valid.error})

        if (valid.error){
            const inputValidationError = new Error (valid.error.message);
            inputValidationError.status = 422;
            // throw inputValidationError;
            logger.info(inputValidationError)
            const errorParam = encodeURIComponent(inputValidationError.message); // Encode the error message
            return res.redirect(`/forgot_password?error=${errorParam}`);
        }
        
        const email = req.body.email.toLowerCase();
        const user = await UserModel.findOne({
            email: email
          });
          if (!user){
            const userNotFound = new Error ("User not found, check email or signup");
            userNotFound.status = 404;
            // throw userNotFound;
            const errorParam = encodeURIComponent(userNotFound.message); // Encode the error message
            return res.redirect(`/signup?error=${errorParam}`);
          }
        const timestamp = moment().format();
        const resetToken = await bcrypt.hash(email + timestamp, 10);
        const urlSafeToken = encodeURIComponent(resetToken);
        const tokenUpdate = await UserModel.updateOne({email: email}, {$set: {resetToken: resetToken, resetTime: timestamp}})
        if (tokenUpdate.nModified === 0) {
            // If no documents were modified (nModified is 0)
            return res.status(403).json({
              message: "Update condition not met. Token not updated."
            });
          }

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: EMAIL,
              pass: PASSWORD
            }
          });

          const mailOptions = {
            from: EMAIL,
            to: email,
            subject: 'Password Reset Request',
            text: `Click the following link to reset your password:${process.env.DOMAIN}/reset/${urlSafeToken}`
          };
          // console.log({mailOptions})
          await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                logger.error("Email sending error:", error);
            } else {
                logger.log("Email sent: " + info.response);
            }
        });
        logger.info('[resetToken] => ended')
          res.status(200)
          // res.json({
          //   mesage: "reset link successfully sent"
          // })
          res.redirect('/')
    } catch (error) {
        next(error)
    }
}


// -----------------------resetPassword-------------
const resetPassword = async(req, res, next) => {
  try {
    logger.info('[resetPassword] => started')
    const schema = joi.object({
      password: joi.string().required(),
      repeat_password: joi.ref('password'),
      urlSafeToken: joi.required()
  })
  const valid = await schema.validate(req.body)
      // logger.debug({validError: valid.error})

      if (valid.error){
          const inputValidationError = new Error (valid.error.message);
          inputValidationError.status = 422;
          // throw inputValidationError;
          const errorParam = encodeURIComponent(inputValidationError.message); // Encode the error message
          return res.redirect(`/signup?error=${errorParam}`);
      }

      const urlSafeToken = req.body.urlSafeToken
      const resetToken = decodeURIComponent(urlSafeToken);
  const newPassword = req.body.password;

const existToken = await UserModel.findOne({resetToken})
if(!existToken){
  return res.status(404).json({
    message: "link is wrong or already used"
  })
}
const timestamp = existToken.resetTime
// Calculate the token's age
const tokenAge = moment().diff(moment(timestamp), 'minutes');
logger.info({tokenAge})
if (tokenAge > 15){
  return res.status(401).json({
    message: 'link already expired'
  })
}
const hash = await bcrypt.hash(newPassword, 10);
const updatePassword = await UserModel.updateOne({resetToken: resetToken}, {$set: {password: hash}});
if (updatePassword.nModified === 0) {
  // If no documents were modified (nModified is 0), it means the update condition was not met
  return res.status(403).json({
    message: "Update condition not met. Password not changed."
  });
}
await UserModel.findOneAndUpdate({resetToken}, {$set: {resetToken: ''}})
logger.info('[resetPassword] => password reset successful')
res.status(200)
res.redirect('/login')
  } catch (error) {
    next(error)
  }
    
}


module.exports = {
    createUser,
    login,
    resetToken,
    resetPassword
}