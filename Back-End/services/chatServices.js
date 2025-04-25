// Example: services/chatService.js
import Chat from '../models/Chat.js';
import { generateChatbotAnswer } from '../chatbot.js';

export const processChatAndSave = async (userId, prompt) => {
  try {
    // 1. Get answer from bot
    const { answer: botAnswer } = await generateChatbotAnswer(prompt); // Adjust return
     if (!botAnswer) throw new Error("Invalid bot response");

    // 2. Save to DB
    const userMessage = { role: 'user', content: prompt };
    const botMessage = { role: 'bot', content: botAnswer };
    await Chat.findOneAndUpdate(
        { userId: userId },
        { $push: { messages: { $each: [userMessage, botMessage] } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return botAnswer; // Return the answer

  } catch(error) {
      console.error(`Error in chat service for user ${userId}:`, error);
      throw error; // Re-throw to be caught by route handler
  }
}