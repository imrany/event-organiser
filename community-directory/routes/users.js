const express =require("express")
const passport = require('passport');
const User=require("../models/user")
const bcrypt = require('bcryptjs');

function isAuthenticated(req,res,next){
  if(req.session.username){
    res.redirect("/events")
  }else{
    next()
  }
}

const router = express.Router();
// Redirect user to GitHub for authentication
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback route
router.get('/auth/github/callback', (req,res,next)=>{
  // passport.authenticate('github', { failureRedirect: '/login' }),
  // (req, res) => {
  //   // Successful authentication
  //   res.redirect('/events');
  // }

  passport.authenticate('github', (err, user, info) => { 
    if (err) { 
      return next(err); 
    } 
    if (!user) { 
      return res.redirect('/login'); 
    } 
    req.logIn(user, (err) => { 
      if (err) { 
        return next(err); 
      } 
      // Save the logged-in username in the session 
      req.session.username = user.username; 
      return res.redirect('/events'); 
    }); 
  })(req, res, next); 
});

// Register page (GET)
router.get('/register',isAuthenticated, (req, res) => {
  res.render('users/register',{title:"Register page"});
});

// Register user (POST)
router.post('/register', async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Debugging
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already taken');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, password:hashedPassword });
    await newUser.save();
    if(newUser){
      req.session.username = newUser.username
      res.redirect('/events');
    }else{
      res.status(500).send('Failed to create user');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Login page (GET)
router.get('/login', (req, res) => {
  if(req.session.username){
    res.redirect("/events")
  }else{
    console.log('Login page accessed');
    res.render('users/login',{ title : "Login page"});
  }
});


// Login user (POST)
// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/events', // On success, redirect to events
//   failureRedirect: '/login',  // On failure, redirect to login
//   failureMessage: true
// }), (req, res) => {
//   // Save the logged-in username in the session
//   req.session.username = req.user.username; 
//   console.log(req.user)
//   res.redirect('/');
// });
 
router.post('/login', (req, res, next) => { 
  passport.authenticate('local', (err, user, info) => { 
    if (err) { 
      return next(err); 
    } 
    if (!user) { 
      return res.redirect('/login'); 
    } 
    req.logIn(user, (err) => { 
      if (err) { 
        return next(err); 
      } 
      // Save the logged-in username in the session 
      req.session.username = user.username; 
      return res.redirect('/events'); 
    }); 
  })(req, res, next); 
});

// Logout user
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.redirect('/login');
  });
});

module.exports = router; // Ensure you export the router
