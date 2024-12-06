var express = require('express');
var path = require('path');
var session = require('express-session');
var passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const connectDB = require('./config/db');
const User = require('./models/user');
const hbs = require('hbs');
const fs = require('fs');
const bcrypt=require("bcryptjs")

var app = express();

const uploadFolder = 'uploads/';
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
  console.log(`Created folder: ${uploadFolder}`);
}

hbs.registerPartials(path.join(__dirname, 'views/partials'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false, 
  saveUninitialized: true, 
  cookie: { secure: false } 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

// Passport.js initialization
app.use((req, res, next) => {
  res.locals.loggedInUser = req.session.username || null; // Pass username or null
  next();
});
app.use(passport.initialize());
app.use(passport.session());

// Passport.js configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await bcrypt.compare(password,user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_REDIRECT_URI
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user in the database
    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      user = new User({
        githubId: profile.id,
        username: profile.username,
        password: "github" // GitHub login users don't have passwords
      });
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use('/', require('./routes/index'));
app.use('/', require('./routes/users'));
app.use('/', require('./routes/events')); 

connectDB();

module.exports = app;
