const User = require("../models/user");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
require('dotenv').config();


 //require sign in
 exports.requireSignin = expressJWT({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  userProperty: 'auth'
})


exports.isAuth = (req,res,next) =>{
  let user = req.profile && req.auth && req.profile._id == req.auth.id;
  
  //console.log(req.profile._id, req.auth.id);
  if(!user){
      return res.status(403).json({
          error: "Access Denied"
      })
  }

  next();
}


//create new user account
exports.postSignUp = (req, res, next) => {
  const { name, email, password } = req.body;

  //hash the password
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt)

  const user = new User({ name: name, email: email, hashPassword: hash });
  user.save((err, user) => {
    if (err) {
      //console.log(err)
      return res.status(400).json({
        error: err,
      });
    }

    user.hashPassword = undefined;
    return res.json({
      user,
    });
  });
};



//user login
exports.postSignIn = (req,res,next) => {
    const { email, password } = req.body;

    User.findOne({email}, (err, user) => {
        if(err || !user){
            return res.status(400).json({
                error: "Email is Not Registred!! Please Signup First"
            });
        }

        if(!user.authenticate(password)) {
            return res.status(401).json({
                error: "Email and Password dont Match"
            })
        }
       
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
        res.cookie('t', token, {expire: new Date()+ 9999});

        const {_id, name, email} = user ;
        return res.json({
            token,
            user: {
                _id,
                email,
                name,
            }
        })

    })
}
