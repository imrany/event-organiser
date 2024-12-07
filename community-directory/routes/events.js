var express = require('express');
var router = express.Router();
const Event = require('../models/event');  // Import the Event model
const multer = require('multer');
var path = require('path');

function isAuthenticated(req,res,next){
  if(!req.session.username){
    return res.redirect("/events")
  }
  next()
}

// Handle Pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploads in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});
const upload = multer({ storage });

// Handle form submission with file upload
router.post('/events', upload.single('photo'), async (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    console.log('Request Body:', req.body); // Log form data
    console.log('Uploaded File:', req.file); // Log uploaded file

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) throw new Error('Invalid date format');

    const photo_name = req.file ? req.file.filename : null;
    console.log('Photo Filename:', photo_name);
    const photo_url=`${process.env.BASE_URL}/${photo_name}`

    const newEvent = new Event({ name, description, date: parsedDate, location, photo:photo_url });
    await newEvent.save();

    res.redirect('/events');
  } catch (err) {
    console.error('Error creating event:', err.message);
    res.status(500).send(`Error creating event. ${err.message}`);
  }
});


// Show all events (public page)
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({created_at:-1}); // Fetch all events
    const updatedEvents = events.map(event => ({ 
      _id: event._id,
      name: event.name,
      description: event.description,
      date: event.date,
      location: event.location,
      photo: event.photo,
      descriptionPreview: `${event.description.slice(0, 120)}...` 
    }));

    res.render('events/index', { events:updatedEvents, title:"Events", username:req.session.username });
  } catch (err) {
    res.status(500).send('Error retrieving events.');
  }
});

// Show form to create a new event
router.get('/events/new',isAuthenticated, (req, res) => {
  res.render('events/new', { title:"Create new event", username:req.session.username });
});


// Show form to edit an event
router.get('/events/:id/edit',isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    res.render('events/edit', { event, title:event.name, username:req.session.username  });
  } catch (err) {
    res.status(500).send('Error retrieving event for editing.');
  }
});

// Handle form submission to update an event
router.post('/events/:id', async (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    if(date){
      await Event.findByIdAndUpdate(req.params.id, { 
        ...req.body  
      });
      res.redirect('/events');
    }else{
      res.send("Date is required")
    }
  } catch (err) {
    res.status(500).send('Error updating event.');
  }
});

// Delete an event
router.post('/events/:id/delete', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Error deleting event.');
  }
});

module.exports = router; // Ensure you export the router
