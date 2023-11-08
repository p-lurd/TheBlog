const mongoose = require('mongoose')
const UserModel = require('../models/user');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const logger = require('../logger/index')


const tokenAuth = async (req, res, next) => {
    try {

        const authHeader = req.cookies.token;
        const decoded = await jwt.verify(authHeader, process.env.JWT_SECRET);
        const user = await UserModel.findOne({_id: decoded._id});


        if (!user){
            res.status(401)
            const noUserError = new Error ("No user found")
            // throw noUserError
            logger.info(noUserError)
            res.redirect('/login')
        }
        req.user = user;
        next();
    } catch (error) {
        logger.error(error)
        res.status(401)
        // res.json({
        //     message: "Unauthorized",
        // })
        res.redirect('/login')
    }
}



module.exports ={
    tokenAuth
}