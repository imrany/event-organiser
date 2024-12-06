const mongoose = require('mongoose');

// Define the Event Schema
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  photo: { type: String }, // Optional
});

// Check if the model is already defined to avoid overwriting it
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

module.exports = Event;
