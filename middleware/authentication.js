const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_SECRET
const User = require('../model/User')

const authMiddleware = async (req, res, next ) => {
    const token = req.cookies.token;
  
    if(!token) {
      return res.redirect('/login')
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret);
      //dont just find by Id, but by password
      const user = await User.findById(decoded.userId)
      if(!user) {
        return redirect('/login')
      }
      req.user = decoded.userId;
      res.cookie('userID', req.user, {httpOnly: true})
      next();
    } catch(error) {
      return res.redirect('/login')
    }
  }


module.exports = {
    authMiddleware
}