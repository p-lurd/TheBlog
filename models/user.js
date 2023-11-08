const mongoose = require('mongoose');
const shortid = require('shortid');
const bcrypt = require('bcrypt');


const Schema = mongoose.Schema;

const User = new Schema ({
    _id: {
        type: String,
        default: shortid.generate
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { type: String, required: true},
    created_at: { type: Date, default: new Date() },
    resetToken: {type:String, required:false},
    resetTime: {type: Date, required: false}
})




// before save
User.pre('save', async function (next) {
        const user = this;
        const hash = await bcrypt.hash(this.password, 10);
        this.password = hash;
        const caseEmail = await this.email.toLowerCase();
        this.email = caseEmail
})



User.methods.isValidPassword = async function(password){
    const user = this;
    const compare = await bcrypt.compare(password, user.password);

    return compare
}





const UserModel = mongoose.model('users', User);


module.exports = UserModel