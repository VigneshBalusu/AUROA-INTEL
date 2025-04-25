// models/Experience.js
import mongoose from 'mongoose';

const ExperienceSchema = new mongoose.Schema({
  // ★★★ REMOVED the separate 'name' field ★★★

  experience: {
    type: String,
    required: [true, 'Experience text is required'],
    trim: true,
  },
  taggedEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  messageToRecipient: {
    type: String,
    trim: true,
    default: null,
  },
  userId: { // Reference to the user who submitted
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // ★ These fields store the user info AT TIME OF POSTING
  userName: { // THIS field holds the user's name
      type: String,
      required: [true, 'User name is required'], // Keep this required
  },
  userEmail: { // THIS field holds the user's email
      type: String,
      required: [true, 'User email is required'], // Keep this required
  },
  userPhoto: {
      type: String, // URL or path to the photo
      default: '/uploads/default-profile-placeholder.png' // Use a default server path or URL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true }); // Add timestamps if you want createdAt and updatedAt automatically

ExperienceSchema.index({ userId: 1 });
ExperienceSchema.index({ createdAt: -1 });

// Use mongoose.models to prevent OverwriteModelError during hot-reloading
export default mongoose.models.Experience || mongoose.model('Experience', ExperienceSchema);