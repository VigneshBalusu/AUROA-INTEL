// middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // Keep dotenv here if you need process.env directly, though often it's loaded once in server.js
import User from '../models/User.js'; // Adjust path if models are elsewhere

dotenv.config(); // Ensure environment variables are loaded

// ✅ Generate JWT Token (Keep as is, seems fine)
export const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables!");
        throw new Error("JWT secret not configured."); // Throw error if secret is missing
    }
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// ✅ Authentication Middleware (Verify JWT Token) - ADDED LOGGING & next(error)
export const authMiddleware = async (req, res, next) => {
    console.log('[authMiddleware] - 1. Running...'); // ★ LOG 1
    try {
        // Check for Authorization header
        const authHeader = req.header('Authorization'); // Use req.header()
        // console.log('[authMiddleware] Authorization Header received:', authHeader); // Can be verbose

        if (!authHeader) {
             console.log('[authMiddleware] - 2a. No Authorization header found.');
             const error = new Error('Unauthorized: Authorization header is required');
             error.status = 401;
             return next(error); // ★ Pass error via next()
            // return res.status(401).json({ message: "❌ Authorization header is required" });
        }

        // Check Bearer token format
        if (!authHeader.startsWith("Bearer ")) {
            console.log('[authMiddleware] - 2b. Header does not start with "Bearer ".');
             const error = new Error('Unauthorized: Invalid token format (Bearer missing)');
             error.status = 401;
             return next(error); // ★ Pass error via next()
            // return res.status(401).json({ message: "❌ Invalid token format" });
        }

        // Extract token
        const token = authHeader.split(" ")[1]; // Or authHeader.replace('Bearer ', '');
        if (!token) {
             console.log('[authMiddleware] - 2c. Token not found after splitting header.');
             const error = new Error('Unauthorized: Token not found in header');
             error.status = 401;
             return next(error); // ★ Pass error via next()
            // return res.status(401).json({ message: "❌ Token not found" });
        }
        // console.log('[authMiddleware] Token extracted:', `${token.substring(0,10)}...`);

        // Verify token
        console.log('[authMiddleware] - 3. Verifying token...');
        if (!process.env.JWT_SECRET) {
             console.error('[authMiddleware] - FATAL ERROR: JWT_SECRET is not defined!');
             throw new Error('Server configuration error: JWT secret missing.');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // This throws specific errors on failure
        console.log('[authMiddleware] - 4. Token decoded:', decoded);

        if (!decoded || !decoded.userId) {
            // This case might be redundant as jwt.verify usually throws, but safe check
             console.log('[authMiddleware] - ERROR: Decoded token missing userId.');
            throw new Error("Unauthorized: Invalid token payload (Missing userId)"); // Let catch block handle
        }

        // Find user in database based on ID from token
        console.log(`[authMiddleware] - 5. Finding user in DB with ID: ${decoded.userId}`);
        console.time("authUserFindDB"); // ★ Start timer for DB query
        const user = await User.findById(decoded.userId).select('-password'); // Exclude password field
        console.timeEnd("authUserFindDB"); // ★ End timer

        if (!user) {
            console.log(`[authMiddleware] - 6a. User not found in DB for ID: ${decoded.userId}`);
            // Treat this as unauthorized because the token refers to a non-existent user
            const error = new Error('Unauthorized: User associated with token not found');
            error.status = 401; // Use 401 for consistency, client needs to re-auth
            throw error; // Let catch block handle
        }

        console.log(`[authMiddleware] - 6b. User found: ${user.email}. Attaching to req.user.`);
        req.user = user; // ★ Attach the user document to the request object
        console.log('[authMiddleware] - 7. Calling next().');
        next(); // ★ Proceed to the next middleware or the actual route handler

    } catch (error) {
        // Catch errors from jwt.verify, User.findById, or missing JWT_SECRET
        console.error("❌ Authentication Error Caught:", error.message);
        console.log('[authMiddleware] - 8. CATCH block.');

        // Standardize error handling and pass to global error handler via next()
        let authError = new Error();
        authError.status = 401; // Default to Unauthorized

        if (error.name === 'JsonWebTokenError') {
            authError.message = "Unauthorized: Invalid token signature";
        } else if (error.name === 'TokenExpiredError') {
            authError.message = "Unauthorized: Token expired";
        } else {
            // Use the message from the caught error or a default
            authError.message = error.message || "Authentication failed";
            // Keep status if error already had one (like the 401 thrown above)
            authError.status = error.status || 401;
        }

        // Pass the structured error to the next middleware (global error handler)
        next(authError);

        // Removed direct res.status().json() calls from here
    }
};

// ✅ Verify User (Optional Middleware - Checks if req.user exists AFTER authMiddleware)
// This is often redundant if authMiddleware guarantees req.user on success.
// Useful if you have optional authentication on some routes.
export const verifyUser = async (req, res, next) => {
    console.log('[verifyUser] - Checking req.user...');
    // This middleware assumes authMiddleware ran successfully before it
    if (!req.user || !req.user._id) {
        console.log('[verifyUser] - Failed: req.user not found.');
        // Send response directly or pass error via next()
        return res.status(401).json({ message: "❌ User not properly authenticated for this step" });
        // Or: const error = new Error(...); error.status = 401; next(error);
    }

    try {
        // Optionally re-fetch user to ensure they weren't deleted *just* now
        // const user = await User.findById(req.user._id);
        // if (!user) {
        //     return res.status(404).json({ message: "❌ User associated with session no longer exists" });
        // }
        // req.user = user; // Update req.user if re-fetched
        console.log(`[verifyUser] - Success: User ${req.user._id} verified.`);
        next(); // User seems valid, proceed
    } catch (error) {
        console.error("❌ User Verification Error:", error.message);
        error.message = `User verification failed: ${error.message}`;
        next(error); // Pass unexpected errors
    }
};

// Default export remains the same (optional)
export default { generateToken, authMiddleware, verifyUser };