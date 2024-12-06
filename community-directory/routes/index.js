var express = require('express');
const Event = require('../models/event');
var router = express.Router();

function isAuthenticated(req,res,next){
  if(req.session.username){
    res.redirect("/events")
  }else{
    next()
  }
}

/* GET home page. */
router.get('/',isAuthenticated, function(req, res) {
  res.redirect("/events");
});

module.exports = router;
