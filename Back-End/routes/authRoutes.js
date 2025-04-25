// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer'; // Assuming multer config is needed here or passed
import path from 'path';
import fs from 'fs';
import cloudinary from 'cloudinary';

import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';

// ★ You'll need the 'upload' middleware instance configured in server.js
// ★ Option 1: Pass it from server.js (more complex setup)
// ★ Option 2: Re-configure multer here (simpler if only used here)
// Let's reconfigure here for simplicity in this example:
const storage = multer.diskStorage({ /* ... same storage config as server.js ... */
    destination: (req, file, cb) => {
        const tempDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads_temp'); // Adjust path
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => { /* ... same fileFilter config ... */
     if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        req.fileValidationError = 'Only image files (jpg, jpeg, png, gif, webp) are allowed!';
        return cb(null, false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: fileFilter });
// End Multer Re-configuration

const router = express.Router();

// --- Routes previously inline in server.js ---

// POST /api/auth/signup (was /add-user)
router.post('/signup', async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: '❌ Name, email, and password required.' });
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: '❌ Email already exists.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultPhoto = '/uploads/default-profile-placeholder.png';
    const newUser = new User({ name, email, password: hashedPassword, photo: defaultPhoto });
    await newUser.save();
    const userResponse = { _id: newUser._id, name: newUser.name, email: newUser.email, photo: newUser.photo };
    res.status(201).json({ message: '✅ User created successfully', user: userResponse });
  } catch(error) { console.error("Signup Error:", error); next(error); }
});

// POST /api/auth/login (was /login)
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const tokenPayload = { userId: user._id };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`✅ Login successful for user: ${user._id}`);
    res.status(200).json({ token, user: { name: user.name, email: user.email, photo: user.photo } });
  } catch (err) { console.error('Login route error:', err); next(err); }
});

// GET /api/auth/user (Get current user details) - Protected
router.get('/user', authMiddleware, async (req, res, next) => { // Path relative to /api/auth
  try {
    const user = req.user;
    console.log(`✅ Sending user data for authenticated user: ${user._id}`);
    res.status(200).json({
      name: user.name, email: user.email, photo: user.photo,
      address: user.address, phone: user.phone, dateOfBirth: user.dateOfBirth
    });
  } catch (err) { console.error('❌ Error fetching authenticated user details:', err); next(err); }
});

// PUT /api/auth/user (Update current user's profile) - Protected
router.put('/user', authMiddleware, async (req, res, next) => { // Path relative to /api/auth
    const updates = req.body; const userId = req.user._id;
    const allowedUpdates = ['name', 'email', 'photo', 'address', 'phone', 'dateOfBirth'];
    const finalUpdates = {};
    Object.keys(updates).forEach((key) => { if (allowedUpdates.includes(key) && updates[key] !== undefined) finalUpdates[key] = updates[key]; });
    if (Object.keys(finalUpdates).length === 0) return res.status(400).json({ message: '❌ No valid update fields provided.' });
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, finalUpdates, { new: true, runValidators: true });
        if (!updatedUser) return res.status(404).json({ message: '❌ User not found for update' });
        const userResponse = { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, photo: updatedUser.photo, address: updatedUser.address, phone: updatedUser.phone, dateOfBirth: updatedUser.dateOfBirth };
        console.log(`✅ Profile updated successfully for user: ${userId}`);
        res.status(200).json({ message: '✅ Profile updated successfully', user: userResponse });
    } catch (err) {
        console.error('❌ Update profile error:', err);
        if (err.name === 'ValidationError') return res.status(400).json({ message: '❌ Validation failed', errors: err.errors });
        if (err.code === 11000) return res.status(409).json({ message: '❌ Email already in use by another account.' });
        next(err);
    }
});

// POST /api/auth/upload (Upload profile image for current user) - Protected
router.post('/upload', authMiddleware, upload.single('profileImage'), async (req, res, next) => { // Path relative to /api/auth
    // NOTE: This assumes Multer 'upload' is configured above within this file
    // If passed from server.js, you'd receive it differently.
    if (req.fileValidationError) return res.status(400).json({ message: req.fileValidationError });
    if (!req.file) return res.status(400).json({ message: '❌ No image file uploaded' });

    let photoUrl = null; const tempFilePath = req.file.path;
    const publicUploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'uploads'); // Adjust path

    try {
        if (cloudinary.v2.config().cloud_name) {
            try {
                console.log(`Attempting Cloudinary upload for: ${tempFilePath}`);
                const result = await cloudinary.v2.uploader.upload(tempFilePath, { folder: 'profile_pictures' });
                photoUrl = result.secure_url; console.log('✅ Image uploaded to Cloudinary:', photoUrl);
            } catch (cldErr) { console.error("❌ Cloudinary upload error:", cldErr); /* Fallback or error */ }
        }
        if (!photoUrl) { // Fallback to local
            console.log('⚠️ Saving image locally.'); const filename = req.file.filename;
            const targetPath = path.join(publicUploadsDir, filename); fs.renameSync(tempFilePath, targetPath);
            photoUrl = `/uploads/${filename}`; console.log('✅ Image saved locally:', photoUrl);
        }
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { photo: photoUrl }, { new: true });
        if (!updatedUser) { /* Handle orphaned upload */ return res.status(404).json({ message: '❌ User not found during photo update' }); }
        if (photoUrl.startsWith('http') && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); // Cleanup temp if Cloudinary used
        res.status(200).json({ message: '✅ Upload successful', photo: photoUrl });
    } catch (error) { console.error("❌ File upload process error:", error); next(error);
    } finally { if (fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) { console.error("Error deleting final temp file:", e);} }
});


// --- Removed /update-user/:id and /delete-user/:id ---
// These should have proper admin checks if implemented, keep separate if needed

export default router; // Export the router