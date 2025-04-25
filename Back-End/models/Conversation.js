// models/Conversation.js
import mongoose from 'mongoose';

/**
 * Schema for individual messages within a conversation.
 * Each message has a role (who sent it), content, and a timestamp.
 */
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: [true, 'Message role is required.'], // Added specific error message
    // Ensure roles match what's used in your application logic (backend routes, frontend).
    // 'bot' is commonly used for AI responses.
    enum: {
        values: ['user', 'bot', 'error', 'system', 'AURORA INTEL'], // Added 'bot'
        message: 'Invalid role: {VALUE}. Must be one of: user, bot, error, system, AURORA INTEL' // Custom enum error message
    }
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty.'], // Added specific error message
    trim: true, // Remove leading/trailing whitespace
  },
  timestamp: {
    type: Date,
    default: Date.now, // Default to the time the message is created
  },
}, {
  _id: false, // Subdocuments (messages) don't need their own MongoDB _id by default
  // You could add _id: true if you specifically need to reference individual messages later
});


/**
 * Schema for a single conversation (chat session).
 * Includes reference to the user, a title, an array of messages,
 * and timestamps for creation, update, and last significant activity.
 */
const conversationSchema = new mongoose.Schema({
  // Reference to the user who owns this conversation
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the 'User' model (ensure you have a User model)
    required: [true, 'User ID is required for a conversation.'],
    index: true, // Create an index on userId for faster lookups of a user's chats
  },
  // Title of the conversation, often generated from the first user prompt
  title: {
    type: String,
    trim: true,
    required: [true, 'Conversation title is required.'], // Title is mandatory
    default: 'Untitled Chat', // Sensible default if generation logic fails elsewhere
    maxlength: [100, 'Title cannot be longer than 100 characters.'] // Optional: Add a max length
  },
  // Array containing all messages in the conversation, using the messageSchema
  messages: [messageSchema],
  // Timestamp indicating the last time a message was added or the chat was interacted with.
  // Useful for sorting conversations by recent activity.
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true // Create an index for efficient sorting by last activity
  }
}, {
  // Mongoose options:
  timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields managed by Mongoose
  // `updatedAt` reflects any change to the document, while `lastActivity`
  // is specifically meant to be updated when messages are added.
});


// --- Important Note on `lastActivity` ---
// While Mongoose middleware (like `.pre('save')` or `.pre('findOneAndUpdate')`)
// can be used to automatically update `lastActivity`, it's often clearer and
// more reliable to update it explicitly in your route handler (controller logic)
// *after* successfully adding messages or performing the relevant action.
// This avoids potential complexities with different types of update operations.

// Example (in your route handler):
// await Conversation.findByIdAndUpdate(chatId, {
//     $push: { messages: { $each: [userMessage, botMessage] } },
//     $set: { lastActivity: new Date() } // Explicitly set it here!
// }, { new: true });

// Or when creating a new conversation:
// const newConversation = new Conversation({
//   userId: ...,
//   title: ...,
//   messages: [...],
//   lastActivity: new Date() // Set explicitly
// });
// await newConversation.save();


// Create the Mongoose model from the schema
const Conversation = mongoose.model('Conversation', conversationSchema);

// Export the model for use in other parts of your application (like routes/controllers)
export default Conversation;