const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'student', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);