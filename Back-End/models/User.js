// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  photo: { 
    type: String, 
    default: '' 
  },
  address:{
    type:String,
    default:''
  },
  phone: {
    type: String,
    default: ''
  },

  dateOfBirth: {
    type: Date,
    default: null
  },

  
}, { timestamps: true });

// Ensure the model is registered only once
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;  
