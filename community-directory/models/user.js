const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  githubId: { type: String, unique: true } 
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
