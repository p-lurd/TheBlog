const joi = require('joi');





const validateUserCreation = async (req, res, next)=>{
    try {
        // console.log(req.body);
        const schema = joi.object({
            first_name: joi.string().required(),
            last_name: joi.string().required(),
            email: joi.string().required(),
            password: joi.string().required(),
            confirm_password: joi.ref('password')
        })
        const valid = await schema.validate(req.body)

        if (valid.error){
            const inputValidationError = new Error (valid.error.message);
            inputValidationError.status = 422;
            // throw inputValidationError;
            const errorParam = encodeURIComponent(inputValidationError.message); // Encode the error message
            return res.redirect(`/signup?error=${errorParam}`);
        }else{
            const {first_name, last_name, email, password} = req.body
            next();
        }
        
    } catch (error) {
        next(error)
    }
}


const loginValidation = async (req, res, next) => {
    try {
            const schema = joi.object({
                email: joi.string().required(),
                password: joi.string().required()
            })
            const valid = await schema.validate(req.body, { abortEarly: true })
            if (valid.error){
                const loginError = new Error (valid.error.message);
                loginError.status = 422;
                // throw loginError;
                const errorParam = encodeURIComponent(loginError.message); // Encode the error message
                return res.redirect(`/login?error=${errorParam}`);
            }
        
            
        next();
        
    } catch (error) {
        next(error)
    }
    }









module.exports = {
    validateUserCreation,
    loginValidation
}