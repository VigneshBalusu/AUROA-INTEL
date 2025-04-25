// routes/experienceRoutes.js
import express from 'express';
import Experience from '../models/Experience.js'; // Correct: Model for experiences
import { authMiddleware } from '../middleware/auth.js'; // Correct: Middleware for protected routes
import { sendEmail } from '../utils/email.js'; // <--- CHANGE TO THIS
// If you move sendEmail to utils: import { sendEmail } from '../utils/email.js';

const router = express.Router();

// --- GET All Experiences (Public Route - No Auth Needed) ---
// Fetches a list of experiences, sorted newest first, with a limit.
router.get('/', async (req, res, next) => {
  console.log("[Backend GET /api/experiences] - 1. Request received.");
  try {
    console.time("fetchExperiencesDB"); // Start timing DB query
    console.log("[Backend GET /api/experiences] - 2. Querying database (find, sort, limit 100)...");

    const experiences = await Experience.find() // Fetch documents
                                        .sort({ createdAt: -1 }) // Sort by creation date, descending (newest first)
                                        .limit(100) // Limit to the latest 100 experiences
                                        .lean(); // Use lean() for performance boost on read-only operations

    console.timeEnd("fetchExperiencesDB"); // Stop timing DB query
    const count = experiences?.length ?? 0; // Safely get count
    console.log(`[Backend GET /api/experiences] - 3. Found ${count} experiences.`);

    // Basic validation (find usually returns an array, even if empty)
    if (!Array.isArray(experiences)) {
        console.error("[Backend GET /api/experiences] - ERROR: Database query did not return an array!");
        // This indicates a deeper issue, likely with Mongoose/DB connection if it occurs
        throw new Error("Internal server error retrieving data.");
    }

    console.log("[Backend GET /api/experiences] - 4. Sending success response to client...");
    res.status(200).json(experiences); // Send the fetched data
    // Cannot log after res.json reliably

  } catch (error) {
    console.error('❌ Error fetching experiences in GET route:', error.message); // Log specific message
    console.log("[Backend GET /api/experiences] - 5. Error occurred, passing to global error handler.");
    next(error); // Pass errors to the central error handling middleware
  }
});

// --- POST a New Experience (Protected Route - Requires Authentication) ---
// Creates a new experience, associates it with the logged-in user, and optionally sends an email notification.
router.post('/', authMiddleware, async (req, res, next) => {
    console.log("[Backend POST /api/experiences] - 1. Request received.");
    try {
        // User details are attached to req.user by authMiddleware
        if (!req.user) { // Defensive check, middleware should prevent this
             console.error("Error: req.user not found after authMiddleware!");
             return res.status(401).json({ error: 'Authentication failed unexpectedly.' });
        }
        const { _id: userId, name: userNameFromAuth, email: userEmailFromAuth, photo: userPhotoFromAuth } = req.user;

        // Extract data from request body
        const { experience, taggedEmail, messageToRecipient } = req.body;
        console.log("[Backend POST /api/experiences] - 2. Data extracted. Validating inputs...");

        // --- Input Validation ---
        if (!experience || experience.trim() === '') {
            console.log("[Backend POST /api/experiences] - Validation Failed: Experience text empty.");
            return res.status(400).json({ error: 'Experience text cannot be empty.' });
        }
        // Validate email format ONLY IF taggedEmail is provided and not empty
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (taggedEmail && taggedEmail.trim() !== '' && !emailRegex.test(taggedEmail.trim())) {
             console.log("[Backend POST /api/experiences] - Validation Failed: Invalid taggedEmail format.");
             return res.status(400).json({ error: 'Invalid recipient email format provided.' });
        }
        console.log("[Backend POST /api/experiences] - 3. Validation passed.");

        // --- Create Experience Document ---
        const processedTaggedEmail = taggedEmail ? taggedEmail.trim().toLowerCase() : null; // Trim and lowercase email or null
        const newExperience = new Experience({
            experience: experience.trim(),
            taggedEmail: processedTaggedEmail,
            messageToRecipient: (processedTaggedEmail && messageToRecipient) ? messageToRecipient.trim() : null, // Only save message if email exists
            // User details from authenticated user
            userId: userId, // From req.user._id
            userName: userNameFromAuth,
            userEmail: userEmailFromAuth,
            userPhoto: userPhotoFromAuth || '/uploads/default-profile-placeholder.png' // Provide default if null/undefined
        });

        console.log("[Backend POST /api/experiences] - 4. Attempting to save document to database...");
        const savedExperience = await newExperience.save(); // Mongoose validation runs here
        console.log(`[Backend POST /api/experiences] - 5. Experience successfully saved with ID: ${savedExperience._id}`);

        // --- Send Email Notification (if applicable) ---
        // Run asynchronously - don't block the response waiting for email.
        if (savedExperience.taggedEmail) {
            console.log(`[Backend POST /api/experiences] - 6. Tagged email [${savedExperience.taggedEmail}] present. Attempting notification.`);
            const appName = process.env.APP_NAME || "My App"; // Use environment variable for app name
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Base URL for links
            const subject = `${savedExperience.userName} shared an experience with you on ${appName}!`;
            // Construct email content
            let emailText = `Hi there,\n\n`;
            emailText += `${savedExperience.userName} (${savedExperience.userEmail}) shared an experience on ${appName} and mentioned you:\n\n`;
            emailText += `"${savedExperience.experience}"\n\n`;
            if (savedExperience.messageToRecipient) {
                emailText += `They added this message for you:\n"${savedExperience.messageToRecipient}"\n\n`;
            }
            // Link to relevant section (e.g., blog/experiences page)
            emailText += `You can view all experiences here: ${frontendUrl}/blog\n\n`; // Adjust link as needed
            emailText += `Thanks,\nThe ${appName} Team`;

            // Call sendEmail (imported from server.js or utils)
            sendEmail(savedExperience.taggedEmail, subject, emailText)
                .then(info => console.log(`[Backend POST /api/experiences] - Email notification queued/sent to ${savedExperience.taggedEmail}. Message ID: ${info.messageId}`))
                .catch(emailError => {
                    // Log error but don't fail the API response because email sending failed
                    console.error(`❌ CRITICAL (but non-blocking): Failed to send tag notification email to ${savedExperience.taggedEmail}. Error: ${emailError.message}`);
                });
        } else {
            console.log("[Backend POST /api/experiences] - 6. No tagged email provided, skipping notification.");
        }

        console.log("[Backend POST /api/experiences] - 7. Sending success (201) response to client...");
        // Send response with the newly created experience
        res.status(201).json({ message: 'Experience added successfully!', experience: savedExperience });
        console.log("[Backend POST /api/experiences] - 8. POST response sent.");


      } catch (error) {
        console.error('❌ Error adding experience in POST route:', error.message); // Log specific message
        console.log("[Backend POST /api/experiences] - 9. Error occurred, handling error response...");
        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            // Extract meaningful error messages
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: `Validation Failed: ${messages.join(', ')}` });
        }
        // Handle potential duplicate key errors if you add unique indexes
        if (error.code === 11000) {
            return res.status(409).json({ error: 'A duplicate entry was detected.' });
        }
        // Pass other types of errors to the global handler
        next(error);
      }
});

// --- Other potential routes (e.g., GET /:id, PUT /:id, DELETE /:id) would go here ---
// router.get('/:id', ...)
// router.put('/:id', authMiddleware, ...)
// router.delete('/:id', authMiddleware, ...)

export default router; // Export the router for use in server.js