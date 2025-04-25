// routes/chatRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js'; // Ensure this path is correct
import Conversation from '../models/Conversation.js';
// Assume generateChatbotAnswer exists and potentially takes history
// NOTE: You might need to modify generateChatbotAnswer to accept history object
import { generateChatbotAnswer } from '../chatbot.js'; // Ensure this path is correct

const router = express.Router();

// --- Helper function to generate title ---
function generateTitleFromPrompt(prompt) {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
        return "New Conversation"; // Fallback for empty prompt
    }
    let title = trimmedPrompt.substring(0, 50); // Max 50 chars
    if (trimmedPrompt.length > 50) {
        title += "...";
    }
    return title;
}

// --- POST /api/chatbot -> Handle interaction (New or Existing Chat) ---
router.post('/chatbot', authMiddleware, async (req, res, next) => {
    const userId = req.user.id;
    // history might not be needed if your bot recalculates context each time
    // but chatId is crucial
    const { prompt, history, chatId } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt is required and must be a non-empty string.' });
    }

    const userMessage = {
        role: 'user',
        content: prompt.trim(),
        timestamp: new Date(),
    };

    let conversation;
    let isNewChat = false;
    const responsePayload = {}; // Prepare response object

    try {
        // --- Scenario 1: Update Existing Chat ---
        if (chatId) {
            console.log(`Attempting to update existing chat: ${chatId} for user: ${userId}`);

            // 1. Find the conversation first to ensure it exists and belongs to the user
            conversation = await Conversation.findOne({ _id: chatId, userId: userId });

            if (!conversation) {
                console.warn(`Chat ${chatId} not found or access denied for user ${userId}.`);
                // You could potentially create a new chat here as a fallback,
                // but returning an error is often clearer for the user/frontend.
                return res.status(404).json({ error: `Chat not found or you don't have permission.` });
            }

            // 2. Call the chatbot service (pass necessary context/history)
            // TODO: Adapt generateChatbotAnswer if it needs history
            // const botContext = conversation.messages; // Or format history as needed
            const { answer: botAnswer } = await generateChatbotAnswer(prompt /*, botContext */);

            if (!botAnswer || typeof botAnswer !== 'string') {
                 console.error("Invalid chatbot response format received.");
                 throw new Error("Invalid chatbot response format"); // Caught below
            }

            const botMessage = { role: 'bot', content: botAnswer, timestamp: new Date() };

             // 3. Update the conversation atomically
             const updatedConversation = await Conversation.findByIdAndUpdate(
                 chatId, // Already verified ownership
                 {
                     $push: { messages: { $each: [userMessage, botMessage] } }, // Add both messages
                     $set: { lastActivity: new Date() } // Update activity timestamp
                 },
                 { new: true } // Return the updated document
             );

             if (!updatedConversation) {
                 // Should not happen if findOne succeeded, but handle defensively
                 throw new Error("Failed to update conversation after finding it.");
             }
             conversation = updatedConversation; // Use the latest doc

             // Prepare response for existing chat
             responsePayload.answer = botMessage.content;
             responsePayload.updatedChat = { // Send minimal update info
                 id: conversation._id,
                 lastUpdate: conversation.lastActivity,
                 // title: conversation.title // Only if title might change during update
             };
             console.log(`Updated chat ${chatId}. Responding.`);


        }
        // --- Scenario 2: Create New Chat ---
        else {
            console.log(`Creating new chat for user: ${userId}`);
            isNewChat = true;

            // 1. Generate Title
            const chatTitle = generateTitleFromPrompt(prompt);

            // 2. Call the chatbot service (pass minimal context for a new chat)
            // TODO: Adapt generateChatbotAnswer if needed for new chat context
            const { answer: botAnswer } = await generateChatbotAnswer(prompt /*, [userMessage] */);

            if (!botAnswer || typeof botAnswer !== 'string') {
                 console.error("Invalid chatbot response format received.");
                 throw new Error("Invalid chatbot response format");
            }

            const botMessage = { role: 'bot', content: botAnswer, timestamp: new Date() };

            // 3. Create and save the new conversation document
            conversation = new Conversation({
                userId: userId,
                title: chatTitle,
                messages: [userMessage, botMessage], // Start with both messages
                lastActivity: new Date(), // Set initial activity
            });

            await conversation.save();
            console.log(`New chat ${conversation._id} created with title "${chatTitle}".`);

            // Prepare response for new chat
            responsePayload.answer = botMessage.content;
            responsePayload.newChatId = conversation._id; // Crucial for frontend
            responsePayload.title = conversation.title;   // Send back the generated title
            console.log("Responding with new chat info.");
        }

        // --- Send successful response ---
        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error(`Chat processing error for user ${userId} (ChatID: ${chatId || 'N/A'}):`, error);

        // Customize error response based on error type
        let statusCode = 500;
        let message = 'Failed to process chat request.';

        if (error.message?.includes("timed out")) {
            statusCode = 408; // Request Timeout
            message = 'The request to the chatbot timed out.';
        } else if (error.message?.includes("Invalid chatbot response format")) {
            statusCode = 502; // Bad Gateway (error from upstream service)
            message = 'Received an invalid response from the chatbot service.';
        } else if (error.name === 'ValidationError') {
            statusCode = 400; // Bad Request (Mongoose validation)
            message = error.message;
        } else if (error.name === 'CastError') {
             statusCode = 400; // Bad Request (e.g., invalid ObjectId format for chatId)
             message = 'Invalid chat ID format provided.';
        }

        // Pass to generic error handler or send response directly
        // Using next(error) assumes you have a global error handler middleware
         error.status = statusCode; // Attach status to error object if using global handler
         error.message = message;   // Standardize message
         next(error);
        // OR send directly:
        // return res.status(statusCode).json({ error: message });
    }
});

// --- GET /api/chats -> Fetch list of user's chats (metadata only) ---
router.get('/chats', authMiddleware, async (req, res, next) => {
    try {
        const chats = await Conversation.find({ userId: req.user.id })
            .select('_id title lastActivity createdAt') // Select only needed fields for list view
            .sort({ lastActivity: -1 }); // Sort by most recent activity

        // Map to frontend-expected format (id, title, lastUpdate)
        const chatList = chats.map(chat => ({
            id: chat._id,
            title: chat.title,
            lastUpdate: chat.lastActivity // Frontend expects lastUpdate
            // createdAt: chat.createdAt // Optional: if needed
        }));

        // It's okay to return an empty array if user has no chats
        res.status(200).json(chatList);

    } catch (error) {
        console.error(`Failed to fetch chat list for user ${req.user.id}:`, error);
        error.status = 500;
        next(error); // Pass to error handler
    }
});

// --- GET /api/chats/:id -> Fetch a single chat's full history ---
router.get('/chats/:id', authMiddleware, async (req, res, next) => {
    const chatId = req.params.id;
    const userId = req.user.id;

    try {
        const conversation = await Conversation.findOne({ _id: chatId, userId: userId });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat not found or you do not have permission.' });
        }

        // Respond with the full conversation details needed for loading history
        res.status(200).json({
             id: conversation._id,
             title: conversation.title,
             messages: conversation.messages, // Send the full message array
             lastUpdate: conversation.lastActivity,
             createdAt: conversation.createdAt
        });

    } catch (error) {
        console.error(`Failed to fetch chat ${chatId} for user ${userId}:`, error);
        let statusCode = 500;
        if (error.name === 'CastError') {
             statusCode = 400;
             error.message = 'Invalid chat ID format.';
        }
        error.status = statusCode;
        next(error);
    }
});


// --- DELETE /api/chats/:id -> Delete a specific chat ---
router.delete('/chats/:id', authMiddleware, async (req, res, next) => {
    const chatId = req.params.id;
    const userId = req.user.id;

    try {
        // Find and delete, ensuring the chat belongs to the user
        const deletedChat = await Conversation.findOneAndDelete({ _id: chatId, userId: userId });

        if (!deletedChat) {
            // Chat not found OR didn't belong to the user
            return res.status(404).json({ error: 'Chat not found or you do not have permission to delete it.' });
        }

        console.log(`Chat ${chatId} deleted successfully for user ${userId}.`);
        res.status(200).json({ message: 'Chat deleted successfully' }); // Send 200 OK

    } catch (error) {
        console.error(`Failed to delete chat ${chatId} for user ${userId}:`, error);
         let statusCode = 500;
         if (error.name === 'CastError') {
             statusCode = 400;
             error.message = 'Invalid chat ID format.';
         }
         error.status = statusCode;
        next(error);
    }
});


export default router;